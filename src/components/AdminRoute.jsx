import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        <i className="bi bi-arrow-repeat" style={{ 
          fontSize: '1.5rem', 
          animation: 'spin 1s linear infinite',
          color: '#5043e8'
        }}></i>
        <span>Carregando...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#333' }}>Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return children;
}

