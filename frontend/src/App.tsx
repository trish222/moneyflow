import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Investments from "./pages/Investments";
import Debt from "./pages/Debt";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";

interface User {
  id: number;
  email: string;
  name?: string;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)' }}>
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      {/* Navigation Bar */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-purple-500/20">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex-shrink-0 cursor-pointer hover:opacity-80 transition"
            >
              moneyflow
            </Link>

            <ul className="flex gap-6 md:gap-10 flex-wrap justify-center flex-1">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  to="/transactions"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Transactions
                </Link>
              </li>

              <li>
                <Link
                  to="/budgets"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Budgets
                </Link>
              </li>

              <li>
                <Link
                  to="/investments"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Investments
                </Link>
              </li>

              <li>
                <Link
                  to="/debt"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Debt
                </Link>
              </li>

              <li>
                <Link
                  to="/savings"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Savings
                </Link>
              </li>

              <li>
                <Link
                  to="/reports"
                  className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer"
                >
                  Reports
                </Link>
              </li>
            </ul>

            <div className="flex gap-4 items-center flex-shrink-0">
              <span className="text-gray-300 text-sm">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-red-400 transition cursor-pointer font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/debt" element={<Debt />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
