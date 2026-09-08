/* App.tsx is the interactive React UI
 * - it renders into the root element provided by index.html and updates the DOM when the state changes.
 * - it uses React Router to decide which page to display (Dashboard, Transactions, Budgets).
 */
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Investments from "./pages/Investments";
import Debt from "./pages/Debt";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Navigation Bar */}
        <nav className="bg-slate-900/80 backdrop-blur border-b border-purple-500/20">
          <div className="w-full px-4 md:px-8 py-4">
            <div className="flex items-center justify-between gap-8">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex-shrink-0">
                MoneyFlow
              </Link>

              <ul className="flex gap-6 md:gap-10 flex-wrap justify-center flex-1">
                <li>
                  <Link
                    to="/"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Dashboard
                  </Link>
                </li>

                <li>
                  <Link
                    to="/transactions"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Transactions
                  </Link>
                </li>

                <li>
                  <Link
                    to="/budgets"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Budgets
                  </Link>
                </li>

                <li>
                  <Link
                    to="/investments"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Investments
                  </Link>
                </li>

                <li>
                  <Link
                    to="/debt"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Debt
                  </Link>
                </li>

                <li>
                  <Link
                    to="/savings"
                    className="text-gray-300 hover:text-purple-400 font-medium transition"
                  >
                    Savings
                  </Link>
                </li>
              </ul>

              <div className="flex gap-4 items-center flex-shrink-0">
                <button className="text-gray-300 hover:text-purple-400 transition">
                  🌙
                </button>
                <button className="text-gray-300 hover:text-purple-400 transition">
                  ⚙️
                </button>
                <button className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition">
                  👤
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/debt" element={<Debt />} />
            <Route path="/savings" element={<Savings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
