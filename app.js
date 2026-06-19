/**
 * 修正後的 app.js — 已修復語法衝突並優化交互
 */
'use strict';

const state = {
  primaryProduct: null,
  compareProducts: [],
  activeScene: 1,
  s1Results: {},
  s2Results: {},
  advisorTags: [],
  financeEnabled: true,
  displayCurrency: null,
};

let chartWealthRiver = null;
let chartSafetyPie = null;
let chartDualReturn = null;
let chartComparison = null;

document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  if (typeof initSync === 'function') initSync();
  if (typeof initData === 'function') await initData();
  onDataReady();
});

function onDataReady() {
  initProductList();
  initBankList();
  initCharts();
  initPrivilegesWall();
  calcScene1();
  calcScene2();
  updateOpportunityTable();
  updateBrochureForProduct();
}

function refreshAllUI() {
  initProductList();
  initBankList();
  updateWealthChart();
  updateSafetyPie();
  updateDualReturnChart();
  updateComparisonSection();
  updateOpportunityTable();
  updateBrochureForProduct();
}

/* 核心初始化：包含你要求的交互優化 */
function initCharts() {
  // 基礎設置 (避免 Spread Operator 以防兼容性錯誤)
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false
  };

  /* 7c. 雙極限 NAV 分析圖 (完整修正版) */
  chartDualReturn = new Chart(
    document.getElementById('chart-dual-return'),
    {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: '正常環境 (NAV)', data: [], borderColor: '#1a5fb4', backgroundColor: 'rgba(26,95,180,0.05)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 2 },
          { label: '封頂環境 (NAV)', data: [], borderColor: '#c01c28', backgroundColor: 'rgba(192,28,40,0.05)', fill: true, tension: 0.4, borderWidth: 2.5, borderDash: [6, 3], pointRadius: 2 },
          { label: '⭐ 黃金退出點', data: [], borderColor: '#f5a623', backgroundColor: '#f5a623', pointRadius: 8, pointStyle: 'star', showLine: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeInOutQuad' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { font: { size: 12 } } },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            callbacks: {
              label: function(ctx) { return ' ' + ctx.dataset.label + ': ' + fmt(ctx.raw); }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: '保單年度' } },
          y: { title: { display: true, text: '保單淨資產價值 NAV' }, ticks: { callback: function(v) { return fmtShort(v); } } }
        }
      }
    }
  );
  
  // (其他 chart 初始化邏輯...)
  // 為了簡潔，這裡我只放你最關心的修正區塊
  // 若你還有其他圖表定義，請確保它們也在 initCharts 內
}

/* 更新函數 */
function updateDualReturnChart() {
  const prod = getProductById(state.primaryProduct);
  if (!prod || !chartDualReturn) return;

  const totalPrem = parseFloat(document.getElementById('s2-total-premium').value) || 600000;
  const ltvPct = (parseFloat(document.getElementById('s2-ltv').value) || 95) / 100;
  const annualRate = (parseFloat(document.getElementById('s2-rate').value) || 3.275) / 100;
  const capRate = (parseFloat(document.getElementById('s2-cap-rate').value) || 3.9) / 100;
  const loanFeeRate = (parseFloat(document.getElementById('s2-loan-fee').value) || 2) / 100;
  const exitYear = Math.min(10, parseInt(document.getElementById('s2-loan-term').value) || 9);

  const firstDayCVRatio = prod.firstDayCVRatio || 0.7869;
  const firstDayCV = totalPrem * firstDayCVRatio;
  const loanAmount = firstDayCV * ltvPct;
  const loanFee = loanAmount * loanFeeRate;
  const ratio = totalPrem / getBasePremiumUnit(prod);

  const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  chartDualReturn.data.labels = years.map(function(y) { return '第' + y + '年'; });
  
  chartDualReturn.data.datasets[0].data = years.map(function(yr) {
    const data = getPolicyDataAtYear(prod, yr);
    return data ? ((data.guaranteedCV + data.nonGuaranteedBonus) * ratio) - loanAmount - (loanAmount * annualRate * yr) - loanFee : null;
  });

  chartDualReturn.data.datasets[1].data = years.map(function(yr) {
    const data = getPolicyDataAtYear(prod, yr);
    return data ? ((data.guaranteedCV + data.nonGuaranteedBonus) * ratio) - loanAmount - (loanAmount * capRate * yr) - loanFee : null;
  });

  const anchorData = new Array(10).fill(null);
  anchorData[exitYear - 1] = chartDualReturn.data.datasets[0].data[exitYear - 1];
  chartDualReturn.data.datasets[2].data = anchorData;

  chartDualReturn.update();
}

// ... (其餘原本的函數內容保持不變)
