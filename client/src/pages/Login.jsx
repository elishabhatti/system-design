import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Terminal, Code2, Cpu } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const data = await loginUser({ email, password });
      setAuthUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Main Container Card */}
      <div className="w-full max-w-5xl backdrop-blur-xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></span>
              <span className="font-bold text-2xl tracking-widest uppercase text-zinc-300">
                Studio
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl tracking-tight text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-xs text-zinc-400 mb-8 font-normal">
              Please sign in to access your creator dashboard.
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="elisha@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition placeholder-zinc-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-400">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition placeholder-zinc-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded bg-[#09090b] border-zinc-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-zinc-400 select-none"
                >
                  Remember Me
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/25 transition duration-300 cursor-pointer mt-2"
              >
                Sign In
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-400 font-semibold hover:underline"
              >
                Register
              </Link>
            </p>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-medium">
              <a href="#" className="hover:text-zinc-300 transition">
                GitHub
              </a>
              <span>•</span>
              <a href="#" className="hover:text-zinc-300 transition">
                Twitter
              </a>
              <span>•</span>
              <a href="#" className="hover:text-zinc-300 transition">
                Discord
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Dark Themed Branding & Graphic Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950/40 via-[#09090b] to-violet-950/40 border-l border-zinc-800/80 relative overflow-hidden">
          {/* Top navigation links mimicking the reference layout */}

          {/* Central Artistic Element / Tech Graphic */}
          <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/20 mb-6 animate-pulse">
              <Terminal className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-3">
              Engineering Scalable Systems & Masterclasses
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Dive deep into full-stack architecture, clean code practices, and
              modern web engineering logs.
            </p>
          </div>

          {/* Bottom subtle badge */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>SECURE AUTH v2.4</span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-3 h-3" /> Encrypted Session
            </span>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
