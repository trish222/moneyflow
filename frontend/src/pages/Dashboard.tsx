import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardMetrics {
  netWorth: number;
  availableFunds: number;
  debts: number;
  savings: number;
  investmentsValue: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  date: string;
}

interface Budget {
  id: number;
  category: string;
  limit: number;
  spent: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    netWorth: 0,
    availableFunds: 0,
    debts: 0,
    savings: 0,
    investmentsValue: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("month");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [includedDebt, setIncludeDebt] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      let url = "http://localhost:3000/api/dashboard/metrics";
      if (filterType === "month") {
        url += `?month=${selectedMonth}&year=${selectedYear}`;
      } else if (filterType === "year") {
        url += `?year=${selectedYear}`;
      } else if (filterType === "day") {
        url += `?day=${selectedDay}&month=${selectedMonth}&year=${selectedYear}`;
      } else if (filterType === "week") {
        const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
        url += `?week=${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}&month=${selectedMonth}&year=${selectedYear}`;
      }

      const metricsResponse = await fetch(url);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      const transactionsResponse = await fetch("http://localhost:3000/api/transactions");
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.slice(0, 5));

      const budgetsResponse = await fetch(`http://localhost:3000/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData.slice(0, 3));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedMonth, selectedYear, selectedDay]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i,
  );

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const displayNetWorth = includedDebt
    ? metrics.netWorth
    : metrics.availableFunds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <style>{`
        .glow-card {
          position: relative;
          border-radius: 1.5rem;
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .glow-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1.5rem;
          padding: 2px;
          background: linear-gradient(135deg, var(--color-1), var(--color-2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 10;
        }

        .glow-card::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 1.5rem;
          background: linear-gradient(135deg, var(--color-1), var(--color-2));
          z-index: -1;
          filter: blur(15px);
          opacity: 0.3;
          transition: opacity 0.3s ease, filter 0.3s ease;
          pointer-events: none;
        }

        .glow-card:hover::before {
          opacity: 0.6;
          filter: blur(25px);
        }

        .glow-red {
          --color-1: #ff6b6b;
          --color-2: #ffa94d;
          --glow-color: rgba(255, 107, 107, 0.8);
          --glow-color-dim: rgba(255, 107, 107, 0.2);
        }

        .glow-cyan {
          --color-1: #00d9ff;
          --color-2: #0099ff;
          --glow-color: rgba(0, 217, 255, 0.8);
          --glow-color-dim: rgba(0, 217, 255, 0.2);
        }

        .glow-purple {
          --color-1: #c77dff;
          --color-2: #ff006e;
          --glow-color: rgba(199, 125, 255, 0.8);
          --glow-color-dim: rgba(199, 125, 255, 0.2);
        }

        .glow-blue {
          --color-1: #00b4ff;
          --color-2: #0066ff;
          --glow-color: rgba(0, 180, 255, 0.8);
          --glow-color-dim: rgba(0, 180, 255, 0.2);
        }

        .toggle-switch {
          position: relative;
          display: inline-flex;
          width: 50px;
          height: 28px;
          background-color: #334155;
          border-radius: 20px;
          cursor: pointer;
          transition: background-color 0.3s;
          border: 1px solid #475569;
        }
        .toggle-switch.active {
          background-color: #6366f1;
          border-color: #818cf8;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: left 0.3s;
        }
        .toggle-switch.active::after {
          left: 24px;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome, Trish</h1>
        <p className="text-purple-300">Financial Snapshot</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Small Metric Cards */}
        <div className="w-full lg:w-1/4 space-y-6">
          {/* Net Worth Card */}
          <div className="glow-card glow-red">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-semibold">Net Worth</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">Include Debt</span>
                <div
                  onClick={() => setIncludeDebt(!includedDebt)}
                  className={`toggle-switch ${includedDebt ? "active" : ""}`}
                />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-red-300">
              ${displayNetWorth.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-2">↑ 0.05%</p>
          </div>

          {/* Investments Card */}
          <div className="glow-card glow-cyan">
            <h3 className="text-white font-semibold mb-4">Investments Value</h3>
            <div className="flex justify-center">
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#00d9ff"
                    strokeWidth="8"
                    strokeDasharray="141 283"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm md:text-lg font-bold text-cyan-300">
                      ${metrics.investmentsValue.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400">invested</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Card */}
          <div className="glow-card glow-blue">
            <h3 className="text-white font-semibold mb-4">Savings</h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-300">
              ${metrics.savings.toFixed(2)}
            </p>
          </div>

          {/* Debt Card */}
          <div className="glow-card glow-purple">
            <h3 className="text-white font-semibold mb-4">Debt</h3>
            <p className="text-2xl md:text-3xl font-bold text-purple-300">
              ${metrics.debts.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Middle Section - Main Cards */}
        <div className="w-full lg:flex-1 space-y-6">
          {/* Transactions Card */}
          <div
            onClick={() => navigate("/transactions")}
            className="glow-card glow-cyan cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Transactions</h2>
              <svg
                className="w-6 h-6 text-cyan-400 group-hover:translate-x-1 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-green-400 pl-4 py-2">
                <p className="text-gray-400 text-sm">Income</p>
                <p className="text-lg md:text-xl font-bold text-green-400">
                  +${totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">this month</p>
              </div>

              <div className="border-l-4 border-red-400 pl-4 py-2">
                <p className="text-gray-400 text-sm">Expense</p>
                <p className="text-lg md:text-xl font-bold text-red-400">
                  -${totalExpense.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">this month</p>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-gray-500 mb-3">Recent transactions:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {transactions.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between text-sm text-gray-300"
                    >
                      <span>{t.category}</span>
                      <span
                        className={
                          t.type === "income"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {t.type === "income" ? "+" : "-"}${t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budgeting Card */}
          <div
            onClick={() => navigate("/budgets")}
            className="glow-card glow-purple cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Budgeting</h2>
              <p className="text-sm text-purple-300">monthly</p>
              <svg
                className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const percentage = (budget.spent / budget.limit) * 100;
                  let barColor = "bg-blue-500";
                  if (percentage > 100) barColor = "bg-red-500";
                  else if (percentage > 75) barColor = "bg-yellow-500";

                  return (
                    <div key={budget.id}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 capitalize">
                          {budget.category}
                        </span>
                        <span className="text-sm text-gray-400">
                          ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`${barColor} h-2 rounded-full transition-all`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">No budgets set yet</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Filters */}
        <div className="w-full md:w-56 lg:w-48">
          <h3 className="text-white font-semibold mb-4 text-center">
            Activity Summary
          </h3>

          <div className="space-y-3 flex flex-col">
            <button
              onClick={() => setFilterType("day")}
              className={`py-2 px-4 rounded-full border-2 font-medium transition ${
                filterType === "day"
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-slate-600 text-gray-300 hover:border-purple-400"
              }`}
            >
              Day
            </button>

            <button
              onClick={() => setFilterType("week")}
              className={`py-2 px-4 rounded-full border-2 font-medium transition ${
                filterType === "week"
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-slate-600 text-gray-300 hover:border-purple-400"
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setFilterType("month")}
              className={`py-2 px-4 rounded-full border-2 font-medium transition ${
                filterType === "month"
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-slate-600 text-gray-300 hover:border-purple-400"
              }`}
            >
              Month
            </button>

            <button
              onClick={() => setFilterType("year")}
              className={`py-2 px-4 rounded-full border-2 font-medium transition ${
                filterType === "year"
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-slate-600 text-gray-300 hover:border-purple-400"
              }`}
            >
              Year
            </button>

            <button
              onClick={() => setFilterType("all")}
              className={`py-2 px-4 rounded-full border-2 font-medium transition ${
                filterType === "all"
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-slate-600 text-gray-300 hover:border-purple-400"
              }`}
            >
              All Time
            </button>
          </div>

          {filterType === "day" && (
            <div className="mt-6 space-y-3">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === "month" && (
            <div className="mt-6 space-y-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === "year" && (
            <div className="mt-6 space-y-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === "week" && (
            <div className="mt-6 space-y-3">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
