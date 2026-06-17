/**
 * ════════════════════════════════════════════════════════════
 * app.js — 核心應用邏輯
 * 保險銷售視覺化培訓系統 v2.0
 *
 * 依賴：
 *   - Chart.js (CDN)
 *   - data.js (productList, bankList, appConfig, initData)
 *   - sync.js (syncData, initSync, openTokenModal 等)
 * ════════════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════
   1. 全局狀態
══════════════════════════════════════════ */
const state = {
  primaryProduct:   null,     // 主力產品 id
  compareProducts:  [],       // 對比產品 id 陣列
  activeScene:      1,        // 1 = 儲蓄険, 2 = 保費融資
  s1Results:        {},       // 場景一計算結果
  s2Results:        {},       // 場景二計算結果
};

/* Chart.js 實例 */
let chartWealthRiver  = null;
let chartSafetyPie    = null;
let chartDualReturn   = null;
let chartComparison   = null;

/* ══════════════════════════════════════════
   2. 初始化
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  initClock();

  /* v2.0: 初始化同步面板 */
  if (typeof initSync === 'function') {
    initSync();
  }

  /* v2.0: 載入產品數據（localStorage 快取 → 預設 JSON） */
  if (typeof initData === 'function') {
    await initData();
  }

  /* 數據載入完成後初始化 UI */
  onDataReady();
});

/* 數據準備完成後的 UI 初始化（可被 data.js 回調或 sync.js 重新觸發） */
function onDataReady() {
  initProductList();
  initBankList();
  initCharts();
  initPrivilegesWall();
  calcScene1();
  calcScene2();
}

/* v2.0: 同步後刷新所有 UI */
function refreshAllUI() {
  initProductList();
  initBankList();
  updateWealthChart();
  updateSafetyPie();
  updateDualReturnChart();
  updateComparisonSection();
}

/* 頁頭時鐘 */
function initClock() {
  const el = document.getElementById('current-time');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleString('zh-HK', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  };
  tick();
  setInterval(tick, 1000);
}

/* 渲染產品列表（v2.0：顯示 category） */
function initProductList() {
  const container = document.getElementById('product-list');
  container.innerHTML = '';

  productList.forEach((prod, idx) => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.id = `prod-item-${prod.id}`;
    item.innerHTML = `
      <input type="checkbox" id="chk-${prod.id}" value="${prod.id}"
        onchange="handleProductSelect(event, '${prod.id}')" />
      <div>
        <div class="prod-name">${prod.name}</div>
        <div class="prod-type">${prod.category} · ${prod.currency}${prod.isFinanceable ? ' · 可融資' : ''}</div>
      </div>
    `;
    container.appendChild(item);

    // 預設選中第一個可融資產品（若有），否則第一個
    const shouldSelect = idx === 0 || (prod.isFinanceable && !container.querySelector('input:checked'));
    if (shouldSelect && !state.primaryProduct) {
      const chk = item.querySelector('input');
      chk.checked = true;
      handleProductSelect({ target: chk }, prod.id);
    }
  });
}

/* 銀行下拉 */
function initBankList() {
  const sel = document.getElementById('s2-bank');
  sel.innerHTML = '';
  bankList.forEach(bank => {
    const opt = document.createElement('option');
    opt.value = bank.id;
    opt.textContent = `${bank.name}（最高 ${bank.maxLTV}% LTV）`;
    sel.appendChild(opt);
  });
}

/* ══════════════════════════════════════════
   3. 產品選擇邏輯
══════════════════════════════════════════ */
function handleProductSelect(evt, prodId) {
  const checked = evt.target.checked;

  if (checked) {
    if (!state.primaryProduct) {
      state.primaryProduct = prodId;
    } else if (!state.compareProducts.includes(prodId)) {
      state.compareProducts.push(prodId);
    }
  } else {
    if (state.primaryProduct === prodId) {
      state.primaryProduct = state.compareProducts.length > 0
        ? state.compareProducts.shift()
        : null;
    } else {
      state.compareProducts = state.compareProducts.filter(id => id !== prodId);
    }
  }

  updateProductItemStyles();
  renderHighlights();
  updateProductCurrencyHints();
  updatePayTermOptions();
  updateComparisonSection();
  calcScene1();
  calcScene2();
}

/* v2.0：更新幣別提示 */
function updateProductCurrencyHints() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const sym = appConfig.currencySymbols[prod.currency] || 'HK$';
  const hint1 = document.getElementById('s1-currency-hint');
  const hint2 = document.getElementById('s2-currency-hint');
  const hintPT = document.getElementById('s1-payterm-hint');
  if (hint1) hint1.textContent = `(${sym})`;
  if (hint2) hint2.textContent = `(${sym})`;
  if (hintPT) hintPT.textContent = `· ${prod.currency}`;
}

