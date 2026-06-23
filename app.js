// app.js v1.0-launch
// 保險產品比較器 - 相容舊版 ECharts 圖表、多產品對比、客戶 PDF 報告
// 數據源: productData.js (productData + finConfig + chartConfig)
// 所有 if 判斷使用標準 &&; 運算符，標點統一英文半角#
// 修復: 所有函數全域定義，無包裹大括號隔離；雙保險 DOMContentLoaded + window.onload

let selectedTagList = [];
let comparedProductIds = [];
let reportItems = [];
let currentChart = null;

// ===== 數據載入(從 productData.js 同步讀取) =====#
function loadProductData() {
  console.log('[v1.0-launch] loadProductData() called');
  if (typeof productData === 'undefined') {
    console.error('productData.js not loaded');
    var el = document.getElementById('productContainer');
    if (el) el.innerHTML = '<div class="no-result">productData.js 載入失敗，請確認檔案路徑正確</div>';
    return;
  }
  console.log('[v1.0-launch] productData loaded:', productData.products.length, 'products,', productData.tags.length, 'tags');
  initApp();
}

// ===== 標籤面板渲染 =====#
function renderTagPanel() {
  console.log('renderTagPanel() called');
  var container = document.getElementById('tagContainer');
  if (!container) { console.warn('tagContainer not found'); return; }
  var html = '';
  for (var i = 0; i < productData.tags.length; i++) {
    var t = productData.tags[i];
    html += '<label class="tag-label">';
    html += '<input type="checkbox" value="' + t.tag_name + '" onchange="onTagChange()">';
    html += '<span>' + t.tag_name + '</span>';
    html += '</label>';
    html += '<div class="tag-rule">' + t.篩選規則 + '</div>';
  }
  container.innerHTML = html;
}

function getSelectedTags() {
  var inputs = document.querySelectorAll('.tag-label input:checked');
  var result = [];
  for (var i = 0; i < inputs.length; i++) { result.push(inputs[i].value); }
  return result;
}

function onTagChange() {
  console.log('onTagChange() called');
  selectedTagList = getSelectedTags();
  renderProductList();
  updateFilterStats();
}

// ===== 產品列表渲染 =====#
function filterProducts() {
  if (!selectedTagList || selectedTagList.length === 0) return productData.products;
  return productData.products.filter(function(p) {
    return selectedTagList.every(function(t) { return p.tag_list.indexOf(t) !== -1; });
  });
}

function formatVal(v, suffix) {
  if (v === null || v === undefined || v === '待補') return '<span class="metric-value tbd">待補</span>';
  return '<span class="metric-value">' + v + (suffix || '') + '</span>';
}

function renderProductList() {
  console.log('renderProductList() called');
  var list = filterProducts();
  var container = document.getElementById('productContainer');
  var header = document.getElementById('resultHeader');
  if (!container) { console.warn('productContainer not found'); return; }

  if (list.length === 0) {
    container.innerHTML = '<div class="no-result">無符合條件的產品，請調整標籤組合</div>';
    if (header) header.textContent = '顯示 0 款產品';
    return;
  }

  var html = '';
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    var chips = '';
    for (var j = 0; j < (p.tag_list || []).length; j++) {
      chips += '<span class="tag-chip">' + p.tag_list[j] + '</span>';
    }
    var financeClass = p.finance_support === '是' ? '' : 'no';
    var isChecked = comparedProductIds.indexOf(p.prod_id) !== -1 ? 'checked' : '';
    html += '<div class="product-card" data-prod-id="' + p.prod_id + '">';
    html += '<div class="card-head">';
    html += '<div style="flex:1">';
    html += '<div class="prod-title">' + p.prod_name + '</div>';
    html += '<div class="prod-meta">' + p.ins_name + ' | ' + p.prod_id + '</div>';
    html += '</div>';
    html += '<label class="compare-toggle">';
    html += '<input type="checkbox" value="' + p.prod_id + '" onchange="onCompareToggle(this.value)" ' + isChecked + '> 加入對比';
    html += '</label>';
    html += '<div class="finance-tag ' + financeClass + '">保費融資</div>';
    html += '</div>';
    html += '<div class="metrics">';
    html += '<div class="metric"><div class="metric-label">最低保費</div>' + formatVal(p.min_prem) + '</div>';
    html += '<div class="metric"><div class="metric-label">繳費年期</div>' + formatVal(p.pay_term) + '</div>';
    html += '<div class="metric"><div class="metric-label">回本年</div>' + formatVal(p.break_year) + '</div>';
    html += '<div class="metric"><div class="metric-label">IRR 20年</div>' + formatVal(p.irr_20, '%') + '</div>';
    html += '</div>';
    html += '<div class="tag-list">' + chips + '</div>';
    html += '<div class="feature-text">' + p.feature_short + '</div>';
    html += '<div class="influencer-block">';
    html += '<div class="point">★ ' + p.influencer_point + '</div>';
    html += '<div class="scene">' + p.scene_desc + '</div>';
    html += '</div>';
    html += '<div class="card-actions">';
    html += '<button class="btn btn-ghost" onclick="showIncomeChart(\'' + p.prod_id + '\')">收益曲線</button>';
    html += '<button class="btn btn-ghost" onclick="showIRRChart(\'' + p.prod_id + '\')">IRR對比</button>';
    html += '<button class="btn btn-primary" onclick="addToReport(\'' + p.prod_id + '\')">加入報告</button>';
    html += '</div>';
    html += '</div>';
  }
  container.innerHTML = html;

  if (header) header.textContent = '顯示 ' + list.length + ' 款產品';
  updateCompareBadge();
}

