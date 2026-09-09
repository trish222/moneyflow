import { useEffect, useState } from "react";

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  date: string;
}

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/savings-goals");
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount || 0),
          date: formData.date,
        }),
      });
      if (response.ok) {
        setFormData({
          name: "",
          targetAmount: "",
          currentAmount: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowForm(false);
        fetchGoals();
      }
    } catch (error) {
      console.error("Error adding savings goal:", error);
    }
  };

  const handleUpdateGoal = async (id: number, currentAmount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    try {
      const response = await fetch(`http://localhost:3000/api/savings-goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount,
          date: goal.date,
        }),
      });
      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error("Error updating savings goal:", error);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/savings-goals/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error("Error deleting savings goal:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Savings Goals</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            {showForm ? "Cancel" : "+ Add Goal"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddGoal}
            className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              Add Savings Goal
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading savings goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No savings goals yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(goal.date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );
              return (
                <div
                  key={goal.id}
                  className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/20 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {goal.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {daysLeft === 0
                          ? "Target reached"
                          : `${daysLeft} days remaining`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-400 hover:text-red-300 transition text-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">
                      ${goal.currentAmount.toFixed(2)} / $
                      {goal.targetAmount.toFixed(2)}
                    </p>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleUpdateGoal(goal.id, goal.currentAmount + 50)
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      +$50
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateGoal(
                          goal.id,
                          Math.max(0, goal.currentAmount - 50)
                        )
                      }
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      -$50
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