/* v2.0：根據產品 payTerms 動態渲染繳費年期選項 */
function updatePayTermOptions() {
  const prod = getProductById(state.primaryProduct);
  if (!prod) return;
  const container = document.getElementById('s1-pay-term');
  if (!container) return;

  container.innerHTML = '';
  prod.payTerms.forEach((term, idx) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 's1pt';
    radio.value = term;
    radio.onchange = calcScene1;
    if (idx === 0) radio.checked = true;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(` ${term}年`));
    container.appendChild(label);
  });
}

function updateProductItemStyles() {
  productList.forEach(prod => {
    const item = document.getElementById(`prod-item-${prod.id}`);
    if (!item) return;
    item.classList.remove('primary-selected', 'compare-selected');
    if (prod.id === state.primaryProduct) {
      item.classList.add('primary-selected');
    } else if (state.compareProducts.includes(prod.id)) {
      item.classList.add('compare-selected');
    }
  });
}

/* 渲染三大亮點 */
function renderHighlights() {
  const area = document.getElementById('highlights-area');
  if (!state.primaryProduct) {
    area.innerHTML = `
      <div class="highlight-placeholder">
        <span class="ph-icon">👈</span>
        <p>請先選擇一個主力產品以查看核心銷售亮點</p>
      </div>`;
    return;
  }

  const prod = getProductById(state.primaryProduct);
  if (!prod) return;

  const listHTML = prod.highlights.map((h, i) => `
    <div class="highlight-card">
      <div class="highlight-num">${i + 1}</div>
      <div class="highlight-content">
        <h4>${h.icon} ${h.title}</h4>
        <p>${h.desc}</p>
      </div>
    </div>
  `).join('');

  area.innerHTML = `<div class="highlights-list">${listHTML}</div>`;
}

/* ══════════════════════════════════════════
   4. 場景切換
══════════════════════════════════════════ */
function switchScene(num) {
  state.activeScene = num;

  document.getElementById('scene1').classList.toggle('active', num === 1);
  document.getElementById('scene2').classList.toggle('active', num === 2);
  document.getElementById('btn-scene1').classList.toggle('active', num === 1);
  document.getElementById('btn-scene2').classList.toggle('active', num === 2);

  if (num === 1) calcScene1();
  else calcScene2();
}

/* ══════════════════════════════════════════
   5. 場景一：儲蓄險計算邏輯（v2.0 雙軌制輸入）
══════════════════════════════════════════ */
function calcScene1() {
  const basePremium = parseFloat(document.getElementById('s1-premium').value) || 0;
  const payTerm     = parseInt(document.querySelector('input[name="s1pt"]:checked')?.value || '10');
  const discY1Pct   = (parseFloat(document.getElementById('s1-discount-y1').value) || 0) / 100;
  const discY2Pct   = (parseFloat(document.getElementById('s1-discount-y2').value) || 0) / 100;
  const prepayRate  = (parseFloat(document.getElementById('s1-prepay').value) || 0) / 100;

  /* ── 折後保費計算（v2.0：次年折扣僅第2年適用，第3年起無折扣）── */
  const premY1  = basePremium * (1 - discY1Pct);
  const premY2  = basePremium * (1 - discY2Pct);
  const premRest = basePremium;

  const remainingYears = Math.max(0, payTerm - 2);
  const totalBeforePrepay = premY1 + premY2 + premRest * remainingYears;
  const prepayDiscount = totalBeforePrepay * prepayRate * (payTerm / 2) / 12;
  const netTotal = Math.max(0, totalBeforePrepay - prepayDiscount);

  state.s1Results = {
    basePremium, payTerm, discY1Pct, discY2Pct, prepayRate,
    premY1, premY2, premRest, totalBeforePrepay, prepayDiscount, netTotal
  };

  const prod = getProductById(state.primaryProduct);
  const sym  = prod ? appConfig.currencySymbols[prod.currency] : 'HK$';

  document.getElementById('s1-net-total').textContent = `${sym} ${fmt(netTotal)}`;
  document.getElementById('s1-net-breakdown').textContent =
    `原始總額 ${sym} ${fmt(totalBeforePrepay)}，預繳折讓 ${sym} ${fmt(prepayDiscount)}`;
  document.getElementById('s1-y1-net').textContent = `${sym} ${fmt(premY1)}`;
  document.getElementById('s1-y2-net').textContent = `${sym} ${fmt(premY2)}`;
  document.getElementById('s1-remaining-net').textContent =
    remainingYears > 0 ? `${sym} ${fmt(premRest)} × ${remainingYears} 年` : '—';

  updatePrivilegesWall(basePremium * payTerm);
  updateWealthChart();
}

/* v2.0 快捷按鈕函數 */
function setS1Premium(v)    { document.getElementById('s1-premium').value = v; calcScene1(); }
function setS1DiscountY1(v) { document.getElementById('s1-discount-y1').value = v; calcScene1(); }
function setS1DiscountY2(v) { document.getElementById('s1-discount-y2').value = v; calcScene1(); }
function setS1Prepay(v)     { document.getElementById('s1-prepay').value = v; calcScene1(); }
function setS1YearRange(v)  { document.getElementById('s1-year-range').value = v; document.getElementById('s1-year-label').textContent = v; updateWealthChart(); }

