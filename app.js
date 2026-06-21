/**
 * app.js v3.0 — ECharts + 需求標籤 + 7款產品 + 動態圖表
 */
'use strict';

const state = {
  primaryProduct: null, compareProducts: [], activeScene: 1,
  s1Results: {}, s2Results: {}, advisorTags: [], financeEnabled: true,
  displayCurrency: null, needTags: []
};

let echartsInstances = {};

/* ═══ 初始化 ═══ */
document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  if (typeof initSync === 'function') initSync();
  if (typeof initData === 'function') await initData();
  onDataReady();
});

function onDataReady() {
  initNeedTags();
  initProductList();
  initBankList();
  initCharts();
  calcScene1();
  calcScene2();
  updateOpportunityTable();
  updateBrochureForProduct();
}

function refreshAllUI() { onDataReady(); }

function initClock() {
  const el = document.getElementById('current-time');
  if (!el) return;
  const tick = () => { el.textContent = new Date().toLocaleString('zh-HK', { hour12: false }); };
  tick(); setInterval(tick, 1000);
}

/* ═══ 需求標籤 ═══ */
function initNeedTags() {
  const container = document.getElementById('need-tags');
  if (!container) return;
  const tags = (typeof appConfig !== 'undefined' && appConfig.needTags) || ['教育金','退休','家族傳承','保費融資','財富增值'];
  container.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('label');
    chip.className = 'tag-chip';
    chip.innerHTML = `<input type="checkbox" value="${tag}" onchange="onNeedTagChange()"> ${tag}`;
    container.appendChild(chip);
  });
}

function onNeedTagChange() {
  const checked = document.querySelectorAll('#need-tags input:checked');
  state.needTags = Array.from(checked).map(cb => cb.value);
  updateProductMatching();
  updateComparisonSection();  /* 第五步：標籤變化時自動更新同類對比 */
}

function updateProductMatching() {
  const container = document.getElementById('product-list');
  if (!container) return;

  if (state.needTags.length === 0) {
    /* 清除匹配狀態，恢復原始排序 */
    document.querySelectorAll('.product-item').forEach(item => {
      item.classList.remove('need-match', 'need-partial');
      const badge = item.querySelector('.match-badge');
      if (badge) badge.remove();
      const tip = item.querySelector('.finance-tip');
      if (tip) tip.remove();
      item.style.display = '';
    });
    /* 恢復原始排序 */
    productList.forEach(prod => {
      const item = document.getElementById(`prod-item-${prod.id}`);
      if (item) container.appendChild(item);
    });
    return;
  }

  /* 第一步：排序置頂 + 標記 */
  const matched = [];
  const unmatched = [];

  productList.forEach(prod => {
    const item = document.getElementById(`prod-item-${prod.id}`);
    if (!item) return;
    const matchCount = state.needTags.filter(t => prod.needTags.includes(t)).length;
    const old = item.querySelector('.match-badge');
    if (old) old.remove();
    const oldTip = item.querySelector('.finance-tip');
    if (oldTip) oldTip.remove();

    if (matchCount > 0) {
      item.classList.add('need-match');
      item.classList.remove('need-partial');
      item.style.display = '';
      const badge = document.createElement('span');
      badge.className = 'match-badge';
      badge.textContent = '⭐推薦';
      item.appendChild(badge);
      matched.push({ prod, item, matchCount });
    } else {
      item.classList.remove('need-match');
      /* 保費融資標籤特殊處理 */
      if (state.needTags.includes('保費融資')) {
        item.classList.add('need-partial');
        const tip = document.createElement('div');
        tip.className = 'finance-tip';
        tip.style.cssText = 'font-size:.65rem;color:var(--text-muted);width:100%;';
        tip.textContent = '僅豐饒傳承III支持保費融資';
        item.appendChild(tip);
      } else {
        item.classList.add('need-partial');
      }
      unmatched.push({ prod, item });
    }
  });

  /* 匹配的按匹配數排序後置頂 */
  matched.sort((a, b) => b.matchCount - a.matchCount);
  matched.forEach(m => container.appendChild(m.item));
  unmatched.forEach(u => container.appendChild(u.item));
}

/* ═══ 產品列表 ═══ */
function initProductList() {
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = '';
  productList.forEach((prod, idx) => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.id = `prod-item-${prod.id}`;
    item.innerHTML = `
      <input type="checkbox" id="chk-${prod.id}" value="${prod.id}" onchange="handleProductSelect(event, '${prod.id}')" />
      <div style="flex:1">
        <div class="prod-name">${prod.name}</div>
        <div class="prod-type">${prod.company} · ${prod.currency}${prod.isFinanceable ? ' · 可融資' : ''}</div>
      </div>`;
    container.appendChild(item);
    if (idx === 0 && !state.primaryProduct) {
      item.querySelector('input').checked = true;
      handleProductSelect({ target: item.querySelector('input') }, prod.id);
    }
  });
}

function initBankList() {
  const sel = document.getElementById('s2-bank');
  if (!sel) return;
  sel.innerHTML = '';
  bankList.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id; opt.textContent = `${b.name}（最高${b.maxLTV}% LTV）`;
    sel.appendChild(opt);
  });
}

function handleProductSelect(evt, prodId) {
  const checked = evt.target.checked;
  if (checked) {
    if (!state.primaryProduct) state.primaryProduct = prodId;
    else if (!state.compareProducts.includes(prodId)) state.compareProducts.push(prodId);
  } else {
    if (state.primaryProduct === prodId) {
      state.primaryProduct = state.compareProducts.shift() || null;
    } else state.compareProducts = state.compareProducts.filter(id => id !== prodId);
  }
  updateProductItemStyles();
  renderHighlights();
  updateProductCurrencyHints();
  updatePayTermOptions();
  updateComparisonSection();
  updateBrochureForProduct();
  calcScene1();
  calcScene2();
}

function updateProductItemStyles() {
  productList.forEach(p => {
    const item = document.getElementById(`prod-item-${p.id}`);
    if (!item) return;
    item.classList.remove('primary-selected', 'compare-selected');
    if (p.id === state.primaryProduct) item.classList.add('primary-selected');
    else if (state.compareProducts.includes(p.id)) item.classList.add('compare-selected');
  });
}

