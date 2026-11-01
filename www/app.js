
const pageTitle = document.getElementById("pageTitle");
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".page-section");

const form = document.getElementById("transactionForm");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");
const categorySelect = document.getElementById("categorySelect");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");

const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoryKindInput = document.getElementById("categoryKind");
const categorySubmitBtn = document.getElementById("categorySubmitBtn");
const categoryCancelBtn = document.getElementById("categoryCancelBtn");
const categoriesTable = document.getElementById("categoriesTable");

const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");

const totalIncomeEl = document.getElementById("totalIncome");
const totalFixedEl = document.getElementById("totalFixed");
const totalVariableEl = document.getElementById("totalVariable");
const savingsBalanceEl = document.getElementById("savingsBalance");
const transactionTable = document.getElementById("transactionTable");
const monthlyDetailTable = document.getElementById("monthlyDetailTable");
const exportBtn = document.getElementById("exportBtn");

const analyticsCards = document.getElementById("analyticsCards");
const analyticsCategoryTable = document.getElementById("analyticsCategoryTable");
const insightsList = document.getElementById("insightsList");
const ruleTable = document.getElementById("ruleTable");
const comparisonTable = document.getElementById("comparisonTable");
const averageTable = document.getElementById("averageTable");
const projectionTable = document.getElementById("projectionTable");
const alertsList = document.getElementById("alertsList");
const suggestionsList = document.getElementById("suggestionsList");
const paretoTable = document.getElementById("paretoTable");
const categoryVarianceTable = document.getElementById("categoryVarianceTable");
const recurringTable = document.getElementById("recurringTable");
const variableAnalysisTable = document.getElementById("variableAnalysisTable");
const categoryMatrixHead = document.getElementById("categoryMatrixHead");
const categoryMatrixBody = document.getElementById("categoryMatrixBody");
const financialScoreBox = document.getElementById("financialScoreBox");
const scoreBreakdownTable = document.getElementById("scoreBreakdownTable");
const dataQualityTable = document.getElementById("dataQualityTable");
const optimizationTable = document.getElementById("optimizationTable");

let monthlyChart = null;
let chartsMonthlyChart = null;
let yearlyChart = null;
let categoryReportChart = null;
let expenseTrendChart = null;
let paretoChart = null;
let categoryShareChart = null;
let fixedVariableStackedChart = null;
let cumulativeSavingsChart = null;
let cumulativeExpensesChart = null;
let incomeExpenseRatioChart = null;
let ruleScoreChart = null;

let transactionsCache = [];
let categoriesCache = [];
let editingTransactionId = null;
let editingCategoryId = null;

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const isMobile = () => window.innerWidth <= 520;

const apiGetDB = () => Data.getDB();
const apiCreateTransaction = transaction => Data.createTransaction(transaction);
const apiUpdateTransaction = (id, transaction) => Data.updateTransaction(id, transaction);
const apiDeleteTransaction = id => Data.deleteTransaction(id);
const apiCreateCategory = category => Data.createCategory(category);
const apiUpdateCategory = (id, category) => Data.updateCategory(id, category);
const apiDeleteCategory = id => Data.deleteCategory(id);

async function refreshData() {
  const db = await apiGetDB();
  transactionsCache = db.transactions || [];
  categoriesCache = db.categories || [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value || 0);
}

function pct(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
}

function getCurrentDateValue() {
  return new Date().toISOString().split("T")[0];
}

function getDateParts(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  };
}

function getMonth(dateString) {
  return getDateParts(dateString).month;
}

function getYear(dateString) {
  return getDateParts(dateString).year;
}

function getLastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildMonthlyDate(originalDate, targetYear, targetMonth) {
  const originalDay = getDateParts(originalDate).day;
  const lastDay = getLastDayOfMonth(targetYear, targetMonth);
  const validDay = Math.min(originalDay, lastDay);

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`;
}

function isSameOrAfterMonth(targetYear, targetMonth, startDate) {
  const start = getDateParts(startDate);
  return targetYear > start.year || (targetYear === start.year && targetMonth >= start.month);
}

function getTypeLabel(type) {
  const labels = {
    income: "Ingreso",
    fixed: "Gasto fijo",
    variable: "Gasto variable",
    savings: "Ahorro"
  };

  return labels[type] || type;
}

function getCategoryName(categoryId) {
  const category = categoriesCache.find(item => item.id === categoryId);
  return category ? category.name : "Sin categoría";
}

function setupFilters() {
  const currentYear = new Date().getFullYear();

  monthFilter.innerHTML = "";
  yearFilter.innerHTML = "";

  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    monthFilter.appendChild(option);
  });

  const years = new Set(transactionsCache.map(item => getYear(item.date)));
  years.add(currentYear);

  Array.from(years).sort((a, b) => b - a).forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  monthFilter.value = new Date().getMonth();
  yearFilter.value = currentYear;
}

function setupYearFilterIfNeeded() {
  const selectedYear = yearFilter.value;
  const years = new Set(transactionsCache.map(item => String(getYear(item.date))));
  years.add(String(new Date().getFullYear()));

  if (!years.has(selectedYear)) years.add(selectedYear);

  const currentOptions = Array.from(yearFilter.options).map(option => option.value);
  const newOptions = Array.from(years).sort((a, b) => Number(b) - Number(a));

  if (JSON.stringify(currentOptions) !== JSON.stringify(newOptions)) {
    yearFilter.innerHTML = "";

    newOptions.forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });

    yearFilter.value = selectedYear;
  }
}

function renderCategoryOptions() {
  const selectedType = typeInput.value;
  const selectedValue = categorySelect.value;

  const categories = categoriesCache
    .filter(category => category.kind === selectedType)
    .sort((a, b) => a.name.localeCompare(b.name));

  categorySelect.innerHTML = "";

  if (categories.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Primero crea una categoría";
    categorySelect.appendChild(option);
    return;
  }

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  if (categories.some(category => category.id === selectedValue)) {
    categorySelect.value = selectedValue;
  }
}

function getTransactionsForMonth(year, month) {
  const normalTransactions = transactionsCache.filter(item => {
    if (item.type === "fixed") return false;
    if (item.type === "fixed_override") return false;
    if (item.type === "fixed_deleted") return false;
    return getMonth(item.date) === month && getYear(item.date) === year;
  });

  const recurringFixedExpenses = transactionsCache
    .filter(item => item.type === "fixed")
    .filter(item => isSameOrAfterMonth(year, month, item.date))
    .map(item => {
      const deletedMarker = getDeletedRecurringMarker(item.id, year, month);
      if (deletedMarker) return null;

      const override = getRecurringOverride(item.id, year, month);

      if (override) {
        return {
          ...override,
          originalId: item.id,
          id: override.id,
          date: override.date,
          type: "fixed_override",
          isGeneratedFixed: true,
          isMonthlyOverride: true,
          description: override.description || "Gasto fijo recurrente modificado para este mes"
        };
      }

      return {
        ...item,
        originalId: item.id,
        id: `${item.id}-${year}-${month}`,
        date: buildMonthlyDate(item.date, year, month),
        isGeneratedFixed: true,
        isMonthlyOverride: false,
        description: item.description || "Gasto fijo recurrente"
      };
    })
    .filter(Boolean);

  return [...normalTransactions, ...recurringFixedExpenses];
}

function getFilteredTransactions() {
  return getTransactionsForMonth(Number(yearFilter.value), Number(monthFilter.value));
}

function calculateTotals(transactions) {
  return transactions.reduce(
    (totals, item) => {
      if (item.type === "income") totals.income += item.amount;
      if (item.type === "fixed") totals.fixed += item.amount;
      if (item.type === "variable") totals.variable += item.amount;

      totals.expenses = totals.fixed + totals.variable;
      totals.savings = totals.income - totals.expenses;

      return totals;
    },
    { income: 0, fixed: 0, variable: 0, expenses: 0, savings: 0 }
  );
}

function getYearlyTotals(year = Number(yearFilter.value)) {
  return monthNames.map((month, index) => {
    const totals = calculateTotals(getTransactionsForMonth(year, index));

    return {
      month,
      income: totals.income,
      fixed: totals.fixed,
      variable: totals.variable,
      expenses: totals.expenses,
      savings: totals.savings
    };
  });
}

function getPreviousMonthInfo() {
  let year = Number(yearFilter.value);
  let month = Number(monthFilter.value) - 1;

  if (month < 0) {
    month = 11;
    year -= 1;
  }

  return {
    year,
    month,
    transactions: getTransactionsForMonth(year, month)
  };
}

function updateSummary() {
  const totals = calculateTotals(getFilteredTransactions());

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalFixedEl.textContent = formatCurrency(totals.fixed);
  totalVariableEl.textContent = formatCurrency(totals.variable);
  savingsBalanceEl.textContent = formatCurrency(totals.savings);
}

function groupByCategory(transactions, includeIncome = false) {
  const grouped = {};

  transactions.forEach(item => {
    if (!includeIncome && item.type === "income") return;

    const name = getCategoryName(item.categoryId);
    const key = item.categoryId || name;

    if (!grouped[key]) {
      grouped[key] = {
        category: name,
        type: item.type,
        amount: 0,
        count: 0
      };
    }

    grouped[key].amount += item.amount;
    grouped[key].count += 1;
  });

  return Object.values(grouped).sort((a, b) => b.amount - a.amount);
}

function renderMonthlyDetailTable() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);

  const rows = transactions.map(item => ({
    amount: item.amount,
    category: getCategoryName(item.categoryId),
    description: item.description || "-",
    type: item.type,
    originalId: item.originalId || item.id
  }));

  rows.push({
    amount: totals.savings,
    category: "Saldo restante",
    description: "Ahorro del mes",
    type: "savings",
    originalId: null
  });

  monthlyDetailTable.innerHTML = "";

  if (rows.length === 0) {
    monthlyDetailTable.innerHTML = '<tr><td colspan="5">No hay información para mostrar.</td></tr>';
    return;
  }

  rows
    .sort((a, b) => {
      const order = { income: 1, fixed: 2, variable: 3, savings: 4 };
      return order[a.type] - order[b.type];
    })
    .forEach(item => {
      const row = document.createElement("tr");

      if (item.type === "income") row.classList.add("income-row");
      if (item.type === "fixed" || item.type === "variable") row.classList.add("expense-row");
      if (item.type === "savings") row.classList.add("savings-row");

      const action = item.type === "fixed"
        ? `<button class="edit" data-edit-transaction-id="${item.originalId}">Editar</button>`
        : "-";

      row.innerHTML = `
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.category}</td>
        <td>${item.description}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${action}</td>
      `;

      monthlyDetailTable.appendChild(row);
    });
}

function renderTransactionTable() {
  const transactions = getFilteredTransactions();
  transactionTable.innerHTML = "";

  if (transactions.length === 0) {
    transactionTable.innerHTML = '<tr><td colspan="6">No hay movimientos registrados para este mes.</td></tr>';
    return;
  }

  transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(item => {
      const row = document.createElement("tr");
      const deleteId = item.isGeneratedFixed ? item.originalId : item.id;
      const deleteText = item.isGeneratedFixed ? "Eliminar serie" : "Eliminar";
      const description = item.isGeneratedFixed
        ? `${item.description || "-"} · Recurrente`
        : item.description || "-";

      row.innerHTML = `
        <td>${item.date}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${getCategoryName(item.categoryId)}</td>
        <td>${description}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td><button class="danger" data-delete-transaction-id="${deleteId}">${deleteText}</button></td>
      `;

      transactionTable.appendChild(row);
    });
}

function renderCategoriesTable() {
  categoriesTable.innerHTML = "";

  if (categoriesCache.length === 0) {
    categoriesTable.innerHTML = '<tr><td colspan="4">No hay categorías registradas.</td></tr>';
    return;
  }

  categoriesCache
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
    .forEach(category => {
      const usage = transactionsCache.filter(transaction => transaction.categoryId === category.id).length;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${category.name}</td>
        <td>${getTypeLabel(category.kind)}</td>
        <td>${usage} movimiento(s)</td>
        <td>
          <button class="edit" data-edit-category-id="${category.id}">Editar</button>
          <button class="danger" data-delete-category-id="${category.id}">Eliminar</button>
        </td>
      `;

      categoriesTable.appendChild(row);
    });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile() ? "bottom" : "top",
        labels: {
          boxWidth: isMobile() ? 12 : 40
        }
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label || context.label}: ${formatCurrency(context.raw)}`
        }
      }
    }
  };
}

function renderMonthlyChartIn(canvasId, name) {
  const totals = calculateTotals(getFilteredTransactions());
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (name === "monthly" && monthlyChart) monthlyChart.destroy();
  if (name === "chartsMonthly" && chartsMonthlyChart) chartsMonthlyChart.destroy();

  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Gastos fijos", "Gastos variables", "Ahorro"],
      datasets: [{
        label: "Monto",
        data: [
          Math.max(totals.fixed, 0),
          Math.max(totals.variable, 0),
          Math.max(totals.savings, 0)
        ]
      }]
    },
    options: chartOptions()
  });

  if (name === "monthly") monthlyChart = chart;
  if (name === "chartsMonthly") chartsMonthlyChart = chart;
}

function renderCategoryReportChart() {
  const grouped = groupByCategory(getFilteredTransactions(), false);
  const canvas = document.getElementById("categoryReportChart");
  if (!canvas) return;

  if (categoryReportChart) categoryReportChart.destroy();

  categoryReportChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: grouped.map(item => item.category),
      datasets: [{
        label: "Gasto por categoría",
        data: grouped.map(item => item.amount)
      }]
    },
    options: {
      ...chartOptions(),
      indexAxis: grouped.length > 4 || isMobile() ? "y" : "x",
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    }
  });
}

function renderYearlyChart() {
  const data = getYearlyTotals();
  const canvas = document.getElementById("yearlyChart");
  if (!canvas) return;

  if (yearlyChart) yearlyChart.destroy();

  yearlyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Ingresos", data: data.map(item => item.income) },
        { label: "Fijos", data: data.map(item => item.fixed) },
        { label: "Variables", data: data.map(item => item.variable) },
        { label: "Ahorro", data: data.map(item => item.savings) }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderExpenseTrendChart() {
  const data = getYearlyTotals();
  const canvas = document.getElementById("expenseTrendChart");
  if (!canvas) return;

  if (expenseTrendChart) expenseTrendChart.destroy();

  expenseTrendChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Gastos", data: data.map(item => item.expenses), tension: 0.25 },
        { label: "Ahorro", data: data.map(item => item.savings), tension: 0.25 }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function rowClassByStatus(status) {
  if (status === "OK") return "good";
  if (status === "Revisar") return "warning";
  return "danger-text";
}

function renderAnalytics() {
  if (!analyticsCards || !analyticsCategoryTable || !ruleTable || !comparisonTable || !averageTable || !projectionTable || !alertsList || !suggestionsList || !insightsList) return;
  const selectedYear = Number(yearFilter.value);
  const selectedMonth = Number(monthFilter.value);

  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);
  const previous = calculateTotals(getPreviousMonthInfo().transactions);
  const grouped = groupByCategory(transactions, false);
  const groupedPrevious = groupByCategory(getPreviousMonthInfo().transactions, false);
  const top = grouped[0];

  const savingsRate = totals.income > 0 ? (totals.savings / totals.income) * 100 : 0;
  const expenseRate = totals.income > 0 ? (totals.expenses / totals.income) * 100 : 0;
  const fixedRate = totals.expenses > 0 ? (totals.fixed / totals.expenses) * 100 : 0;
  const variableRate = totals.expenses > 0 ? (totals.variable / totals.expenses) * 100 : 0;

  const yearly = getYearlyTotals();
  const activeMonths = yearly.filter(item => item.income || item.expenses || item.savings);
  const monthsCount = Math.max(activeMonths.length, 1);

  const yearIncome = yearly.reduce((sum, item) => sum + item.income, 0);
  const yearFixed = yearly.reduce((sum, item) => sum + item.fixed, 0);
  const yearVariable = yearly.reduce((sum, item) => sum + item.variable, 0);
  const yearExpenses = yearly.reduce((sum, item) => sum + item.expenses, 0);
  const yearSavings = yearly.reduce((sum, item) => sum + item.savings, 0);

  const avgIncome = yearIncome / monthsCount;
  const avgFixed = yearFixed / monthsCount;
  const avgVariable = yearVariable / monthsCount;
  const avgExpenses = yearExpenses / monthsCount;
  const avgSavings = yearSavings / monthsCount;

  const variableTransactions = transactions.filter(item => item.type === "variable");
  const fixedTransactions = transactions.filter(item => item.type === "fixed");
  const incomeTransactions = transactions.filter(item => item.type === "income");
  const avgVariableTicket = variableTransactions.length ? totals.variable / variableTransactions.length : 0;
  const maxVariable = variableTransactions.length ? Math.max(...variableTransactions.map(item => item.amount)) : 0;
  const minVariable = variableTransactions.length ? Math.min(...variableTransactions.map(item => item.amount)) : 0;
  const dailyBurn = totals.expenses / 30;

  analyticsCards.innerHTML = `
    <div class="analytics-card"><h4>Tasa de ahorro</h4><p>${pct(savingsRate)}</p><small>Ahorro / ingresos</small></div>
    <div class="analytics-card"><h4>Tasa de gasto</h4><p>${pct(expenseRate)}</p><small>Gastos / ingresos</small></div>
    <div class="analytics-card"><h4>Fijos sobre gastos</h4><p>${pct(fixedRate)}</p><small>Compromisos recurrentes</small></div>
    <div class="analytics-card"><h4>Variables sobre gastos</h4><p>${pct(variableRate)}</p><small>Gastos ajustables</small></div>
    <div class="analytics-card"><h4>Gasto diario estimado</h4><p>${formatCurrency(dailyBurn)}</p><small>Gasto mensual / 30</small></div>
    <div class="analytics-card"><h4>Ahorro proyectado</h4><p>${formatCurrency(avgSavings * 12)}</p><small>Promedio anualizado</small></div>
    <div class="analytics-card"><h4>Categoría dominante</h4><p>${top ? top.category : "-"}</p><small>${top ? formatCurrency(top.amount) : "Sin datos"}</small></div>
    <div class="analytics-card"><h4>Movimientos del mes</h4><p>${transactions.length}</p><small>${incomeTransactions.length} ingresos, ${fixedTransactions.length} fijos, ${variableTransactions.length} variables</small></div>
  `;

  // Top category table
  analyticsCategoryTable.innerHTML = "";
  if (grouped.length === 0) {
    analyticsCategoryTable.innerHTML = '<tr><td colspan="5">No hay gastos para analizar.</td></tr>';
  } else {
    grouped.forEach(item => {
      const percentIncome = totals.income > 0 ? (item.amount / totals.income) * 100 : 0;
      const percentExpense = totals.expenses > 0 ? (item.amount / totals.expenses) * 100 : 0;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.category}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${pct(percentIncome)}</td>
        <td>${pct(percentExpense)}</td>
      `;
      analyticsCategoryTable.appendChild(row);
    });
  }

  // Rule 50/30/20
  ruleTable.innerHTML = "";
  [
    { name: "Necesidades / fijos", amount: totals.fixed, value: totals.income > 0 ? totals.fixed / totals.income * 100 : 0, goal: "≤ 50%", limit: 50, mode: "max" },
    { name: "Variables", amount: totals.variable, value: totals.income > 0 ? totals.variable / totals.income * 100 : 0, goal: "≤ 30%", limit: 30, mode: "max" },
    { name: "Ahorro", amount: totals.savings, value: savingsRate, goal: "≥ 20%", limit: 20, mode: "min" }
  ].forEach(item => {
    const status = item.mode === "max"
      ? (item.value <= item.limit ? "OK" : "Revisar")
      : (item.value >= item.limit ? "OK" : "Bajo");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${pct(item.value)}</td>
      <td>${item.goal}</td>
      <td class="${rowClassByStatus(status)}">${status}</td>
    `;
    ruleTable.appendChild(row);
  });

  // Comparison
  comparisonTable.innerHTML = "";
  [
    ["Ingresos", totals.income, previous.income],
    ["Gastos fijos", totals.fixed, previous.fixed],
    ["Gastos variables", totals.variable, previous.variable],
    ["Gastos totales", totals.expenses, previous.expenses],
    ["Ahorro", totals.savings, previous.savings]
  ].forEach(([name, current, old]) => {
    const diff = current - old;
    const change = old !== 0 ? (diff / old) * 100 : 0;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${formatCurrency(current)}</td>
      <td>${formatCurrency(old)}</td>
      <td class="${diff > 0 ? "warning" : diff < 0 ? "good" : ""}">${formatCurrency(diff)}</td>
      <td>${old === 0 ? "-" : pct(change)}</td>
    `;
    comparisonTable.appendChild(row);
  });

  // Averages
  averageTable.innerHTML = "";
  [
    ["Ingresos", avgIncome, yearIncome],
    ["Gastos fijos", avgFixed, yearFixed],
    ["Gastos variables", avgVariable, yearVariable],
    ["Gastos totales", avgExpenses, yearExpenses],
    ["Ahorro", avgSavings, yearSavings]
  ].forEach(([name, avg, total]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td><td>${formatCurrency(avg)}</td><td>${formatCurrency(total)}</td>`;
    averageTable.appendChild(row);
  });

  // Projection
  projectionTable.innerHTML = "";
  [
    ["Ingresos", avgIncome * 12, "Estimado según tus meses con datos"],
    ["Gastos", avgExpenses * 12, "Proyección de salida anual"],
    ["Ahorro", avgSavings * 12, avgSavings >= 0 ? "Vas en positivo si mantienes el ritmo" : "Riesgo de cerrar el año en negativo"],
    ["Gastos variables", avgVariable * 12, "Área con mayor capacidad de ajuste"]
  ].forEach(([name, value, comment]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td><td>${formatCurrency(value)}</td><td>${comment}</td>`;
    projectionTable.appendChild(row);
  });

  // Pareto table
  if (!paretoTable || !categoryVarianceTable || !recurringTable || !variableAnalysisTable || !categoryMatrixHead || !categoryMatrixBody || !financialScoreBox || !scoreBreakdownTable || !dataQualityTable || !optimizationTable) return;
  paretoTable.innerHTML = "";
  let cumulative = 0;
  let cumulativePareto = 0;
  if (grouped.length === 0) {
    paretoTable.innerHTML = '<tr><td colspan="6">No hay gastos para calcular Pareto.</td></tr>';
  } else {
    grouped.forEach((item, index) => {
      const share = totals.expenses > 0 ? item.amount / totals.expenses * 100 : 0;
      cumulative += share;
      cumulativePareto = cumulative;
      const priority = index < 3 || cumulative <= 80 ? "Alta" : cumulative <= 95 ? "Media" : "Baja";
      const priorityClass = priority === "Alta" ? "priority-high" : priority === "Media" ? "priority-medium" : "priority-low";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.category}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${pct(share)}</td>
        <td>${pct(cumulative)}</td>
        <td class="${priorityClass}">${priority}</td>
      `;
      paretoTable.appendChild(row);
    });
  }

  // Category variance
  categoryVarianceTable.innerHTML = "";
  const categoryNames = new Set([...grouped.map(item => item.category), ...groupedPrevious.map(item => item.category)]);
  if (categoryNames.size === 0) {
    categoryVarianceTable.innerHTML = '<tr><td colspan="5">No hay categorías para comparar.</td></tr>';
  } else {
    Array.from(categoryNames).forEach(category => {
      const current = grouped.find(item => item.category === category)?.amount || 0;
      const old = groupedPrevious.find(item => item.category === category)?.amount || 0;
      const diff = current - old;
      const change = old !== 0 ? diff / old * 100 : 0;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${category}</td>
        <td>${formatCurrency(current)}</td>
        <td>${formatCurrency(old)}</td>
        <td class="${diff > 0 ? "warning" : diff < 0 ? "good" : ""}">${formatCurrency(diff)}</td>
        <td>${old === 0 ? "-" : pct(change)}</td>
      `;
      categoryVarianceTable.appendChild(row);
    });
  }

  // Recurring commitments
  recurringTable.innerHTML = "";
  const recurring = transactionsCache
    .filter(item => item.type === "fixed")
    .sort((a, b) => getDateParts(a.date).day - getDateParts(b.date).day);

  if (recurring.length === 0) {
    recurringTable.innerHTML = '<tr><td colspan="4">No hay gastos fijos recurrentes registrados.</td></tr>';
  } else {
    recurring.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${getDateParts(item.date).day}</td>
        <td>${getCategoryName(item.categoryId)}</td>
        <td>${item.description || "-"}</td>
        <td>${formatCurrency(item.amount)}</td>
      `;
      recurringTable.appendChild(row);
    });
  }

  // Variable analysis
  variableAnalysisTable.innerHTML = "";
  [
    ["Cantidad de gastos variables", variableTransactions.length, "Frecuencia de consumo flexible"],
    ["Ticket promedio variable", formatCurrency(avgVariableTicket), "Promedio por movimiento variable"],
    ["Gasto variable más alto", formatCurrency(maxVariable), "Mayor salida flexible del mes"],
    ["Gasto variable más bajo", formatCurrency(minVariable), "Menor salida flexible del mes"],
    ["Variables sobre ingreso", pct(totals.income > 0 ? totals.variable / totals.income * 100 : 0), "Meta sugerida: máximo 30%"]
  ].forEach(([metric, value, reading]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${metric}</td><td>${value}</td><td>${reading}</td>`;
    variableAnalysisTable.appendChild(row);
  });

  // Category matrix by year
  categoryMatrixHead.innerHTML = "";
  categoryMatrixBody.innerHTML = "";
  const expenseCategories = categoriesCache
    .filter(category => category.kind !== "income")
    .sort((a, b) => a.name.localeCompare(b.name));

  categoryMatrixHead.innerHTML = `
    <tr>
      <th>Categoría</th>
      ${monthNames.map(month => `<th>${month.slice(0, 3)}</th>`).join("")}
      <th>Total</th>
    </tr>
  `;

  if (expenseCategories.length === 0) {
    categoryMatrixBody.innerHTML = '<tr><td colspan="14">No hay categorías de gasto.</td></tr>';
  } else {
    expenseCategories.forEach(category => {
      const monthlyAmounts = monthNames.map((_, monthIndex) => {
        return getTransactionsForMonth(selectedYear, monthIndex)
          .filter(item => item.categoryId === category.id && item.type !== "income")
          .reduce((sum, item) => sum + item.amount, 0);
      });
      const total = monthlyAmounts.reduce((sum, value) => sum + value, 0);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${category.name}</td>
        ${monthlyAmounts.map(value => `<td>${value ? formatCurrency(value) : "-"}</td>`).join("")}
        <td><strong>${formatCurrency(total)}</strong></td>
      `;
      categoryMatrixBody.appendChild(row);
    });
  }

  // Financial score
  let score = 100;
  const scoreFactors = [];

  function addScoreFactor(name, result, impact, penalty) {
    score -= penalty;
    scoreFactors.push({ name, result, impact });
  }

  if (totals.income === 0) addScoreFactor("Ingresos registrados", "Sin ingresos este mes", "Alto", 25);
  if (totals.savings < 0) addScoreFactor("Ahorro", "Ahorro negativo", "Alto", 30);
  if (savingsRate < 20 && totals.income > 0) addScoreFactor("Tasa de ahorro", `Solo ${pct(savingsRate)}`, "Medio", 15);
  if (expenseRate > 80) addScoreFactor("Tasa de gasto", `${pct(expenseRate)} del ingreso`, "Medio", 12);
  if (fixedRate > 60) addScoreFactor("Gastos fijos", `${pct(fixedRate)} del gasto total`, "Medio", 10);
  if (top && totals.expenses > 0 && top.amount / totals.expenses * 100 > 50) addScoreFactor("Concentración", `Más del 50% en ${top.category}`, "Medio", 8);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const scoreClass = score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-danger";
  const scoreLabel = score >= 75 ? "Saludable" : score >= 50 ? "Revisar" : "Riesgo alto";

  financialScoreBox.innerHTML = `
    <p class="score-number ${scoreClass}">${score}/100</p>
    <p class="score-label ${scoreClass}">${scoreLabel}</p>
  `;

  scoreBreakdownTable.innerHTML = "";
  if (scoreFactors.length === 0) {
    scoreBreakdownTable.innerHTML = '<tr><td colspan="3">No se detectaron factores negativos fuertes.</td></tr>';
  } else {
    scoreFactors.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${item.name}</td><td>${item.result}</td><td>${item.impact}</td>`;
      scoreBreakdownTable.appendChild(row);
    });
  }

  // Data quality
  const allYearTransactions = [];
  monthNames.forEach((_, index) => {
    allYearTransactions.push(...getTransactionsForMonth(selectedYear, index));
  });

  const missingDescription = transactionsCache.filter(item => !item.description || !item.description.trim()).length;
  const zeroAmounts = transactionsCache.filter(item => Number(item.amount) <= 0).length;
  const categoriesWithoutUse = categoriesCache.filter(category => !transactionsCache.some(item => item.categoryId === category.id)).length;

  dataQualityTable.innerHTML = "";
  [
    ["Movimientos sin descripción", missingDescription, "Agrega descripciones para mejores reportes."],
    ["Movimientos con monto cero", zeroAmounts, "Corrige o elimina registros inválidos."],
    ["Categorías sin uso", categoriesWithoutUse, "Elimina o consolida categorías que no usas."],
    ["Meses con datos en el año", activeMonths.length, "Mientras más meses registres, mejores serán las proyecciones."]
  ].forEach(([check, result, suggestion]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${check}</td><td>${result}</td><td>${suggestion}</td>`;
    dataQualityTable.appendChild(row);
  });

  // Optimization plan
  optimizationTable.innerHTML = "";
  const targetSavings = totals.income * 0.20;
  const gap = Math.max(0, targetSavings - totals.savings);
  const adjustable = grouped.filter(item => item.type === "variable");
  if (gap <= 0) {
    optimizationTable.innerHTML = '<tr><td colspan="4">Ya cumples o superas una meta de ahorro del 20% este mes.</td></tr>';
  } else if (adjustable.length === 0) {
    optimizationTable.innerHTML = '<tr><td colspan="4">No hay gastos variables para sugerir reducción.</td></tr>';
  } else {
    const totalAdjustable = adjustable.reduce((sum, item) => sum + item.amount, 0);
    adjustable.slice(0, 5).forEach(item => {
      const proportionalCut = totalAdjustable > 0 ? gap * (item.amount / totalAdjustable) : 0;
      const safeCut = Math.min(item.amount * 0.25, proportionalCut);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.category}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${formatCurrency(safeCut)}</td>
        <td>${formatCurrency(Math.max(0, item.amount - safeCut))}</td>
      `;
      optimizationTable.appendChild(row);
    });
  }

  // Alerts, suggestions, insights
  const alerts = [];
  const suggestions = [];
  const insights = [];

  if (totals.income === 0) alerts.push("No hay ingresos registrados este mes; los porcentajes no serán totalmente útiles.");
  if (totals.savings < 0) alerts.push("Tus gastos superan tus ingresos: hay ahorro negativo.");
  if (expenseRate > 80) alerts.push("Tus gastos consumen más del 80% de tus ingresos.");
  if (fixedRate > 60) alerts.push("Tus gastos fijos pesan más del 60% de tus gastos totales.");
  if (top && totals.income > 0 && top.amount / totals.income * 100 > 35) alerts.push(`La categoría "${top.category}" supera el 35% de tus ingresos.`);
  if (grouped.length > 0 && cumulativePareto > 80 && grouped.length <= 3) alerts.push("Tus gastos están muy concentrados en pocas categorías.");

  if (totals.variable > totals.fixed) suggestions.push("Crea límites semanales para tus gastos variables; son el área con más oportunidad de ajuste.");
  if (savingsRate < 20 && totals.income > 0) suggestions.push("Automatiza el ahorro al inicio del mes para acercarte al 20%.");
  if (top) suggestions.push(`Revisa "${top.category}": es tu mayor salida y puede ser el mejor punto para optimizar.`);
  if (previous.expenses > 0 && totals.expenses > previous.expenses) suggestions.push("Tus gastos subieron vs el mes anterior; revisa la tabla de variación por categoría.");
  if (recurring.length > 0) suggestions.push("Revisa tus compromisos recurrentes cada 3 meses: suelen tener oportunidades de reducción.");
  if (missingDescription > 0) suggestions.push("Agrega descripciones a tus movimientos para mejorar la calidad del análisis.");

  if (totals.income === 0) {
    insights.push("Empieza registrando ingresos para que el análisis sea más preciso.");
  } else if (savingsRate >= 20) {
    insights.push("Tu ahorro está en una zona saludable según la regla 50/30/20.");
  } else {
    insights.push("Tu ahorro está por debajo del 20%; el sistema recomienda revisar gastos variables y pagos recurrentes.");
  }

  if (previous.expenses > 0) {
    const change = (totals.expenses - previous.expenses) / previous.expenses * 100;
    insights.push(`Tus gastos totales cambiaron ${pct(change)} frente al mes anterior.`);
  }

  if (activeMonths.length > 0) {
    insights.push(`Tu ahorro mensual promedio del año es ${formatCurrency(avgSavings)}.`);
  }

  if (top) {
    insights.push(`Tu mayor categoría representa ${pct(totals.expenses > 0 ? top.amount / totals.expenses * 100 : 0)} de tus gastos del mes.`);
  }

  alertsList.innerHTML = (alerts.length ? alerts : ["Sin alertas críticas para este mes."]).map(item => `<li>${item}</li>`).join("");
  suggestionsList.innerHTML = (suggestions.length ? suggestions : ["Agrega más movimientos para generar sugerencias más precisas."]).map(item => `<li>${item}</li>`).join("");
  insightsList.innerHTML = insights.map(item => `<li>${item}</li>`).join("");
}


