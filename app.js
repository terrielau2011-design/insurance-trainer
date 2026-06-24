// app.js v1.1-tags
// 保險產品比較器 - 兼容舊版 ECharts 圖表、多產品對比、客戶 PDF 報告
// 數據源: productData.js (productData + finConfig + chartConfig)
// v1.1 增量修改: 12標籤 OR 篩選邏輯、renderTagPanel 修正欄位名
// 原有所有功能 100% 保留不動

let selectedTagList = [];
let comparedProductIds = [];
let reportItems = [];
let currentChart = null;

// ===== 数据载入(从 productData.js 同步读取) =====
function loadProductData() {
  console.log('[v1.0-launch] loadProductData() called');
  if (typeof productData === 'undefined') {
    console.error('productData.js not loaded');
    var el = document.getElementById('productContainer');
    if (el) el.innerHTML = '<div class="no-result">productData.js 载入失败, 请确认档案路径正确</div>';
    return;
  }
  console.log('[v1.0-launch] productData loaded:', productData.products.length, 'products,', productData.tags.length, 'tags');
  initApp();
}

// ===== 标签面板渲染 =====
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

// ===== 產品過濾篩選核心邏輯 (v1.1: OR 並集邏輯 + 12條規則) =====
function matchesTag(p, tagName) {
  // 欄位別名
  var tp = p.total_premium != null ? p.total_premium : p.min_prem;
  var pt = p.premium_term;
  var cur = p.currency || 'USD';
  var typ = p.type || '';
  var gr = p.guaranteed_return != null ? p.guaranteed_return : 0;
  var fs = p.finance_support === '是';
  var by = p.break_year;
  var irr = p.irr_20 != null ? p.irr_20 : 0;

  switch (tagName) {
    case '高淨值資產配置':
      return tp >= 100000 && fs && cur === 'USD';
    case '跨境財富規劃':
      return cur === 'USD' && (typ === '分紅壽險' || typ === '終身壽險');
    case '槓桿融資':
      return fs;
    case '短期儲蓄':
      return by != null && by <= 10;
    case '資產傳承':
      return typ === '分紅壽險' || typ === '終身壽險';
    case '穩定收益':
      if (typ === '年金計劃') {
        return gr > 0;
      }
      return gr > 0;
    case '退休規劃':
      return typeof pt === 'number' && pt >= 10 && irr >= 3;
    case '整付入場':
      return typeof pt === 'number' && pt === 0;
    case '分期入場':
      return typeof pt === 'number' &&&& pt >= 1 &&&& pt <= 10;
    case '教育基金':
      return (p.tag_list || []).indexOf('教育規劃') !== -1;
    case '小額入場':
      return tp < 20000;
    case '非美元資產配置':
      return cur !== 'USD';
    default:
      // 兜底: 舊有 tag_list 字串比對
      return (p.tag_list || []).indexOf(tagName) !== -1;
  }
}

function filterProducts() {
  if (!selectedTagList || selectedTagList.length === 0) return productData.products;
  // OR 並集: 符合任意一個勾選標籤即顯示
  return productData.products.filter(function(p) {
    return selectedTagList.some(function(tagName) {
      return matchesTag(p, tagName);
    });
  });
}

function formatVal(v, suffix) {
  if (v === null || v === undefined || v === '待补') return '<span class="metric-value tbd">待补</span>';
  return '<span class="metric-value">' + v + (suffix || '') + '</span>';
}

function renderProductList() {
  console.log('renderProductList() called');
  var list = filterProducts();
  var container = document.getElementById('productContainer');
  var header = document.getElementById('resultHeader');
  if (!container) { console.warn('productContainer not found'); return; }

  if (list.length === 0) {
    container.innerHTML = '<div class="no-result">无符合条件的产品, 请调整标签组合</div>';
    if (header) header.textContent = '显示 0 款产品';
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
    html += '<input type="checkbox" value="' + p.prod_id + '" onchange="onCompareToggle(this.value)" ' + isChecked + '> 加入对比';
    html += '</label>';
    html += '<div class="finance-tag ' + financeClass + '">保费融资</div>';
    html += '</div>';
    html += '<div class="metrics">';
    html += '<div class="metric"><div class="metric-label">最低保费</div>' + formatVal(p.min_prem) + '</div>';
    html += '<div class="metric"><div class="metric-label">缴费年期</div>' + formatVal(p.pay_term) + '</div>';
    html += '<div class="metric"><div class="metric-label">回本</div>' + formatVal(p.break_year) + '</div>';
    html += '<div class="metric"><div class="metric-label">IRR 20年</div>' + formatVal(p.irr_20, '%') + '</div>';
    html += '</div>';
    html += '<div class="tag-list">' + chips + '</div>';
    html += '<div class="feature-text">' + p.feature_short + '</div>';
    html += '<div class="influencer-block">';
    html += '<div class="point">★ ' + p.influencer_point + '</div>';
    html += '<div class="scene">' + p.scene_desc + '</div>';
    html += '</div>';
    html += '<div class="card-actions">';
    html += '<button class="btn btn-ghost" onclick="showIncomeChart(\'' + p.prod_id + '\')">收益曲线</button>';
    html += '<button class="btn btn-ghost" onclick="showIRRChart(\'' + p.prod_id + '\')">IRR对比</button>';
    html += '<button class="btn btn-primary" onclick="addToReport(\'' + p.prod_id + '\')">加入报告</button>';
    html += '</div>';
    html += '</div>';
  }
  container.innerHTML = html;

  if (header) header.textContent = '显示 ' + list.length + ' 款产品';
  updateCompareBadge();
}

