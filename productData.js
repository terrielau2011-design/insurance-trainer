// productData.js v1.1-tags
// 保險產品數據源|原有JS物件格式|兼容舊架構
// 包含 productData、finConfig、chartConfig
// v1.0-launch 數據範圍:INS01+INS02 共10款產品
// v1.1 增量修改: 新增12標籤、擴展產品欄位、部分產品新增"教育規劃"tag
(function(){
  const productData = { /* 你原有全部數據 */ };
  const finConfig = { /* 原有配置 */ };
  const chartConfig = { /* 原有圖表配置 */ };
  // 只全域空先掛載
  if (!window.productData) {
    window.productData = productData;
    window.finConfig = finConfig;
    window.chartConfig = chartConfig;
  }
})();

const productData = {
  version: "v1.1-tags",
  generated_at: "2026-06-24",
  scope: "INS01+INS02 only (10 products)",

  // ====== 保險公司 ======
  insurance_companies: {
    "INS01": { ins_id: "INS01", ins_name: "中國人壽海外", currency: "HKD/USD/CNY", coop_status: "啟用" },
    "INS02": { ins_id: "INS02", ins_name: "中國太平洋人壽", currency: "HKD/USD/CNY", coop_status: "啟用" },
    "INS03": { ins_id: "INS03", ins_name: "立橋人壽", currency: "HKD/USD/CNY", coop_status: "啟用" },
    "INS04": { ins_id: "INS04", ins_name: "萬通保險", currency: "HKD/USD/CNY", coop_status: "啟用" }
  },

  // ====== 產品主表 P001-P010 ======
  // 說明: total_premium=最低入場總保費(USD), premium_term=主力繳費年期(數字/0=整付),
  //       currency=主要計價幣種, type=產品分類, guaranteed_return=保證回報率(%)
  products: [
    {
      prod_id: "P001", ins_id: "INS01", ins_name: "中國人壽海外",
      prod_name: "傲瓏盛世儲蓄保險計劃", pay_term: "0,2,5", min_prem: 8000,
      break_year: 5, irr_20: 5.6, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["整付入場", "分期入場", "教育規劃"],
      feature_short: "USD8000/HKD64000/CNY51200(整付/2/5年繳);多幣種;IRR20約5.6-6.0%;回本5年",
      finance_support: "否",
      influencer_point: "USD8000起3種幣種(USD/HKD/CNY)|回本5年|終身分紅",
      scene_desc: "[一張保單,3種幣種,資產全球配置];主打小額入場+多幣種切換",
      total_premium: 8000, premium_term: 5, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P002", ins_id: "INS01", ins_name: "中國人壽海外",
      prod_name: "鑽逸傳承儲蓄保險計劃尊尚版", pay_term: "0", min_prem: 8000,
      break_year: 4, irr_20: 5.4, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["整付入場"],
      feature_short: "USD8000/HKD64000(整付);HKD回本4年;IRR20約5.0-5.4%",
      finance_support: "否",
      influencer_point: "USD8000整付門檻|HKD回本4年最快|終身傳承",
      scene_desc: "[整付入場,4年回本,傳承利器];針對高淨值客戶快速建立美元保單",
      total_premium: 8000, premium_term: 0, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P003", ins_id: "INS01", ins_name: "中國人壽海外",
      prod_name: "豐饒傳承儲蓄保險計劃III", pay_term: "5", min_prem: 200000,
      break_year: 5, irr_20: 4.9, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["分期入場", "高淨值資產配置", "槓桿融資"],
      feature_short: "USD200000年繳(5年預繳);總保費874683預繳;保費融資專用;回本5年;IRR20約4.9%",
      finance_support: "是",
      influencer_point: "USD200,000起,5年預繳|保費融資專用|回本5年|總保費達1M",
      scene_desc: "[保費融資最佳工具:5年回本+槓桿放大+預繳3.5%保證利率];針對高淨值客戶資產傳承+融資套利",
      total_premium: 200000, premium_term: 5, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P004", ins_id: "INS01", ins_name: "中國人壽海外",
      prod_name: "智裕世代多元幣種保險計劃卓越", pay_term: "5", min_prem: 8000,
      break_year: 5, irr_20: 5.8, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["分期入場", "跨境財富規劃", "教育規劃"],
      feature_short: "USD8000/HKD64000/CNY51200年繳(5年繳);9種幣種切換;回本5年;IRR20約5.7-6.0%",
      finance_support: "否",
      influencer_point: "USD8000起5年繳|9種幣種切換|回本5年|跨境財富規劃",
      scene_desc: "[9種幣種自由切換,留學移民海外資產配置首選];針對跨境家庭",
      total_premium: 8000, premium_term: 5, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P005", ins_id: "INS01", ins_name: "中國人壽海外",
      prod_name: "優暇人生延期年金計劃II", pay_term: "5,10", min_prem: 2400,
      break_year: null, irr_20: null, guarantee: "否", life_type: "定期儲蓄",
      tag_list: ["分期入場", "退休規劃"],
      feature_short: "USD2400/HKD18000年繳;5/10年繳;年金入息;90歲TIRR約4.0-4.2%(官方)",
      finance_support: "否",
      influencer_point: "USD2400起|年金入息|90歲TIRR約4.0%|退休規劃",
      scene_desc: "[穩定年金入息+意外身故保障,退休生活無憂];針對準退休人士",
      total_premium: 2400, premium_term: 10, currency: "USD", type: "年金計劃", guaranteed_return: 1.1
    },
    {
      prod_id: "P006", ins_id: "INS02", ins_name: "中國太平洋人壽",
      prod_name: "金如意儲蓄保險計劃星耀版", pay_term: "0,2,5,10", min_prem: 25000,
      break_year: 6, irr_20: 6.2, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["整付入場", "分期入場", "高淨值資產配置", "教育規劃"],
      feature_short: "USD25000整付/2/5/10年繳;IRR20約6.2-6.4%;受6.5%上限限制;回本6年(2年繳基準)",
      finance_support: "否",
      influencer_point: "USD25,000起|4種繳費期選擇|IRR20約6.2%|回本6年|受6.5%上限",
      scene_desc: "[最高IRR產品,4種繳費期靈活選擇];針對追求高回報的儲蓄客戶",
      total_premium: 25000, premium_term: 10, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P007", ins_id: "INS02", ins_name: "中國太平洋人壽",
      prod_name: "金安逸儲蓄保險計劃", pay_term: "3", min_prem: 30000,
      break_year: 7, irr_20: 3.1, guarantee: "是", life_type: "終身儲蓄",
      tag_list: ["分期入場", "穩定收益"],
      feature_short: "USD30000/HKD240000年繳(3年繳);保證回報;回本7年;IRR20約3.1-3.5%",
      finance_support: "否",
      influencer_point: "USD30,000起|3年保證回報|保證IRR|回本7年",
      scene_desc: "[保證回報零分紅,穩健首選];針對保守型投資者",
      total_premium: 30000, premium_term: 3, currency: "USD", type: "終身壽險", guaranteed_return: 2.5
    },
    {
      prod_id: "P008", ins_id: "INS02", ins_name: "中國太平洋人壽",
      prod_name: "世代臻享儲蓄壽險計劃榮耀版", pay_term: "3", min_prem: 12500,
      break_year: 5, irr_20: 4.2, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["分期入場", "小額入場", "教育規劃"],
      feature_short: "USD12500年繳(3年繳);回本5年;IRR20約4.2%",
      finance_support: "否",
      influencer_point: "USD12,500起3年繳|回本5年|IRR20約4.2%|小額入場",
      scene_desc: "[低門檻享5年回本+終身分紅];針對年輕儲蓄客戶",
      total_premium: 12500, premium_term: 3, currency: "USD", type: "分紅壽險", guaranteed_return: 0
    },
    {
      prod_id: "P009", ins_id: "INS02", ins_name: "中國太平洋人壽",
      prod_name: "金相伴終身入息保險計劃", pay_term: "0,6", min_prem: 60000,
      break_year: null, irr_20: 1.5, guarantee: "否", life_type: "終身儲蓄",
      tag_list: ["整付入場", "退休規劃", "資產傳承"],
      feature_short: "USD60000/HKD480000整付/6年繳;終身年金入息;IRR20約1.4-2.0%;入息型無短期回本點",
      finance_support: "否",
      influencer_point: "USD60,000起|整付/6年繳|終身年金入息|退休規劃|資產傳承",
      scene_desc: "[整付+終身入息雙選項,退休傳承雙引擎];針對準退休高端客戶",
      total_premium: 60000, premium_term: 6, currency: "USD", type: "終身壽險", guaranteed_return: 1.5
    },
    {
      prod_id: "P010", ins_id: "INS02", ins_name: "中國太平洋人壽",
      prod_name: "頤養天年延期年金計劃終身", pay_term: "5,10", min_prem: 3000,
      break_year: null, irr_20: 2.8, guarantee: "否", life_type: "定期儲蓄",
      tag_list: ["分期入場", "退休規劃"],
      feature_short: "USD3000-6000年繳;5/10年繳;90歲TIRR約4.18%(官方);IRR20約2.8-3.2%;年金類無標準回本期",
      finance_support: "否",
      influencer_point: "USD3000起|5/10年繳|90歲TIRR約4.18%|延期年金",
      scene_desc: "[延期年金規劃,鎖定未來退休現金流];針對中長期退休規劃",
      total_premium: 3000, premium_term: 10, currency: "USD", type: "年金計劃", guaranteed_return: 1.2
    }
  ],

  // ====== 網紅亮點 P001-P010 (原有不動) ======
  influencer_highlight: [
    { prod_id: "P001", influencer_point: "USD8000起3種幣種(USD/HKD/CNY)|回本5年|終身分紅", scene_desc: "[一張保單,3種幣種,資產全球配置];主打小額入場+多幣種切換" },
    { prod_id: "P002", influencer_point: "USD8000整付門檻|HKD回本4年最快|終身傳承", scene_desc: "[整付入場,4年回本,傳承利器];針對高淨值客戶快速建立美元保單" },
    { prod_id: "P003", influencer_point: "USD200,000起,5年預繳|保費融資專用|回本5年|總保費達1M", scene_desc: "[保費融資最佳工具:5年回本+槓桿放大+預繳3.5%保證利率];針對高淨值客戶資產傳承+融資套利" },
    { prod_id: "P004", influencer_point: "USD8000起5年繳|9種幣種切換|回本5年|跨境財富規劃", scene_desc: "[9種幣種自由切換,留學移民海外資產配置首選];針對跨境家庭" },
    { prod_id: "P005", influencer_point: "USD2400起|年金入息|90歲TIRR約4.0%|退休規劃", scene_desc: "[穩定年金入息+意外身故保障,退休生活無憂];針對準退休人士" },
    { prod_id: "P006", influencer_point: "USD25,000起|4種繳費期選擇|IRR20約6.2%|回本6年|受6.5%上限", scene_desc: "[最高IRR產品,4種繳費期靈活選擇];針對追求高回報的儲蓄客戶" },
    { prod_id: "P007", influencer_point: "USD30,000起|3年保證回報|保證IRR|回本7年", scene_desc: "[保證回報零分紅,穩健首選];針對保守型投資者" },
    { prod_id: "P008", influencer_point: "USD12,500起3年繳|回本5年|IRR20約4.2%|小額入場", scene_desc: "[低門檻享5年回本+終身分紅];針對年輕儲蓄客戶" },
    { prod_id: "P009", influencer_point: "USD60,000起|整付/6年繳|終身年金入息|退休規劃|資產傳承", scene_desc: "[整付+終身入息雙選項,退休傳承雙引擎];針對準退休高端客戶" },
    { prod_id: "P010", influencer_point: "USD3000起|5/10年繳|90歲TIRR約4.18%|延期年金", scene_desc: "[延期年金規劃,鎖定未來退休現金流];針對中長期退休規劃" }
  ],

  // ====== 標籤篩選規則 (v1.1: 12個標籤) ======
  tags: [
    { tag_name: "高淨值資產配置", 篩選規則: "min_prem >= 100000,支持保費融資,美元計價產品優先" },
    { tag_name: "跨境財富規劃", 篩選規則: "幣種包含USD,可離岸資產配置,終身分紅壽險" },
    { tag_name: "槓桿融資", 篩選規則: "finance_support = 是,支持保費融資計劃" },
    { tag_name: "短期儲蓄", 篩選規則: "break_year <= 10,回本速度快" },
    { tag_name: "資產傳承", 篩選規則: "life_type = 終身儲蓄,具備身故傳承價值" },
    { tag_name: "穩定收益", 篩選規則: "guarantee = 是,保證回報佔比高" },
    { tag_name: "退休規劃", 篩選規則: "長期持有價值高,20年期IRR表現優,適合長線持有" },
    { tag_name: "整付入場", 篩選規則: "pay_term = 0(躉繳/整付)" },
    { tag_name: "分期入場", 篩選規則: "pay_term >= 1 &amp;&amp; pay_term <= 10(分期繳費)" },
    { tag_name: "教育基金", 篩選規則: "中期回本,彈性提取現金價值,適合10-15年規劃" },
    { tag_name: "小額入場", 篩選規則: "min_prem < 20000,低門檻投保" },
    { tag_name: "非美元資產配置", 篩選規則: "支持HKD、CNY非美元幣種資產規劃" }
  ]
};

