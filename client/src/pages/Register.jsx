import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, UserPlus, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [channelName, setChannelName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const [error, setError] = useState('');
  const { loginUser: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const data = await registerUser({ channelName, email, password });
      setAuthUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 text-zinc-100 selection:bg-white selection:text-black">
      {/* Main Container Card */}
      <div className="w-full bg-[#0a0a0a] max-w-5xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side: Register Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-3 h-3 bg-white rounded-full shadow-lg shadow-white/20 animate-pulse"></div>
              <span className="font-bold text-xs tracking-wider uppercase text-zinc-400">ORBIT</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Create an Account
            </h1>
            <p className="text-sm text-zinc-400 mb-8 font-normal leading-relaxed">
              Initialize your creator channel workspace and start publishing today.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-zinc-200 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Channel Name</label>
                <input 
                  type="text" 
                  placeholder="Elisha Jameel" 
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-2xl text-sm text-zinc-100 outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition placeholder-zinc-700 font-medium" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="elisha@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-2xl text-sm text-zinc-100 outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition placeholder-zinc-700 font-medium" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 pr-12 bg-black border border-zinc-800 rounded-2xl text-sm text-zinc-100 outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition placeholder-zinc-700 font-medium" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full group flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-bold text-sm shadow-xl shadow-white/5 transition-all duration-300 cursor-pointer mt-2 active:scale-[0.99]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">
              Already have an account? <Link to="/login" className="text-white font-bold hover:underline underline-offset-4">Sign In</Link>
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
              <a href="#" className="hover:text-zinc-300 transition">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-zinc-300 transition">Privacy</a>
            </div>
          </div>
        </div>

        {/* Right Side: Monochrome Minimalist Graphic Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#050505] border-l border-zinc-900 relative overflow-hidden">
          
          {/* Top header decoration */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Video Ecosystem
            </div>
          </div>

          {/* Central Artistic Element */}
          <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-2xl mb-6">
              <UserPlus className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
              Launch Your Creator Journey
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Build your channel, upload masterclasses, stream live sessions, and connect with global developers seamlessly.
            </p>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span className="tracking-wider uppercase font-mono text-[11px] text-zinc-600">SECURE REGISTRATION</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-white" /> Verified Workspace
            </span>
          </div>

          {/* Subtle Ambient Glow */}
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}