/* ══════════════════════════════════════════
   6. 場景二：保費融資精算邏輯（v2.0 完整 8 步 NAV 公式）
══════════════════════════════════════════ */
function calcScene2() {
  const totalPremium  = parseFloat(document.getElementById('s2-total-premium').value) || 0;
  const ltvPct        = (parseFloat(document.getElementById('s2-ltv').value) || 0) / 100;
  const annualRate    = (parseFloat(document.getElementById('s2-rate').value) || 0) / 100;
  const capRate       = (parseFloat(document.getElementById('s2-cap-rate').value) || 0) / 100;
  const loanFeeRate   = (parseFloat(document.getElementById('s2-loan-fee').value) || 0) / 100;
  const loanTermYears = Math.min(10, parseInt(document.getElementById('s2-loan-term').value) || 9);

  const prod = getProductById(state.primaryProduct);
  const sym  = prod ? appConfig.currencySymbols[prod.currency] : 'HK$';

  /* ── v2.0 公式鏈 ── */

  /* 首日現金價值 = 總保費 × firstDayCVRatio */
  const firstDayCVRatio = prod?.firstDayCVRatio || 0.7869;
  const firstDayCV = totalPremium * firstDayCVRatio;

  /* ① 實際貸款金額 = 首日現價 × LTV */
  const loanAmount = firstDayCV * ltvPct;

  /* ② 貸款手續費 = 貸款金額 × 手續費率 */
  const loanFee = loanAmount * loanFeeRate;

  /* ③ 實際本金 = 折扣後實付總保費 − 貸款金額 */
  /* 實付總保費 = 總保費 × (1 − 首年折扣) */
  const firstYearDisc = prod?.discounts?.firstYear?.defaultPercent || 12.5;
  const firstYearDiscPct = firstYearDisc / 100;
  const paidTotal = totalPremium * (1 - firstYearDiscPct);
  const actualPrincipal = paidTotal - loanAmount;

  /* ④ 客戶總出資成本 = 實際本金 + 貸款手續費（手續費雙重計入）*/
  const clientTotalCost = actualPrincipal + loanFee;

  /* ⑤ 保單淨資產價值 NAV = 保單總價值 − 貸款本金 − 累計利息 − 手續費 */
  /* 從 policyData 獲取退出年份的保單價值 */
  let policyValueAtEnd = 0;
  let guaranteedCVAtEnd = 0;
  let nonGuaranteedAtEnd = 0;

  if (prod && prod.policyData.length > 0) {
    const ratio = totalPremium / getBasePremiumUnit(prod);
    const dataAtEnd = getPolicyDataAtYear(prod, loanTermYears);
    if (dataAtEnd) {
      policyValueAtEnd  = (dataAtEnd.guaranteedCV + dataAtEnd.nonGuaranteedBonus) * ratio;
      guaranteedCVAtEnd = dataAtEnd.guaranteedCV * ratio;
      nonGuaranteedAtEnd = dataAtEnd.nonGuaranteedBonus * ratio;
    }
  }

  const totalInterestCurrent = loanAmount * annualRate * loanTermYears;
  const totalInterestCap     = loanAmount * capRate    * loanTermYears;

  const navCurrent = policyValueAtEnd - loanAmount - totalInterestCurrent - loanFee;
  const navCap     = policyValueAtEnd - loanAmount - totalInterestCap     - loanFee;

  /* ⑥ 真·淨回報 = NAV − 客戶總出資成本 */
  const netProfitCurrent = navCurrent - clientTotalCost;
  const netProfitCap     = navCap     - clientTotalCost;

  /* ⑦ 槓桿後總回報率 = 淨回報 / 客戶總出資成本 */
  const roiCurrent = clientTotalCost > 0 ? (netProfitCurrent / clientTotalCost) * 100 : 0;
  const roiCap     = clientTotalCost > 0 ? (netProfitCap     / clientTotalCost) * 100 : 0;

  /* ⑧ 平均年度化單利 = 總回報率 / 貸款年期 */
  const annualCurrent = loanTermYears > 0 ? roiCurrent / loanTermYears : 0;
  const annualCap     = loanTermYears > 0 ? roiCap     / loanTermYears : 0;

  /* 槓桿比例 */
  const clientPct = totalPremium > 0 ? (clientTotalCost / totalPremium) * 100 : 0;
  const bankPct   = totalPremium > 0 ? (loanAmount / totalPremium) * 100 : 0;

  state.s2Results = {
    totalPremium, ltvPct, annualRate, capRate, loanFeeRate, loanTermYears,
    firstDayCV, loanAmount, loanFee, paidTotal, actualPrincipal, clientTotalCost,
    policyValueAtEnd, guaranteedCVAtEnd, nonGuaranteedAtEnd,
    totalInterestCurrent, totalInterestCap,
    navCurrent, navCap, netProfitCurrent, netProfitCap,
    roiCurrent, roiCap, annualCurrent, annualCap,
    clientPct, bankPct
  };

  /* ── 更新 UI：公式鏈步驟 ── */
  document.getElementById('s2-first-day-cv').textContent    = `${sym} ${fmt(firstDayCV)}`;
  document.getElementById('s2-loan-amount').textContent      = `${sym} ${fmt(loanAmount)}`;
  document.getElementById('s2-loan-fee-amount').textContent  = `${sym} ${fmt(loanFee)}`;
  document.getElementById('s2-actual-principal').textContent = `${sym} ${fmt(actualPrincipal)}`;
  document.getElementById('s2-client-total-cost').textContent= `${sym} ${fmt(clientTotalCost)}`;

  /* 雙極限回報卡片 */
  document.getElementById('s2-roi-current').textContent    = `${roiCurrent.toFixed(1)}%`;
  document.getElementById('s2-annual-current').textContent = `${annualCurrent.toFixed(2)}%`;
  document.getElementById('s2-roi-cap').textContent        = `${roiCap.toFixed(1)}%`;
  document.getElementById('s2-annual-cap').textContent     = `${annualCap.toFixed(2)}%`;

  /* 槓桿條形圖 */
  document.getElementById('leverage-client-bar').style.width = `${Math.min(clientPct, 100)}%`;
  document.getElementById('leverage-bank-bar').style.width   = `${Math.min(bankPct, 100)}%`;
  document.getElementById('leverage-client-label').textContent = `客戶 ${clientPct.toFixed(1)}%`;
  document.getElementById('leverage-bank-label').textContent   = `銀行 ${bankPct.toFixed(1)}%`;

  updateSafetyPie();
  updateDualReturnChart();
}