function updateFilterStats() {
  var list = filterProducts();
  var statShown = document.getElementById('stat-shown');
  var statFilter = document.getElementById('stat-filter');
  if (statShown) statShown.textContent = list.length === productData.products.length ? '显示全部' : '筛选后 ' + list.length + ' 款';
  if (statFilter) statFilter.textContent = selectedTagList.length === 0 ? '未启用筛选' : '已选 ' + selectedTagList.length + ' 个标签: ' + selectedTagList.join('、');
}

// ===== 多产品对比逻辑 =====
function onCompareToggle(prodId) {
  console.log('onCompareToggle() called', prodId);
  var idx = comparedProductIds.indexOf(prodId);
  if (idx === -1) {
    if (comparedProductIds.length >= 4) {
      alert('最多同时对比 4 款产品');
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
    prod_name: '产品名称', ins_name: '保险公司', min_prem: '最低保费(USD)',
    pay_term: '缴费年期', break_year: '回本', irr_20: 'IRR 20年(%)',
    guarantee: '保证回报', life_type: '产品类型', finance_support: '保费融资'
  };

  var html = '<table class="compare-table"><thead><tr><th>比较项</th>';
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
      else if (rowKey === 'break_year' &&&& v === null) { display = '待补'; }
      html += '<td>' + display + '</td>';
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  panel.innerHTML = '<div class="compare-header">' +
    '<h3>产品对比(' + products.length + '款)</h3>' +
    '<div>' +
    '<button class="btn btn-ghost" onclick="showMultiProductChart()">多产品图表</button> ' +
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

// ===== ECharts 收益曲线图(单产品) =====
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

// ===== ECharts IRR对比图(单产品 vs 行业均值) =====
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
    xAxis: { type: 'category', data: [product.prod_name, '行业平均'] },
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

// ===== ECharts 多产品 IRR 对比图(多选后) =====
function showMultiProductChart() {
  console.log('showMultiProductChart() called');
  if (comparedProductIds.length === 0) { alert('请先勾选产品'); return; }
  var products = [];
  for (var i = 0; i < comparedProductIds.length; i++) {
    var found = productData.products.find(function(p) { return p.prod_id === comparedProductIds[i]; });
    if (found) products.push(found);
  }

  var modal = document.getElementById('chartModal');
  var title = document.getElementById('chartTitle');
  if (title) title.textContent = '多产品IRR对比(' + products.length + '款)';
  if (modal) modal.style.display = 'block';

  if (currentChart) currentChart.dispose();
  currentChart = echarts.init(document.getElementById('chartContainer'));

  var option = {
    backgroundColor: chartConfig.theme.backgroundColor,
    title: { text: '20年IRR多产品对比', left: 'center', textStyle: chartConfig.theme.title },
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

// ===== 客户 PDF 报告导出 =====
function addToReport(prodId) {
  console.log('addToReport() called', prodId);
  if (reportItems.indexOf(prodId) === -1) {
    reportItems.push(prodId);
    updateReportBadge();
    alert('已加入客户报告');
  } else {
    alert('该产品已在报告中');
  }
}

function updateReportBadge() {
  var badge = document.getElementById('reportBadge');
  if (badge) badge.textContent = reportItems.length;
}

function generateClientReport() {
  console.log('generateClientReport() called');
  if (reportItems.length === 0) {
    alert('请先加入至少一款产品到报告');
    return;
  }
  var products = [];
  for (var i = 0; i < reportItems.length; i++) {
    var found = productData.products.find(function(p) { return p.prod_id === reportItems[i]; });
    if (found) products.push(found);
  }

  var reportHtml = '<html><head><meta charset="UTF-8"><title>客户比较报告</title>' +
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
  reportHtml += '<h1>保险产品比较报告</h1>';
  reportHtml += '<p>报告日期: ' + new Date().toLocaleDateString('
