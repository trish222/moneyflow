import { useEffect, useState } from "react";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  date: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense",
    category: "food",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/transactions");
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
      const response = await fetch("http://localhost:3000/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(
        `http://localhost:3000/api/transactions/${id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const categories = ["food", "entertainment", "utilities", "salary", "business", "other"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Transactions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            {showForm ? "Cancel" : "+ Add Transaction"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddTransaction}
            className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
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
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              Add Transaction
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No transactions yet</p>
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
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300 capitalize">
                        {t.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            t.type === "income"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-300">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-red-400 hover:text-red-300 transition"
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
