import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/api";

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
  const [filterType, setFilterType] = useState("month");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [includedDebt, setIncludeDebt] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      let url = "/dashboard/metrics";
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

      const metricsResponse = await apiCall(url);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      const transactionsResponse = await apiCall("/transactions");
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.slice(0, 5));

      const budgetsResponse = await apiCall(
        `/budgets?month=${selectedMonth}&year=${selectedYear}`,
      );
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData.slice(0, 3));
    } catch (error) {
      console.error("Error fetching data:", error);
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
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 lg:p-8" style={{background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)'}}>
      <style>{`
        .glow-card {
          position: relative;
          border-radius: 1.5rem;
          padding: 1.25rem;
          background: rgba(10, 15, 30, 0.3);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 0.3px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .glow-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1.5rem;
          padding: 1px;
          background: linear-gradient(135deg, var(--color-1), var(--color-2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 10;
          opacity: 0.35;
          transition: opacity 0.3s ease;
        }

        .glow-card:hover::after {
          opacity: 0.6;
        }

        .glow-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background:
            linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
            radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
            radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
            linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
          z-index: 1;
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .glow-card:hover::before {
          opacity: 1;
          background:
            radial-gradient(ellipse 60% 120% at -10% 50%, var(--glow-color-dim) 0%, transparent 40%),
            linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
            radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
            radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
            linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
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

        .filter-btn {
          position: relative;
          overflow: hidden;
          z-index: 1;
          cursor: pointer;
        }

        .filter-btn::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background:
            linear-gradient(to top, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 3%, transparent 10%),
            linear-gradient(to top, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 15%, transparent 50%);
          z-index: -1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .filter-btn.active::before {
          opacity: 0.9;
        }

        .filter-btn:hover::before {
          opacity: 0.7;
        }

        /* Dashboard container - fills available space */
        .dashboard-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Masonry Staggered Layout */
        .dashboard-layout {
          display: grid;
          grid-template-columns: 0.85fr 1.5fr;
          gap: 1.5rem;
          align-items: start;
          flex: 1;
          min-height: 0;
        }

        /* Left column - metric cards */
        .metrics-column {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          min-height: 0;
        }

        .metric-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        /* Right column - large cards grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          grid-auto-rows: max-content;
          min-height: 0;
        }

        @media (max-width: 1280px) {
          .dashboard-layout {
            grid-template-columns: 0.8fr 1fr;
            gap: 1.2rem;
          }
          .metrics-column {
            gap: 1rem;
          }
          .cards-grid {
            gap: 1.2rem;
          }
        }

        @media (max-width: 1024px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .metrics-column {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.8rem;
          }
        }

        @media (max-width: 768px) {
          .metrics-column {
            grid-template-columns: repeat(2, 1fr);
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header - Welcome + Filters (Combined) */}
      <div className="mb-4 flex flex-col gap-3">
        {/* Welcome Text + Filter Buttons - Single Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Welcome, Trish
            </h1>
            <p className="text-purple-300 text-sm">Financial Snapshot</p>
          </div>

          {/* Activity Summary - Filter Buttons */}
          <div className="flex flex-wrap justify-start lg:justify-end gap-2">
            <button
              onClick={() => setFilterType("day")}
              className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm backdrop-blur-md relative ${
                filterType === "day"
                  ? "active border-white bg-white/10 text-white"
                  : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
              }`}
            >
              Day
            </button>

            <button
              onClick={() => setFilterType("week")}
              className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm backdrop-blur-md relative ${
                filterType === "week"
                  ? "active border-white bg-white/10 text-white"
                  : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setFilterType("month")}
              className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm backdrop-blur-md relative ${
                filterType === "month"
                  ? "active border-white bg-white/10 text-white"
                  : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
              }`}
            >
              Month
            </button>

            <button
              onClick={() => setFilterType("year")}
              className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm backdrop-blur-md relative ${
                filterType === "year"
                  ? "active border-white bg-white/10 text-white"
                  : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
              }`}
            >
              Year
            </button>

            <button
              onClick={() => setFilterType("all")}
              className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm backdrop-blur-md relative ${
                filterType === "all"
                  ? "active border-white bg-white/10 text-white"
                  : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Filter Dropdowns - Directly Below, No Gap */}
        <div className="flex flex-wrap gap-3 justify-end items-center h-10">
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm cursor-pointer hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition ${
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
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm cursor-pointer hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition ${
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
          className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm cursor-pointer hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition ${
            filterType === "week" ||
            filterType === "month" ||
            filterType === "year"
              ? ""
              : "hidden"
          }`}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        </div>
      </div>

      {/* Main Content - Masonry Staggered Layout */}
      <div className="dashboard-layout flex-1 min-h-0">
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
              ${displayNetWorth.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">↑ 0.05%</p>
          </div>

          {/* Available Funds Card */}
          <div className="glow-card glow-cyan">
            <h3 className="text-white font-semibold mb-3">Available Funds</h3>
            <p className="text-3xl font-bold text-cyan-300">
              ${metrics.availableFunds.toFixed(2)}
            </p>
          </div>

          {/* Savings Card */}
          <div
            onClick={() => navigate("/savings")}
            className="glow-card glow-blue cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Savings</h3>
                <p className="text-3xl font-bold text-blue-300">
                  ${metrics.savings.toFixed(2)}
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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Debt</h3>
                <p className="text-3xl font-bold text-purple-300">
                  ${metrics.debts.toFixed(2)}
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
                    const percentage = (budget.spent / budget.limit) * 100;
                    let barColor = "bg-blue-500";
                    if (percentage > 100) barColor = "bg-red-500";
                    else if (percentage > 75) barColor = "bg-yellow-500";

                    return (
                      <div key={budget.id}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300 capitalize text-sm">
                            {budget.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            ${budget.spent.toFixed(0)} / $
                            {budget.limit.toFixed(0)}
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
                <p className="text-xs text-gray-400">
                  View detailed portfolio breakdown
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
