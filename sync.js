/**
 * ════════════════════════════════════════════════════════════
 * sync.js — Token 管理 + GitHub API 同步
 * 保險銷售視覺化培訓系統 v2.0
 *
 * 功能：
 *   1. GitHub Personal Access Token 管理
 *   2. 從 GitHub Contents API 拉取 products.json
 *   3. 語義化版本號對比
 *   4. Brochures PDF 快取
 *   5. 同步狀態 UI 更新
 * ════════════════════════════════════════════════════════════
 */

'use strict';

/* ═══ 配置 ═══ */
const SYNC_CONFIG = {
  REPO_OWNER: 'terrielau2011-design',
  REPO_NAME: 'insurance-trainer',
  API_BASE: 'https://api.github.com',
  PRODUCTS_PATH: 'data/products.json',
  BROCHURES_PATH: 'brochures'
};

/* localStorage Keys */
const LS_KEYS = {
  TOKEN: 'it_token',
  DATA_VERSION: 'it_data_version',
  PRODUCTS_CACHE: 'it_products_cache',
  LAST_SYNC: 'it_last_sync',
  BROCHURES_INDEX: 'it_brochures_index'
};

/* ═══ Token 管理 ═══ */

function getToken() {
  return localStorage.getItem(LS_KEYS.TOKEN) || '';
}

function saveToken(token) {
  localStorage.setItem(LS_KEYS.TOKEN, token.trim());
}

function clearToken() {
  localStorage.removeItem(LS_KEYS.TOKEN);
}

/* ═══ 版本號對比 ═══ */
/* 返回: 1 = remote 較新, 0 = 相同, -1 = local 較新 */
function compareVersions(remote, local) {
  if (!local) return 1;
  if (!remote) return 0;
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return 1;
    if (rv < lv) return -1;
  }
  return 0;
}

/* ═══ 同步主流程 ═══ */

