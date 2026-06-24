/* App.tsx is the interactive React UI
 * - it renders into the root element provided by index.html and updates the DOM when the state changes.
 * - it uses React Router to navigate between pages (Dashboard, Transactions, Budgets).
 */
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-purple-600">MoneyFlow</h1>
              <ul className="flex gap-6">
                <li>
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-purple-600 font-medium"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/transactions"
                    className="text-gray-700 hover:text-purple-600 font-medium"
                  >
                    Transactions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/budgets"
                    className="text-gray-700 hover:text-purple-600 font-medium"
                  >
                    Budgets
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
