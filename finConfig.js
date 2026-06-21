// ════════════════════════════════════════════════════════════
// finConfig.js — 廣發銀行保費融資專屬配置
// 數據來源：用戶提供的測算Excel
// ════════════════════════════════════════════════════════════

const finConfig = {
  bankName: "廣發銀行",
  maxLoanRatio: 0.95,
  loanFeeRate: 0.02,
  baseRate: 0.0525,
  minRate: 0.031,
  maxRate: 0.039,
  rateSpread: -0.01975,
  repaymentType: "每月還息，到期歸本",
  scenarios: {
    normal: { rate: 0.031, realizationRate: 1 },
    pessimistic: { rate: 0.039, realizationRate: 0.8 },
  },
};

/**
 * 融資計算函數
 * @param {Object} product - 產品對象（來自 productData）
 * @param {Number} premium - 用戶輸入保費
 * @param {String} scenario - 場景：normal / pessimistic
 * @returns {Object} 融資計算結果
 */
function calculateFinancing(product, premium, scenario) {
  scenario = scenario || "normal";
  const config = finConfig;
  const scene = config.scenarios[scenario];

  // 貸款計算（數據來源：finConfig）
  const loanRatio = config.maxLoanRatio;
  const totalPremium = premium;
  const loanAmount = totalPremium * loanRatio;
  const actualPrincipal = totalPremium - loanAmount;
  const loanFee = loanAmount * config.loanFeeRate;
  const totalOutlay = actualPrincipal;
  const cashValueData = product.cashValue;

  const financingResult = {};
  Object.keys(cashValueData).forEach(function (year) {
    const yr = Number(year);
    const cv = cashValueData[year];
    const guaranteedValue = cv[0];
    const nonGuaranteedValue = cv[1];

    // 退出金額 = 保證 + 非保證 × 實現率（數據來源：productData + finConfig.scenarios）
    const totalCashValue = guaranteedValue + nonGuaranteedValue * scene.realizationRate;
    const loanBalance = loanAmount;
    const netValue = totalCashValue - loanBalance;

    // 利息計算（數據來源：finConfig.scenarios）
    const annualInterest = loanAmount * scene.rate;
    const totalInterestPaid = annualInterest * yr;

    // 淨回報
    const totalReturn = netValue - totalOutlay;
    const returnRate = totalOutlay > 0 ? Math.pow(netValue / totalOutlay, 1 / yr) - 1 : 0;

    financingResult[yr] = {
      totalCashValue: Math.round(totalCashValue),
      loanBalance: Math.round(loanBalance),
      netValue: Math.round(netValue),
      annualInterest: Math.round(annualInterest),
      totalInterestPaid: Math.round(totalInterestPaid),
      totalReturn: Math.round(totalReturn),
      returnRate: returnRate,
    };
  });

  return {
    basicInfo: {
      productName: product.name,
      totalPremium: totalPremium,
      loanAmount: Math.round(loanAmount),
      actualPrincipal: Math.round(actualPrincipal),
      loanFee: Math.round(loanFee),
      totalOutlay: Math.round(totalOutlay),
      loanRate: scene.rate,
      realizationRate: scene.realizationRate,
      scenario: scenario,
    },
    yearByYear: financingResult,
  };
}