function renderHighlights() {
  const area = document.getElementById('highlights-area');
  if (!state.primaryProduct) { area.innerHTML = '<div class="highlight-placeholder"><span class="ph-icon">👈</span><p>請先選擇產品</p></div>'; return; }
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  area.innerHTML = `<div class="highlights-list">${prod.highlights.map((h, i) => `
    <div class="highlight-card">
      <div class="highlight-num">${i+1}</div>
      <div class="highlight-content">
        <h4>${h.icon} ${h.title} <span class="need-badge">${prod.mainTag || (prod.needTags||[]).join(' · ')}</span></h4>
        <p>${h.desc}</p>
        ${prod.subTag ? `<p style="font-size:.72rem;color:var(--text-muted);margin-top:2px;">${prod.subTag}</p>` : ''}
      </div>
    </div>`).join('')}</div>`;
}

function updateProductCurrencyHints() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const sel = document.getElementById('currency-selector');
  if (sel) {
    const curs = prod.supportedCurrencies || [prod.currency];
    sel.innerHTML = '';
    curs.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    state.displayCurrency = prod.currency;
  }
  const cur = state.displayCurrency || prod.currency;
  const sym = (appConfig.currencySymbols||{})[cur] || '';
  const h1 = document.getElementById('s1-currency-hint'); if (h1) h1.textContent = `(${sym})`;
  const h2 = document.getElementById('s2-currency-hint'); if (h2) h2.textContent = `(${sym})`;
  const ht = document.getElementById('s1-payterm-hint'); if (ht) ht.textContent = `· ${cur}`;
  const hg = document.getElementById('s1-target-hint'); if (hg) hg.textContent = `(${sym})`;
}

function onCurrencyChange() {
  const sel = document.getElementById('currency-selector');
  if (sel) state.displayCurrency = sel.value;
  updateProductCurrencyHints();
  calcScene1(); calcScene2(); updateOpportunityTable();
}

function updatePayTermOptions() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const c = document.getElementById('s1-pay-term');
  if (!c) return;
  c.innerHTML = '';
  prod.payTerms.forEach((t, i) => {
    const lab = document.createElement('label');
    const r = document.createElement('input');
    r.type='radio'; r.name='s1pt'; r.value=t; r.onchange=calcScene1;
    if (i===0) r.checked=true;
    const txt = (prod.payTermLabels||{})[String(t)] || `${t}年`;
    lab.appendChild(r); lab.appendChild(document.createTextNode(` ${txt}`));
    c.appendChild(lab);
  });
}

/* ═══ 場景切換 ═══ */
function switchScene(n) {
  state.activeScene = n;
  document.getElementById('scene1').classList.toggle('active', n===1);
  document.getElementById('scene2').classList.toggle('active', n===2);
  document.getElementById('btn-scene1').classList.toggle('active', n===1);
  document.getElementById('btn-scene2').classList.toggle('active', n===2);
  if (n===1) calcScene1(); else calcScene2();
}

/* ═══ 場景一計算 ═══ */
function calcScene1() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const base = parseFloat(document.getElementById('s1-premium').value) || prod.annualPremium;
  const payTerm = parseInt(document.querySelector('input[name="s1pt"]:checked')?.value || prod.payTerms[0]);
  const discY1 = (parseFloat(document.getElementById('s1-discount-y1').value)||0)/100;
  const prepay = (parseFloat(document.getElementById('s1-prepay').value)||0)/100;
  const premY1 = base * (1-discY1);
  const remaining = Math.max(0, payTerm-1);
  const totalBefore = premY1 + base * remaining;
  const prepayDisc = totalBefore * prepay * (payTerm/2)/12;
  const netTotal = Math.max(0, totalBefore - prepayDisc);
  state.s1Results = { base, payTerm, discY1, prepay, premY1, totalBefore, prepayDisc, netTotal };
  const sym = (appConfig.currencySymbols||{})[state.displayCurrency||prod.currency] || '';
  document.getElementById('s1-net-total').textContent = `${sym} ${fmt(netTotal)}`;
  document.getElementById('s1-net-breakdown').textContent = `原始 ${sym}${fmt(totalBefore)}，預繳折讓 ${sym}${fmt(prepayDisc)}`;
  document.getElementById('s1-y1-net').textContent = `${sym} ${fmt(premY1)}`;
  updatePrivilegesWall(base * payTerm);
  updateWealthChart();
  updatePremiumPie();
  updateOppChart();
}

function setVal(id, v) { document.getElementById(id).value = v; }