function cumulativeArray(values) {
  let total = 0;
  return values.map(value => {
    total += value;
    return total;
  });
}

function renderParetoChart() {
  const canvas = document.getElementById("paretoChart");
  if (!canvas) return;

  const grouped = groupByCategory(getFilteredTransactions(), false);
  const total = grouped.reduce((sum, item) => sum + item.amount, 0);
  let cumulative = 0;

  const data = grouped.map(item => {
    const share = total > 0 ? (item.amount / total) * 100 : 0;
    cumulative += share;
    return {
      category: item.category,
      amount: item.amount,
      cumulative
    };
  });

  if (paretoChart) paretoChart.destroy();

  paretoChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(item => item.category),
      datasets: [
        {
          label: "Monto",
          data: data.map(item => item.amount),
          yAxisID: "y"
        },
        {
          label: "% acumulado",
          type: "line",
          data: data.map(item => item.cumulative),
          yAxisID: "y1",
          tension: 0.25
        }
      ]
    },
    options: {
      ...chartOptions(),
      indexAxis: isMobile() ? "y" : "x",
      scales: {
        y: { beginAtZero: true },
        y1: {
          beginAtZero: true,
          max: 100,
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { callback: value => value + "%" }
        }
      }
    }
  });
}

function renderCategoryShareChart() {
  const canvas = document.getElementById("categoryShareChart");
  if (!canvas) return;

  const grouped = groupByCategory(getFilteredTransactions(), false);

  if (categoryShareChart) categoryShareChart.destroy();

  categoryShareChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: grouped.map(item => item.category),
      datasets: [{
        label: "Participación",
        data: grouped.map(item => item.amount)
      }]
    },
    options: chartOptions()
  });
}

