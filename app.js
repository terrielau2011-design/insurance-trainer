// app.js v1.1-tags
// 保險產品比較器 - 兼容舊版 ECharts 圖表、多產品對比、客戶 PDF 報告
// 數據源: productData.js (productData + finConfig + chartConfig)
// v1.1 增量修改: 12標籤 OR 篩選邏輯、renderTagPanel 修正屬位名#
// 原有所有功能 100% 保留不動#

let selectedTagList = [];
let comparedProductIds = [];
let reportItems = [];
let currentChart = null;

// ===== 數據載入(從 productData.js 同步讀取) =====#
function loadProductData() {
  console.log('[v1.1-tags] loadProductData() called');
  if (typeof productData === 'undefined') {
    console.error('productData.js not loaded');
    var el = document.getElementById('productContainer');
    if (el) el.innerHTML = '<div class="no-result">productData.js 載入失敗, 請確認檔案路徑正確</div>';
    return;
  }
  console.log('[v1.1-tags] productData loaded:', productData.products.length, 'products,', productData.tags.length, 'tags');
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

// ===== 產品過濾篩選核心邏輯 (v1.1: OR 並集邏輯 + 12條規則) =====#
function matchesTag(p, tagName) {
  var tp = (p.total_premium != null) ? p.total_premium : p.min_prem;
  var pt = p.premium_term;
  var cur = (p.currency || 'USD');
  var typ = (p.type || '');
  var gr = (p.guaranteed_return != null) ? p.guaranteed_return : 0;
  var fs = (p.finance_support === '是');
  var by = p.break_year;
  var irr = (p.irr_20 != null) ? p.irr_20 : 0;

  switch (tagName) {
    case '高淨值資產配置':
      return (tp >= 100000) &amp;&amp; fs &amp;&amp; (cur === 'USD');
    case '跨境財富規劃':
      return (cur === 'USD') &amp;&amp; ((typ === '分紅壽險') || (typ === '終身壽險'));
    case '槓桿融資':
      return fs;
    case '短期儲蓄':
      return (by != null) &amp;&amp; (by <= 10);
    case '資產傳承':
      return (typ === '分紅壽險') || (typ === '終身壽險');
    case '穩定收益':
      if (typ === '年金計劃') { return gr > 0; }
      return gr > 0;
    case '退休規劃':
      return (typeof pt === 'number') &amp;&amp; (pt >= 10) &amp;&amp; (irr >= 3);
    case '整付入場':
      return (typeof pt === 'number') &amp;&amp; (pt === 0);
    case '分期入場':
      return (typeof pt === 'number') &amp;&amp; (pt >= 1) &amp;&amp; (pt <= 10);
    case '教育基金':
      return (p.tag_list || []).indexOf('教育規劃') !== -1;
    case '小額入場':
      return tp < 20000;
    case '非美元資產配置':
      return cur !== 'USD';
    default:
      return (p.tag_list || []).indexOf(tagName) !== -1;
  }
}

function filterProducts() {
  if (!selectedTagList || selectedTagList.length === 0) return productData.products;
  return productData.products.filter(function(p) {
    return selectedTagList.some(function(tagName) {
      return matchesTag(p, tagName);
    });
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
    container.innerHTML = '<div class="no-result">無符合條件的產品, 請調整標籤組合</div>';
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
    var financeClass = (p.finance_support === '是') ? '' : 'no';
    var isChecked = (comparedProductIds.indexOf(p.prod_id) !== -1) ? 'checked' : '';
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
    html += '<button class="btn btn-ghost" onclick="showIncomeChart(' + p.prod_id + ')
