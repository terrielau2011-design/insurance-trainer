/**
 * ════════════════════════════════════════════════════════════
 * main.js — V1 業務邏輯
 * 數據來源：productData.js / finConfig.js / chartConfig.js
 * ════════════════════════════════════════════════════════════
 */
'use strict';

/* ═══ 全局狀態 ═══ */
const state = {
  selectedProducts: [],     // 選中加入對比的產品 id
  chartProductId: null,     // 當前圖表產品
  finScenario: 'normal',    // 融資場景
};

let echartsInstances = {};

/* ═══ 初始化 ═══ */
document.addEventListener('DOMContentLoaded', () => {
  initModules();
  initTags();
  initProductGrid();
  initChartProductSelect();
});

/* 模塊開關（數據來源：chartConfig.modules）*/
function initModules() {
  const m = chartConfig.modules;
  document.getElementById('section-tags').style.display = m.needTags ? '' : 'none';
  document.getElementById('block-pie').style.display = m.pieChart ? '' : 'none';
  document.getElementById('block-wealth').style.display = m.wealthChart ? '' : 'none';
  document.getElementById('block-opp').style.display = m.oppChart ? '' : 'none';
}

/* ═══ 模塊1：需求標籤篩選 ═══ */
function initTags() {
  if (!chartConfig.modules.needTags) return;
  const container = document.getElementById('tags-container');
  if (!container) return;

  /* 自動讀取 productData 中所有 tags（數據來源：productData.js）*/
  const allTags = new Set();
  productData.forEach(p => p.tags.forEach(t => allTags.add(t)));

  container.innerHTML = '';
  allTags.forEach(tag => {
    const chip = document.createElement('label');
    chip.className = 'tag-chip';
    chip.innerHTML = `<input type="checkbox" value="${tag}" onchange="onTagChange()"> ${tag}`;
    container.appendChild(chip);
  });
}

function onTagChange() {
  const checked = document.querySelectorAll('#tags-container input:checked');
  const selectedTags = Array.from(checked).map(cb => cb.value);

  productData.forEach(prod => {
    const card = document.getElementById(`prod-${prod.id}`);
    if (!card) return;

    if (selectedTags.length === 0) {
      /* 無標籤選中，顯示全部 */
      card.classList.remove('hidden', 'matched');
    } else {
      /* 檢查產品 tags 是否包含任一選中標籤（數據來源：productData.tags）*/
      const isMatch = prod.tags.some(t => selectedTags.includes(t));
      card.classList.toggle('hidden', !isMatch);
      card.classList.toggle('matched', isMatch);
    }
  });
}

/* ═══ 模塊2：產品卡片 + 對比表 ═══ */
function initProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';

  /* 數據來源：productData.js */
  productData.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.id = `prod-${prod.id}`;
    card.onclick = () => toggleProductSelect(prod.id);

    /* 20年 IRR（數據來源：productData.irr）*/
    const irr20 = prod.irr[20] ? (prod.irr[20] * 100).toFixed(1) + '%' : '—';

    card.innerHTML = `
      <div class="prod-name">${prod.name}</div>
      <div class="prod-insurer">${prod.insurer}</div>
      <div class="prod-info">
        <span>${prod.currency}</span>
        <span>${prod.payPeriods.join('/')}年繳</span>
        <span>最低 ${prod.minPremium.toLocaleString()}</span>
        <span>回本 ${prod.breakEvenYear}年</span>
        <span>20年IRR ${irr20}</span>
        ${prod.supportFinancing ? '<span style="color:var(--primary);">可融資</span>' : ''}
      </div>
      <div class="prod-tags">${prod.tags.map(t => `<span class="mini-tag">${t}</span>`).join('')}</div>
    `;
    grid.appendChild(card);
  });
}

function toggleProductSelect(prodId) {
  const idx = state.selectedProducts.indexOf(prodId);
  if (idx >= 0) {
    state.selectedProducts.splice(idx, 1);
  } else {
    if (state.selectedProducts.length >= 4) {
      alert('最多選擇4款產品對比');
      return;
    }
    state.selectedProducts.push(prodId);
  }

  /* 更新卡片選中狀態 */
  productData.forEach(p => {
    const card = document.getElementById(`prod-${p.id}`);
    if (card) card.classList.toggle('selected', state.selectedProducts.includes(p.id));
  });

  updateCompareTable();
  updateChartSection();
}