/* ═══ 場景二計算（修正：使用實付總保費，非原始總保費）═══ */
function calcScene2() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !prod.isFinanceable) return;
  const totalPrem = parseFloat(document.getElementById('s2-total-premium').value) || 0;
  const ltv = (parseFloat(document.getElementById('s2-ltv').value)||95)/100;
  const rate = (parseFloat(document.getElementById('s2-rate').value)||3.275)/100;
  const cap = (parseFloat(document.getElementById('s2-cap-rate').value)||3.9)/100;
  const feeRate = (parseFloat(document.getElementById('s2-loan-fee').value)||2)/100;
  const term = Math.min(10, parseInt(document.getElementById('s2-loan-term').value)||9);
  const sym = (appConfig.currencySymbols||{})[state.displayCurrency||prod.currency] || '';

  /* 任務一修正：首日現價用固定比例，實際貸款取整 */
  const fdCV = totalPrem * (prod.firstDayCVRatio||0.7869);
  const loan = Math.round(fdCV * ltv);  /* 取整，如 448,000 */
  const fee = loan * feeRate;

  /* 任務一修正：實付總保費 = 原始總保費 × (1 - 首年折扣率) */
  const discPct = ((prod.discounts?.firstYear?.defaultPercent)||12.5)/100;
  const paidTotal = totalPrem * (1 - discPct);  /* 524,769.51 */

  /* ① 實際本金 = 實付總保費 - 實際貸款金額 */
  const principal = paidTotal - loan;

  /* ④ 客戶總出資成本 = 實際本金 + 手續費 */
  const cost = principal + fee;

  /* 退出金額 = (保證退出金額 + 分紅實現率 × 預期部分) × 縮放係數 */
  const fin = prod.financing || {};
  const standardPrem = prod.standardPremium || 200000;
  const scalingFactor = totalPrem / 600000;  /* Excel 基準是 600,000 */
  const guaranteedExit = (fin.guaranteedExit || 562800) * scalingFactor;
  const expectedBonus = (fin.expectedBonus || 248784) * scalingFactor;
  const policyVal = guaranteedExit + expectedBonus;

  /* ⑤ NAV = 退出金額 - 貸款 - 手續費 - 利息（手續費在這裡扣一次） */
  const intCurr = loan * rate * term;
  const intCap = loan * cap * term;
  const navCurr = policyVal - loan - fee - intCurr;
  const navCap = policyVal - loan - fee - intCap;

  /* ⑥ 淨收益 = NAV - 實際本金（不再扣手續費，因為 NAV 已扣過）*/
  const netCurr = navCurr - principal;
  const netCap = navCap - principal;

  /* ⑦ 年化單利 = 淨收益 / 客戶總出資成本 / 年期 */
  const roiCurr = cost > 0 ? (netCurr / cost) * 100 : 0;
  const roiCap = cost > 0 ? (netCap / cost) * 100 : 0;
  const annCurr = term > 0 ? roiCurr / term : 0;
  const annCap = term > 0 ? roiCap / term : 0;

  state.s2Results = { totalPrem, ltv, rate, cap, feeRate, term, fdCV, loan, fee, paidTotal, principal, cost, policyVal, intCurr, intCap, netCurr, netCap, roiCurr, roiCap, annCurr, annCap };

  document.getElementById('s2-first-day-cv').textContent = `${sym} ${fmt(fdCV)}`;
  document.getElementById('s2-loan-amount').textContent = `${sym} ${fmt(loan)}`;
  document.getElementById('s2-loan-fee-amount').textContent = `${sym} ${fmt(fee)}`;
  document.getElementById('s2-actual-principal').textContent = `${sym} ${fmt(principal)}`;
  document.getElementById('s2-client-total-cost').textContent = `${sym} ${fmt(cost)}`;
  document.getElementById('s2-roi-current').textContent = `${roiCurr.toFixed(1)}%`;
  document.getElementById('s2-annual-current').textContent = `${annCurr.toFixed(2)}%`;
  document.getElementById('s2-roi-cap').textContent = `${roiCap.toFixed(1)}%`;
  document.getElementById('s2-annual-cap').textContent = `${annCap.toFixed(2)}%`;
  const cp = totalPrem>0 ? (cost/totalPrem)*100 : 0;
  const bp = totalPrem>0 ? (loan/totalPrem)*100 : 0;
  document.getElementById('leverage-client-bar').style.width = `${Math.min(cp,100)}%`;
  document.getElementById('leverage-bank-bar').style.width = `${Math.min(bp,100)}%`;
  document.getElementById('leverage-client-label').textContent = `客戶 ${cp.toFixed(1)}%`;
  document.getElementById('leverage-bank-label').textContent = `銀行 ${bp.toFixed(1)}%`;
  updateDualReturnChart();
}

/* ═══ ECharts 圖表 ═══ */
function initCharts() {
  echartsInstances.wealth = echarts.init(document.getElementById('chart-wealth-river'));
  echartsInstances.premiumPie = echarts.init(document.getElementById('chart-premium-pie'));
  echartsInstances.opp = echarts.init(document.getElementById('chart-opp-cost'));
  echartsInstances.dual = echarts.init(document.getElementById('chart-dual-return'));
  echartsInstances.comparison = echarts.init(document.getElementById('chart-comparison'));
  window.addEventListener('resize', () => Object.values(echartsInstances).forEach(c => c && c.resize()));
}

function updateWealthChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !echartsInstances.wealth) return;
  const userPremium = parseFloat(document.getElementById('s1-premium').value) || prod.annualPremium;
  const target = parseFloat(document.getElementById('s1-target-amount').value) || 0;
  const dataPoints = prod.unitData || prod.policyData || [];
  const years = dataPoints.map(d => `第${d.year}年`);

  /* v3.2：用 unitData 縮放 */
  const guaranteed = dataPoints.map(d => {
    if (d.unitGuaranteed !== undefined) return Math.round(d.unitGuaranteed * userPremium);
    return Math.round((d.guaranteedCV || 0) * (userPremium / getBasePremiumUnit(prod)));
  });
  const bonus = dataPoints.map(d => {
    if (d.unitBonus !== undefined) return Math.round(d.unitBonus * userPremium);
    return Math.round((d.nonGuaranteedBonus || 0) * (userPremium / getBasePremiumUnit(prod)));
  });
  const total = guaranteed.map((g,i) => g + bonus[i]);
  const targetLine = dataPoints.map(() => target);

  let targetYear = null;
  for (let i = 0; i < total.length; i++) {
    if (total[i] >= target) { targetYear = dataPoints[i].year; break; }
  }
  const hintEl = document.getElementById('s1-target-year-hint');
  if (hintEl) hintEl.textContent = targetYear ? `✅ 預計第 ${targetYear} 年達成目標` : '⚠️ 目前參數下未能在展示期內達成目標';

  echartsInstances.wealth.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['保證現金價值','非保證紅利','總價值','目標金額'], top: 0 },
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value', name: '價值', axisLabel: { formatter: v => fmtShort(v) } },
    series: [
      { name: '保證現金價值', type: 'bar', stack: 'wealth', data: guaranteed, itemStyle: { color: '#1a5fb4' } },
      { name: '非保證紅利', type: 'bar', stack: 'wealth', data: bonus, itemStyle: { color: '#999' } },
      { name: '總價值', type: 'line', data: total, itemStyle: { color: '#26a269' }, lineStyle: { width: 2 } },
      { name: '目標金額', type: 'line', data: targetLine, itemStyle: { color: '#c01c28' }, lineStyle: { type: 'dashed', width: 2 }, symbol: 'none' }
    ]
  }, true);
}

