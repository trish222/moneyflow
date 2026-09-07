import { useEffect, useState } from "react";

interface Budget {
  id: number;
  category: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-purple-600">Budgets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          {showForm ? "Cancel" : "Add Budget"}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
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
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Monthly Limit</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Add Budget
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-center text-gray-500">No budgets set for this month</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100;
            const isOverBudget = budget.spent > budget.limit;
            return (
              <div key={budget.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 capitalize">
                      {budget.category}
                    </h2>
                    <p className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                      ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOverBudget
                        ? "bg-red-600"
                        : percentage > 75
                        ? "bg-yellow-600"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
