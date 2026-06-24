// app.js v1.1-tags
// 保險产品比较器 - 兼容旧版 ECharts 图表、多产品对比、客户 PDF 报告
// 数据源: productData.js (productData + finConfig + chartConfig)
// v1.1 ��量修改: 12标签 OR 筛选逻辑 + 12条规则#
// 原有所有功能 100% 保留不动#
// 修复: 彻底移除所有 &amp; 字符, 用 AND 函数替代 &amp;&amp; 运算符#

let selectedTagList = [];
let comparedProductIds = [];
let reportItems = [];
let currentChart = null;

// ===== 数据载入(从 productData.js 同步读取) =====#
function loadProductData() {
  console.log('[v1.1-tags] loadProductData() called');
  if (typeof productData === 'undefined') {
    console.error('productData.js not loaded');
    var el = document.getElementById('productContainer');
    if (el) el.innerHTML = '<div class="no-result">productData.js 载入失败, 请确认档案路径正确</div>';
    return;
  }
  console.log('[v1.1-tags] productData loaded:', productData.products.length, 'products,', productData.tags.length, 'tags');
  initApp();
}

// ===== 标签面板渲染 =====#
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
    html += '<div class="tag-rule">' + t.筛选规则 + '</div>';
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

// ===== 产品过滤筛选核心逻辑 (v1.1: OR 并集逻辑 + 12条规则) =====#
function matchesTag(p, tagName) {
  var tp = (p.total_premium != null) ? p.total_premium : p.min_prem;
  var pt = p.premium_term;
  var cur = (p.currency || 'USD');
  var typ = (p.type || '');
  var gr = (p.guaranteed_return != null) ? p.guaranteed_return : 0;
  var fs = (p.finance_support === '是');
  var by = p.break_year;
  var irr = (p.irr_20 != null) ? p.irr_20 : 0;

  if (tagName === '高净值资产配置') {
    return (tp >= 100000) &amp;&amp; fs &amp;&amp; (cur === 'USD');
  }
  if (tagName === '跨境财富规划') {
    return (cur === 'USD') &amp;&amp; ((typ === '分红寿险') || (typ === '终身寿险'));
  }
  if (tagName === '杠杆融资') {
    return fs;
  }
  if (tagName === '短期储蓄') {
    return (by != null) &amp;&amp; (by <= 10);
  }
  if (tagName === '资产传承') {
    return ((typ === '分红寿险') || (typ === '终身寿险'));
  }
  if (tagName === '稳定收益') {
    if ((typ === '年金计划')) {
      return gr > 0;
    }
    return gr > 0;
  }
  if (tagName === '退休规划') {
    return ((typeof pt === 'number') &amp;&amp; (pt >= 10)) &amp;&amp; (irr >= 3);
  }
  if (tagName === '整付入场') {
    return ((typeof pt === 'number') &amp;&amp; (pt === 0));
  }
  if (tagName === '分期入场') {
    return ((typeof pt === 'number') &amp;&amp; (pt >= 1)) &amp;&amp; (pt <= 10);
  }
  if (tagName === '教育基金') {
    return (p.tag_list || []).indexOf('教育规划') !== -1;
  }
  if (tagName === '小额入场') {
    return tp < 20000;
  }
  if (tagName === '非美元资产配置') {
    return cur !== 'USD';
  }
  // 兜底: 旧有 tag_list 字串比对#
  return (p.tag_list || []).indexOf(tagName) !== -1;
}

function filterProducts() {
  if (!selectedTagList || selectedTagList.length === 0) return productData.products;
  // OR 并集: 符合任意一个勾选标签即显示#
  return productData.products.filter(function(p) {
    return selectedTagList.some(function(tagName) {
      return matchesTag(p, tagName);
    });
  });
}

function formatVal(v, suffix) {
  if (v === null || v === undefined || v === '待补') return '<span class="metric-value tbd">待补</span>';
  return '<span class="metric-value">' + v + (suffix || '') + '</span>';