/* 任務三：繳費構成餅圖（融資模式下隱藏） */
function updatePremiumPie() {
  if (!echartsInstances.premiumPie) return;
  const s1 = state.s1Results;
  if (!s1 || !s1.base) return;

  /* 融資模式下隱藏餅圖 */
  const pieContainer = document.getElementById('chart-premium-pie');
  if (!pieContainer) return;
  const pieWrapper = pieContainer.closest('.chart-mini-wrapper');
  if (state.activeScene === 2 || (state.financeEnabled && getProductById(state.primaryProduct)?.isFinanceable && state.activeScene === 2)) {
    if (pieWrapper) pieWrapper.style.display = 'none';
    return;
  }
  if (pieWrapper) pieWrapper.style.display = '';

  /* 儲蓄險模式：4項分解 */
  const clientPay = s1.premY1 + (s1.base * Math.max(0, s1.payTerm - 1));
  const prepayDisc = s1.prepayDisc;
  const firstDisc = s1.base * s1.discY1;
  const renewalDisc = s1.base * 0; /* 續期折扣（如有，僅第二年，目前預設0） */

  echartsInstances.premiumPie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%','70%'],
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data: [
        { name: '客戶實際出資', value: Math.round(clientPay), itemStyle: { color: '#1a5fb4' } },
        { name: '預繳保費利息', value: Math.round(prepayDisc), itemStyle: { color: '#26a269' } },
        { name: '首年保費折扣', value: Math.round(firstDisc), itemStyle: { color: '#f5a623' } },
        { name: '續期保費折扣', value: Math.round(renewalDisc), itemStyle: { color: '#999' } }
      ].filter(d => d.value > 0) /* 只顯示大於0的項 */
    }]
  }, true);
}

/* 第四步：客戶期望收益 vs 本計劃單利對比（不要 IRR）*/
function updateOppChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !echartsInstances.opp) return;
  const customRate = parseFloat(document.getElementById('opp-custom-rate').value) || 5;
  const base = parseFloat(document.getElementById('s1-premium').value) || prod.annualPremium;
  const ratio = base / getBasePremiumUnit(prod);
  const years = [5, 10, 15, 20].filter(y => prod.policyData.some(d => d.year <= y));
  /* 本計劃平均年度單利 */
  const simpleData = years.map(y => {
    const d = getPolicyDataAtYear(prod, y);
    if (!d) return 0;
    const total = (d.guaranteedCV + d.nonGuaranteedBonus) * ratio;
    const paid = (d.premiumPaid ?? d.principal ?? 0) * ratio;
    return paid > 0 ? +((total - paid) / paid / y * 100).toFixed(2) : 0;
  });
  /* 客戶期望收益率（水平基準線） */
  const customData = years.map(() => customRate);

  echartsInstances.opp.setOption({
    tooltip: { trigger: 'axis', formatter: p => p.map(i => `${i.seriesName}: ${i.value}%`).join('<br/>') },
    legend: { data: ['本計劃平均年度單利', '客戶期望收益率'], top: 0 },
    xAxis: { type: 'category', data: years.map(y => `第${y}年`) },
    yAxis: { type: 'value', name: '%', axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '本計劃平均年度單利', type: 'bar', data: simpleData, itemStyle: { color: '#1a5fb4' }, label: { show: true, formatter: '{c}%', fontSize: 10 } },
      { name: '客戶期望收益率', type: 'line', data: customData, itemStyle: { color: '#f5a623' }, lineStyle: { width: 2, type: 'dashed' }, symbol: 'diamond', symbolSize: 8, label: { show: true, formatter: '{c}%', fontSize: 10 } }
    ]
  }, true);
  updateOpportunityTable();
}

function updateDualReturnChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !prod.isFinanceable || !echartsInstances.dual) return;
  const totalPrem = parseFloat(document.getElementById('s2-total-premium').value) || 0;
  const ltv = (parseFloat(document.getElementById('s2-ltv').value)||95)/100;
  const rate = (parseFloat(document.getElementById('s2-rate').value)||3.275)/100;
  const cap = (parseFloat(document.getElementById('s2-cap-rate').value)||3.9)/100;
  const feeRate = (parseFloat(document.getElementById('s2-loan-fee').value)||2)/100;
  const exitY = Math.min(10, parseInt(document.getElementById('s2-loan-term').value)||9);
  const fdCV = totalPrem * (prod.firstDayCVRatio||0.95);
  const loan = fdCV * ltv;
  const fee = loan * feeRate;
  const ratio = totalPrem / getBasePremiumUnit(prod);
  const years = Array.from({length:10}, (_,i)=>i+1);
  const navCurr = years.map(y => {
    const d = getPolicyDataAtYear(prod, y);
    if (!d) return null;
    return Math.round(((d.guaranteedCV + d.nonGuaranteedBonus) * ratio) - loan - (loan * rate * y) - fee);
  });
  const navCap = years.map(y => {
    const d = getPolicyDataAtYear(prod, y);
    if (!d) return null;
    return Math.round(((d.guaranteedCV + d.nonGuaranteedBonus) * ratio) - loan - (loan * cap * y) - fee);
  });
  const anchor = years.map((y,i) => y === exitY ? navCurr[i] : null);
  echartsInstances.dual.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['正常環境NAV','最壞環境NAV','黃金退出點'], top: 0 },
    xAxis: { type: 'category', data: years.map(y=>`第${y}年`) },
    yAxis: { type: 'value', name: 'NAV', axisLabel: { formatter: v => fmtShort(v) } },
    series: [
      { name: '正常環境NAV', type: 'line', data: navCurr, smooth: true, itemStyle: { color: '#1a5fb4' }, areaStyle: { opacity: 0.1 } },
      { name: '最壞環境NAV', type: 'line', data: navCap, smooth: true, itemStyle: { color: '#c01c28' }, lineStyle: { type: 'dashed' } },
      { name: '黃金退出點', type: 'scatter', data: anchor, symbolSize: 20, itemStyle: { color: '#f5a623' }, label: { show: true, formatter: '⭐', fontSize: 16, position: 'top' } }
    ]
  }, true);
}

