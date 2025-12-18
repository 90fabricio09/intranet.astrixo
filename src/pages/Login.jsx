import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Verificar se o email é de admin ANTES de tentar login
    const adminEmails = ['admin@astrixo.com', 'fabriciobetta88@gmail.com'];
    
    if (!adminEmails.includes(email.toLowerCase().trim())) {
      setError('Email ou senha incorretos');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError('Email ou senha incorretos');
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Por favor, insira seu email antes de solicitar a redefinição de senha');
      return;
    }

    setError('');
    setSuccess('');
    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Email de redefinição de senha enviado! Verifique sua caixa de entrada (e também Spam/Lixo eletrônico).');
    } catch (err) {
      setError('Erro ao enviar email de redefinição. Verifique se o email está correto.');
    }

    setResetLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Astrixo Admin</h1>
          <p>{mode === 'login' ? 'Área Administrativa' : 'Redefina sua senha'}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@astrixo.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordReset();
            }}
            className="login-form"
          >
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@astrixo.com"
              />
            </div>

            <button type="submit" disabled={resetLoading} className="login-button">
              {resetLoading ? 'Enviando...' : 'Enviar email de redefinição'}
            </button>
          </form>
        )}
        
        <div className="login-footer">
          {mode === 'login' ? (
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setMode('reset');
              }}
              className="reset-password-link"
              type="button"
            >
              Esqueceu sua senha?
            </button>
          ) : (
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setPassword('');
                setMode('login');
              }}
              className="reset-password-link"
              type="button"
            >
              Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