/* 對比表（數據來源：productData.js）*/
function updateCompareTable() {
  const section = document.getElementById('section-compare');
  if (state.selectedProducts.length < 2) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  const products = state.selectedProducts.map(id => productData.find(p => p.id === id)).filter(Boolean);
  const years = chartConfig.fixedYears;

  /* 表頭 */
  document.getElementById('compare-thead').innerHTML = '<th>對比維度</th>' + products.map(p => `<th>${p.name}</th>`).join('');

  /* 對比維度 */
  const rows = [
    { label: '保險公司', fn: p => p.insurer },
    { label: '幣別', fn: p => p.currency },
    { label: '繳費年期', fn: p => p.payPeriods.join('/') + '年' },
    { label: '最低保費', fn: p => p.minPremium.toLocaleString() },
    { label: '回本年份', fn: p => p.breakEvenYear + '年', best: 'min' },
    { label: '可融資', fn: p => p.supportFinancing ? '✅' : '❌' },
  ];

  /* 各年份保證現金價值（數據來源：productData.cashValue）*/
  years.forEach(y => {
    rows.push({
      label: `第${y}年保證現金價值`,
      fn: p => p.cashValue[y] ? p.cashValue[y][0].toLocaleString() : '—',
      best: 'max'
    });
    rows.push({
      label: `第${y}年非保證分紅`,
      fn: p => p.cashValue[y] ? p.cashValue[y][1].toLocaleString() : '—',
      best: 'max'
    });
  });

  /* IRR（數據來源：productData.irr）*/
  years.forEach(y => {
    rows.push({
      label: `第${y}年IRR`,
      fn: p => p.irr[y] ? (p.irr[y] * 100).toFixed(2) + '%' : '—',
      best: 'max'
    });
  });

  /* 渲染表格 + 最優值高亮 */
  const tbody = document.getElementById('compare-tbody');
  tbody.innerHTML = rows.map(row => {
    const values = products.map(p => ({ raw: row.fn(p), product: p }));
    let bestIdx = -1;
    if (row.best === 'max') {
      let max = -Infinity;
      values.forEach((v, i) => {
        const num = parseFloat(String(v.raw).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && num > max) { max = num; bestIdx = i; }
      });
    } else if (row.best === 'min') {
      let min = Infinity;
      values.forEach((v, i) => {
        const num = parseFloat(String(v.raw).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && num < min) { min = num; bestIdx = i; }
      });
    }
    return `<tr><td style="font-weight:600">${row.label}</td>` + values.map((v, i) => `<td class="${i === bestIdx ? 'best' : ''}">${v.raw}</td>`).join('') + '</tr>';
  }).join('');
}

/* ═══ 模塊3：動態圖表 ═══ */
function updateChartSection() {
  const section = document.getElementById('section-charts');
  if (state.selectedProducts.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  /* 預設用最後選的產品 */
  if (!state.chartProductId || !state.selectedProducts.includes(state.chartProductId)) {
    state.chartProductId = state.selectedProducts[state.selectedProducts.length - 1];
  }
  initChartProductSelect();
  renderAllCharts();
}

function initChartProductSelect() {
  const sel = document.getElementById('chart-product-select');
  if (!sel) return;
  sel.innerHTML = '';
  state.selectedProducts.forEach(id => {
    const p = productData.find(pp => pp.id === id);
    if (p) {
      const opt = document.createElement('option');
      opt.value = id; opt.textContent = p.name;
      sel.appendChild(opt);
    }
  });
  sel.value = state.chartProductId;
}

function onChartProductChange() {
  state.chartProductId = document.getElementById('chart-product-select').value;
  renderAllCharts();
  calcFinancing(); /* 修復：切換產品時刷新融資面板 */
}

function renderAllCharts() {
  updatePieChart();
  updateWealthChart();
  updateOppChart();
  calcFinancing(); /* 修復：渲染圖表時同步刷新融資 */
}

/* 3a 繳費構成餅圖（數據來源：productData.discount + chartConfig.pieChart）*/
function updatePieChart() {
  if (!chartConfig.modules.pieChart) return;
  const prod = productData.find(p => p.id === state.chartProductId);
  if (!prod) return;

  /* 數據來源：productData.discount */
  const totalPremium = prod.minPremium * prod.payPeriods[0];
  const firstYearDisc = prod.minPremium * prod.discount.firstYear;
  const prepayDisc = totalPremium * prod.discount.prepay;
  const netPremium = totalPremium - firstYearDisc - prepayDisc;

  const el = document.getElementById('chart-pie');
  if (!echartsInstances.pie) echartsInstances.pie = echarts.init(el);

  echartsInstances.pie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data: [
        { name: '實付本金', value: Math.round(netPremium), itemStyle: { color: chartConfig.colors.primary } },
        { name: '首年折扣', value: Math.round(firstYearDisc), itemStyle: { color: chartConfig.colors.warning } },
        { name: '預繳利息', value: Math.round(prepayDisc), itemStyle: { color: chartConfig.colors.secondary } },
      ].filter(d => d.value > 0)
    }]
  }, true);
}