function updateComparisonChart() {
  if (!echartsInstances.comparison) return;
  const ids = [state.primaryProduct, ...state.compareProducts].filter(Boolean);
  if (ids.length < 2) return;
  const years = [1,5,10,15,20,25,30];
  const series = [];

  ids.forEach((pid) => {
    const prod = getProductById(pid);
    if (!prod) return;
    const isPrimary = pid === state.primaryProduct;
    const dataPoints = prod.unitData || prod.policyData || [];

    /* 用 unitData 計算總價值倍數（×100%顯示）*/
    const dataValues = years.map(y => {
      const d = getPolicyDataAtYear(prod, y);
      if (!d) return null;
      const ug = d.unitGuaranteed !== undefined ? d.unitGuaranteed : 0;
      const ub = d.unitBonus !== undefined ? d.unitBonus : 0;
      return +((ug + ub) * 100).toFixed(1);
    });

    series.push({
      name: prod.name, type: 'line', smooth: true,
      data: dataValues,
      itemStyle: { color: isPrimary ? '#1a5fb4' : '#b0bec5' },
      lineStyle: { width: isPrimary ? 3 : 1.5, opacity: isPrimary ? 1 : 0.6 },
      markLine: isPrimary ? {
        symbol: 'none',
        data: (() => {
          const be = calcBreakEvenYear(prod, prod.standardPremium || prod.annualPremium || 1);
          const lines = [];
          if (be?.breakEvenYear) lines.push({ xAxis: `第${be.breakEvenYear}年`, label: { formatter: `回本\n${be.ratio}倍`, color: '#26a269', fontSize: 9 }, lineStyle: { color: '#26a269', type: 'dashed' } });
          if (be?.guaranteedBreakEven) lines.push({ xAxis: `第${be.guaranteedBreakEven}年`, label: { formatter: '保證\n回本', color: '#1a5fb4', fontSize: 9 }, lineStyle: { color: '#1a5fb4', type: 'dotted' } });
          return lines;
        })()
      } : undefined
    });
  });

  echartsInstances.comparison.setOption({
    tooltip: { trigger: 'axis', formatter: p => { let s = p[0].axisValue + '<br/>'; p.forEach(i => { if (i.value != null) s += `${i.marker}${i.seriesName}: ${i.value}%<br/>`; }); return s; } },
    legend: { top: 0, textStyle: { fontSize: 10 } },
    grid: { left: '8%', right: '5%', bottom: '10%' },
    xAxis: { type: 'category', data: years.map(y=>`第${y}年`), axisLabel: { interval: 0 } },
    yAxis: { type: 'value', name: '總資產(×保費%)', axisLabel: { formatter: '{value}%' }, scale: true },
    series
  }, true);
  updateComparisonTable(ids);
}

/* ═══ 對比表 ═══ */
/* 第五步：按需求標籤自動拉入同類產品對比 */
function updateComparisonSection() {
  const sec = document.getElementById('comparison-section');
  const prod = getProductById(state.primaryProduct);
  if (!prod || !sec) return;

  /* 根據需求標籤自動篩選同類產品 */
  let compareIds = [];
  if (state.needTags.length > 0) {
    /* 找出與當前產品共享至少一個需求標籤的其他產品 */
    compareIds = productList
      .filter(p => p.id !== state.primaryProduct && p.needTags.some(t => prod.needTags.includes(t)))
      .map(p => p.id);
  }

  /* 如果沒有需求標籤，但有手動勾選的對比產品，用手動的 */
  if (compareIds.length === 0 && state.compareProducts.length > 0) {
    compareIds = [...state.compareProducts];
  }

  const total = 1 + compareIds.length; /* 當前產品 + 同類 */

  if (total >= 2) {
    sec.classList.remove('comparison-hidden');
    /* 臨時設置 compareProducts 用於圖表渲染 */
    const originalCompare = [...state.compareProducts];
    state.compareProducts = compareIds;
    updateComparisonChart();
    state.compareProducts = originalCompare;

    /* 顯示提示 */
    let banner = document.getElementById('multi-product-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'multi-product-banner';
      banner.style.cssText = 'background:#e8f0ff;padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.85rem;color:var(--primary);font-weight:600;';
      sec.insertBefore(banner, sec.firstChild);
    }
    const tagLabel = state.needTags.length > 0 ? `（按需求標籤：${state.needTags.join('、')}）` : '';
    banner.textContent = `已選 ${total} 個同類產品對比${tagLabel}`;
  } else {
    sec.classList.add('comparison-hidden');
    const banner = document.getElementById('multi-product-banner');
    if (banner) banner.remove();
  }
}

function updateComparisonTable(ids) {
  const t = document.getElementById('comparison-table');
  const thead = t.querySelector('thead tr');
  const tbody = t.querySelector('tbody');
  thead.innerHTML = '<th>對比維度</th>';
  ids.forEach(id => { const p = getProductById(id); if (p) { const th = document.createElement('th'); th.textContent = p.name; thead.appendChild(th); } });
  tbody.innerHTML = '';
  const rows = [
    { label: '公司', fn: p => p.company },
    { label: '貨幣', fn: p => p.currency },
    { label: '繳費年期', fn: p => p.payTerms.map(t => (p.payTermLabels||{})[String(t)]||`${t}年`).join('/') },
    { label: '保證回報率(第20年)', fn: p => { const d = getPolicyDataAtYear(p,20); const b = getBasePremiumUnit(p); return d ? `${(d.guaranteedCV/b*100).toFixed(1)}%` : '—'; } },
    { label: '預期總回報率(第20年)', fn: p => { const d = getPolicyDataAtYear(p,20); const b = getBasePremiumUnit(p); return d ? `${((d.guaranteedCV+d.nonGuaranteedBonus)/b*100).toFixed(1)}%` : '—'; } },
    { label: '回本年份', fn: p => { const b = getBasePremiumUnit(p); for (const d of p.policyData) { if (d.guaranteedCV >= b) return `第${d.year}年`; } return '長期'; } },
    { label: '可融資', fn: p => p.isFinanceable ? '✅' : '❌' },
    { label: '融資後IRR(第10年)', fn: p => p.isFinanceable ? '18.9%' : '—' }
  ];
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.textContent = r.label; td.style.fontWeight='600'; tr.appendChild(td);
    ids.forEach(id => { const p = getProductById(id); const td2 = document.createElement('td'); td2.textContent = p ? r.fn(p) : '—'; tr.appendChild(td2); });
    tbody.appendChild(tr);
  });
}

/* ═══ 權益牆 ═══ */
function updatePrivilegesWall(totalPremium) {
  const prod = getProductById(state.primaryProduct);
  const wall = document.getElementById('privileges-wall');
  if (!prod || !wall) return;
  if (!prod.privileges || prod.privileges.length === 0) { wall.innerHTML = '<span style="font-size:.8rem;color:var(--text-muted)">此產品暫無權益配置</span>'; return; }
  wall.innerHTML = prod.privileges.map(pv => {
    const ok = totalPremium >= pv.threshold;
    return `<div class="privilege-chip ${ok?'unlocked':'locked'}" title="門檻：${fmt(pv.threshold)}">${pv.icon}<span>${pv.name}</span>${ok?'<span style="font-size:.7rem;margin-left:3px">✓</span>':''}</div>`;
  }).join('');
}

