import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Login failed");
        return;
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)' }}>
      <style>{`
        .glow-card {
          position: relative;
          border-radius: 1.5rem;
          padding: 2rem;
          background: rgba(10, 15, 30, 0.3);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 0.3px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .glow-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background:
            linear-gradient(to top, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.3) 5%, transparent 15%),
            radial-gradient(ellipse 20% 250% at 1% 115%, rgba(168, 85, 247, 0.3) 0%, transparent 25%),
            radial-gradient(ellipse 20% 250% at 99% 115%, rgba(168, 85, 247, 0.3) 0%, transparent 25%),
            linear-gradient(to top, rgba(168, 85, 247, 0.6) 0%, rgba(168, 85, 247, 0.4) 20%, transparent 70%);
          z-index: 1;
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .glow-card > * {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="glow-card w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">moneyflow</h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 cursor-text hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition"
              placeholder="trish@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 cursor-text hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg font-medium transition cursor-pointer mt-6"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition cursor-pointer">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
