import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { apiCall } from "../utils/api";

interface Transaction {
  id: number;
  amount?: number;
  type?: string;
  category?: string;
  subcategory?: string;
  date?: string;
}

interface Account {
  id: number;
  name: string;
  balance?: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  subcategories?: any[];
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showBalanceAdjust, setShowBalanceAdjust] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["expense"]));
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvLoading, setCSVLoading] = useState(false);
  const [csvError, setCSVError] = useState<string | null>(null);
  const [balanceData, setBalanceData] = useState({
    balance: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense",
    category: "food",
    subcategory: "",
    date: new Date().toISOString().split("T")[0],
  });

  const colors = ["#ff6b6b", "#00d9ff", "#c77dff", "#00d97e", "#ffa94d", "#ff1493", "#00b4ff", "#88ff88"];

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiCall("/categories");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: data[0].name }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    calculateCategoryBreakdown();
  }, [transactions, selectedTypes]);

  const fetchAccounts = async () => {
    try {
      const response = await apiCall("/accounts");
      const data = await response.json();
      setAccounts(data);
      if (data.length > 0) setSelectedAccount(data[0].id);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const calculateCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};

    transactions.forEach((t) => {
      if (selectedTypes.has(t.type || "")) {
        const category = t.category || "Other";
        breakdown[category] = (breakdown[category] || 0) + (t.amount || 0);
      }
    });

    const data = Object.entries(breakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: parseFloat(value.toFixed(2)),
    }));

    setCategoryData(data);
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiCall("/transactions");
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiCall("/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      if (response.ok) {
        setFormData({
          amount: "",
          type: "expense",
          category: "food",
          subcategory: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowForm(false);
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      const response = await apiCall(`/transactions/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedAccount) {
      setCSVError("Please select a file and account");
      return;
    }

    try {
      setCSVLoading(true);
      setCSVError(null);
      const formDataObj = new FormData();
      formDataObj.append("file", csvFile);
      formDataObj.append("accountId", selectedAccount.toString());

      const response = await apiCall("/transactions/import-csv", {
        method: "POST",
        body: formDataObj,
        headers: {}, // Let the browser set Content-Type for multipart/form-data
      });

      const result = await response.json();
      if (response.ok) {
        setCSVFile(null);
        setShowCSVImport(false);
        fetchTransactions();
        alert(`Successfully imported ${result.imported} transactions!`);
      } else {
        setCSVError(result.message || "Failed to import CSV");
      }
    } catch (error) {
      setCSVError(error instanceof Error ? error.message : "Failed to import CSV");
    } finally {
      setCSVLoading(false);
    }
  };

  const handleSetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !balanceData.balance) {
      setCSVError("Please enter a balance");
      return;
    }

    try {
      setCSVLoading(true);
      setCSVError(null);
      const response = await apiCall(`/accounts/${selectedAccount}/adjust-balance`, {
        method: "PUT",
        body: JSON.stringify({
          balance: parseFloat(balanceData.balance),
          date: balanceData.date,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const txType = result.transactionType;
        setBalanceData({
          balance: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowBalanceAdjust(false);
        fetchTransactions();
        fetchAccounts();
        const message = txType === "opening_balance"
          ? "Opening balance set successfully!"
          : "Balance adjustment recorded successfully!";
        alert(message);
      } else {
        const result = await response.json();
        setCSVError(result.message || "Failed to adjust balance");
      }
    } catch (error) {
      setCSVError(error instanceof Error ? error.message : "Failed to adjust balance");
    } finally {
      setCSVLoading(false);
    }
  };

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
          z-index: 0;
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .glow-cyan {
          --color-1: #00d9ff;
          --color-2: #0099ff;
          --glow-color: rgba(0, 217, 255, 0.8);
          --glow-color-dim: rgba(0, 217, 255, 0.3);
        }

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

        .glow-card > * {
          position: relative;
          z-index: 2;
        }

        .chart-container {
          width: 100%;
          height: 400px;
          position: relative;
          z-index: 2;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-4xl font-bold text-white">Transactions</h1>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {showForm ? "Cancel" : "+ Add Transaction"}
            </button>
            <button
              onClick={() => setShowCSVImport(!showCSVImport)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {showCSVImport ? "Cancel" : "📥 Import CSV"}
            </button>
            <button
              onClick={() => setShowBalanceAdjust(!showBalanceAdjust)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {showBalanceAdjust ? "Cancel" : "⚖️ Adjust Balance"}
            </button>
            <button
              onClick={() => navigate("/categories")}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              🏷️ Manage Categories
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddTransaction}
            className="bg-slate-800/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white placeholder-gray-500 hover:border-purple-400/50 hover:bg-slate-600/40 focus:border-purple-400 focus:outline-none transition cursor-text"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white cursor-pointer hover:border-purple-400/50 hover:bg-slate-600/40 focus:border-purple-400 focus:outline-none transition"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value, subcategory: "" })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white cursor-pointer hover:border-purple-400/50 hover:bg-slate-600/40 focus:border-purple-400 focus:outline-none transition"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon && <span>{cat.icon} </span>}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subcategory (Optional)
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white cursor-pointer hover:border-purple-400/50 hover:bg-slate-600/40 focus:border-purple-400 focus:outline-none transition"
                >
                  <option value="">-- None --</option>
                  {categories
                    .find((c) => c.name === formData.category)
                    ?.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.icon && <span>{sub.icon} </span>}
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white hover:border-purple-400/50 hover:bg-slate-600/40 focus:border-purple-400 focus:outline-none transition cursor-text"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              Add Transaction
            </button>
          </form>
        )}

        {/* CSV Import Form */}
        {showCSVImport && (
          <form
            onSubmit={handleCSVImport}
            className="bg-slate-800/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-white mb-4">Import Transactions from CSV</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account
                </label>
                <select
                  value={selectedAccount || ""}
                  onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white cursor-pointer hover:border-blue-400/50 hover:bg-slate-600/40 focus:border-blue-400 focus:outline-none transition"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setCSVFile(e.target.files?.[0] || null);
                    setCSVError(null);
                  }}
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-gray-300 cursor-pointer hover:border-blue-400/50 hover:bg-slate-600/40 focus:border-blue-400 focus:outline-none transition"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: date, amount, [type], [category], [description]
                </p>
              </div>

              {csvError && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{csvError}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={csvLoading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {csvLoading ? "Importing..." : "Import Transactions"}
            </button>
          </form>
        )}

        {/* Adjust Balance Form */}
        {showBalanceAdjust && (
          <form
            onSubmit={handleSetBalance}
            className="bg-slate-800/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-white mb-4">Adjust Balance</h2>
            <p className="text-sm text-gray-400 mb-4">
              Set an opening balance for a new account, or adjust an existing account balance if transactions are missing or incorrect.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account
                </label>
                <select
                  value={selectedAccount || ""}
                  onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white cursor-pointer hover:border-green-400/50 hover:bg-slate-600/40 focus:border-green-400 focus:outline-none transition"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Desired Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceData.balance}
                  onChange={(e) =>
                    setBalanceData({ ...balanceData, balance: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white placeholder-gray-500 hover:border-green-400/50 hover:bg-slate-600/40 focus:border-green-400 focus:outline-none transition cursor-text"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={balanceData.date}
                  onChange={(e) =>
                    setBalanceData({ ...balanceData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/40 backdrop-blur-lg border border-white/10 rounded-lg text-white hover:border-green-400/50 hover:bg-slate-600/40 focus:border-green-400 focus:outline-none transition cursor-text"
                  required
                />
              </div>

              {csvError && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{csvError}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={csvLoading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {csvLoading ? "Adjusting..." : "Adjust Balance"}
            </button>
          </form>
        )}

        {/* Chart Card */}
        <div className="mb-8">
          <div className="glow-card glow-cyan">
            <div className="flex justify-between items-center mb-6" style={{ position: "relative", zIndex: 2 }}>
              <h2 className="text-2xl font-bold text-white">
                {selectedTypes.size === 0 ? "No Data" : selectedTypes.size === 2 ? "Income & Expenses" : selectedTypes.has("expense") ? "Expenses" : "Income"} Breakdown
              </h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has("expense")}
                    onChange={(e) => {
                      const newTypes = new Set(selectedTypes);
                      if (e.target.checked) {
                        newTypes.add("expense");
                      } else {
                        newTypes.delete("expense");
                      }
                      setSelectedTypes(newTypes);
                    }}
                    className="w-4 h-4 cursor-pointer accent-red-400"
                  />
                  <span>Expenses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has("income")}
                    onChange={(e) => {
                      const newTypes = new Set(selectedTypes);
                      if (e.target.checked) {
                        newTypes.add("income");
                      } else {
                        newTypes.delete("income");
                      }
                      setSelectedTypes(newTypes);
                    }}
                    className="w-4 h-4 cursor-pointer accent-green-400"
                  />
                  <span>Income</span>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20" style={{ position: "relative", zIndex: 2 }}>
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : categoryData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => {
                      const numValue = typeof value === "number" ? value : 0;
                      return `$${numValue.toFixed(2)}`;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20" style={{ position: "relative", zIndex: 2 }}>
                <p className="text-gray-400">
                  {selectedTypes.size === 0
                    ? "Select at least one transaction type"
                    : `No ${selectedTypes.size === 2 ? "income or expense" : selectedTypes.has("expense") ? "expense" : "income"} data available`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
            {transactions.filter((t) => selectedTypes.has(t.type || "")).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {transactions.length === 0 ? "No transactions yet" : "No transactions match the selected types"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-300">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-300">
                      Category
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-300">
                      Subcategory
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-300">
                      Type
                    </th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-300">
                      Amount
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => selectedTypes.has(t.type || ""))
                    .map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {t.date ? new Date(t.date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-300 capitalize">
                        {t.category || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {t.subcategory || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            (t.type || "").toLowerCase() === "income"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {((t.type || "").charAt(0).toUpperCase() + (t.type || "").slice(1)) || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-300">
                        ${(t.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