/* v2.0 場景二快捷按鈕函數 */
function setS2Premium(v)  { document.getElementById('s2-total-premium').value = v; calcScene2(); }
function setS2LTV(v)      { document.getElementById('s2-ltv').value = v; calcScene2(); }
function setS2Rate(v)     { document.getElementById('s2-rate').value = v; calcScene2(); }
function setS2CapRate(v)  { document.getElementById('s2-cap-rate').value = v; calcScene2(); }
function setS2LoanFee(v)  { document.getElementById('s2-loan-fee').value = v; calcScene2(); }
function setS2LoanTerm(v) { document.getElementById('s2-loan-term').value = v; calcScene2(); }

/* ══════════════════════════════════════════
   7. 初始化圖表
══════════════════════════════════════════ */
function initCharts() {
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { font: { family: "'Noto Sans TC', sans-serif", size: 12 } }
      }
    }
  };

  /* ── 7a. 財富消長河流圖（堆疊柱狀圖）── */
  chartWealthRiver = new Chart(
    document.getElementById('chart-wealth-river'),
    {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: '投入本金',
            data: [],
            backgroundColor: 'rgba(26,95,180,0.6)',
            borderColor: 'rgba(26,95,180,1)',
            borderWidth: 1
          },
          {
            label: '保證現金價值（超出本金部分）',
            data: [],
            backgroundColor: 'rgba(38,162,105,0.6)',
            borderColor: 'rgba(38,162,105,1)',
            borderWidth: 1
          },
          {
            label: '非保證紅利',
            data: [],
            backgroundColor: 'rgba(245,166,35,0.6)',
            borderColor: 'rgba(245,166,35,1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: '保單年度', font: { size: 11 } }
          },
          y: {
            stacked: true,
            title: { display: true, text: '價值（原幣）', font: { size: 11 } },
            ticks: {
              callback: v => fmtShort(v)
            }
          }
        },
        plugins: {
          ...chartDefaults.plugins,
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
            }
          }
        }
      }
    }
  );

  /* ── 7b. 安全感指標圓餅圖 ── */
  chartSafetyPie = new Chart(
    document.getElementById('chart-safety-pie'),
    {
      type: 'doughnut',
      data: {
        labels: ['保證現金價值', '非保證紅利'],
        datasets: [{
          data: [50, 50],
          backgroundColor: ['rgba(38,162,105,0.75)', 'rgba(144,202,249,0.75)'],
          borderColor:      ['#26a269', '#64b5f6'],
          borderWidth: 2
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`
            }
          }
        }
      }
    }
  );

  /* ── 7c. v2.0 10年期雙極限 NAV 分析圖 ── */
  chartDualReturn = new Chart(
    document.getElementById('chart-dual-return'),
    {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '藍線：正常環境 NAV（現行利率）',
            data: [],
            borderColor: '#1a5fb4',
            backgroundColor: 'rgba(26,95,180,0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#1a5fb4'
          },
          {
            label: '紅線：最壞環境 NAV（封頂利率）',
            data: [],
            borderColor: '#c01c28',
            backgroundColor: 'rgba(192,28,40,0.07)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            borderDash: [6, 3],
            pointRadius: 4,
            pointBackgroundColor: '#c01c28'
          },
          {
            label: '⭐ 黃金退出點',
            data: [],
            borderColor: '#f5a623',
            backgroundColor: '#f5a623',
            pointRadius: 10,
            pointHoverRadius: 14,
            pointStyle: 'star',
            showLine: false,
            fill: false
          }
        ]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: { title: { display: true, text: '保單年度（10年期）' } },
          y: {
            title: { display: true, text: '保單淨資產價值 NAV' },
            ticks: { callback: v => fmtShort(v) }
          }
        },
        plugins: {
          ...chartDefaults.plugins,
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
            }
          }
        }
      }
    }
  );

  /* ── 7d. 跨產品對比折線圖 ── */
  chartComparison = new Chart(
    document.getElementById('chart-comparison'),
    {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        ...chartDefaults,
        scales: {
          x: { title: { display: true, text: '保單年度' } },
          y: {
            title: { display: true, text: '總資產增長（× 原投入）' },
            ticks: { callback: v => v.toFixed(2) + 'x' }
          }
        }
      }
    }
  );

  /* 初始渲染 */
  updateWealthChart();
  updateSafetyPie();
  updateDualReturnChart();
}

/* ══════════════════════════════════════════
   8. 圖表更新函數
══════════════════════════════════════════ */

/* 8a. 財富消長河流圖 */
function updateWealthChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !chartWealthRiver) return;

  const maxYear   = parseInt(document.getElementById('s1-year-range').value);
  const basePrem  = parseFloat(document.getElementById('s1-premium').value) || 100000;
  const ratio     = basePrem / getBasePremiumUnit(prod);

  /* 篩選年度數據，確保連貫 */
  const dataPoints = getInterpolatedData(prod, maxYear, ratio);

  chartWealthRiver.data.labels = dataPoints.map(d => `第${d.year}年`);

  /* 堆疊：三層分別為 本金 / (保證CV - 本金) / 非保證 */
  chartWealthRiver.data.datasets[0].data = dataPoints.map(d =>
    Math.min(d.principal, d.guaranteedCV) // 本金（最多到保證CV）
  );
  chartWealthRiver.data.datasets[1].data = dataPoints.map(d =>
    Math.max(0, d.guaranteedCV - d.principal) // 保證增值部分
  );
  chartWealthRiver.data.datasets[2].data = dataPoints.map(d =>
    d.nonGuaranteedBonus
  );

  chartWealthRiver.update();
}

/* 8b. 安全感指標圓餅圖 */
function updateSafetyPie() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !chartSafetyPie) return;

  const obsYear   = parseInt(document.getElementById('s2-obs-year').value);
  const totalPrem = parseFloat(document.getElementById('s2-total-premium').value) || 1000000;
  const ratio     = totalPrem / getBasePremiumUnit(prod);
  const data      = getPolicyDataAtYear(prod, obsYear);

  if (!data) return;

  const gcv  = data.guaranteedCV * ratio;
  const ngb  = data.nonGuaranteedBonus * ratio;
  const total = gcv + ngb;
  const gcvPct = total > 0 ? (gcv / total) * 100 : 50;
  const ngbPct = total > 0 ? (ngb / total) * 100 : 50;

  chartSafetyPie.data.datasets[0].data = [gcvPct, ngbPct];
  chartSafetyPie.update();

  document.getElementById('pie-guaranteed').textContent    = `${gcvPct.toFixed(1)}%`;
  document.getElementById('pie-nonguaranteed').textContent = `${ngbPct.toFixed(1)}%`;
}

/* 8c. v2.0 10年期雙極限 NAV 分析圖（藍線正常 + 紅線封頂 + 退出錨點） */
function updateDualReturnChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !chartDualReturn) return;

  const totalPrem   = parseFloat(document.getElementById('s2-total-premium').value) || 600000;
  const ltvPct      = (parseFloat(document.getElementById('s2-ltv').value) || 95) / 100;
  const annualRate  = (parseFloat(document.getElementById('s2-rate').value) || 3.275) / 100;
  const capRate     = (parseFloat(document.getElementById('s2-cap-rate').value) || 3.9) / 100;
  const loanFeeRate = (parseFloat(document.getElementById('s2-loan-fee').value) || 2) / 100;
  const exitYear    = Math.min(10, parseInt(document.getElementById('s2-loan-term').value) || 9);

  const firstDayCVRatio = prod.firstDayCVRatio || 0.7869;
  const firstDayCV = totalPrem * firstDayCVRatio;
  const loanAmount = firstDayCV * ltvPct;
  const loanFee    = loanAmount * loanFeeRate;
  const ratio      = totalPrem / getBasePremiumUnit(prod);

  /* v2.0：固定 10 年期，橫軸第 1~10 年 */
  const years = Array.from({ length: 10 }, (_, i) => i + 1);

  const navCurrent = [];
  const navCap     = [];

  years.forEach(yr => {
    const data = getPolicyDataAtYear(prod, yr);
    if (!data) {
      navCurrent.push(null);
      navCap.push(null);
      return;
    }

    const policyVal    = (data.guaranteedCV + data.nonGuaranteedBonus) * ratio;
    const interestCurr = loanAmount * annualRate * yr;
    const interestCap  = loanAmount * capRate    * yr;

    /* ⑤ NAV = 保單總值 − 貸款 − 利息 − 手續費 */
    const navCurr  = policyVal - loanAmount - interestCurr - loanFee;
    const navWorst = policyVal - loanAmount - interestCap  - loanFee;

    navCurrent.push(navCurr);
    navCap.push(navWorst);
  });

  /* 退出年份的 NAV 值（用於錨點標註） */
  const exitIdx = exitYear - 1;
  const exitNavCurr = navCurrent[exitIdx];

  /* 更新圖表數據 */
  chartDualReturn.data.labels = years.map(y => `第${y}年`);
  chartDualReturn.data.datasets[0].data = navCurrent;
  chartDualReturn.data.datasets[1].data = navCap;

  /* 退出錨點：在退出年份加一個閃爍標記點 */
  const anchorData = new Array(10).fill(null);
  if (exitNavCurr != null) anchorData[exitIdx] = exitNavCurr;
  chartDualReturn.data.datasets[2].data = anchorData;

  chartDualReturn.update();
}

/* 8d. 跨產品對比圖 */
function updateComparisonChart() {
  if (!chartComparison) return;

  const allProducts = [state.primaryProduct, ...state.compareProducts].filter(Boolean);
  const colors = ['#1a5fb4', '#f5a623', '#26a269', '#c01c28'];
  const datasets = [];

  allProducts.forEach((prodId, idx) => {
    const prod = getProductById(prodId);
    if (!prod) return;

    const basePrem = getBasePremiumUnit(prod);
    const maxYear  = Math.max(...prod.policyData.map(d => d.year));
    const years    = [];
    const values   = [];

    for (let yr = 1; yr <= maxYear; yr++) {
      const data = getPolicyDataAtYear(prod, yr);
      if (data) {
        years.push(yr);
        const total = data.guaranteedCV + data.nonGuaranteedBonus;
        values.push(basePrem > 0 ? total / basePrem : 0);
      }
    }

    datasets.push({
      label: `${prod.name}（純儲蓄）`,
      data: values,
      borderColor: colors[idx % colors.length],
      backgroundColor: 'transparent',
      tension: 0.4,
      borderWidth: 2.5
    });
  });

  const maxYear = Math.max(...productList.map(p => Math.max(...p.policyData.map(d => d.year))));
  chartComparison.data.labels = Array.from({ length: maxYear }, (_, i) => `第${i+1}年`);
  chartComparison.data.datasets = datasets;
  chartComparison.update();

  /* 更新對比表 */
  updateComparisonTable(allProducts);
}

/* ══════════════════════════════════════════
   9. 權益兌換牆
══════════════════════════════════════════ */
function initPrivilegesWall() {
  updatePrivilegesWall(0);
}

function updatePrivilegesWall(currentPremium) {
  const prod = getProductById(state.primaryProduct);
  const wall = document.getElementById('privileges-wall');

  if (!prod || !wall) {
    wall.innerHTML = '<span style="font-size:.8rem;color:var(--text-muted)">請先選擇產品</span>';
    return;
  }

  wall.innerHTML = prod.privileges.map(priv => {
    const unlocked = currentPremium >= priv.threshold;
    return `
      <div class="privilege-chip ${unlocked ? 'unlocked' : 'locked'}"
           title="解鎖門檻：${appConfig.currencySymbols[prod.currency] || 'HK$'} ${fmt(priv.threshold)}">
        ${priv.icon}
        <span>${priv.name}</span>
        ${unlocked ? '<span style="font-size:.7rem;margin-left:3px">✓</span>' : ''}
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════════════
   10. 跨產品對比區切換
══════════════════════════════════════════ */
function updateComparisonSection() {
  const section = document.getElementById('comparison-section');
  const totalSelected = [state.primaryProduct, ...state.compareProducts].filter(Boolean).length;

  if (totalSelected >= 2) {
    section.classList.remove('comparison-hidden');
    section.classList.add('chart-section');
    updateComparisonChart();
  } else {
    section.classList.add('comparison-hidden');
    section.classList.remove('chart-section');
  }
}

/* 跨產品對比表 */
function updateComparisonTable(productIds) {
  const table = document.getElementById('comparison-table');
  const thead = table.querySelector('thead tr');
  const tbody = table.querySelector('tbody');

  const rows = [
    { key: 'type',         label: '產品類別' },
    { key: 'currency',     label: '計價幣種' },
    { key: 'payTerms',     label: '繳費年期' },
    { key: 'cv10',         label: '第10年保證CV（×保費）' },
    { key: 'cv20',         label: '第20年保證CV（×保費）' },
    { key: 'total30',      label: '第30年總價值（×保費）' },
  ];

  /* 表頭 */
  thead.innerHTML = '<th>對比維度</th>';
  productIds.forEach(id => {
    const prod = getProductById(id);
    if (prod) {
      const th = document.createElement('th');
      th.textContent = prod.name;
      thead.appendChild(th);
    }
  });

  /* 表體 */
  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.textContent = row.label;
    tdLabel.style.fontWeight = '600';
    tr.appendChild(tdLabel);

    productIds.forEach(id => {
      const prod = getProductById(id);
      const td   = document.createElement('td');
      if (!prod) { tr.appendChild(td); return; }

      const base = getBasePremiumUnit(prod);
      switch (row.key) {
        case 'type':     td.textContent = prod.type; break;
        case 'currency': td.textContent = prod.currency; break;
        case 'payTerms': td.textContent = prod.payTerms.join(' / ') + ' 年'; break;
        case 'cv10': {
          const d = getPolicyDataAtYear(prod, 10);
          td.textContent = d ? `${(d.guaranteedCV / base).toFixed(2)}x` : '—';
          break;
        }
        case 'cv20': {
          const d = getPolicyDataAtYear(prod, 20);
          td.textContent = d ? `${(d.guaranteedCV / base).toFixed(2)}x` : '—';
          break;
        }
        case 'total30': {
          const d = getPolicyDataAtYear(prod, 30);
          td.textContent = d ? `${((d.guaranteedCV + d.nonGuaranteedBonus) / base).toFixed(2)}x` : '—';
          break;
        }
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════
   11. 報告生成
══════════════════════════════════════════ */
function generateReport() {
  const s1 = state.s1Results;
  const s2 = state.s2Results;
  const prod = getProductById(state.primaryProduct);
  const sym  = prod ? appConfig.currencySymbols[prod.currency] : 'HK$';

  const now = new Date().toLocaleString('zh-HK');

  /* 場景一數據 */
  const hasS1 = s1 && s1.basePremium > 0;
  /* 場景二數據 */
  const hasS2 = s2 && s2.totalPremium > 0;

  const reportContainer = document.getElementById('report-output');

  reportContainer.innerHTML = `
    <div class="report-content">
      <div class="report-section-title">📋 客戶投保明白備忘錄</div>
      <div class="report-row"><span>產品名稱</span><span>${prod ? prod.name : '—'}</span></div>
      <div class="report-row"><span>產品類別</span><span>${prod ? prod.type : '—'}</span></div>
      <div class="report-row"><span>計價幣種</span><span>${prod ? prod.currency : '—'}</span></div>
      <div class="report-row"><span>生成時間</span><span>${now}</span></div>

      ${hasS1 ? `
      <div class="report-section-title">💰 儲蓄方案分析</div>
      <div class="report-row"><span>基本年保費</span><span>${sym} ${fmt(s1.basePremium)}</span></div>
      <div class="report-row"><span>繳費年期</span><span>${s1.payTerm} 年</span></div>
      <div class="report-row"><span>首年折扣</span><span>${(s1.discY1Pct * 100).toFixed(0)}%，折後 ${sym} ${fmt(s1.premY1)}</span></div>
      <div class="report-row"><span>次年折扣</span><span>${(s1.discY2Pct * 100).toFixed(0)}%，折後 ${sym} ${fmt(s1.premY2)}</span></div>
      <div class="report-row"><span>預繳儲蓄率</span><span>${(s1.prepayRate * 100).toFixed(1)}%</span></div>
      <div class="report-row"><span>📌 實際淨出資總額</span><span style="color:var(--accent);font-size:1.05rem">${sym} ${fmt(s1.netTotal)}</span></div>
      ` : ''}

      ${hasS2 ? `
      <div class="report-section-title">🏦 保費融資方案分析</div>
      <div class="report-row"><span>保單總保費</span><span>${sym} ${fmt(s2.totalPremium)}</span></div>
      <div class="report-row"><span>貸款成數 (LTV)</span><span>${(s2.ltvPct * 100).toFixed(0)}%</span></div>
      <div class="report-row"><span>客戶實際出資</span><span>${sym} ${fmt(s2.clientCash)}（${s2.clientPct.toFixed(1)}%）</span></div>
      <div class="report-row"><span>銀行貸款金額</span><span>${sym} ${fmt(s2.loanAmount)}（${s2.bankPct.toFixed(1)}%）</span></div>
      <div class="report-row"><span>當前貸款利率</span><span>${(s2.annualRate * 100).toFixed(2)}%</span></div>
      <div class="report-row"><span>封頂利率 (Cap Rate)</span><span>${(s2.capRate * 100).toFixed(2)}%</span></div>
      <div class="report-row"><span>預計貸款年期</span><span>${s2.loanTermYears} 年</span></div>
      <div class="report-row"><span>✅ 預期年化回報（現行利率）</span><span style="color:var(--success)">${s2.simpleIRRCurrent.toFixed(2)}%</span></div>
      <div class="report-row"><span>⚠️ 最壞情況回報（封頂利率）</span><span style="color:var(--warning)">${s2.simpleIRRCap.toFixed(2)}%</span></div>
      ` : ''}

      <div class="report-section-title">⚠️ 重要聲明</div>
      <div style="font-size:.8rem;color:var(--text-muted);line-height:1.8">
        本備忘錄由銷售培訓工具自動生成，僅供參考，不構成任何投保或財務建議。
        非保證紅利並不保證，實際結果視乎保險公司的派息決定。
        所有數字以正式計劃書為準。客戶如有疑問，請向持牌保險顧問查詢。
      </div>
    </div>
  `;

  document.getElementById('btn-copy').disabled  = false;
  document.getElementById('btn-print').disabled = false;
}

/* 複製報告文字 */
function copyReport() {
  const el = document.getElementById('report-output');
  const text = el.innerText || el.textContent || '';

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('✅ 已複製到剪貼板！可直接貼入 WhatsApp');
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✅ 已複製！');
  }
}

/* 列印報告 */
function printReport() {
  window.print();
}

/* 簡易 Toast 通知 */
function showToast(msg) {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = `
    position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
    background:#1a5fb4; color:#fff; padding:.75rem 1.5rem;
    border-radius:8px; font-size:.88rem; z-index:9999;
    box-shadow:0 4px 20px rgba(0,0,0,.25); animation: fadeInUp .2s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ══════════════════════════════════════════
   12. 工具函數
══════════════════════════════════════════ */

/* 按 ID 查找產品 */
function getProductById(id) {
  return productList.find(p => p.id === id) || null;
}

/* 獲取產品的基準保費單位（policyData 中第一年 premiumPaid）*/
/* v2.0: principal → premiumPaid 欄位名變更 */
function getBasePremiumUnit(prod) {
  if (!prod || !prod.policyData || prod.policyData.length === 0) return 1;
  const y1 = prod.policyData.find(d => d.year === 1) || prod.policyData[0];
  return y1?.premiumPaid || y1?.principal || 1;  /* 向後兼容 v1.0 */
}

/* 線性插值獲取任意年度的精算數據 */
function getPolicyDataAtYear(prod, targetYear) {
  if (!prod || !prod.policyData || prod.policyData.length === 0) return null;

  const sorted = [...prod.policyData].sort((a, b) => a.year - b.year);

  /* 精確命中 */
  const exact = sorted.find(d => d.year === targetYear);
  if (exact) return exact;

  /* 邊界處理 */
  if (targetYear < sorted[0].year) return sorted[0];
  if (targetYear > sorted[sorted.length - 1].year) return sorted[sorted.length - 1];

  /* 線性插值 */
  const before = sorted.filter(d => d.year < targetYear).pop();
  const after  = sorted.find(d => d.year > targetYear);

  if (!before || !after) return null;

  const t = (targetYear - before.year) / (after.year - before.year);
  return {
    year: targetYear,
    /* v2.0: 支援 premiumPaid（新）和 principal（舊）雙欄位名 */
    premiumPaid:         lerp(before.premiumPaid ?? before.principal ?? 0,         after.premiumPaid ?? after.principal ?? 0,         t),
    principal:           lerp(before.premiumPaid ?? before.principal ?? 0,         after.premiumPaid ?? after.principal ?? 0,         t),
    guaranteedCV:         lerp(before.guaranteedCV,         after.guaranteedCV,         t),
    nonGuaranteedBonus:   lerp(before.nonGuaranteedBonus,   after.nonGuaranteedBonus,   t)
  };
}

/* 線性插值 */
function lerp(a, b, t) { return a + (b - a) * t; }

/* 生成連貫年度插值數據陣列（最多每5年一點，max 個年份，套用 ratio） */
function getInterpolatedData(prod, maxYear, ratio = 1) {
  const step = maxYear <= 15 ? 1 : maxYear <= 25 ? 2 : 3;
  const years = [];
  for (let y = step; y <= maxYear; y += step) years.push(y);

  return years.map(yr => {
    const d = getPolicyDataAtYear(prod, yr);
    return d ? {
      year: yr,
      premiumPaid:        (d.premiumPaid ?? d.principal ?? 0) * ratio,
      principal:          (d.premiumPaid ?? d.principal ?? 0) * ratio,
      guaranteedCV:       d.guaranteedCV        * ratio,
      nonGuaranteedBonus: d.nonGuaranteedBonus  * ratio
    } : { year: yr, premiumPaid: 0, principal: 0, guaranteedCV: 0, nonGuaranteedBonus: 0 };
  });
}

/* 數字格式化（千分位） */
function fmt(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Math.round(num).toLocaleString('zh-HK');
}

/* 簡短數字格式（萬/億） */
function fmtShort(num) {
  if (Math.abs(num) >= 1e8) return (num / 1e8).toFixed(1) + '億';
  if (Math.abs(num) >= 1e4) return (num / 1e4).toFixed(1) + '萬';
  return Math.round(num).toString();
}
