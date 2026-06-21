// ════════════════════════════════════════════════════════════
// chartConfig.js — 圖表與模塊開關配置
// ════════════════════════════════════════════════════════════

const chartConfig = {
  // 固定顯示年份（不開放自訂）
  fixedYears: [5, 10, 15, 20],

  // 配色（沿用 v3.2.1 風格）
  colors: {
    primary: "#165DFF",
    secondary: "#36CFC9",
    warning: "#FF7D00",
    danger: "#F53F3F",
    background: "#F5F7FA",
    text: "#1D2129",
  },

  // 圖表尺寸
  size: {
    width: "100%",
    height: 400,
  },

  // 財富走勢圖開關
  wealthChart: {
    showNeutralOnly: true,   // 預設只顯示中性場景
    showTargetLine: true,    // 顯示紅色目標虛線
    targetLineLabel: "客戶財富目標",
  },

  // 對比圖開關
  compareChart: {
    showIrr: true,
    showBreakEven: true,
  },

  // 餅圖開關
  pieChart: {
    showDiscount: true,
    showNetPremium: true,
  },

  // 模塊開關（後續隱藏只需改這裡）
  modules: {
    needTags: true,        // 模塊1：需求標籤篩選
    productCompare: true,  // 模塊2：產品多維對比
    pieChart: true,        // 模塊3a：繳費構成餅圖
    wealthChart: true,     // 模塊3b：財富走勢圖
    oppChart: true,        // 模塊3c：跨資產柱圖
    financing: true,       // 模塊4：廣發融資演算
  },
};
