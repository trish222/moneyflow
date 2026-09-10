import { useEffect, useState } from "react";

interface Budget {
  id: number;
  category?: string;
  limit?: number;
  spent?: number;
  month?: number;
  year?: number;
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [formData, setFormData] = useState({
    category: "food",
    limit: "",
  });

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/budgets?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          limit: parseFloat(formData.limit),
          month: selectedMonth,
          year: selectedYear,
        }),
      });
      if (response.ok) {
        setFormData({ category: "food", limit: "" });
        setShowForm(false);
        fetchBudgets();
      }
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchBudgets();
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const categories = ["food", "transport", "entertainment", "utilities", "health", "shopping", "other"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Budgets</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            {showForm ? "Cancel" : "+ Add Budget"}
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 font-medium"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 font-medium"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddBudget}
            className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
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
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              Add Budget
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No budgets set for this month</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const limit = budget.limit || 0;
              const percentage = limit > 0 ? (spent / limit) * 100 : 0;
              let barColor = "bg-blue-500";
              let statusColor = "text-blue-400";

              if (percentage > 100) {
                barColor = "bg-red-500";
                statusColor = "text-red-400";
              } else if (percentage > 75) {
                barColor = "bg-yellow-500";
                statusColor = "text-yellow-400";
              }

              return (
                <div
                  key={budget.id}
                  className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/20 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {budget.category}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {months[selectedMonth - 1]} {selectedYear}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-red-400 hover:text-red-300 transition text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className={`text-sm font-medium ${statusColor}`}>
                        {percentage.toFixed(0)}% used
                      </span>
                      <span className="text-sm text-gray-400">
                        ${spent.toFixed(2)} / ${limit.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`${barColor} h-3 rounded-full transition-all`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {percentage > 100 && (
                    <p className="text-red-400 text-sm">
                      Over budget by ${(spent - limit).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
