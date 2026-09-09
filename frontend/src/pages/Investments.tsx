import { useEffect, useState } from "react";

interface Investment {
  id: number;
  name: string;
  type: string;
  value: number;
  gain?: number;
  percentage?: number;
}

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/investments");
        const data = await response.json();
        setInvestments(data);

        const total = data.reduce((sum: number, inv: Investment) => sum + inv.value, 0);
        const gains = data.reduce((sum: number, inv: Investment) => sum + (inv.gain || 0), 0);
        setTotalValue(total);
        setTotalGain(gains);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
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

        .glow-green {
          --color-1: #00d97e;
          --color-2: #00a86b;
          --glow-color: rgba(0, 217, 126, 0.8);
          --glow-color-dim: rgba(0, 217, 126, 0.2);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Investments</h1>
        <p className="text-purple-300">Portfolio Overview & Performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Value Card */}
        <div className="glow-card glow-green">
          <h3 className="text-white font-semibold text-lg mb-4">Portfolio Value</h3>
          <p className="text-5xl font-bold text-green-300 mb-2">
            ${totalValue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Total investment amount</p>
        </div>

        {/* Total Gain Card */}
        <div className="glow-card glow-green">
          <h3 className="text-white font-semibold text-lg mb-4">Total Gain</h3>
          <p className={`text-5xl font-bold mb-2 ${totalGain >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${totalGain.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Overall performance</p>
        </div>
      </div>

      {/* Investments List */}
      <div className="glow-card glow-green">
        <h2 className="text-2xl font-bold text-white mb-6">Holdings</h2>

        {loading ? (
          <p className="text-gray-400">Loading investments...</p>
        ) : investments.length > 0 ? (
          <div className="space-y-4">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-green-500/30 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{investment.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{investment.type}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-lg font-bold text-green-300">
                      ${investment.value.toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(investment.percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  {investment.gain !== undefined && (
                    <span
                      className={`ml-4 font-semibold text-sm ${
                        investment.gain >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {investment.gain >= 0 ? "+" : ""}${investment.gain.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No investments found</p>
        )}
      </div>
    </div>
  );
}
