import { useEffect, useState } from "react";

interface DebtItem {
  id: number;
  name: string;
  type: string;
  amount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
}

export default function Debt() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/debts");
        const data = await response.json();
        setDebts(data);

        const total = data.reduce((sum: number, debt: DebtItem) => sum + debt.amount, 0);
        const payments = data.reduce((sum: number, debt: DebtItem) => sum + debt.monthlyPayment, 0);
        setTotalDebt(total);
        setTotalMonthlyPayment(payments);
      } catch (error) {
        console.error("Error fetching debts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

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

        .glow-blue {
          --color-1: #00b4ff;
          --color-2: #0066ff;
          --glow-color: rgba(0, 180, 255, 0.8);
          --glow-color-dim: rgba(0, 180, 255, 0.2);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Debt Management</h1>
        <p className="text-purple-300">Track and manage your outstanding debts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Debt Card */}
        <div className="glow-card glow-blue">
          <h3 className="text-white font-semibold text-lg mb-4">Total Debt</h3>
          <p className="text-5xl font-bold text-blue-300 mb-2">
            ${totalDebt.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Outstanding balance</p>
        </div>

        {/* Monthly Payment Card */}
        <div className="glow-card glow-blue">
          <h3 className="text-white font-semibold text-lg mb-4">Monthly Payments</h3>
          <p className="text-5xl font-bold text-blue-300 mb-2">
            ${totalMonthlyPayment.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Total monthly obligation</p>
        </div>
      </div>

      {/* Debts List */}
      <div className="glow-card glow-blue">
        <h2 className="text-2xl font-bold text-white mb-6">Debt Accounts</h2>

        {loading ? (
          <p className="text-gray-400">Loading debts...</p>
        ) : debts.length > 0 ? (
          <div className="space-y-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-blue-500/30 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{debt.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{debt.type}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-lg font-bold text-blue-300">
                      ${debt.amount.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-400">Balance</p>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Interest Rate</p>
                    <p className="text-white font-semibold">{debt.interestRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Monthly Payment</p>
                    <p className="text-white font-semibold">${debt.monthlyPayment.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-400">Due: {debt.dueDate}</p>
                  <div className="w-24 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No debts found</p>
        )}
      </div>
    </div>
  );
}
