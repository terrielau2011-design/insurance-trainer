/**
 * ════════════════════════════════════════════════════════════
 * data.js — 產品靜態 JSON 數據接口
 * 保險銷售視覺化培訓系統 v1.0
 *
 * ⚠️  使用說明：
 *     所有精算數據、文字亮點、權益門檻，均在此文件填入。
 *     UI 邏輯全部在 app.js，此文件只管「數據」。
 * ════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────
   【一】產品清單 productList
   每個產品物件包含：
     id         - 唯一識別碼（英文）
     name       - 產品顯示名稱（中文）
     type       - 產品類別標籤
     currency   - 幣種
     payTerms   - 可選繳費年期陣列
     highlights - 三大銷售亮點（標題 + 描述）
     discounts  - 折扣設定（首年最高 / 次年最高）
     privileges - 權益兌換門檻清單
     policyData - 各年度精算數據表
───────────────────────────────────────────── */
const productList = [
  {
    id: 'product_alpha',
    name: '豐盛人生儲蓄計劃',          // ← 替換為正式產品名
    type: '分紅儲蓄壽險',
    currency: 'HKD',
    payTerms: [5, 10, 15, 20],
    highlights: [
      {
        icon: '💰',
        title: '高達 XX% 首年折扣',     // ← 填入正式話術
        desc:  '有效降低入場門檻，首年保費折後更抵買。'
      },
      {
        icon: '📈',
        title: '長線分紅持續增值',
        desc:  '非保證分紅歷史實現率達 XX%，長期複利回報可觀。'
      },
      {
        icon: '🎁',
        title: '多重會員禮遇',
        desc:  '指定保費門檻自動解鎖尊尚體檢、高球、機場接送等專屬權益。'
      }
    ],
    discounts: {
      year1Max: 30,   // 首年最高折扣 %
      year2Max: 20    // 次年最高折扣 %
    },
    privileges: [
      { threshold: 50000,   icon: '🏥', name: '基礎體檢禮遇' },
      { threshold: 100000,  icon: '✈️', name: '機場接送禮遇' },
      { threshold: 200000,  icon: '⛳', name: '高球場體驗' },
      { threshold: 500000,  icon: '👑', name: '尊尚私人醫生' },
      { threshold: 1000000, icon: '🌟', name: 'VIP 財富管理服務' }
    ],
    /**
     * policyData：各年度精算數據
     * 格式：{ year, principal, guaranteedCV, nonGuaranteedBonus }
     * year             - 保單年度
     * principal        - 年累計總保費（本金）
     * guaranteedCV     - 保證現金價值
     * nonGuaranteedBonus - 非保證紅利（樂觀情景）
     *
     * ⚠️ 以下為示範佔位數據，請替換為正式計劃書數值
     *    （建議以每年保費 100,000 HKD 為基準 1 單位填入，
     *     系統會按實際保費比例換算）
     */
    policyData: [
      // year, principal, guaranteedCV, nonGuaranteedBonus
      { year:  1, principal: 100000, guaranteedCV:  62000, nonGuaranteedBonus:  1500 },
      { year:  2, principal: 200000, guaranteedCV: 128000, nonGuaranteedBonus:  4200 },
      { year:  3, principal: 300000, guaranteedCV: 198000, nonGuaranteedBonus:  8100 },
      { year:  4, principal: 400000, guaranteedCV: 271000, nonGuaranteedBonus: 13500 },
      { year:  5, principal: 500000, guaranteedCV: 348000, nonGuaranteedBonus: 20800 },
      { year:  6, principal: 500000, guaranteedCV: 378000, nonGuaranteedBonus: 30200 },
      { year:  7, principal: 500000, guaranteedCV: 409000, nonGuaranteedBonus: 41500 },
      { year:  8, principal: 500000, guaranteedCV: 442000, nonGuaranteedBonus: 55000 },
      { year:  9, principal: 500000, guaranteedCV: 477000, nonGuaranteedBonus: 70200 },
      { year: 10, principal: 500000, guaranteedCV: 513000, nonGuaranteedBonus: 87500 },
      { year: 11, principal: 500000, guaranteedCV: 540000, nonGuaranteedBonus: 106800 },
      { year: 12, principal: 500000, guaranteedCV: 568000, nonGuaranteedBonus: 128200 },
      { year: 13, principal: 500000, guaranteedCV: 597000, nonGuaranteedBonus: 152100 },
      { year: 14, principal: 500000, guaranteedCV: 628000, nonGuaranteedBonus: 178700 },
      { year: 15, principal: 500000, guaranteedCV: 660000, nonGuaranteedBonus: 208300 },
      { year: 16, principal: 500000, guaranteedCV: 693000, nonGuaranteedBonus: 241200 },
      { year: 17, principal: 500000, guaranteedCV: 728000, nonGuaranteedBonus: 277500 },
      { year: 18, principal: 500000, guaranteedCV: 764000, nonGuaranteedBonus: 317500 },
      { year: 19, principal: 500000, guaranteedCV: 802000, nonGuaranteedBonus: 361500 },
      { year: 20, principal: 500000, guaranteedCV: 842000, nonGuaranteedBonus: 410000 },
      { year: 21, principal: 500000, guaranteedCV: 884000, nonGuaranteedBonus: 463200 },
      { year: 22, principal: 500000, guaranteedCV: 928000, nonGuaranteedBonus: 521500 },
      { year: 23, principal: 500000, guaranteedCV: 974000, nonGuaranteedBonus: 585300 },
      { year: 24, principal: 500000, guaranteedCV: 1023000, nonGuaranteedBonus: 655200 },
      { year: 25, principal: 500000, guaranteedCV: 1074000, nonGuaranteedBonus: 731500 },
      { year: 26, principal: 500000, guaranteedCV: 1128000, nonGuaranteedBonus: 814800 },
      { year: 27, principal: 500000, guaranteedCV: 1184000, nonGuaranteedBonus: 905700 },
      { year: 28, principal: 500000, guaranteedCV: 1243000, nonGuaranteedBonus: 1004000 },
      { year: 29, principal: 500000, guaranteedCV: 1305000, nonGuaranteedBonus: 1110200 },
      { year: 30, principal: 500000, guaranteedCV: 1370000, nonGuaranteedBonus: 1225000 }
    ]
  },

  {
    id: 'product_beta',
    name: '富盈傳承儲蓄計劃',           // ← 替換為正式產品名
    type: '全球分紅壽險',
    currency: 'USD',
    payTerms: [5, 10, 20],
    highlights: [
      {
        icon: '🌍',
        title: '美元保單抗匯率風險',
        desc:  '以美元計價，對沖港元貶值風險，適合有海外資產配置需求客戶。'
      },
      {
        icon: '📊',
        title: '長期 IRR 達 XX%',
        desc:  '於第 XX 年突破保費回本，長期持有複利倍增。'
      },
      {
        icon: '🔒',
        title: '保證現金價值穩健',
        desc:  '首 XX 年保證現金價值達投入本金 XX%，安全感十足。'
      }
    ],
    discounts: {
      year1Max: 25,
      year2Max: 15
    },
    privileges: [
      { threshold: 30000,  icon: '🏥', name: '基礎體檢禮遇' },
      { threshold: 60000,  icon: '✈️', name: '機場貴賓室' },
      { threshold: 150000, icon: '⛳', name: '精英會員資格' },
      { threshold: 300000, icon: '👑', name: '私人財富顧問' }
    ],
    policyData: [
      // ⚠️ 以 USD 計價，示範數據以 10,000 USD 年保費為 1 單位
      { year:  1, principal: 10000, guaranteedCV:  6200, nonGuaranteedBonus:   200 },
      { year:  2, principal: 20000, guaranteedCV: 12900, nonGuaranteedBonus:   600 },
      { year:  3, principal: 30000, guaranteedCV: 20000, nonGuaranteedBonus:  1300 },
      { year:  4, principal: 40000, guaranteedCV: 27400, nonGuaranteedBonus:  2400 },
      { year:  5, principal: 50000, guaranteedCV: 35200, nonGuaranteedBonus:  4000 },
      { year:  6, principal: 50000, guaranteedCV: 38200, nonGuaranteedBonus:  6100 },
      { year:  7, principal: 50000, guaranteedCV: 41400, nonGuaranteedBonus:  8700 },
      { year:  8, principal: 50000, guaranteedCV: 44800, nonGuaranteedBonus: 11800 },
      { year:  9, principal: 50000, guaranteedCV: 48400, nonGuaranteedBonus: 15500 },
      { year: 10, principal: 50000, guaranteedCV: 52300, nonGuaranteedBonus: 19700 },
      { year: 15, principal: 50000, guaranteedCV: 67000, nonGuaranteedBonus: 48000 },
      { year: 20, principal: 50000, guaranteedCV: 86000, nonGuaranteedBonus: 98000 },
      { year: 25, principal: 50000, guaranteedCV: 110000, nonGuaranteedBonus: 182000 },
      { year: 30, principal: 50000, guaranteedCV: 140000, nonGuaranteedBonus: 310000 }
    ]
  },

  {
    id: 'product_gamma',
    name: '環球增值傳承計劃',            // ← 替換為正式產品名
    type: '高端增值壽險',
    currency: 'USD',
    payTerms: [5, 10],
    highlights: [
      {
        icon: '🚀',
        title: '極速增值設計',
        desc:  '短繳期快速儲入，首 5 年保證現金價值達 XX%。'
      },
      {
        icon: '🏡',
        title: '靈活提款安排',
        desc:  '不限次數部分提款，資金流動性高，緊急時無需清盤整份保單。'
      },
      {
        icon: '⚖️',
        title: '保費融資最優選',
        desc:  '保證現金價值高，作抵押品時融資成數更高，槓桿效益最大化。'
      }
    ],
    discounts: {
      year1Max: 20,
      year2Max: 10
    },
    privileges: [
      { threshold: 50000,  icon: '🏥', name: '尊尚體檢' },
      { threshold: 100000, icon: '✈️', name: '頭等艙禮遇' },
      { threshold: 300000, icon: '🌟', name: 'UHNW 私行服務' }
    ],
    policyData: [
      // ⚠️ 示範數據，請替換
      { year:  1, principal: 10000, guaranteedCV:  7500, nonGuaranteedBonus:   100 },
      { year:  2, principal: 20000, guaranteedCV: 15800, nonGuaranteedBonus:   400 },
      { year:  3, principal: 30000, guaranteedCV: 24800, nonGuaranteedBonus:  1000 },
      { year:  4, principal: 40000, guaranteedCV: 34200, nonGuaranteedBonus:  2100 },
      { year:  5, principal: 50000, guaranteedCV: 44200, nonGuaranteedBonus:  4000 },
      { year: 10, principal: 50000, guaranteedCV: 65000, nonGuaranteedBonus: 18000 },
      { year: 15, principal: 50000, guaranteedCV: 85000, nonGuaranteedBonus: 44000 },
      { year: 20, principal: 50000, guaranteedCV: 109000, nonGuaranteedBonus: 88000 },
      { year: 25, principal: 50000, guaranteedCV: 139000, nonGuaranteedBonus: 158000 },
      { year: 30, principal: 50000, guaranteedCV: 178000, nonGuaranteedBonus: 262000 }
    ]
  }
];