/* 3b 財富走勢圖（數據來源：productData.cashValue + chartConfig.wealthChart）*/
function updateWealthChart() {
  if (!chartConfig.modules.wealthChart) return;
  const prod = productData.find(p => p.id === state.chartProductId);
  if (!prod) return;

  const years = chartConfig.fixedYears;
  const target = parseFloat(document.getElementById('target-amount').value) || 0;
  const showPess = document.getElementById('show-pessimistic')?.checked;
  const showOpt = document.getElementById('show-optimistic')?.checked;

  /* 中性場景 = 保證 + 非保證（數據來源：productData.cashValue）*/
  const neutralData = years.map(y => {
    const cv = prod.cashValue[y];
    return cv ? cv[0] + cv[1] : null;
  });
  /* 悲觀 = 保證 + 非保證 × 0.8 */
  const pessData = years.map(y => {
    const cv = prod.cashValue[y];
    return cv ? cv[0] + cv[1] * 0.8 : null;
  });
  /* 樂觀 = 保證 + 非保證 × 1.2 */
  const optData = years.map(y => {
    const cv = prod.cashValue[y];
    return cv ? cv[0] + cv[1] * 1.2 : null;
  });
  const targetLine = years.map(() => target);

  const series = [
    { name: '中性（保證+非保證）', type: 'line', data: neutralData, smooth: true, itemStyle: { color: chartConfig.colors.primary }, areaStyle: { opacity: 0.1 }, lineStyle: { width: 3 } },
  ];
  if (showPess) series.push({ name: '悲觀（×0.8）', type: 'line', data: pessData, smooth: true, itemStyle: { color: chartConfig.colors.danger }, lineStyle: { type: 'dashed' } });
  if (showOpt) series.push({ name: '樂觀（×1.2）', type: 'line', data: optData, smooth: true, itemStyle: { color: chartConfig.colors.success }, lineStyle: { type: 'dotted' } });
  if (chartConfig.wealthChart.showTargetLine && target > 0) {
    series.push({ name: chartConfig.wealthChart.targetLineLabel, type: 'line', data: targetLine, itemStyle: { color: chartConfig.colors.danger }, lineStyle: { type: 'dashed', width: 2 }, symbol: 'none' });
  }

  const el = document.getElementById('chart-wealth');
  if (!echartsInstances.wealth) echartsInstances.wealth = echarts.init(el);
  echartsInstances.wealth.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    xAxis: { type: 'category', data: years.map(y => `第${y}年`) },
    yAxis: { type: 'value', name: '價值', scale: true, axisLabel: { formatter: v => v >= 10000 ? (v/10000).toFixed(0)+'萬' : v } },
    series
  }, true);
}

/* 3c 跨資產柱圖（數據來源：productData.irr + chartConfig.fixedYears）*/
function updateOppChart() {
  if (!chartConfig.modules.oppChart) return;
  const prod = productData.find(p => p.id === state.chartProductId);
  if (!prod) return;

  const years = chartConfig.fixedYears;
  /* 本方案 IRR（數據來源：productData.irr）*/
  const irrData = years.map(y => prod.irr[y] ? +(prod.irr[y] * 100).toFixed(2) : null);
  /* 美債 4.0% / 定存 3.5% / 物業 2.75% */
  const bondData = years.map(() => 4.0);
  const depositData = years.map(() => 3.5);
  const propertyData = years.map(() => 2.75);

  const el = document.getElementById('chart-opp');
  if (!echartsInstances.opp) echartsInstances.opp = echarts.init(el);
  echartsInstances.opp.setOption({
    tooltip: { trigger: 'axis', formatter: p => p.map(i => `${i.seriesName}: ${i.value}%`).join('<br/>') },
    legend: { top: 0 },
    xAxis: { type: 'category', data: years.map(y => `第${y}年`) },
    yAxis: { type: 'value', name: '%', axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '本方案IRR', type: 'bar', data: irrData, itemStyle: { color: chartConfig.colors.primary }, label: { show: true, formatter: '{c}%', fontSize: 10 } },
      { name: '美國國債', type: 'bar', data: bondData, itemStyle: { color: chartConfig.colors.secondary } },
      { name: '定存', type: 'bar', data: depositData, itemStyle: { color: chartConfig.colors.warning } },
      { name: '物業收租', type: 'bar', data: propertyData, itemStyle: { color: chartConfig.colors.danger } },
    ]
  }, true);
}