/* ═══ 跨資產機會成本表 ═══ */
/* 第六步：投資工具對比表（6項 + 入場門檻 + 核心差異）*/
function updateOpportunityTable() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const obsYear = 20;
  const userPremium = parseFloat(document.getElementById('s1-premium').value) || prod.annualPremium || prod.standardPremium;
  const sym = (appConfig.currencySymbols||{})[state.displayCurrency||prod.currency] || '';

  /* v3.2：用 unitData 計算本方案平均年度單利 */
  const d = getPolicyDataAtYear(prod, obsYear);
  let irr = 0;
  if (d) {
    const ug = d.unitGuaranteed !== undefined ? d.unitGuaranteed : 0;
    const ub = d.unitBonus !== undefined ? d.unitBonus : 0;
    const totalValue = (ug + ub) * userPremium;
    /* 折扣後總保費 */
    const discPct = ((prod.discounts?.firstYear?.defaultPercent)||0)/100;
    const payTerm = prod.payTerms?.[0] || 1;
    const paidTotal = userPremium * (1 - discPct) * payTerm;
    irr = paidTotal > 0 ? ((totalValue - paidTotal) / paidTotal / obsYear * 100) : 0;
  }

  const rows = [
    { tool: '🏠 本儲蓄保險方案', ret: `<span class="return-positive">${irr.toFixed(2)}% 單利</span>`, threshold: `${sym}${fmt(state.s1Results.netTotal||userPremium)}`, liq: '低', risk: '早期退保虧損、非保證分紅波動', diff: '—', hl: true },
    { tool: '🇺🇸 美國長期國債ETF（TLT/VGLT）', ret: '4.0%-4.7%', threshold: '約25-150美元（1股）', liq: '高', risk: '利率風險、匯率風險、30%利息預扣稅', diff: '收益隨利率波動，ETF無固定到期保本', hl: false },
    { tool: '🏦 銀行定期存款', ret: '1.5%-3.5%', threshold: '約1,000美元起', liq: '高', risk: '利率下行風險、再投資風險', diff: '收益確定但較低，受存款保障（最高80萬港元）', hl: false },
    { tool: '📊 高股息ETF（如00900等）', ret: '約7.6%（非保證）', threshold: '約數萬港元', liq: '高', risk: '價格波動風險、股息不穩定', diff: '收益非保證，需承擔市場波動，無保本機制', hl: false },
    { tool: '💰 穩健型銀行理財（固收+）', ret: '3.45%-7.51%', threshold: '約1萬元人民幣起', liq: '中高', risk: '淨值波動風險（資管新規後不保本）', diff: '收益浮動，淨值可能下跌，無保險保障', hl: false },
    { tool: '🏠 物業收租', ret: '2.5%-3.0%', threshold: '約300,000美元', liq: '極低', risk: '管理費、空置期、樓價跌、印花稅', diff: '流動性最差，持有成本高，受經濟周期影響大', hl: false }
  ];
  const tbody = document.getElementById('opp-table-body');
  if (!tbody) return;
  tbody.innerHTML = rows.map(r => `<tr class="${r.hl?'opp-highlight':''}"><td>${r.tool}</td><td>${r.ret}</td><td>${r.threshold}</td><td>${r.liq}</td><td>${r.risk}</td><td>${r.diff}</td></tr>`).join('');
}

/* ═══ 報告 ═══ */
function updateAdvisorTags() {
  state.advisorTags = Array.from(document.querySelectorAll('#advisor-tags input:checked')).map(cb => cb.value);
}
function onFinanceToggle() {
  const t = document.getElementById('finance-toggle');
  const l = document.getElementById('finance-toggle-label');
  state.financeEnabled = t.checked;
  l.textContent = t.checked ? '已啟用 — 報告含融資壓力測試頁（共三頁）' : '已關閉 — 報告僅含兩頁';
  l.style.color = t.checked ? 'var(--success)' : 'var(--text-muted)';
}