function updateFilterStats() {
  var list = filterProducts();
  var statShown = document.getElementById('stat-shown');
  var statFilter = document.getElementById('stat-filter');
  if (statShown) statShown.textContent = list.length === productData.products.length ? '顯示全部' : '篩選後 ' + list.length + ' 款';
  if (statFilter) statFilter.textContent = selectedTagList.length === 0 ? '未啟用篩選' : '已選 ' + selectedTagList.length + ' 個標籤: ' + selectedTagList.join('、');
}

// ===== 多產品對比邏輯 =====#
function onCompareToggle(prodId) {
  console.log('onCompareToggle() called', prodId);
  var idx = comparedProductIds.indexOf(prodId);
  if (idx === -1) {
    if (comparedProductIds.length >= 4) {
      alert('最多同時對比 4 款產品');
      var cb = document.querySelector('input[value="' + prodId + '"]');
      if (cb) cb.checked = false;
      return;
    }
    comparedProductIds.push(prodId);
  } else {
    comparedProductIds.splice(idx, 1);
  }
  updateCompareBadge();
  renderComparePanel();
}

function updateCompareBadge() {
  var badge = document.getElementById('compareBadge');
  if (badge) badge.textContent = comparedProductIds.length;
}

function renderComparePanel() {
  console.log('renderComparePanel() called');
  var panel = document.getElementById('comparePanel');
  if (!panel) { console.warn('comparePanel not found'); return; }
  if (comparedProductIds.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  var products = [];
  for (var i = 0; i < comparedProductIds.length; i++) {
    var found = productData.products.find(function(p) { return p.prod_id === comparedProductIds[i]; });
    if (found) products.push(found);
  }

  var rows = ['prod_name', 'ins_name', 'min_prem', 'pay_term', 'break_year', 'irr_20', 'guarantee', 'life_type', 'finance_support'];
  var labels = {
    prod_name: '產品名稱', ins_name: '保險公司', min_prem: '最低保費(USD)',
    pay_term: '繳費年期', break_year: '回本年', irr_20: 'IRR 20年(%)',
    guarantee: '保證回報', life_type: '產品類型', finance_support: '保費融資'
  };

  var html = '<table class="compare-table"><thead><tr><th>比較項</th>';
  for (var i = 0; i < products.length; i++) { html += '<th>' + products[i].prod_name + '</th>'; }
  html += '</tr></thead><tbody>';

  for (var r = 0; r < rows.length; r++) {
    var rowKey = rows[r];
    html += '<tr><td><strong>' + labels[rowKey] + '</strong></td>';
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var v = p[rowKey];
      var display = v;
      if (v === null || v === undefined) { display = '-'; }
      else if (rowKey === 'irr_20') { display = v + '%'; }
      else if (rowKey === 'break_year' && v === null) { display = '待補'; }
      html += '<td>' + display + '</td>';
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  panel.innerHTML = '<div class="compare-header">' +
    '<h3>產品對比(' + products.length + '款)</h3>' +
    '<div>' +
    '<button class="btn btn-ghost" onclick="showMultiProductChart()">多產品圖表</button> ' +
    '<button class="btn btn-ghost" onclick="clearCompare()">清空</button>' +
    '</div>' +
    '</div>' + html;
}

function clearCompare() {
  comparedProductIds = [];
  var inputs = document.querySelectorAll('.compare-toggle input');
  for (var i = 0; i < inputs.length; i++) { inputs[i].checked = false; }
  updateCompareBadge();
  renderComparePanel();
}

// ===== ECharts 收益曲線圖(單產品) =====#
function showIncomeChart(prodId) {
  console.log('showIncomeChart() called', prodId);
  var product = productData.products.find(function(p) { return p.prod_id === prodId; });
  if (!product) return;
  var modal = document.getElementById('chartModal');
  var title = document.getElementById('chartTitle');
  if (title) title.textContent = product.prod_name + ' | ' + chartConfig.income_chart.title;
  if (modal) modal.style.display = 'block';

  if (currentChart) currentChart.dispose();
  currentChart = echarts.init(document.getElementById('chartContainer'));

  var cfg = chartConfig.income_chart;
  var initial = parseFloat(product.min_prem) || 10000;
  var irr = parseFloat(product.irr_20) || 0;
  var guaranteedSeries = cfg.years.map(function(y) { return Math.round(initial * Math.pow(1 + finConfig.irr_params.guarantee_rate_low, y)); });
  var projectedSeries = cfg.years.map(function(y) { return Math.round(initial * Math.pow(1 + irr / 100, y)); });

  var option = {
    backgroundColor: chartConfig.theme.backgroundColor,
    title: { text: product.prod_name, subtext: product.ins_name, left: 'center', textStyle: chartConfig.theme.title },
    tooltip: cfg.tooltip,
    legend: { data: [cfg.series_names.guaranteed, cfg.series_names.projected], top: cfg.legend_position.top, textStyle: chartConfig.theme.legend.textStyle },
    xAxis: { type: 'category', data: cfg.years.map(function(y) { return '第' + y + '年'; }) },
    yAxis: { type: 'value', name: cfg.y_axis_name },
    series: [
      { name: cfg.series_names.guaranteed, type: 'line', data: guaranteedSeries, smooth: cfg.smooth, itemStyle: { color: cfg.colors.guaranteed }, animation: cfg.animation },
      { name: cfg.series_names.projected, type: 'line', data: projectedSeries, smooth: cfg.smooth, itemStyle: { color: cfg.colors.projected }, animation: cfg.animation }
    ]
  };
  currentChart.setOption(option);
  window.addEventListener('resize', function() { if (currentChart) currentChart.resize(); });
}

// ===== ECharts IRR對比圖(單產品 vs 行業均值) =====#
function showIRRChart(prodId) {
  console.log('showIRRChart() called', prodId);
  var product = productData.products.find(function(p) { return p.prod_id === prodId; });
  if (!product) return;
  var modal = document.getElementById('chartModal');
  var title = document.getElementById('chartTitle');
  if (title) title.textContent = product.prod_name + ' | ' + chartConfig.irr_compare_chart.title;
  if (modal) modal.style.display = 'block';

  if (currentChart) currentChart.dispose();
  currentChart = echarts.init(document.getElementById('chartContainer'));

  var cfg = chartConfig.irr_compare_chart;
  var irr = parseFloat(product.irr_20) || 0;
  var avgIRR = 4.5;
  var option = {
    backgroundColor: chartConfig.theme.backgroundColor,
    title: { text: cfg.title, subtext: product.prod_name, left: 'center', textStyle: chartConfig.theme.title },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: [product.prod_name, '行業平均'] },
    yAxis: { type: 'value', name: 'IRR %', min: cfg.y_axis_min, max: cfg.y_axis_max },
    series: [{
      name: '20年IRR',
      type: cfg.type,
      data: [{ value: irr, itemStyle: { color: cfg.color } }, { value: avgIRR, itemStyle: { color: '#7a8a99' } }],
      label: { show: true, position: 'top', formatter: '{c}%' }
    }]
  };
  currentChart.setOption(option);
  window.addEventListener('resize', function() { if (currentChart) currentChart.resize(); });
}

// ===== ECharts 多產品 IRR 對比圖(多選後) =====#
function showMultiProductChart() {
  console.log('showMultiProductChart() called');
  if (comparedProductIds.length === 0) { alert('請先勾選產品'); return; }
  var products = [];
  for (var i = 0; i < comparedProductIds.length; i++) {
    var found = productData.products.find(function(p) { return p.prod_id === comparedProductIds[i]; });
    if (found) products.push(found);
  }

  var modal = document.getElementById('chartModal');
  var title = document.getElementById('chartTitle');
  if (title) title.textContent = '多產品IRR對比(' + products.length + '款)';
  if (modal) modal.style.display = 'block';

  if (currentChart) currentChart.dispose();
  currentChart = echarts.init(document.getElementById('chartContainer'));

  var option = {
    backgroundColor: chartConfig.theme.backgroundColor,
    title: { text: '20年IRR多產品對比', left: 'center', textStyle: chartConfig.theme.title },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: products.map(function(p) { return p.prod_name; }) },
    yAxis: { type: 'value', name: 'IRR %' },
    series: [{
      name: '20年IRR',
      type: 'bar',
      data: products.map(function(p) {
        return { value: parseFloat(p.irr_20) || 0, itemStyle: { color: '#1e3a5f' } };
      }),
      label: { show: true, position: 'top', formatter: '{c}%' }
    }]
  };
  currentChart.setOption(option);
  window.addEventListener('resize', function() { if (currentChart) currentChart.resize(); });
}

