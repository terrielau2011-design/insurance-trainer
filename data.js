/**
 * ════════════════════════════════════════════════════════════
 * data.js — 數據載入層（v2.0 重構）
 * 保險銷售視覺化培訓系統 v2.0
 *
 * 載入優先順序：
 *   1. localStorage 快取（it_products_cache）
 *   2. data/products.default.json（內嵌回退）
 *   3. 空陣列（最後防線）
 * ════════════════════════════════════════════════════════════
 */

'use strict';

/* 全局數據變量（供 app.js 使用） */
let productList = [];
let bankList = [];
let appConfig = {
  defaultProduct: null,
  defaultPayTerm: 10,
  defaultLTV: 95,
  defaultLoanRate: 3.275,
  defaultCapRate: 4.5,
  defaultLoanTerm: 9,
  currencySymbols: { HKD: 'HK$', USD: 'US$', RMB: '¥' }
};

/* 當前數據版本 */
let dataVersion = '2.0.0';

/* ═══ 從 localStorage 載入快取數據 ═══ */
function loadProductsFromCache() {
  const cached = localStorage.getItem('it_products_cache');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      applyData(data);
      console.log('✅ 從 localStorage 快取載入數據 v' + data.version);
      return true;
    } catch (e) {
      console.warn('localStorage 快取解析失敗:', e);
    }
  }
  return false;
}

/* ═══ 從內嵌預設數據載入 ═══ */
async function loadProductsDefault() {
  try {
    const resp = await fetch('data/products.default.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    applyData(data);
    console.log('✅ 從 products.default.json 載入數據 v' + data.version);
    return true;
  } catch (e) {
    console.warn('預設數據載入失敗:', e);
    return false;
  }
}

/* ═══ 套用數據到全局變量 ═══ */
function applyData(data) {
  if (!data || !data.products) return;

  dataVersion = data.version || '2.0.0';
  productList = data.products;

  if (data.config) {
    if (data.config.banks) bankList = data.config.banks;
    if (data.config.currencySymbols) {
      appConfig.currencySymbols = data.config.currencySymbols;
    }
  }

  /* 設定預設產品 */
  if (productList.length > 0 && !appConfig.defaultProduct) {
    appConfig.defaultProduct = productList[0].id;
  }

  /* 從第一個可融資產品讀取融資預設值 */
  const financeable = productList.find(p => p.isFinanceable);
  if (financeable && financeable.financing) {
    const f = financeable.financing;
    appConfig.defaultLTV = f.defaultLTV;
    appConfig.defaultLoanRate = f.benchmarkRate;
    appConfig.defaultCapRate = f.capRate;
    appConfig.defaultLoanTerm = f.defaultLoanTerm;
  }
}

/* ═══ 初始化數據載入 ═══ */
async function initData() {
  /* 1. 嘗試 localStorage 快取 */
  if (!loadProductsFromCache()) {
    /* 2. 回退到預設 JSON */
    await loadProductsDefault();
  }

  /* 3. 若 app.js 的 DOMContentLoaded 已準備好，刷新 UI */
  if (typeof onDataReady === 'function') {
    onDataReady();
  }
}

/* ═══ 獲取當前數據版本 ═══ */
function getDataVersion() {
  return dataVersion;
}
