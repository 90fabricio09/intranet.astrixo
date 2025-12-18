import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import '../styles/AdminSidebar.css';
import astrixoLogo from '../assets/astrixo.png';

export default function AdminSidebar() {
  const { logout, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketNotifications, setTicketNotifications] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      let unreadCount = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Conta tickets não lidos pelo admin (adminRead false ou não existe)
        if (data.adminRead === false || (data.adminRead === undefined && data.status !== 'closed' && data.status !== 'resolved')) {
          unreadCount++;
        }
      });
      setTicketNotifications(unreadCount);
    }, (error) => {
      console.error('Erro ao buscar tickets:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/admin/categories', label: 'Categorias', icon: 'bi-folder-fill' },
    { path: '/admin/courses', label: 'Cursos', icon: 'bi-book-fill' },
    { path: '/admin/users', label: 'Usuários', icon: 'bi-people-fill' },
    { path: '/admin/community', label: 'Comunidade', icon: 'bi-chat-dots-fill' },
    { path: '/admin/tickets', label: 'Tickets', icon: 'bi-ticket-detailed-fill', badge: ticketNotifications }
  ];

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={astrixoLogo} alt="Astrixo Admin" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
            >
              <i className={`nav-icon ${item.icon}`}></i>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(userProfile?.fullName || currentUser?.email || '?')?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <p className="user-email">{userProfile?.fullName || currentUser?.email}</p>
              <span className="admin-badge">Admin</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </aside>
      
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}