function closeChartModal() {
  var modal = document.getElementById('chartModal');
  if (modal) modal.style.display = 'none';
  if (currentChart) { currentChart.dispose(); currentChart = null; }
}

// ===== 客戶 PDF 報告導出 =====#
function addToReport(prodId) {
  console.log('addToReport() called', prodId);
  if (reportItems.indexOf(prodId) === -1) {
    reportItems.push(prodId);
    updateReportBadge();
    alert('已加入客戶報告');
  } else {
    alert('該產品已在報告中');
  }
}

function updateReportBadge() {
  var badge = document.getElementById('reportBadge');
  if (badge) badge.textContent = reportItems.length;
}

function generateClientReport() {
  console.log('generateClientReport() called');
  if (reportItems.length === 0) {
    alert('請先加入至少一款產品到報告');
    return;
  }
  var products = [];
  for (var i = 0; i < reportItems.length; i++) {
    var found = productData.products.find(function(p) { return p.prod_id === reportItems[i]; });
    if (found) products.push(found);
  }

  var reportHtml = '<html><head><meta charset="UTF-8"><title>客戶比較報告</title>' +
    '<style>body{font-family:"Microsoft JhengHei";padding:30px;color:#2c3e50;}' +
    'h1{color:#1e3a5f;border-bottom:3px solid #1e3a5f;padding-bottom:10px;}' +
    'h2{color:#2c5282;margin-top:30px;}' +
    'table{width:100%;border-collapse:collapse;margin:20px 0;}' +
    'th,td{border:1px solid #ddd;padding:10px;text-align:left;}' +
    'th{background:#1e3a5f;color:#fff;}' +
    '.product-section{margin:30px 0;padding:20px;background:#f7f9fc;border-radius:8px;border-left:4px solid #1e3a5f;}' +
    '.highlight{background:#fffbf0;padding:10px;border-radius:4px;border-left:3px solid #d4af37;margin:10px 0;}' +
    '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;color:#7a8a99;font-size:12px;}' +
    '</style></head><body>';
  reportHtml += '<h1>保險產品比較報告</h1>';
  reportHtml += '<p>報告日期: ' + new Date().toLocaleDateString('zh-HK') + '</p>';
  reportHtml += '<p>顧問: ' + finConfig.report.contact + ' | ' + finConfig.report.company_name + '</p>';
  reportHtml += '<p>產品數量: ' + products.length + ' 款</p>';
  reportHtml += '<h2>產品對比總覽</h2><table><tr><th>產品</th><th>保司</th><th>最低保費</th><th>回本年</th><th>IRR 20年</th><th>保證回報</th><th>保費融資</th></tr>';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    reportHtml += '<tr><td>' + p.prod_name + '</td><td>' + p.ins_name + '</td><td>USD' + p.min_prem + '</td><td>' + (p.break_year || '待補') + '</td><td>' + (p.irr_20 || '待補') + '%</td><td>' + p.guarantee + '</td><td>' + p.finance_support + '</td></tr>';
  }
  reportHtml += '</table>';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    reportHtml += '<div class="product-section">';
    reportHtml += '<h2>' + p.prod_name + '(' + p.prod_id + ')</h2>';
    reportHtml += '<p><strong>保險公司:</strong> ' + p.ins_name + '</p>';
    reportHtml += '<p><strong>繳費年期:</strong> ' + p.pay_term + '</p>';
    reportHtml += '<p><strong>最低保費:</strong> USD' + p.min_prem + '</p>';
    reportHtml += '<p><strong>回本年:</strong> ' + (p.break_year || '待補') + '</p>';
    reportHtml += '<p><strong>IRR 20年:</strong> ' + (p.irr_20 || '待補') + '%</p>';
    reportHtml += '<p><strong>產品類型:</strong> ' + p.life_type + ' | <strong>保證回報:</strong> ' + p.guarantee + '</p>';
    reportHtml += '<p><strong>產品特色:</strong> ' + p.feature_short + '</p>';
    reportHtml += '<div class="highlight"><strong>★ 網紅亮點:</strong> ' + p.influencer_point + '</div>';
