'use strict';

// Get the elements used by the application.
const balanceEl = document.getElementById('balance');
const incomeAmountEl = document.getElementById('income-amount');
const expenseAmountEl = document.getElementById('expense-amount');
const transactionListEl = document.getElementById('transaction-list');
const transactionFormEl = document.getElementById('transaction-form');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');

// Keep the same LocalStorage key used by the original project so existing data can be reused.
const STORAGE_KEY = 'transactions';

function loadTransactions() {
    try {
        const savedTransactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(savedTransactions)) return [];

        return savedTransactions
            .map((transaction, index) => ({
                id: transaction.id ?? (Date.now() + index),
                description: String(transaction.description ?? '').trim(),
                amount: Number(transaction.amount)
            }))
            .filter(transaction =>
                transaction.description.length > 0 && Number.isFinite(transaction.amount) && transaction.amount !== 0
            );
    } catch (error) {
        console.error('Could not read saved transactions:', error);
        return [];
    }
}

let transactions = loadTransactions();

transactionFormEl.addEventListener('submit', addTransaction);

function addTransaction(event) {
    event.preventDefault();

    const description = descriptionEl.value.trim();
    const amount = Number(amountEl.value);

    if (!description) {
        descriptionEl.focus();
        return;
    }

    if (amountEl.value.trim() === '' || !Number.isFinite(amount) || amount === 0) {
        alert('Enter an amount greater than or less than zero.');
        amountEl.focus();
        return;
    }

    transactions.push({
        id: createTransactionId(),
        description,
        amount
    });

    saveTransactions();
    renderApp();
    transactionFormEl.reset();
    descriptionEl.focus();
}

function createTransactionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error('Could not save transactions:', error);
        alert('The transaction could not be saved in this browser. Check the browser storage settings.');
    }
}

function updateTransactionList() {
    transactionListEl.replaceChildren();

    [...transactions].reverse().forEach(transaction => {
        transactionListEl.appendChild(createTransactionElement(transaction));
    });
}

function createTransactionElement(transaction) {
    const item = document.createElement('li');
    item.classList.add('transaction', transaction.amount > 0 ? 'income' : 'expense');

    const description = document.createElement('span');
    description.className = 'transaction-description';
    description.textContent = transaction.description;

    const amount = document.createElement('span');
    amount.className = 'transaction-amount';
    amount.textContent = formatCurrency(transaction.amount);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `Delete ${transaction.description}`);
    deleteButton.addEventListener('click', () => removeTransaction(transaction.id));

    item.append(description, amount, deleteButton);
    return item;
}

function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.amount > 0)
        .reduce((total, transaction) => total + transaction.amount, 0);

    // Show expenses as a positive total in the summary, matching the course example.
    const expenses = transactions
        .filter(transaction => transaction.amount < 0)
        .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    const balance = income - expenses;

    balanceEl.textContent = formatCurrency(balance);
    incomeAmountEl.textContent = formatCurrency(income);
    expenseAmountEl.textContent = formatCurrency(expenses);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderApp();
}

function renderApp() {
    updateTransactionList();
    updateSummary();
}

// Draw saved transactions and totals when the page opens.
renderApp();