// ====== 財務配置 finConfig (原有不動) ======
const finConfig = {
  version: "v1.0-launch",
  base_currency: "USD",
  exchange_rates: {
    "HKD_to_USD": 0.128,
    "USD_to_HKD": 7.8,
    "CNY_to_USD": 0.138,
    "USD_to_CNY": 7.25
  },
  finance_terms: {
    "INS01": {
      product_codes: ["C521", "C522", "C535", "C536", "C537-C539", "C540-C542", "C508-C516"],
      min_finance_amount: 200000,
      loan_to_value: 0.7,
      interest_rate: 0.0525,
      loan_tenor: 5,
      prepayment_interest_rate: 0.035
    }
  },
  irr_params: {
    guarantee_rate_low: 0.01,
    guarantee_rate_high: 0.025,
    projection_horizon: [10, 15, 20, 25, 30],
    tax_rate: 0
  },
  prepayment: {
    "INS01": { rate: 0.035, term: 5 },
    "INS02": { rate: 0.035, term: 5 }
  },
  report: {
    company_name: "保險比較顧問",
    contact: "Terrie Lau",
    currency_symbol: "USD"
  }
};

// ====== 圖表配置 chartConfig (原有不動) ======
const chartConfig = {
  version: "v1.0-launch",
  theme: {
    backgroundColor: "#ffffff",
    textStyle: { color: "#2c3e50", fontFamily: '"Microsoft JhengHei", sans-serif' },
    title: { textStyle: { color: "#1e3a5f", fontSize: 18, fontWeight: 700 } },
    legend: { textStyle: { color: "#4a5568" } }
  },
  income_chart: {
    title: "保險收益曲線",
    years: [1, 3, 5, 7, 10, 15, 20, 25, 30],
    series_names: {
      guaranteed: "保證現金價值",
      projected: "預期回報(含非保證)"
    },
    colors: {
      guaranteed: "#1e3a5f",
      projected: "#d4af37"
    },
    tooltip: { trigger: "axis" },
    legend_position: { top: 50 },
    y_axis_name: "USD",
    animation: true,
    smooth: true
  },
  irr_compare_chart: {
    title: "20年IRR對比",
    type: "bar",
    color: "#1e3a5f",
    y_axis_min: 0,
    y_axis_max: 7
  },
  radar_chart: {
    title: "產品綜合評分",
    indicators: [
      { name: "回本速度", max: 10 },
      { name: "IRR表現", max: 10 },
      { name: "門檻友好", max: 10 },
      { name: "保證回報", max: 10 },
      { name: "彈活度", max: 10 }
    ]
  },
  tag_cloud: {
    title: "產品標籤分佈",
    type: "wordCloud",
    color_scheme: ["#1e3a5f", "#2c5282", "#d4af37", "#c47a1e", "#7a8a99"]
  },
  leverage_chart: {
    title: "保費融資槓桿分析",
    series: [
      { name: "自有資金", type: "bar", stack: "amt", color: "#1e3a5f" },
      { name: "融資金額", type: "bar", stack: "amt", color: "#d4af37" }
    ]
  }
};