<em>' + p.scene_desc + '</em></div>';
    reportHtml += '<p><strong>標籤:</strong> ' + (p.tag_list || []).join('、') + '</p>';
    if (p.finance_support === '是') {
      reportHtml += '<p><strong>保費融資:</strong>支持(最低融資額 USD' + finConfig.finance_terms.INS01.min_finance_amount + ',LTV ' + (finConfig.finance_terms.INS01.loan_to_value * 100) + '%,利率 ' + (finConfig.finance_terms.INS01.interest_rate * 100) + '%)</p>';
    }
    reportHtml += '</div>';
  }
  reportHtml += '<div class="footer">';
  reportHtml += '<p>本報告由 ' + finConfig.report.company_name + ' 提供 | 數據版本 ' + productData.version + ' | ' + productData.generated_at + '</p>';
  reportHtml += '<p>本報告僅供參考，最終保單條款以保險公司正式保單文件為準。</p>';
  reportHtml += '</div></body></html>';

  var w = window.open('', '_blank');
  if (!w) { alert('請允許彈出視窗'); return; }
  w.document.write(reportHtml);
  w.document.close();

  setTimeout(function() {
    var btn = w.document.createElement('button');
    btn.textContent = '導出PDF';
    btn.style.cssText = 'position:fixed;top:20px;right:20px;padding:10px 20px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;z-index:9999;';
    btn.onclick = function() {
      w.html2pdf().set({
        margin: 10,
        filename: 'insurance_report_' + Date.now() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(w.document.body).save();
    };
    w.document.body.appendChild(btn);
  }, 500);
}

// ===== 初始化 =====#
function initApp() {
  console.log('initApp() called');
  renderTagPanel();
  renderProductList();
  updateFilterStats();
  var clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      var inputs = document.querySelectorAll('.tag-label input');
      for (var i = 0; i < inputs.length; i++) { inputs[i].checked = false; }
      selectedTagList = [];
      renderProductList();
      updateFilterStats();
    });
  }
  var reportBtn = document.getElementById('generateReportBtn');
  if (reportBtn) reportBtn.addEventListener('click', generateClientReport);
}

// ===== 雙重保險: DOMContentLoaded + window.onload =====#
function bootstrap() {
  console.log('bootstrap() called');
  if (typeof loadProductData === 'function') {
    loadProductData();
  } else {
    console.error('loadProductData is not a function!');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

if (window.addEventListener) {
  window.addEventListener('load', bootstrap);
} else if (window.attachEvent) {
  window.attachEvent('onload', bootstrap);
}
