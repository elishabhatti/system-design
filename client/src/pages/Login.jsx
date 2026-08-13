import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const data = await loginUser({ email, password });
      setAuthUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border border-[#272727] rounded-xl bg-[#121212] text-white shadow-lg">
      <h2 className="text-xl font-bold mb-4">Sign In</h2>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-3">
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-[#1f1f1f] border border-[#333] rounded text-sm outline-none focus:border-white" 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 bg-[#1f1f1f] border border-[#333] rounded text-sm outline-none focus:border-white" 
        />
        <button type="submit" className="w-full bg-white text-black py-2 rounded font-medium text-sm hover:bg-gray-200 transition">
          Login
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Don't have an account? <Link to="/register" className="text-white underline">Register</Link>
      </p>
    </div>
  );
}