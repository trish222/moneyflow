import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardMetrics {
  netWorth?: number;
  availableFunds?: number;
  debts?: number;
  savings?: number;
  investmentsValue?: number;
}

interface Transaction {
  id: number;
  amount?: number;
  type?: string;
  category?: string;
  date?: string;
}

interface Budget {
  id: number;
  category?: string;
  limit?: number;
  spent?: number;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-4 md:p-8">
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

        .glow-green {
          --color-1: #00d97e;
          --color-2: #00a86b;
          --glow-color: rgba(0, 217, 126, 0.8);
          --glow-color-dim: rgba(0, 217, 126, 0.2);
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

        /* Masonry Staggered Layout */
        .dashboard-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: start;
        }

        /* Left column - metric cards */
        .metrics-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .metric-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }


        /* Right column - large cards grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          grid-auto-rows: max-content;
        }

        @media (max-width: 1024px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome, Trish</h1>
          <p className="text-purple-300">Financial Snapshot</p>
        </div>

        {/* Activity Summary Filters */}
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            onClick={() => setFilterType("day")}
            className={`py-2 px-3 rounded-full border-2 font-medium transition text-sm ${
              filterType === "day"
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-slate-600 text-gray-300 hover:border-purple-400"
            }`}
          >
            Day
          </button>

          <button
            onClick={() => setFilterType("week")}
            className={`py-2 px-3 rounded-full border-2 font-medium transition text-sm ${
              filterType === "week"
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-slate-600 text-gray-300 hover:border-purple-400"
            }`}
          >
            Week
          </button>

          <button
            onClick={() => setFilterType("month")}
            className={`py-2 px-3 rounded-full border-2 font-medium transition text-sm ${
              filterType === "month"
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-slate-600 text-gray-300 hover:border-purple-400"
            }`}
          >
            Month
          </button>

          <button
            onClick={() => setFilterType("year")}
            className={`py-2 px-3 rounded-full border-2 font-medium transition text-sm ${
              filterType === "year"
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-slate-600 text-gray-300 hover:border-purple-400"
            }`}
          >
            Year
          </button>

          <button
            onClick={() => setFilterType("all")}
            className={`py-2 px-3 rounded-full border-2 font-medium transition text-sm ${
              filterType === "all"
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-slate-600 text-gray-300 hover:border-purple-400"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Selectors for Filters - Reserved Space */}
      <div className="mb-6 flex flex-wrap gap-3 justify-end h-10">
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm ${
            filterType === "day" || filterType === "week" ? "" : "hidden"
          }`}
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
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm ${
            filterType === "week" || filterType === "month" ? "" : "hidden"
          }`}
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
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm ${
            filterType === "week" || filterType === "month" || filterType === "year" ? "" : "hidden"
          }`}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content - Masonry Staggered Layout */}
      <div className="dashboard-layout">
        {/* Left Column - Metric Cards */}
        <div className="metrics-column">
          {/* Net Worth Card */}
          <div className="glow-card glow-red">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-white font-semibold text-lg">Net Worth</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">Include Debt</span>
                <div
                  onClick={() => setIncludeDebt(!includedDebt)}
                  className={`toggle-switch ${includedDebt ? "active" : ""}`}
                />
              </div>
            </div>
            <p className="text-5xl md:text-6xl font-bold text-red-300 mb-4">
              ${(displayNetWorth || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">↑ 0.05%</p>
          </div>

          {/* Available Funds Card */}
          <div className="glow-card glow-cyan">
            <h3 className="text-white font-semibold mb-3">Available Funds</h3>
            <p className="text-3xl font-bold text-cyan-300">
              ${(metrics.availableFunds || 0).toFixed(2)}
            </p>
          </div>

          {/* Savings Card */}
          <div
            onClick={() => navigate("/savings")}
            className="glow-card glow-blue cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold mb-3">Savings</h3>
                <p className="text-3xl font-bold text-blue-300">
                  ${(metrics.savings || 0).toFixed(2)}
                </p>
              </div>
              <svg
                className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition"
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
          </div>

          {/* Debt Card */}
          <div
            onClick={() => navigate("/debt")}
            className="glow-card glow-purple cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold mb-3">Debt</h3>
                <p className="text-3xl font-bold text-purple-300">
                  ${(metrics.debts || 0).toFixed(2)}
                </p>
              </div>
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
          </div>
        </div>

        {/* Right Column - Page Cards */}
        <div>
          <div className="cards-grid">
            {/* Transactions Card */}
            <div
              onClick={() => navigate("/transactions")}
              className="glow-card glow-cyan cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Transactions</h2>
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
                  <p className="text-lg font-bold text-green-400">
                    +${totalIncome.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">this month</p>
                </div>

                <div className="border-l-4 border-red-400 pl-4 py-2">
                  <p className="text-gray-400 text-sm">Expense</p>
                  <p className="text-lg font-bold text-red-400">
                    -${totalExpense.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">this month</p>
                </div>
              </div>
            </div>

            {/* Budgeting Card */}
            <div
              onClick={() => navigate("/budgets")}
              className="glow-card glow-purple cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Budgeting</h2>
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
                  {budgets.slice(0, 2).map((budget) => {
                    const spent = budget.spent || 0;
                    const limit = budget.limit || 0;
                    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                    let barColor = "bg-blue-500";
                    if (percentage > 100) barColor = "bg-red-500";
                    else if (percentage > 75) barColor = "bg-yellow-500";

                    return (
                      <div key={budget.id}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300 capitalize text-sm">
                            {budget.category || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ${spent.toFixed(0)} / ${limit.toFixed(0)}
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
                <p className="text-gray-400 text-sm">No budgets set yet</p>
              )}
            </div>

            {/* Investments Card */}
            <div
              onClick={() => navigate("/investments")}
              className="glow-card glow-green cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Investments</h2>
                <svg
                  className="w-6 h-6 text-green-400 group-hover:translate-x-1 transition"
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

              <div className="space-y-3">
                <div className="border-l-4 border-green-400 pl-4 py-2">
                  <p className="text-gray-400 text-sm">Total Invested</p>
                  <p className="text-2xl font-bold text-green-300">
                    ${metrics.investmentsValue.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-gray-400">View detailed portfolio breakdown</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
