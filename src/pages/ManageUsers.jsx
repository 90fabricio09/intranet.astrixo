import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/ManageUsers.css';

export default function ManageUsers() {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    // Solicitar senha do admin antes de criar o usuário
    setShowPasswordModal(true);
  };

  const handleCreateUser = async () => {
    if (!adminCredentials.password) {
      setMessage({ type: 'error', text: 'Digite sua senha de admin para continuar' });
      return;
    }

    setLoading(true);
    setShowPasswordModal(false);

    try {
      // Salvar email do admin atual
      const adminEmail = currentUser.email;

      // Criar o novo usuário (isso fará login automático com o novo usuário)
      const created = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const createdUid = created.user.uid;
      
      // Fazer logout imediatamente
      await signOut(auth);
      
      // Fazer login novamente com a conta admin
      await signInWithEmailAndPassword(auth, adminEmail, adminCredentials.password);

      // Salvar perfil do aluno no Firestore (agora como admin)
      await setDoc(doc(db, 'users', createdUid), {
        email: formData.email.toLowerCase().trim(),
        role: 'student',
        createdAt: serverTimestamp()
      }, { merge: true });
      
      setMessage({ type: 'success', text: `Conta criada com sucesso! Email: ${formData.email}` });
      setFormData({ email: '', password: '', confirmPassword: '' });
      setAdminCredentials({ email: '', password: '' });
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        setShowModal(false);
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      let errorMessage = 'Erro ao criar conta';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha de admin incorreta. Tente novamente.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Senha de admin incorreta. Tente novamente.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setAdminCredentials({ email: '', password: '' });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setFormData({ email: '', password: '', confirmPassword: '' });
    setAdminCredentials({ email: '', password: '' });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1>Gerenciar Usuários</h1>
            <p>Crie contas de acesso para o curso</p>
          </div>
          <button className="btn-primary" onClick={openNewModal}>
            + Novo Usuário
          </button>
        </div>

        <div className="info-card">
          <div className="info-icon"><i className="bi bi-info-circle-fill"></i></div>
          <div className="info-content">
            <h3>Como funciona</h3>
            <p>
              Crie contas de acesso para seus alunos. Eles receberão um email e senha 
              para acessar a plataforma de cursos em <strong>curso.astrixo.com.br</strong>
            </p>
            <ul>
              <li>O email será usado como login</li>
              <li>A senha deve ter no mínimo 6 caracteres</li>
              <li>Compartilhe as credenciais com o aluno de forma segura</li>
              <li><strong>Você precisará confirmar sua senha de admin ao criar cada usuário</strong></li>
            </ul>
          </div>
        </div>

        <div className="tips-card">
          <h3><i className="bi bi-shield-fill-check"></i> Dicas de Segurança</h3>
          <ul>
            <li>Use senhas fortes e únicas para cada usuário</li>
            <li>Oriente os alunos a alterarem a senha no primeiro acesso</li>
            <li>Não compartilhe senhas por canais inseguros</li>
            <li>Mantenha um registro das contas criadas</li>
            <li><strong>Sua sessão de admin permanecerá ativa após criar usuários</strong></li>
          </ul>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Criar Nova Conta</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email do Aluno</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="aluno@exemplo.com"
                  />
                  <small>Este será o login do usuário</small>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Senha do Aluno</label>
                  <div className="password-input-wrapper">
                  <input
                      type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                  />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Senha</label>
                  <div className="password-input-wrapper">
                  <input
                      type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    placeholder="Digite a senha novamente"
                    minLength="6"
                  />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <i className={showConfirmPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                    </button>
                  </div>
                </div>

                <div className="warning-box">
                  <strong><i className="bi bi-exclamation-triangle-fill"></i> Importante:</strong> Anote as credenciais antes de criar a conta. 
                  Você precisará compartilhá-las com o usuário. <strong>Sua senha de admin será solicitada para confirmar a criação.</strong>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    Continuar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirme sua Senha de Admin</h2>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              
              <div className="modal-body-confirm">
                <div className="confirm-icon">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <p className="confirm-message">
                  Para manter sua sessão ativa após criar o usuário, precisamos confirmar sua senha de administrador.
                </p>
                
                <div className="user-info-box">
                  <div className="user-info-row">
                    <strong>Admin atual:</strong> {currentUser?.email}
                  </div>
                  <div className="user-info-row">
                    <strong>Novo usuário:</strong> {formData.email}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="adminPassword">Sua Senha de Admin</label>
                  <div className="password-input-wrapper">
                  <input
                      type={showAdminPassword ? "text" : "password"}
                    id="adminPassword"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                    required
                    placeholder="Digite sua senha de admin"
                    autoFocus
                  />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      aria-label={showAdminPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <i className={showAdminPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                    </button>
                  </div>
                </div>

                <div className="info-message">
                  <i className="bi bi-info-circle-fill"></i>
                  <span>Após criar o usuário, você permanecerá logado como admin automaticamente.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowPasswordModal(false)}
                  disabled={loading}
                >
                  Voltar
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleCreateUser}
                  disabled={loading || !adminCredentials.password}
                >
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
