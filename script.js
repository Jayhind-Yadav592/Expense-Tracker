
// Global state
let transactions = [];
let currency = 'USD';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$'
};

const CATEGORIES = {
    food: { name: 'Food & Dining', color: '#FF6384', icon: '🍔' },
    transport: { name: 'Transportation', color: '#36A2EB', icon: '🚗' },
    shopping: { name: 'Shopping', color: '#FFCE56', icon: '🛍️' },
    entertainment: { name: 'Entertainment', color: '#4BC0C0', icon: '🎬' },
    bills: { name: 'Bills & Utilities', color: '#9966FF', icon: '📄' },
    health: { name: 'Healthcare', color: '#FF9F40', icon: '⚕️' },
    salary: { name: 'Salary', color: '#4CAF50', icon: '💼' },
    other: { name: 'Other', color: '#95A5A6', icon: '📦' }
};

// Initialize
function init() {
    loadData();
    updateUI();
}

// Load data from localStorage
function loadData() {
    const savedTransactions = localStorage.getItem('transactions');
    const savedCurrency = localStorage.getItem('currency');

    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }

    if (savedCurrency) {
        currency = savedCurrency;
        document.getElementById('currencySelect').value = currency;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('currency', currency);
}

// Show view
function showView(view) {
    // Hide all views
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected view
    const viewMap = {
        'dashboard': 'dashboardView',
        'add': 'addView',
        'history': 'historyView',
        'settings': 'settingsView'
    };

    document.getElementById(viewMap[view]).classList.add('active');
    event.target.classList.add('active');

    updateUI();
}

// Add transaction
function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.querySelector('input[name="type"]:checked').value;

    if (!description || !amount) {
        alert('Please fill all fields!');
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        category,
        type,
        date: new Date().toISOString()
    };

    transactions.unshift(transaction);
    saveData();

    // Clear form
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';

    // Show history
    showView('history');
    updateUI();
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateUI();
}

// Change currency
function changeCurrency() {
    currency = document.getElementById('currencySelect').value;
    saveData();
    updateUI();
}

// Calculate totals
function calculateTotals() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
}

// Update UI
function updateUI() {
    const symbol = CURRENCIES[currency];
    const { income, expense, balance } = calculateTotals();

    // Update currency display
    document.getElementById('currencyDisplay').textContent = `${symbol} ${currency}`;
    document.getElementById('currencySymbol').textContent = symbol;

    // Update summary cards
    document.getElementById('totalIncome').textContent = `${symbol}${income.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `${symbol}${expense.toFixed(2)}`;
    document.getElementById('balance').textContent = `${symbol}${balance.toFixed(2)}`;

    // Update balance card color
    const balanceCard = document.getElementById('balanceCard');
    if (balance < 0) {
        balanceCard.classList.add('negative');
    } else {
        balanceCard.classList.remove('negative');
    }

    // Update category chart
    updateCategoryChart(symbol, expense);

    // Update monthly summary
    updateMonthlySummary(symbol);

    // Update transaction history
    updateTransactionHistory(symbol);
}

// Update category chart
function updateCategoryChart(symbol, totalExpense) {
    const categoryData = {};

    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (!categoryData[t.category]) {
                categoryData[t.category] = 0;
            }
            categoryData[t.category] += t.amount;
        });

    const chartHTML = Object.keys(categoryData).length > 0
        ? Object.keys(categoryData).map(cat => {
            const amount = categoryData[cat];
            const percentage = (amount / totalExpense) * 100;
            return `
    <div class="category-item">
        <div class="category-left">
            <div class="category-color" style="background-color: ${CATEGORIES[cat].color}"></div>
            <span>${CATEGORIES[cat].name}</span>
        </div>
        <div class="category-right">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%; background-color: ${CATEGORIES[cat].color}"></div>
            </div>
            <span class="category-amount">${symbol}${amount.toFixed(2)}</span>
        </div>
    </div>
    `;
        }).join('')
        : '<div class="empty-state">No expenses yet</div>';

    document.getElementById('categoryChart').innerHTML = chartHTML;
}

// Update monthly summary
function updateMonthlySummary(symbol) {
    const months = {};

    transactions.forEach(t => {
        const date = new Date(t.date);
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!months[month]) {
            months[month] = { income: 0, expense: 0 };
        }

        months[month][t.type] += t.amount;
    });

    const monthlyHTML = Object.keys(months).length > 0
        ? Object.keys(months).slice(0, 6).map(month => {
            const data = months[month];
            const net = data.income - data.expense;
            return `
    <div class="monthly-item">
        <div class="monthly-month">${month}</div>
        <div class="monthly-details">
            <div class="monthly-income">
                Income: <strong>${symbol}${data.income.toFixed(2)}</strong>
            </div>
            <div class="monthly-expense">
                Expense: <strong>${symbol}${data.expense.toFixed(2)}</strong>
            </div>
            <div class="monthly-net" style="color: ${net >= 0 ? '#059669' : '#dc2626'}">
                Net: <strong>${symbol}${net.toFixed(2)}</strong>
            </div>
        </div>
    </div>
    `;
        }).join('')
        : '<div class="empty-state">No data yet</div>';

    document.getElementById('monthlySummary').innerHTML = monthlyHTML;
}

// Update transaction history
function updateTransactionHistory(symbol) {
    const historyHTML = transactions.length > 0
        ? transactions.map(t => {
            const date = new Date(t.date).toLocaleDateString();
            return `
    <div class="transaction-item">
        <div class="transaction-left">
            <div class="transaction-icon ${t.type}">
                ${CATEGORIES[t.category].icon}
            </div>
            <div>
                <div class="transaction-title">${t.description}</div>
                <div class="transaction-meta">${CATEGORIES[t.category].name} • ${date}</div>
            </div>
        </div>
        <div class="transaction-right">
            <span class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}${symbol}${t.amount.toFixed(2)}
            </span>
            <button class="delete-btn" onclick="deleteTransaction(${t.id})">🗑️</button>
        </div>
    </div>
    `;
        }).join('')
        : '<div class="empty-state">No transactions yet</div>';

    document.getElementById('transactionList').innerHTML = historyHTML;
}

// Initialize on load
init();