/* ═══ 模塊4：廣發融資演算 ═══ */
function switchFinScene(scene) {
  state.finScenario = scene;
  document.getElementById('btn-normal').classList.toggle('active', scene === 'normal');
  document.getElementById('btn-pessimistic').classList.toggle('active', scene === 'pessimistic');
  calcFinancing();
}

function calcFinancing() {
  if (!chartConfig.modules.financing) return;
  const prod = productData.find(p => p.id === state.chartProductId);
  const section = document.getElementById('section-financing');

  /* 融資面板僅 supportFinancing=true 產品顯示，其他產品隱藏並清空數據 */
  if (!prod || !prod.supportFinancing) {
    if (section) {
      section.style.display = 'none';
      /* 清空融資數據 */
      document.getElementById('fin-results').innerHTML = '';
      document.getElementById('fin-compare').innerHTML = '';
    }
    return;
  }
  if (section) section.style.display = '';

  /* 切換到融資產品時，更新保費輸入框預設值 */
  const finPremInput = document.getElementById('fin-premium');
  if (finPremInput && (!finPremInput.value || parseInt(finPremInput.value) !== prod.minPremium)) {
    finPremInput.value = prod.minPremium;
  }

  const premium = parseFloat(finPremInput.value) || prod.minPremium;

  /* 調用 finConfig.js 的 calculateFinancing（數據來源：finConfig + productData）*/
  const result = calculateFinancing(prod, premium, state.finScenario);
  const info = result.basicInfo;

  /* 渲染結果卡片 */
  const sym = prod.currency === 'HKD' ? 'HK$' : 'US$';
  document.getElementById('fin-results').innerHTML = `
    <div class="fin-card"><div class="fc-label">總保費</div><div class="fc-value">${sym}${info.totalPremium.toLocaleString()}</div></div>
    <div class="fin-card"><div class="fc-label">貸款金額 (${(finConfig.maxLoanRatio*100)}%)</div><div class="fc-value">${sym}${info.loanAmount.toLocaleString()}</div></div>
    <div class="fin-card accent"><div class="fc-label">自付本金</div><div class="fc-value">${sym}${info.actualPrincipal.toLocaleString()}</div></div>
    <div class="fin-card"><div class="fc-label">手續費 (${(finConfig.loanFeeRate*100)}%)</div><div class="fc-value">${sym}${info.loanFee.toLocaleString()}</div></div>
    <div class="fin-card"><div class="fc-label">貸款利率</div><div class="fc-value">${(info.loanRate*100).toFixed(3)}%</div></div>
    <div class="fin-card"><div class="fc-label">分紅實現率</div><div class="fc-value">${(info.realizationRate*100)}%</div></div>
  `;

  /* 融資前後對比表 */
  const years = chartConfig.fixedYears;
  const yby = result.yearByYear;
  let tableHTML = `<table class="compare-table"><thead><tr>
    <th>年份</th><th>退出總值</th><th>貸款餘額</th><th>淨資產</th><th>累計利息</th><th>淨回報</th><th>年化回報率</th>
  </tr></thead><tbody>`;
  years.forEach(y => {
    const d = yby[y];
    if (!d) return;
    tableHTML += `<tr>
      <td style="font-weight:600">第${y}年</td>
      <td>${sym}${d.totalCashValue.toLocaleString()}</td>
      <td>${sym}${d.loanBalance.toLocaleString()}</td>
      <td>${sym}${d.netValue.toLocaleString()}</td>
      <td>${sym}${d.totalInterestPaid.toLocaleString()}</td>
      <td style="color:${d.totalReturn >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600">${sym}${d.totalReturn.toLocaleString()}</td>
      <td style="color:${d.returnRate >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700">${(d.returnRate * 100).toFixed(2)}%</td>
    </tr>`;
  });
  tableHTML += '</tbody></table>';
  document.getElementById('fin-compare').innerHTML = tableHTML;
}

/* 圖表 resize */
window.addEventListener('resize', () => {
  Object.values(echartsInstances).forEach(c => c && c.resize());
});
