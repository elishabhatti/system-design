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
    <div className="max-w-sm mx-auto mt-20 p-6 border border-[#272727] rounded-xl bg-[#121212] text-white shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create Account</h2>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <form onSubmit={handleRegister} className="space-y-3">
        <input 
          type="text" 
          placeholder="Channel Name" 
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="w-full p-2 bg-[#1f1f1f] border border-[#333] rounded text-sm outline-none focus:border-white" 
        />
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
          Register
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-white underline">Sign In</Link>
      </p>
    </div>
  );
}