function renderFixedVariableStackedChart() {
  const canvas = document.getElementById("fixedVariableStackedChart");
  if (!canvas) return;

  const data = getYearlyTotals();

  if (fixedVariableStackedChart) fixedVariableStackedChart.destroy();

  fixedVariableStackedChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Gastos fijos", data: data.map(item => item.fixed) },
        { label: "Gastos variables", data: data.map(item => item.variable) }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}

function renderCumulativeSavingsChart() {
  const canvas = document.getElementById("cumulativeSavingsChart");
  if (!canvas) return;

  const data = getYearlyTotals();
  const cumulativeSavings = cumulativeArray(data.map(item => item.savings));

  if (cumulativeSavingsChart) cumulativeSavingsChart.destroy();

  cumulativeSavingsChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [{
        label: "Ahorro acumulado",
        data: cumulativeSavings,
        tension: 0.25,
        fill: true
      }]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function renderCumulativeExpensesChart() {
  const canvas = document.getElementById("cumulativeExpensesChart");
  if (!canvas) return;

  const data = getYearlyTotals();

  if (cumulativeExpensesChart) cumulativeExpensesChart.destroy();

  cumulativeExpensesChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Fijos acumulados", data: cumulativeArray(data.map(item => item.fixed)), tension: 0.25 },
        { label: "Variables acumulados", data: cumulativeArray(data.map(item => item.variable)), tension: 0.25 },
        { label: "Total acumulado", data: cumulativeArray(data.map(item => item.expenses)), tension: 0.25 }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderIncomeExpenseRatioChart() {
  const canvas = document.getElementById("incomeExpenseRatioChart");
  if (!canvas) return;

  const totals = calculateTotals(getFilteredTransactions());

  if (incomeExpenseRatioChart) incomeExpenseRatioChart.destroy();

  incomeExpenseRatioChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Ingresos", "Gastos", "Ahorro"],
      datasets: [{
        label: "Monto",
        data: [totals.income, totals.expenses, totals.savings]
      }]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderRuleScoreChart() {
  const canvas = document.getElementById("ruleScoreChart");
  if (!canvas) return;

  const totals = calculateTotals(getFilteredTransactions());
  const fixedPct = totals.income > 0 ? totals.fixed / totals.income * 100 : 0;
  const variablePct = totals.income > 0 ? totals.variable / totals.income * 100 : 0;
  const savingsPct = totals.income > 0 ? totals.savings / totals.income * 100 : 0;

  if (ruleScoreChart) ruleScoreChart.destroy();

  ruleScoreChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Fijos", "Variables", "Ahorro"],
      datasets: [
        { label: "Actual %", data: [fixedPct, variablePct, savingsPct] },
        { label: "Meta %", data: [50, 30, 20] }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => value + "%" }
        }
      }
    }
  });
}

