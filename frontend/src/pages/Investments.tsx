import { useEffect, useState } from "react";

interface Investment {
  id: number;
  investmentAccountId?: number;
  name?: string;
  type?: string;
  value?: number;
  gain?: number;
  percentage?: number;
}

interface InvestmentAccount {
  id: number;
  name?: string;
  accountType?: string;
  investments?: Investment[];
}

export default function Investments() {
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("Brokerage");
  const [newInvName, setNewInvName] = useState("");
  const [newInvType, setNewInvType] = useState("stock");
  const [newInvValue, setNewInvValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingInvId, setEditingInvId] = useState<number | null>(null);

  const accountTypes = ["Brokerage", "401k", "Roth IRA", "Traditional IRA", "HSA"];
  const investmentTypes = ["stock", "etf", "crypto", "bond", "mutual fund", "commodity"];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/investment-accounts");
      const accountsData = await response.json();

      // Fetch investments for each account
      const accountsWithInvestments = await Promise.all(
        accountsData.map(async (account: InvestmentAccount) => {
          try {
            const invResponse = await fetch(`http://localhost:3000/api/investment-accounts/${account.id}`);
            const fullAccount = await invResponse.json();
            return fullAccount;
          } catch {
            return account;
          }
        })
      );

      setAccounts(accountsWithInvestments);
      if (accountsWithInvestments.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountsWithInvestments[0].id);
      }
    } catch (error) {
      console.error("Error fetching investment accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/investment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName,
          accountType: newAccountType,
        }),
      });
      if (response.ok) {
        setNewAccountName("");
        setNewAccountType("Brokerage");
        setShowAccountForm(false);
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error adding investment account:", error);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    try {
      const response = await fetch("http://localhost:3000/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newInvName,
          type: newInvType,
          value: parseFloat(newInvValue),
          investmentAccountId: selectedAccountId,
          date: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        setNewInvName("");
        setNewInvType("stock");
        setNewInvValue("");
        setShowInvestmentForm(false);
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error adding investment:", error);
    }
  };

  const handleDeleteInvestment = async (investmentId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/investments/${investmentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error deleting investment:", error);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/investment-accounts/${accountId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (selectedAccountId === accountId) {
          setSelectedAccountId(null);
        }
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const selectedAccount = selectedAccountId ? accounts.find((acc) => acc.id === selectedAccountId) : null;
  const accountInvestments = selectedAccountId
    ? selectedAccount?.investments || []
    : accounts.flatMap((acc) => acc.investments || []);
  const totalValue = accountInvestments.reduce((sum: number, inv: Investment) => sum + (inv.value || 0), 0);
  const totalGain = accountInvestments.reduce((sum: number, inv: Investment) => sum + (inv.gain || 0), 0);

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Investments</h1>
          <p className="text-purple-300">Portfolio Overview & Performance</p>
        </div>
        <button
          onClick={() => setShowAccountForm(!showAccountForm)}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          {showAccountForm ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {/* Add Account Form */}
      {showAccountForm && (
        <form
          onSubmit={handleAddAccount}
          className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6 mb-8 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Name</label>
              <input
                type="text"
                required
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                placeholder="e.g., Fidelity Brokerage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Create Account
          </button>
        </form>
      )}

      {/* Account Selector */}
      {!loading && accounts.length > 0 && (
        <div className="mb-8 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Account:</label>
            <select
              value={selectedAccountId || "all"}
              onChange={(e) => setSelectedAccountId(e.target.value === "all" ? null : Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-gray-300 text-sm hover:border-green-400 focus:border-green-400 focus:outline-none transition"
            >
              <option value="all">All Accounts - Total Portfolio</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name || "Unknown"} ({account.accountType || "Unknown"})
                </option>
              ))}
            </select>
          </div>
          {selectedAccountId && (
            <button
              onClick={() => handleDeleteAccount(selectedAccountId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
              title="Delete selected account"
            >
              Delete Account
            </button>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Contributions Card */}
        <div className="glow-card glow-green">
          <h3 className="text-white font-semibold text-lg mb-4">Total Contributions</h3>
          <p className="text-4xl font-bold text-green-300 mb-2">
            ${(() => {
              const totalContributions = (totalValue || 0) - (totalGain || 0);
              return Math.max(0, totalContributions).toFixed(2);
            })()}
          </p>
          <p className="text-xs text-gray-400">Amount invested</p>
        </div>

        {/* Portfolio Value Card */}
        <div className="glow-card glow-green">
          <h3 className="text-white font-semibold text-lg mb-4">Portfolio Value</h3>
          <p className="text-4xl font-bold text-green-300 mb-2">
            ${(totalValue || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">Current worth</p>
        </div>

        {/* Total Gain Card */}
        <div className="glow-card glow-green">
          <h3 className="text-white font-semibold text-lg mb-4">Total Gain/Loss</h3>
          <p className={`text-4xl font-bold mb-2 ${(totalGain || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${(totalGain || 0).toFixed(2)}
          </p>
          <p className={`text-xs ${(totalGain || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {(() => {
              const totalContributions = Math.max(1, (totalValue || 0) - (totalGain || 0));
              const percentageGain = ((totalGain || 0) / totalContributions * 100).toFixed(1);
              return `${(totalGain || 0) >= 0 ? "+" : ""}${percentageGain}% return`;
            })()}
          </p>
        </div>
      </div>

      {/* Add Investment Form */}
      {!loading && selectedAccountId && (
        <>
          {showInvestmentForm && (
            <form
              onSubmit={handleAddInvestment}
              className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6 mb-8 space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Asset Name</label>
                  <input
                    type="text"
                    required
                    value={newInvName}
                    onChange={(e) => setNewInvName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                    placeholder="e.g., Apple Stock"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={newInvType}
                    onChange={(e) => setNewInvType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    {investmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvValue}
                    onChange={(e) => setNewInvValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Add Investment
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvestmentForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {!showInvestmentForm && (
            <button
              onClick={() => setShowInvestmentForm(true)}
              className="mb-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              + Add Investment
            </button>
          )}
        </>
      )}

      {/* Holdings */}
      <div className="glow-card glow-green">
        <h2 className="text-2xl font-bold text-white mb-6">Holdings</h2>

        {loading ? (
          <p className="text-gray-400">Loading investments...</p>
        ) : accountInvestments.length > 0 ? (
          <div className="space-y-4">
            {accountInvestments.map((investment) => (
              <div
                key={investment.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-green-500/30 transition relative group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{investment.name || "Unknown"}</h3>
                    <p className="text-xs text-gray-400 capitalize">{investment.type || "Unknown"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-right">
                      <span className="text-lg font-bold text-green-300">
                        ${(investment.value || 0).toFixed(2)}
                      </span>
                    </p>
                    <button
                      onClick={() => handleDeleteInvestment(investment.id)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition text-lg"
                      title="Delete investment"
                    >
                      ✕
                    </button>
                  </div>
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
          <p className="text-gray-400">
            {accounts.length === 0 ? "No investment accounts yet. Create one to get started!" : "No investments in this account"}
          </p>
        )}
      </div>
    </div>
  );
}
