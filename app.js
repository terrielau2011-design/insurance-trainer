// app.js v1.0-full 全量功能版
// 保險產品比較器 - 完整業務邏輯 | 融資演算 | 動態圖表 | PDF報告
// 全局變量
let selectedTags = [];
let selectedProducts = [];
let financeParams = {
    loan_amount: 0,
    loan_term: 20,
    rate_type: "base",
    processing_fee: 0.01
};

// 頁面初始化 - 雙重保證DOM載入
document.addEventListener('DOMContentLoaded', bootstrap);
window.onload = bootstrap;

// 主初始化函數
function bootstrap() {
    console.log("✅ 頁面初始化開始，DOM已完全載入");
    loadProductData();
    renderTagPanel();
    renderProductList();
    initFinanceCalculator();
    initCharts();
    initPDFExport();
    console.log("✅ 全量功能初始化完成");
}

// 1. 數據載入
function loadProductData() {
    console.log("📦 載入產品數據，共" + productData.products.length + "款產品");
    // 初始化標籤
    const allTags = new Set();
    productData.products.forEach(p => {
        p.tags.forEach(tag => allTags.add(tag));
    });
    window.allTags = Array.from(allTags);
}

// 2. 標籤面板渲染
function renderTagPanel() {
    const tagContainer = document.getElementById('tagContainer');
    if (!tagContainer) return;
    
    tagContainer.innerHTML = '';
    window.allTags.forEach(tag => {
        const tagBtn = document.createElement('button');
        tagBtn.className = 'tag-btn';
        tagBtn.textContent = tag;
        tagBtn.dataset.tag = tag;
        tagBtn.onclick = () => toggleTag(tag);
        if (selectedTags.includes(tag)) {
            tagBtn.classList.add('active');
        }
        tagContainer.appendChild(tagBtn);
    });
    console.log("🏷️ 標籤面板渲染完成，共" + window.allTags.length + "個標籤");
}

// 標籤切換
function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        selectedTags.push(tag);
    }
    renderTagPanel();
    renderProductList();
    updateCharts();
}