function renderCategoryHeatmap() {
  const container = document.getElementById("categoryHeatmap");
  if (!container) return;

  const selectedYear = Number(yearFilter.value);
  const expenseCategories = categoriesCache
    .filter(category => category.kind !== "income")
    .sort((a, b) => a.name.localeCompare(b.name));

  const matrix = expenseCategories.map(category => {
    const values = monthNames.map((_, monthIndex) => {
      return getTransactionsForMonth(selectedYear, monthIndex)
        .filter(item => item.categoryId === category.id && item.type !== "income")
        .reduce((sum, item) => sum + item.amount, 0);
    });

    return {
      category: category.name,
      values
    };
  });

  const maxValue = Math.max(0, ...matrix.flatMap(row => row.values));

  function heatClass(value) {
    if (!value || maxValue === 0) return "heat-0";
    const ratio = value / maxValue;
    if (ratio < 0.25) return "heat-1";
    if (ratio < 0.50) return "heat-2";
    if (ratio < 0.75) return "heat-3";
    return "heat-4";
  }

  container.innerHTML = `
    <div class="heatmap-grid">
      <div class="heatmap-head">Categoría</div>
      ${monthNames.map(month => `<div class="heatmap-head">${month.slice(0, 3)}</div>`).join("")}
      ${
        matrix.length === 0
          ? `<div class="heatmap-label">Sin categorías</div>${monthNames.map(() => `<div class="heatmap-cell heat-0">-</div>`).join("")}`
          : matrix.map(row => `
              <div class="heatmap-label">${row.category}</div>
              ${row.values.map(value => `<div class="heatmap-cell ${heatClass(value)}">${value ? formatCurrency(value) : "-"}</div>`).join("")}
            `).join("")
      }
    </div>
  `;
}

