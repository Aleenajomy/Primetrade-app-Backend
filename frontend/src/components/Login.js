import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { setUser } = useAuth();

  const handleLogin = () => {
    setUser({ id: 1, name: 'Demo User', email: 'demo@test.com', role: 'user' });
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Primetrade Login</h1>
      <button 
        onClick={handleLogin}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#4f46e5', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click to Login
      </button>
    </div>
  );
};

export default Login;