// 3. 產品列表渲染
function renderProductList() {
    const productContainer = document.getElementById('productContainer');
    if (!productContainer) return;
    
    // 過濾產品
    let filteredProducts = productData.products;
    if (selectedTags.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
            selectedTags.every(tag => p.tags.includes(tag))
        );
    }
    
    productContainer.innerHTML = '';
    filteredProducts.forEach(p => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="card-header">
                <h3>${p.name}</h3>
                <span class="company-badge">${p.company}</span>
                <span class="currency-badge">${p.currency}</span>
            </div>
            <div class="card-body">
                <div class="highlight"><strong>★ 網紅亮點:</strong> ${p.influencer_point}</div>
                <div class="highlight"><em>${p.scene_desc}</em></div>
                <div class="param-grid">
                    <div class="param-item">
                        <span class="label">繳費年期</span>
                        <span class="value">${p.premium_term}年</span>
                    </div>
                    <div class="param-item">
                        <span class="label">保證回報率</span>
                        <span class="value">${(p.guaranteed_return * 100).toFixed(2)}%</span>
                    </div>
                    <div class="param-item">
                        <span class="label">總IRR</span>
                        <span class="value">${(p.irr * 100).toFixed(2)}%</span>
                    </div>
                    <div class="param-item">
                        <span class="label">回本年期</span>
                        <span class="value">${p.break_year}年</span>
                    </div>
                    <div class="param-item">
                        <span class="label">風險等級</span>
                        <span class="value risk-${p.risk_level}">${p.risk_level}</span>
                    </div>
                    <div class="param-item">
                        <span class="label">流動性</span>
                        <span class="value">${p.liquidity}</span>
                    </div>
                </div>
                <div class="feature-list">
                    ${p.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="addToCompare('${p.id}')">加入對比</button>
                    ${p.finance_support ? `<button class="btn btn-secondary" onclick="showFinanceCalculator('${p.id}')">融資演算</button>` : ''}
                    <button class="btn btn-outline" onclick="showIncomeChart('${p.id}')">收益圖表</button>
                </div>
            </div>
        `;
        productContainer.appendChild(productCard);
    });
    console.log("📦 產品列表渲染完成，共" + filteredProducts.length + "款產品");
}

// 4. 產品對比功能
function addToCompare(productId) {
    if (selectedProducts.length >= 4) {
        alert("最多只能選擇4款產品對比");
        return;
    }
    if (!selectedProducts.includes(productId)) {
        selectedProducts.push(productId);
        renderCompareTable();
        updateCharts();
    }
}

function renderCompareTable() {
    const compareContainer = document.getElementById('compareContainer');
    if (!compareContainer) return;
    
    if (selectedProducts.length < 2) {
        compareContainer.innerHTML = '<p class="empty-tip">請選擇至少2款產品進行對比</p>';
        return;
    }
    
    const products = selectedProducts.map(id => productData.products.find(p => p.id === id));
    const compareRows = [
        { key: 'name', label: '產品名稱' },
        { key: 'company', label: '發行公司' },
        { key: 'currency', label: '計價貨幣' },
        { key: 'premium_term', label: '繳費年期' },
        { key: 'guaranteed_return', label: '保證回報率', format: v => `${(v * 100).toFixed(2)}%` },
        { key: 'irr', label: '總IRR', format: v => `${(v * 100).toFixed(2)}%` },
        { key: 'break_year', label: '回本年期', format: v => v === null ? '待補' : `${v}年` },
        { key: 'risk_level', label: '風險等級' },
        { key: 'liquidity', label: '流動性' },
        { key: 'finance_support', label: '融資支持', format: v => v ? '✅ 支持' : '❌ 不支持' }
    ];
    
    let tableHtml = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>對比維度</th>
                    ${products.map(p => `<th>${p.name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;
    
    compareRows.forEach(row => {
        tableHtml += `<tr><td>${row.label}</td>`;
        products.forEach(p => {
            let display = p[row.key];
            if (row.format) display = row.format(display);
            // 高亮優勢產品
            let highlight = '';
            if (row.key === 'irr' || row.key === 'guaranteed_return') {
                const maxVal = Math.max(...products.map(pp => pp[row.key]));
                if (p[row.key] === maxVal) highlight = 'class="highlight-row"';
            }
            if (row.key === 'break_year') {
                const minVal = Math.min(...products.map(pp => pp[row.key]));
                if (p[row.key] === minVal) highlight = 'class="highlight-row"';
            }
            tableHtml += `<td ${highlight}>${display}</td>`;
        });
        tableHtml += `</tr>`;
    });
    
    tableHtml += `
            </tbody>
        </table>
        <button class="btn btn-danger" onclick="clearCompare()">清空對比</button>
    `;
    
    compareContainer.innerHTML = tableHtml;
    console.log("📊 產品對比表格渲染完成");
}

function clearCompare() {
    selectedProducts = [];
    renderCompareTable();
    updateCharts();
}

// 5. 融資演算器
function initFinanceCalculator() {
    const financeModal = document.getElementById('financeModal');
    if (!financeModal) return;
    
    // 初始化融資參數
    financeParams.loan_amount = productData.products[0].total_premium * 0.95;
    document.getElementById('loanAmount').value = financeParams.loan_amount;
    document.getElementById('loanTerm').value = financeParams.loan_term;
    document.getElementById('rateType').value = financeParams.rate_type;
    document.getElementById('processingFee').value = financeParams.processing_fee;
    
    // 綁定事件
    document.getElementById('calculateFinanceBtn').onclick = calculateFinance;
    document.getElementById('closeFinanceModal').onclick = () => {
        financeModal.style.display = 'none';
    };
}

function showFinanceCalculator(productId) {
    const product = productData.products.find(p => p.id === productId);
    if (!product || !product.finance_support) return;
    
    const financeConfig = productData.finance_terms[product.company];
    financeParams.loan_amount = product.total_premium * financeConfig.loan_to_value;
    financeParams.loan_term = financeConfig.max_loan_term;
    financeParams.processing_fee = financeConfig.processing_fee;
    financeParams.base_rate = financeConfig.base_rate;
    
    // 更新表單
    document.getElementById('selectedProductName').textContent = product.name;
    document.getElementById('loanAmount').value = financeParams.loan_amount;
    document.getElementById('loanTerm').value = financeParams.loan_term;
    document.getElementById('rateType').value = "base";
    document.getElementById('processingFee').value = financeParams.processing_fee;
    
    // 顯示模態框
    document.getElementById('financeModal').style.display = 'block';
    calculateFinance();
}

function calculateFinance() {
    // 獲取參數
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    const rateType = document.getElementById('rateType').value;
    const processingFee = parseFloat(document.getElementById('processingFee').value);
    
    // 計算貸款利率
    let annualRate = financeParams.base_rate;
    if (rateType === "prime") annualRate += 0.005;
    if (rateType === "preferential") annualRate -= 0.002;
    
    // 計算手續費
    const feeAmount = loanAmount * processingFee;
    const actualLoan = loanAmount - feeAmount;
    
    // 計算月供（年金公式）
    const monthlyRate = annualRate / 12;
    const totalMonths = loanTerm * 12;
    const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    // 計算融資後IRR
    const product = productData.products.find(p => p.name === document.getElementById('selectedProductName').textContent);
    const financeIrr = ((product.irr * product.total_premium) - (monthlyPayment * 12 * loanTerm / loanAmount)) / product.total_premium;
    
    // 顯示結果
    document.getElementById('financeResult').innerHTML = `
        <div class="result-grid">
            <div class="result-item">
                <span class="label">貸款金額</span>
                <span class="value">${loanAmount.toLocaleString()} ${product.currency}</span>
            </div>
            <div class="result-item">
                <span class="label">實際到賬金額</span>
                <span class="value">${actualLoan.toLocaleString()} ${product.currency}</span>
            </div>
            <div class="result-item">
                <span class="label">手續費</span>
                <span class="value">${feeAmount.toLocaleString()} ${product.currency}</span>
            </div>
            <div class="result-item">
                <span class="label">貸款年期</span>
                <span class="value">${loanTerm}年</span>
            </div>
            <div class="result-item">
                <span class="label">年利率</span>
                <span class="value">${(annualRate * 100).toFixed(2)}%</span>
            </div>
            <div class="result-item">
                <span class="label">每月供款</span>
                <span class="value">${monthlyPayment.toFixed(2)} ${product.currency}</span>
            </div>
            <div class="result-item highlight">
                <span class="label">融資後IRR</span>
                <span class="value">${(financeIrr * 100).toFixed(2)}%</span>
            </div>
        </div>
    `;
    console.log("💰 融資演算完成");
}

// 6. 動態圖表初始化
let incomeChart, pieChart, opportunityChart, riskChart;
function initCharts() {
    // 收益曲線圖
    incomeChart = echarts.init(document.getElementById('incomeChart'));
    // 繳費結構餅圖
    pieChart = echarts.init(document.getElementById('pieChart'));
    // 機會成本柱狀圖
    opportunityChart = echarts.init(document.getElementById('opportunityChart'));
    // 風險對比雷達圖
    riskChart = echarts.init(document.getElementById('riskChart'));
    
    // 初始化圖表
    updateCharts();
    // 窗口大小改變時自適應
    window.onresize = () => {
        incomeChart.resize();
        pieChart.resize();
        opportunityChart.resize();
        riskChart.resize();
    };
    console.log("📈 所有動態圖表初始化完成");
}

function updateCharts() {
    updateIncomeChart();
    updatePieChart();
    updateOpportunityChart();
    updateRiskChart();
}

// 收益曲線圖
function updateIncomeChart() {
    if (!incomeChart) return;
    const products = selectedProducts.length > 0 
        ? selectedProducts.map(id => productData.products.find(p => p.id === id))
        : productData.products.slice(0, 3);
    
    const years = Array.from({length: 31}, (_, i) => i);
    const series = products.map(p => {
        const values = years.map(year => {
            if (year < p.premium_term) return -p.total_premium / p.premium_term * year;
            const holdYears = year - p.premium_term;
            return p.total_premium * Math.pow(1 + p.irr, holdYears);
        });
        return {
            name: p.name,
            data: values,
            type: 'line',
            smooth: true
        };
    });
    
    incomeChart.setOption({
        title: { text: '產品收益曲線對比', left: 'center' },
        tooltip: { trigger: 'axis' },
        legend: { top: 30 },
        xAxis: { type: 'category', data: years, name: '持有年期' },
        yAxis: { type: 'value', name: '資產價值', axisLabel: { formatter: '{value}' } },
        series: series,
        markLine: {
            data: [{ yAxis: 0, name: '回本線', lineStyle: { color: 'red' } }]
        }
    });
}

// 繳費結構餅圖
function updatePieChart() {
    if (!pieChart) return;
    const product = selectedProducts.length > 0 
        ? productData.products.find(p => p.id === selectedProducts[0])
        : productData.products[0];
    
    pieChart.setOption({
        title: { text: `${product.name} 繳費結構`, left: 'center' },
        tooltip: { trigger: 'item' },
        series: [
            {
                name: '繳費結構',
                type: 'pie',
                radius: '50%',
                data: [
                    { value: product.total_premium, name: '已繳保費' },
                    { value: product.total_premium * (1 + product.guaranteed_return * 10), name: '保證收益' },
                    { value: product.total_premium * (1 + product.non_guaranteed_return * 10), name: '非保證收益' }
                ]
            }
        ]
    });
}

// 機會成本柱狀圖
function updateOpportunityChart() {
    if (!opportunityChart) return;
    const product = selectedProducts.length > 0 
        ? productData.products.find(p => p.id === selectedProducts[0])
        : productData.products[0];
    
    const tools = productData.investment_tools;
    opportunityChart.setOption({
        title: { text: '跨資產機會成本對比', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: tools.map(t => t.name) },
        yAxis: { type: 'value', name: '年化回報率', axisLabel: { formatter: '{value}%' } },
        series: [
            {
                name: '年化回報率',
                type: 'bar',
                data: tools.map(t => t.return_rate * 100),
                itemStyle: {
                    color: (params) => params.name === product.name ? '#1890ff' : '#ccc'
                }
            }
        ]
    });
}

// 風險對比雷達圖
function updateRiskChart() {
    if (!riskChart) return;
    const products = selectedProducts.length > 0 
        ? selectedProducts.map(id => productData.products.find(p => p.id === id))
        : productData.products.slice(0, 3);
    
    const riskScores = {
        "極低": 10,
        "低": 30,
        "中低": 50,
        "中": 70,
        "中高": 85,
        "高": 100
    };
    
    const liquidityScores = {
        "極高": 100,
        "高": 80,
        "中": 60,
        "低": 40,
        "極低": 20
    };
    
    riskChart.setOption({
        title: { text: '產品風險&流動性對比', left: 'center' },
        tooltip: { trigger: 'item' },
        radar: {
            indicator: [
                { name: '風險等級', max: 100 },
                { name: '流動性', max: 100 },
                { name: '回本速度', max: 100 },
                { name: '保證回報', max: 100 },
                { name: '融資靈活性', max: 100 }
            ]
        },
        series: products.map(p => ({
            name: p.name,
            type: 'radar',
            data: [
                { value: riskScores[p.risk_level], name: '風險等級' },
                { value: liquidityScores[p.liquidity], name: '流動性' },
                { value: 100 / p.break_year * 10, name: '回本速度' },
                { value: p.guaranteed_return * 1000, name: '保證回報' },
                { value: p.finance_support ? 100 : 0, name: '融資靈活性' }
            ]
        }))
    });
}

// 7. PDF報告導出
function initPDFExport() {
    document.getElementById('exportPDFBtn').onclick = exportPDFReport;
}

function exportPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 報告標題
    doc.setFontSize(20);
    doc.text('保險產品客戶報告', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`生成時間：${new Date().toLocaleString('zh-HK')}`, 105, 30, { align: 'center' });
    
    // 產品清單
    let y = 40;
    const products = selectedProducts.length > 0 
        ? selectedProducts.map(id => productData.products.find(p => p.id === id))
        : productData.products.slice(0, 5);
    
    doc.setFontSize(14);
    doc.text('產品清單', 20, y);
    y += 10;
    doc.setFontSize(10);
    products.forEach(p => {
        doc.text(`${p.name} | ${p.company} | 保證回報率：${(p.guaranteed_return * 100).toFixed(2)}% | IRR：${(p.irr * 100).toFixed(2)}%`, 20, y);
        y += 8;
    });
    
    // 融資壓力測試
    if (selectedProducts.some(id => productData.products.find(p => p.id === id).finance_support)) {
        y += 10;
        doc.setFontSize(14);
        doc.text('融資壓力測試', 20, y);
        y += 10;
        doc.setFontSize(10);
        selectedProducts.forEach(id => {
            const p = productData.products.find(p => p.id === id);
            if (p.finance_support) {
                const financeConfig = productData.finance_terms[p.company];
                doc.text(`${p.name} | 最高貸款額度：${(p.total_premium * financeConfig.loan_to_value).toLocaleString()} ${p.currency} | 基準利率：${(financeConfig.base_rate * 100).toFixed(2)}%`, 20, y);
                y += 8;
            }
        });
    }
    
    // 保存PDF
    doc.save(`保險產品報告_${new Date().toLocaleDateString('zh-HK')}.pdf`);
    console.log("📄 PDF報告導出完成");
}

// 輔助函數：顯示單個產品收益圖表
function showIncomeChart(productId) {
    selectedProducts = [productId];
    updateCharts();
    document.getElementById('chartModal').style.display = 'block';
}

// 清空標籤
function clearTags() {
    selectedTags = [];
    renderTagPanel();
    renderProductList();
    updateCharts();
}

// 頁面加載完成後綁定清空標籤事件
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('clearTagsBtn').onclick = clearTags;
});