function renderChartsSummaryTable() {
  const table = document.getElementById("chartsSummaryTable");
  if (!table) return;

  const totals = calculateTotals(getFilteredTransactions());
  const grouped = groupByCategory(getFilteredTransactions(), false);
  const top = grouped[0];
  const yearly = getYearlyTotals();
  const bestSavingsMonth = yearly.reduce((best, item) => item.savings > best.savings ? item : best, yearly[0]);
  const worstExpenseMonth = yearly.reduce((worst, item) => item.expenses > worst.expenses ? item : worst, yearly[0]);
  const savingsRate = totals.income > 0 ? totals.savings / totals.income * 100 : 0;

  const rows = [
    ["Categoría más alta", top ? `${top.category} - ${formatCurrency(top.amount)}` : "-", "Prioriza esta categoría para optimizar gastos."],
    ["Tasa de ahorro mensual", pct(savingsRate), savingsRate >= 20 ? "Buen nivel de ahorro." : "Conviene revisar gastos variables."],
    ["Mejor mes de ahorro", bestSavingsMonth ? `${bestSavingsMonth.month} - ${formatCurrency(bestSavingsMonth.savings)}` : "-", "Mes con mayor ahorro del año seleccionado."],
    ["Mes con más gastos", worstExpenseMonth ? `${worstExpenseMonth.month} - ${formatCurrency(worstExpenseMonth.expenses)}` : "-", "Mes que requiere revisión de categorías."],
    ["Gastos fijos del mes", formatCurrency(totals.fixed), "Compromisos recurrentes."],
    ["Gastos variables del mes", formatCurrency(totals.variable), "Área con mayor posibilidad de ajuste."]
  ];

  table.innerHTML = rows.map(row => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
    </tr>
  `).join("");
}

function renderAllProCharts() {
  renderMonthlyChartIn("monthlyChart", "monthly");
  renderMonthlyChartIn("chartsMonthlyChart", "chartsMonthly");
  renderCategoryReportChart();
  renderYearlyChart();
  renderExpenseTrendChart();
  renderParetoChart();
  renderCategoryShareChart();
  renderFixedVariableStackedChart();
  renderCumulativeSavingsChart();
  renderCumulativeExpensesChart();
  renderIncomeExpenseRatioChart();
  renderRuleScoreChart();
  renderCategoryHeatmap();
  renderChartsSummaryTable();
}

function refreshDashboard() {
  setupYearFilterIfNeeded();
  renderCategoryOptions();
  updateSummary();
  renderMonthlyDetailTable();
  renderTransactionTable();
  renderCategoriesTable();
  renderAllProCharts();
  renderAnalytics();
}

function startEditingTransaction(id) {
  const transaction = transactionsCache.find(item => item.id === id);
  if (!transaction) return;

  editingTransactionId = id;

  dateInput.value = transaction.date;
  typeInput.value = transaction.type;
  typeInput.disabled = transaction.type === "fixed";
  renderCategoryOptions();
  categorySelect.value = transaction.categoryId;
  amountInput.value = transaction.amount;
  descriptionInput.value = transaction.description || "";

  submitBtn.textContent = "Guardar cambios";
  cancelEditBtn.classList.remove("hidden");

  showSection("transactionsSection");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditingTransaction() {
  editingTransactionId = null;
  form.reset();
  dateInput.value = getCurrentDateValue();
  typeInput.disabled = false;
  submitBtn.textContent = "Agregar";
  cancelEditBtn.classList.add("hidden");
  renderCategoryOptions();
}

async function addOrUpdateTransaction(event) {
  event.preventDefault();

  if (!categorySelect.value) {
    alert("Primero crea o selecciona una categoría.");
    return;
  }

  const transaction = {
    date: dateInput.value,
    type: typeInput.value,
    categoryId: categorySelect.value,
    amount: Number(amountInput.value),
    description: descriptionInput.value.trim()
  };

  if (editingTransactionId) {
    await apiUpdateTransaction(editingTransactionId, transaction);
    alert("Movimiento actualizado.");
  } else {
    await apiCreateTransaction(transaction);

    if (transaction.type === "fixed") {
      alert("Gasto fijo guardado como recurrente.");
    }
  }

  await refreshData();

  const selectedDate = transaction.date;
  cancelEditingTransaction();

  monthFilter.value = getMonth(selectedDate);
  yearFilter.value = getYear(selectedDate);

  refreshDashboard();
}


async function deleteRecurringOnlyThisMonth(parentRecurringId) {
  const selectedYear = Number(yearFilter.value);
  const selectedMonth = Number(monthFilter.value);
  const original = transactionsCache.find(item => item.id === parentRecurringId);

  if (!original) {
    alert("No se encontró la serie recurrente original.");
    return;
  }

  const existingOverride = getRecurringOverride(parentRecurringId, selectedYear, selectedMonth);
  const existingDeleted = getDeletedRecurringMarker(parentRecurringId, selectedYear, selectedMonth);

  if (existingDeleted) {
    alert("Este gasto recurrente ya está eliminado para este mes.");
    return;
  }

  if (existingOverride) {
    await apiDeleteTransaction(existingOverride.id);
  }

  const deletionMarker = {
    date: buildMonthlyDate(original.date, selectedYear, selectedMonth),
    type: "fixed_deleted",
    parentRecurringId,
    overrideYear: selectedYear,
    overrideMonth: selectedMonth,
    categoryId: original.categoryId,
    amount: 0,
    description: "Gasto recurrente eliminado solo para este mes"
  };

  await apiCreateTransaction(deletionMarker);
  await refreshData();
  refreshDashboard();

  alert("Gasto recurrente eliminado solo para este mes. Los demás meses no se modificaron.");
}

async function deleteTransaction(id) {
  await apiDeleteTransaction(id);
  await refreshData();
  refreshDashboard();
}

function startEditingCategory(id) {
  const category = categoriesCache.find(item => item.id === id);
  if (!category) return;

  editingCategoryId = id;
  categoryNameInput.value = category.name;
  categoryKindInput.value = category.kind;
  categorySubmitBtn.textContent = "Guardar categoría";
  categoryCancelBtn.classList.remove("hidden");
}

function cancelEditingCategory() {
  editingCategoryId = null;
  categoryForm.reset();
  categorySubmitBtn.textContent = "Agregar categoría";
  categoryCancelBtn.classList.add("hidden");
}

async function addOrUpdateCategory(event) {
  event.preventDefault();

  const category = {
    name: categoryNameInput.value.trim(),
    kind: categoryKindInput.value
  };

  if (!category.name) {
    alert("Escribe un nombre para la categoría.");
    return;
  }

  try {
    if (editingCategoryId) {
      await apiUpdateCategory(editingCategoryId, category);
      alert("Categoría actualizada.");
    } else {
      await apiCreateCategory(category);
    }

    await refreshData();
    cancelEditingCategory();
    refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteCategory(id) {
  if (!confirm("¿Deseas eliminar esta categoría? Solo se puede eliminar si no tiene movimientos.")) return;

  try {
    await apiDeleteCategory(id);
    await refreshData();
    refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function exportJSON() {
  const json = JSON.stringify({ categories: categoriesCache, transactions: transactionsCache }, null, 2);

  if (Data.isNative()) {
    try {
      const { Filesystem, Share } = window.Capacitor.Plugins;
      await Filesystem.writeFile({ path: "db_export.json", directory: "CACHE", encoding: "utf8", data: json });
      const { uri } = await Filesystem.getUri({ path: "db_export.json", directory: "CACHE" });
      await Share.share({ title: "Respaldo Mi Balance", url: uri });
    } catch (error) {
      if (!String(error && error.message).toLowerCase().includes("cancel")) {
        alert("No se pudo exportar el respaldo: " + (error.message || error));
      }
    }
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "db_export.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importJSONFile(file) {
  if (!file) return;
  if (!confirm("Importar reemplazará TODOS los datos actuales con los del respaldo. ¿Deseas continuar?")) return;

  try {
    const data = JSON.parse(await file.text());
    await Data.importDB(data);
    await refreshData();
    setupFilters();
    renderCategoryOptions();
    refreshDashboard();
    alert("Respaldo importado correctamente.");
  } catch (error) {
    alert("No se pudo importar: " + (error.message || error));
  }
}

function showSection(sectionId) {
  sections.forEach(section => section.classList.remove("active-section"));
  navButtons.forEach(button => button.classList.remove("active"));

  document.getElementById(sectionId).classList.add("active-section");
  document.querySelector(`[data-section="${sectionId}"]`).classList.add("active");

  const titles = {
    transactionsSection: "Registrar movimientos",
    categoriesSection: "Categorías",
    chartsSection: "Gráficos",
    analyticsSection: "Data analytics"
  };

  pageTitle.textContent = titles[sectionId] || "Mi Balance";

  setTimeout(() => {
    renderAllProCharts();
    renderAnalytics();
  }, 120);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

form.addEventListener("submit", addOrUpdateTransaction);
cancelEditBtn.addEventListener("click", cancelEditingTransaction);
typeInput.addEventListener("change", renderCategoryOptions);

categoryForm.addEventListener("submit", addOrUpdateCategory);
categoryCancelBtn.addEventListener("click", cancelEditingCategory);

monthlyDetailTable.addEventListener("click", event => {
  if (event.target.matches("button[data-edit-transaction-id]")) {
    startEditingTransaction(event.target.dataset.editTransactionId);
  }
});

transactionTable.addEventListener("click", event => {
  if (event.target.matches("button[data-delete-transaction-id]")) {
    const text = event.target.textContent;
    const id = event.target.dataset.deleteTransactionId;

    if (text === "Eliminar solo este mes") {
      if (!confirm("Este gasto recurrente se eliminará solo del mes seleccionado. Los demás meses no se modificarán. ¿Deseas continuar?")) return;
      deleteRecurringOnlyThisMonth(id);
      return;
    }

    if (!confirm("¿Deseas eliminar este movimiento?")) return;
    deleteTransaction(id);
  }
});

categoriesTable.addEventListener("click", event => {
  if (event.target.matches("button[data-edit-category-id]")) {
    startEditingCategory(event.target.dataset.editCategoryId);
  }

  if (event.target.matches("button[data-delete-category-id]")) {
    deleteCategory(event.target.dataset.deleteCategoryId);
  }
});

monthFilter.addEventListener("change", refreshDashboard);
yearFilter.addEventListener("change", refreshDashboard);
exportBtn.addEventListener("click", exportJSON);
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  importJSONFile(importFile.files[0]);
  importFile.value = "";
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => refreshDashboard(), 250);
});

async function initApp() {
  dateInput.value = getCurrentDateValue();

  try {
    await refreshData();
    setupFilters();
    renderCategoryOptions();
    refreshDashboard();
  } catch (error) {
    alert("No se pudo iniciar la app. Cierra y vuelve a abrirla.");
    console.error(error);
  }
}

initApp();
