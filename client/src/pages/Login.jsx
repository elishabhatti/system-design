import React from 'react'

export const Login = () => (
  <div className="max-w-sm mx-auto mt-20 p-6 border rounded-xl bg-white shadow-sm">
    <h2 className="text-xl font-bold mb-4">Sign In</h2>
    <input type="email" placeholder="Email" className="w-full p-2 mb-3 border rounded text-sm" />
    <input type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded text-sm" />
    <button className="w-full bg-blue-600 text-white py-2 rounded font-medium text-sm">Login</button>
  </div>
);