async function syncData() {
  const token = getToken();

  if (!token) {
    showSyncStatus('⚠ 請先設定 GitHub Access Token', 'warning');
    openTokenModal();
    return;
  }

  showSyncStatus('🔄 檢查中央版本中...', 'loading');
  setSyncButtonDisabled(true);

  try {
    /* ── 1. 拉取遠端 products.json ── */
    const apiUrl = `${SYNC_CONFIG.API_BASE}/repos/${SYNC_CONFIG.REPO_OWNER}/${SYNC_CONFIG.REPO_NAME}/contents/${SYNC_CONFIG.PRODUCTS_PATH}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 401) {
      showSyncStatus('❌ Token 無效或已過期，請重新輸入', 'error');
      openTokenModal();
      return;
    }
    if (response.status === 404) {
      showSyncStatus('❌ 找不到 products.json，請確認倉庫路徑', 'error');
      return;
    }
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);

    const fileObj = await response.json();
    /* base64 解碼 */
    const decoded = atob(fileObj.content.replace(/\n/g, ''));
    const remoteJson = JSON.parse(decoded);

    /* ── 2. 版本對比 ── */
    const localVersion = localStorage.getItem(LS_KEYS.DATA_VERSION);
    const remoteVersion = remoteJson.version;
    const cmp = compareVersions(remoteVersion, localVersion);

    if (cmp <= 0 && localVersion) {
      const lastSync = localStorage.getItem(LS_KEYS.LAST_SYNC);
      const syncTime = lastSync ? formatSyncTime(lastSync) : '未知';
      showSyncStatus(`✅ 已是最新 v${localVersion}（${syncTime} 同步）`, 'success');
      setSyncButtonDisabled(false);
      return;
    }

    /* ── 3. 發現新版本，寫入本地 ── */
    showSyncStatus(`📥 發現新版本 v${remoteVersion}，同步中...`, 'loading');

    localStorage.setItem(LS_KEYS.PRODUCTS_CACHE, JSON.stringify(remoteJson));
    localStorage.setItem(LS_KEYS.DATA_VERSION, remoteVersion);
    localStorage.setItem(LS_KEYS.LAST_SYNC, new Date().toISOString());

    /* ── 4. 同步 Brochures PDF ── */
    await cacheBrochures(token);

    /* ── 5. 重新載入產品數據 + 刷新 UI ── */
    if (typeof loadProductsFromCache === 'function') {
      loadProductsFromCache();
    }
    if (typeof refreshAllUI === 'function') {
      refreshAllUI();
    }

    /* 通知 Service Worker 清除舊數據快取 */
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('CLEAR_DATA_CACHE');
    }

    showSyncStatus(`✅ 同步完成！v${remoteVersion}（${remoteJson.products.length} 款產品）`, 'success');

  } catch (err) {
    console.error('Sync failed:', err);
    if (localStorage.getItem(LS_KEYS.PRODUCTS_CACHE)) {
      showSyncStatus('⚠ 同步失敗（離線），已使用本地快取數據', 'warning');
    } else {
      showSyncStatus(`❌ 同步失敗：${err.message}`, 'error');
    }
  } finally {
    setSyncButtonDisabled(false);
  }
}

/* ═══ Brochures 快取 ═══ */

async function cacheBrochures(token) {
  try {
    const apiUrl = `${SYNC_CONFIG.API_BASE}/repos/${SYNC_CONFIG.REPO_OWNER}/${SYNC_CONFIG.REPO_NAME}/contents/${SYNC_CONFIG.BROCHURES_PATH}`;
    const resp = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!resp.ok) {
      console.log('Brochures 資料夾為空或不存在');
      return;
    }

    const files = await resp.json();
    const cachedList = [];

    for (const file of files) {
      if (!file.name.endsWith('.pdf')) continue;

      /* 透過 Service Worker 快取 PDF */
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_PDF',
          pdfUrl: file.download_url
        });
      }

      cachedList.push({
        name: file.name,
        url: file.download_url,
        size: file.size
      });
    }

    localStorage.setItem(LS_KEYS.BROCHURES_INDEX, JSON.stringify(cachedList));
    console.log(`Brochures: 已索引 ${cachedList.length} 個 PDF`);

  } catch (err) {
    console.warn('Brochures 快取失敗:', err.message);
  }
}

/* ═══ UI 更新 ═══ */

function showSyncStatus(message, type) {
  const el = document.getElementById('sync-status');
  if (!el) return;

  const colors = {
    loading:  'var(--primary)',
    success:  'var(--success)',
    warning:  'var(--warning)',
    error:    'var(--danger)'
  };

  el.textContent = message;
  el.style.color = colors[type] || 'var(--text-muted)';
  el.style.fontWeight = type === 'loading' ? '600' : '500';
}

function setSyncButtonDisabled(disabled) {
  const btn = document.getElementById('btn-sync');
  if (btn) {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.5' : '1';
  }
}

function formatSyncTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('zh-HK', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    });
  } catch {
    return '未知';
  }
}

/* ═══ Token Modal ═══ */

function openTokenModal() {
  const modal = document.getElementById('token-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  const input = document.getElementById('token-input');
  if (input) {
    input.value = getToken();
    setTimeout(() => input.focus(), 100);
  }
}

function closeTokenModal() {
  const modal = document.getElementById('token-modal');
  if (modal) modal.style.display = 'none';
}

function saveTokenAndSync() {
  const input = document.getElementById('token-input');
  if (!input || !input.value.trim()) {
    alert('請輸入 GitHub Access Token');
    return;
  }
  saveToken(input.value);
  closeTokenModal();
  syncData();
}

/* ═══ 初始化 ═══ */

function initSync() {
  /* 顯示當前版本 */
  const version = localStorage.getItem(LS_KEYS.DATA_VERSION);
  const lastSync = localStorage.getItem(LS_KEYS.LAST_SYNC);

  const versionEl = document.getElementById('sync-version');
  if (versionEl) {
    versionEl.textContent = version || '--';
  }

  const statusEl = document.getElementById('sync-status');
  if (statusEl && version) {
    const syncTime = lastSync ? formatSyncTime(lastSync) : '';
    statusEl.textContent = `v${version}${syncTime ? '（' + syncTime + '）' : ''}`;
    statusEl.style.color = 'var(--text-muted)';
  }

  /* 檢查 URL 參數是否要求同步 */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'sync') {
    setTimeout(() => syncData(), 500);
  }
  if (urlParams.get('scene') === '2') {
    setTimeout(() => {
      if (typeof switchScene === 'function') switchScene(2);
    }, 500);
  }

  /* Token Modal 背景點擊關閉 */
  const modal = document.getElementById('token-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTokenModal();
    });
  }

  /* Enter 鍵提交 Token */
  const tokenInput = document.getElementById('token-input');
  if (tokenInput) {
    tokenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTokenAndSync();
    });
  }
}

/* ═══ Service Worker 註冊 ═══ */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker 已註冊:', reg.scope);
        })
        .catch(err => {
          console.warn('⚠ Service Worker 註冊失敗:', err);
        });
    });
  }
}