function generateReport() {
  const s1 = state.s1Results, s2 = state.s2Results;
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const sym = (appConfig.currencySymbols||{})[state.displayCurrency||prod.currency] || '';
  const now = new Date().toLocaleString('zh-HK');
  const ver = document.getElementById('report-version').value;
  const isClient = ver === 'client';
  const intro = state.advisorTags.length > 0
    ? state.advisorTags.map(t => ({ '財富傳承':'針對財富傳承需求，透過長線複利增值實現跨代傳承。','資產配置與投資':'作為防守型資產，與進攻型資產互補降低組合波動。','儲蓄退休規劃':'為退休提供穩健被動收入，鎖定長線回報。','子女教育基金':'為子女教育提前儲備，複利效應最大化。','高額人壽保障':'結合高額保障與儲蓄增值，一張保單雙重需求。' }[t] || '')).join(' ')
    : `本報告基於${prod.name}的保證與非保證利益，提供客觀數據供參考。`;
  const irrLabel = isClient ? '平均每年複利回報' : 'IRR';
  const container = document.getElementById('report-output');
  let p1 = `<div class="pdf-page"><div class="pdf-page-title">📋 客戶專屬資產配置摘要</div>
    <div class="report-row"><span>產品名稱</span><span>${prod.name}</span></div>
    <div class="report-row"><span>產品編碼</span><span>${prod.code}</span></div>
    <div class="report-row"><span>保險公司</span><span>${prod.company}</span></div>
    <div class="report-row"><span>顧問標籤</span><span>${state.advisorTags.join('、')||'未指定'}</span></div>
    <div class="report-row"><span>生成日期</span><span>${now}</span></div>
    <div class="pdf-intro">${intro}</div>
    <div class="report-section-title">💰 儲蓄方案分析</div>
    <div class="report-row"><span>年保費</span><span>${sym} ${fmt(s1.base)}</span></div>
    <div class="report-row"><span>繳費年期</span><span>${s1.payTerm} 年</span></div>
    <div class="report-row"><span>首年折扣</span><span>${(s1.discY1*100).toFixed(0)}%</span></div>
    <div class="report-row"><span>📌 實際淨出資</span><span style="color:var(--accent);font-weight:700">${sym} ${fmt(s1.netTotal)}</span></div></div>`;
  let p2 = `<div class="pdf-page"><div class="pdf-page-title">⚖️ 跨資產機會成本對比（第20年）</div>
    <table class="comparison-table opp-table" style="width:100%;font-size:.82rem;"><thead><tr><th>投資工具</th><th>預期年化收益</th><th>流動性</th><th>風險</th></tr></thead><tbody>${document.getElementById('opp-table-body').innerHTML}</tbody></table>
    <p style="margin-top:1rem;font-size:.78rem;color:var(--text-muted);">⚠️ 以上對比基於第20週年數據，僅供參考。</p></div>`;
  let p3 = '';
  if (state.financeEnabled && s2 && s2.totalPrem > 0) {
    p3 = `<div class="pdf-page"><div class="pdf-page-title">🏦 保費融資雙極限壓力測試</div>
      <div class="report-section-title">客戶總出資成本明細</div>
      <div class="report-row"><span>① 實際貸款金額</span><span>${sym} ${fmt(s2.loan)}</span></div>
      <div class="report-row"><span>② 貸款手續費</span><span>${sym} ${fmt(s2.fee)}</span></div>
      <div class="report-row"><span>④ 客戶總出資成本</span><span style="color:var(--accent);font-weight:700">${sym} ${fmt(s2.cost)}</span></div>
      <div class="report-section-title">雙極限回報（第${s2.term}年退出）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin:.75rem 0;">
        <div class="result-card success" style="text-align:center;"><div class="rc-label">✅ 正常環境</div><div class="rc-value">${s2.roiCurr.toFixed(1)}%</div><div class="rc-sub">${isClient?'平均年回報':irrLabel} <strong>${s2.annCurr.toFixed(2)}%</strong></div></div>
        <div class="result-card warning" style="text-align:center;"><div class="rc-label">⚠️ 最壞環境</div><div class="rc-value">${s2.roiCap.toFixed(1)}%</div><div class="rc-sub">${isClient?'平均年回報':irrLabel} <strong>${s2.annCap.toFixed(2)}%</strong></div></div>
      </div>
      <div class="pdf-signature"><div><p>客戶簽名：</p><div class="pdf-signature-line"></div></div><div style="text-align:right;"><p>顧問簽署：</p><div class="pdf-signature-line"></div></div></div></div>`;
  }
  container.innerHTML = p1 + p2 + p3 + `<div style="font-size:.75rem;color:var(--text-muted);line-height:1.8;margin-top:1rem;padding:.75rem;background:var(--surface-3);border-radius:var(--radius-sm);">⚠️ 重要聲明：終期紅利、融資預計回報屬非保證演示數據。所有數字以正式計劃書為準。</div>`;
  document.getElementById('btn-whatsapp').disabled = false;
  document.getElementById('btn-pdf').disabled = false;
  showToast('✅ 報告已生成！');
}

function copyWhatsApp() {
  const s1 = state.s1Results, s2 = state.s2Results;
  const prod = getProductById(state.primaryProduct);
  const sym = (appConfig.currencySymbols||{})[state.displayCurrency||prod.currency] || '';
  let t = `🛡 *${prod.name} — 客戶投保分析摘要*\n\n💰 *儲蓄方案*\n• 年保費：${sym}${fmt(s1.base)}｜繳費 ${s1.payTerm} 年\n• 淨出資：${sym}${fmt(s1.netTotal)}\n`;
  if (state.financeEnabled && s2 && s2.totalPrem > 0) {
    t += `\n🏦 *保費融資*\n• 總保費：${sym}${fmt(s2.totalPrem)}｜LTV ${(s2.ltv*100).toFixed(0)}%\n• 客戶出資：${sym}${fmt(s2.cost)}\n• 第${s2.term}年退出：✅正常${s2.roiCurr.toFixed(1)}%（年${s2.annCurr.toFixed(2)}%）⚠️封頂${s2.roiCap.toFixed(1)}%（年${s2.annCap.toFixed(2)}%）\n`;
  }
  if (state.advisorTags.length > 0) t += `\n🏷 *顧問觀點*：${state.advisorTags.join('、')}\n`;
  t += `\n⚠️ 數據僅供參考，以正式計劃書為準。`;
  navigator.clipboard.writeText(t).then(() => showToast('💬 WhatsApp 摘要已複製！'));
}

function downloadPDF() {
  const el = document.getElementById('report-output');
  const prod = getProductById(state.primaryProduct);
  showToast('📄 正在生成 PDF...');
  html2pdf().set({ margin:[10,10,10,10], filename:`${prod.name}_報告.pdf`, image:{type:'jpeg',quality:0.95}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['css','legacy'],before:'.pdf-page'} }).from(el).save().then(()=>showToast('✅ PDF 已下載！')).catch(()=>showToast('❌ PDF 生成失敗'));
}

/* ═══ Brochures ═══ */
function updateBrochureForProduct() {
  const prod = getProductById(state.primaryProduct);
  const c = document.getElementById('brochures-list');
  const h = document.getElementById('brochures-hint');
  if (!c || !prod) return;
  const cached = localStorage.getItem('it_brochures_index');
  let files = []; try { files = JSON.parse(cached) || []; } catch {}
  const expected = prod.brochureFile || `${prod.id}.pdf`;
  const matched = files.find(f => f.name === expected);
  if (matched) {
    h.textContent = `當前產品：${prod.name}`;
    c.innerHTML = `<div class="brochure-card" onclick="openBrochure('${matched.url}','${matched.name}')"><span class="brochure-icon">📄</span><span class="brochure-name">${prod.name}</span><span class="brochure-size">${(matched.size/1024).toFixed(0)} KB</span><span style="font-size:.72rem;color:var(--primary);">點擊查閱 →</span></div>`;
  } else {
    h.textContent = `當前產品：${prod.name} — 檔名：${expected}`;
    c.innerHTML = `<div class="brochure-card" style="cursor:default;border-style:dashed;"><span class="brochure-icon">📄</span><span class="brochure-name">${prod.name}</span><span style="font-size:.72rem;color:var(--text-muted);">尚未同步</span></div>`;
  }
}