/* ─────────────────────────────────────────────
   【二】貸款銀行設定 bankList
   每個銀行物件包含：
     id       - 唯一識別碼
     name     - 銀行顯示名稱
     maxLTV   - 最高貸款成數 %
     baseRate - 參考利率說明（僅顯示用）
     minAmount - 最低貸款金額
───────────────────────────────────────────── */
const bankList = [
  {
    id: 'bank_a',
    name: '匯豐銀行 HSBC',         // ← 替換為正式合作銀行
    maxLTV: 90,
    baseRate: 'P - 2.5%',
    minAmount: 500000
  },
  {
    id: 'bank_b',
    name: '中銀香港 BOCHK',
    maxLTV: 85,
    baseRate: 'H + 1.8%',
    minAmount: 300000
  },
  {
    id: 'bank_c',
    name: '恒生銀行 Hang Seng',
    maxLTV: 80,
    baseRate: 'P - 2.0%',
    minAmount: 500000
  },
  {
    id: 'bank_d',
    name: '渣打銀行 SCB',
    maxLTV: 88,
    baseRate: 'SOFR + 2.2%',
    minAmount: 1000000
  }
];


/* ─────────────────────────────────────────────
   【三】全域系統設定 appConfig
───────────────────────────────────────────── */
const appConfig = {
  defaultProduct:    'product_alpha',  // 預設選中產品 ID
  defaultPayTerm:    10,               // 預設繳費年期
  defaultLTV:        85,               // 預設 LTV %
  defaultLoanRate:   4.5,             // 預設貸款利率 %
  defaultCapRate:    7.0,             // 預設封頂利率 %
  defaultLoanTerm:   5,               // 預設貸款年期
  currencySymbols: {
    HKD: 'HK$',
    USD: 'US$'
  }
};
