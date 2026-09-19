import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SpendingData {
  category: string;
  total: number;
}

interface IncomeExpenseData {
  month: number;
  income: number;
  expenses: number;
}

interface PortfolioData {
  account: string;
  type: string;
  holdings: number;
  totalValue: number;
}

interface SummaryData {
  income: number;
  expenses: number;
  netIncome: number;
  transactionCount: number;
  budgetCount: number;
}

export default function Reports() {
  const [spending, setSpending] = useState<SpendingData[]>([]);
  const [incomeExpense, setIncomeExpense] = useState<IncomeExpenseData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  const colors = ["#ff6b6b", "#00d9ff", "#c77dff", "#00d97e", "#ffa94d", "#ff1493"];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [spendingRes, incomeRes, portfolioRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:3000/api/reports/spending-by-category?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`http://localhost:3000/api/reports/income-vs-expenses?year=${selectedYear}`),
        fetch(`http://localhost:3000/api/reports/portfolio-performance`),
        fetch(`http://localhost:3000/api/reports/summary?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      const [spendingData, incomeData, portfolioData, summaryData] = await Promise.all([
        spendingRes.json(),
        incomeRes.json(),
        portfolioRes.json(),
        summaryRes.json(),
      ]);

      setSpending(spendingData || []);
      setIncomeExpense(incomeData || []);
      setPortfolio(portfolioData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const incomeExpenseChartData = incomeExpense.map((item) => ({
    month: monthNames[item.month - 1]?.substring(0, 3) || "",
    income: item.income || 0,
    expenses: item.expenses || 0,
  }));

  return (
    <div className="min-h-screen p-4 md:p-8" style={{background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)'}}>
      <style>{`
        .glow-card {
          position: relative;
          border-radius: 1.5rem;
          padding: 1.5rem;
          background: rgba(10, 15, 30, 0.3);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 0.3px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
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

        .glow-red { --color-1: #ff6b6b; --color-2: #ffa94d; --glow-color: rgba(255, 107, 107, 0.8); --glow-color-dim: rgba(255, 107, 107, 0.3); }
        .glow-cyan { --color-1: #00d9ff; --color-2: #0099ff; --glow-color: rgba(0, 217, 255, 0.8); --glow-color-dim: rgba(0, 217, 255, 0.3); }
        .glow-purple { --color-1: #c77dff; --color-2: #ff006e; --glow-color: rgba(199, 125, 255, 0.8); --glow-color-dim: rgba(199, 125, 255, 0.3); }
        .glow-green { --color-1: #00d97e; --color-2: #00a86b; --glow-color: rgba(0, 217, 126, 0.8); --glow-color-dim: rgba(0, 217, 126, 0.3); }

        .glow-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
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

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: rgb(156, 163, 175);
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: bold;
          color: white;
        }

        .recharts-wrapper {
          width: 100% !important;
          height: auto !important;
        }
      `}</style>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Financial Reports</h1>
        <p className="text-purple-300">Analytics and insights into your finances</p>
      </div>

      {/* Month/Year Filter */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition"
        >
          {monthNames.map((month, idx) => (
            <option key={idx} value={idx + 1}>
              {month}
            </option>
          ))}
        </select>
        <span className="text-gray-400 py-2">{selectedYear}</span>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glow-card glow-green stat-card">
            <div className="stat-label">Income</div>
            <div className="stat-value text-green-400">${(summary.income || 0).toFixed(2)}</div>
          </div>
          <div className="glow-card glow-red stat-card">
            <div className="stat-label">Expenses</div>
            <div className="stat-value text-red-400">${(summary.expenses || 0).toFixed(2)}</div>
          </div>
          <div className="glow-card glow-purple stat-card">
            <div className="stat-label">Net Income</div>
            <div className={`stat-value ${(summary.netIncome || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${(summary.netIncome || 0).toFixed(2)}
            </div>
          </div>
          <div className="glow-card glow-cyan stat-card">
            <div className="stat-label">Transactions</div>
            <div className="stat-value text-cyan-400">{summary.transactionCount || 0}</div>
          </div>
          <div className="glow-card glow-red stat-card">
            <div className="stat-label">Budgets</div>
            <div className="stat-value text-red-400">{summary.budgetCount || 0}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading reports...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spending by Category */}
          <div className="glow-card glow-red">
            <h2 className="text-2xl font-bold text-white mb-6">Spending by Category</h2>
            {spending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, total }) => `${category}: $${total.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {spending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center py-8">No spending data for this period</div>
            )}
          </div>

          {/* Income vs Expenses */}
          <div className="glow-card glow-cyan">
            <h2 className="text-2xl font-bold text-white mb-6">Income vs Expenses</h2>
            {incomeExpenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeExpenseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgb(156, 163, 175)" />
                  <YAxis stroke="rgb(156, 163, 175)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 30, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                    }}
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#00d97e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center py-8">No transaction data available</div>
            )}
          </div>

          {/* Portfolio Performance */}
          <div className="glow-card glow-green lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio Performance by Account</h2>
            {portfolio.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="account" stroke="rgb(156, 163, 175)" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="rgb(156, 163, 175)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 30, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                    }}
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="totalValue" fill="#00d97e" name="Total Value" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="holdings" fill="#00d9ff" name="Holdings" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center py-8">No investment data available</div>
            )}
          </div>

          {/* Spending Details Table */}
          <div className="glow-card glow-purple lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Category Breakdown</h2>
            {spending.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-400 font-semibold">Category</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold">Amount</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const total = spending.reduce((sum, item) => sum + item.total, 0);
                      return spending.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-slate-800/30">
                          <td className="py-3 px-2 text-gray-300">{item.category}</td>
                          <td className="text-right py-3 px-2 text-white font-semibold">${(item.total || 0).toFixed(2)}</td>
                          <td className="text-right py-3 px-2 text-gray-400">{total > 0 ? ((item.total / total) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">No spending data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