async function loadBrochuresList() {
  const c = document.getElementById('brochures-list');
  const token = typeof getToken === 'function' ? getToken() : '';
  const cached = localStorage.getItem('it_brochures_index');
  if (cached) { try { const f = JSON.parse(cached); if (f.length > 0) { renderBrochures(f); return; } } catch {} }
  c.innerHTML = '<p class="hint-text">🔄 載入中...</p>';
  try {
    const resp = await fetch('https://api.github.com/repos/terrielau2011-design/insurance-trainer/contents/brochures', { headers: { 'Accept':'application/vnd.github.v3+json', ...(token?{'Authorization':`Bearer ${token}`}:{}) } });
    if (!resp.ok) { updateBrochureForProduct(); return; }
    const files = (await resp.json()).filter(f => f.name.endsWith('.pdf')).map(f => ({ name:f.name, url:f.download_url, size:f.size }));
    localStorage.setItem('it_brochures_index', JSON.stringify(files));
    renderBrochures(files);
  } catch { updateBrochureForProduct(); }
}

function renderBrochures(files) { document.getElementById('brochures-list').innerHTML = files.map(f => `<div class="brochure-card" onclick="openBrochure('${f.url}','${f.name}')"><span class="brochure-icon">📄</span><span class="brochure-name">${f.name}</span><span class="brochure-size">${(f.size/1024).toFixed(0)} KB</span><span style="font-size:.72rem;color:var(--primary);">查閱 →</span></div>`).join(''); }
function openBrochure(url, name) { window.open(url, '_blank'); }

function showToast(msg) {
  const old = document.getElementById('toast'); if (old) old.remove();
  const t = document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#1a5fb4;color:#fff;padding:.75rem 1.5rem;border-radius:8px;font-size:.88rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);';
  t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3000);
}

/* ═══ 工具函數（v3.2：unitData 縮放算法 + 回本期計算）═══ */
function getProductById(id) { return productList.find(p => p.id === id) || null; }

function getBasePremiumUnit(prod) {
  return prod?.standardPremium || prod?.annualPremium || 1;
}

/* v3.2：用單位利益數據獲取任意年度價值 */
function getPolicyDataAtYear(prod, yr) {
  if (!prod) return null;

  /* 優先使用 unitData */
  if (prod.unitData && prod.unitData.length > 0) {
    const sorted = [...prod.unitData].sort((a, b) => a.year - b.year);
    const exact = sorted.find(d => d.year === yr);
    if (exact) return { year: yr, unitGuaranteed: exact.unitGuaranteed, unitBonus: exact.unitBonus, guaranteedCV: exact.unitGuaranteed * (prod.standardPremium||1), nonGuaranteedBonus: exact.unitBonus * (prod.standardPremium||1) };
    if (yr < sorted[0].year) return { year: yr, unitGuaranteed: sorted[0].unitGuaranteed, unitBonus: sorted[0].unitBonus, guaranteedCV: sorted[0].unitGuaranteed * (prod.standardPremium||1), nonGuaranteedBonus: sorted[0].unitBonus * (prod.standardPremium||1) };
    if (yr > sorted[sorted.length-1].year) return { year: yr, unitGuaranteed: sorted[sorted.length-1].unitGuaranteed, unitBonus: sorted[sorted.length-1].unitBonus, guaranteedCV: sorted[sorted.length-1].unitGuaranteed * (prod.standardPremium||1), nonGuaranteedBonus: sorted[sorted.length-1].unitBonus * (prod.standardPremium||1) };
    const before = sorted.filter(d => d.year < yr).pop();
    const after = sorted.find(d => d.year > yr);
    if (!before || !after) return null;
    const t = (yr - before.year) / (after.year - before.year);
    const ug = lerp(before.unitGuaranteed, after.unitGuaranteed, t);
    const ub = lerp(before.unitBonus, after.unitBonus, t);
    return { year: yr, unitGuaranteed: ug, unitBonus: ub, guaranteedCV: ug * (prod.standardPremium||1), nonGuaranteedBonus: ub * (prod.standardPremium||1) };
  }

  /* 向後兼容舊 policyData */
  if (!prod.policyData || prod.policyData.length === 0) return null;
  const s = [...prod.policyData].sort((a,b)=>a.year-b.year);
  const ex = s.find(d => d.year === yr); if (ex) return ex;
  if (yr < s[0].year) return s[0];
  if (yr > s[s.length-1].year) return s[s.length-1];
  const before = s.filter(d => d.year < yr).pop();
  const after = s.find(d => d.year > yr);
  if (!before || !after) return null;
  const t = (yr - before.year) / (after.year - before.year);
  return { year: yr, premiumPaid: lerp(before.premiumPaid||before.principal||0, after.premiumPaid||after.principal||0, t), guaranteedCV: lerp(before.guaranteedCV, after.guaranteedCV, t), nonGuaranteedBonus: lerp(before.nonGuaranteedBonus, after.nonGuaranteedBonus, t) };
}

/* v3.2：計算回本年份 */
function calcBreakEvenYear(prod, userPremium) {
  if (!prod || !prod.unitData) return null;
  const discPct = ((prod.discounts?.firstYear?.defaultPercent)||0)/100;
  const paidTotal = userPremium * (1 - discPct) * (prod.payTerms?.[0] || 1);
  const sorted = [...prod.unitData].sort((a,b) => a.year - b.year);
  let breakEvenYear = null, guaranteedBreakEven = null, ratio = null;
  for (const d of sorted) {
    const totalValue = (d.unitGuaranteed + d.unitBonus) * userPremium;
    if (totalValue >= paidTotal && !breakEvenYear) {
      breakEvenYear = d.year;
      ratio = (paidTotal / totalValue).toFixed(2);
    }
    if (d.unitGuaranteed * userPremium >= paidTotal && !guaranteedBreakEven) {
      guaranteedBreakEven = d.year;
    }
  }
  return { breakEvenYear, guaranteedBreakEven, ratio };
}

function lerp(a,b,t) { return a + (b-a)*t; }
function fmt(n) { return (n===null||n===undefined||isNaN(n)) ? '—' : Math.round(n).toLocaleString('zh-HK'); }
function fmtShort(n) { if (Math.abs(n)>=1e8) return (n/1e8).toFixed(1)+'億'; if (Math.abs(n)>=1e4) return (n/1e4).toFixed(1)+'萬'; return Math.round(n).toString(); }
