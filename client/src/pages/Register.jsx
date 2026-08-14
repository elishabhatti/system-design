import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [channelName, setChannelName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-zinc-800 rounded-2xl bg-[#121217] text-zinc-100 shadow-2xl backdrop-blur-md">
      <h2 className="text-xl font-bold mb-2 tracking-tight">Create Account</h2>
      <p className="text-xs text-zinc-400 mb-6">Initialize your creator channel workspace.</p>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Channel Name</label>
          <input 
            type="text" 
            placeholder="Elisha Jameel" 
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
          <input 
            type="email" 
            placeholder="elisha@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition" 
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer">
          Create Account
        </button>
      </form>
      <p className="text-xs text-zinc-500 mt-6 text-center">
        Already have an account? <Link to="/login" className="text-indigo-400 font-medium hover:underline">Sign In</Link>
      </p>
    </div>
  );
}