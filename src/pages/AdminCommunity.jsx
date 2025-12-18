import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, getDocs, writeBatch } from 'firebase/firestore';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/AdminCommunity.css';

export default function AdminCommunity() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  // Categoria "Geral" fixa (sempre aparece primeiro)
  const GENERAL_CATEGORY = {
    id: 'geral',
    name: 'Geral',
    description: 'Conversas gerais, dúvidas e networking com a comunidade'
  };

  const loadCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, 'categories'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories([GENERAL_CATEGORY, ...categoriesData]);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([GENERAL_CATEGORY]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/admin/community/${categoryId}`);
  };

  const handleClearChat = async (e, categoryId, categoryName) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja limpar todas as mensagens do chat "${categoryName}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const messagesRef = collection(db, 'communityMessages', categoryId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      if (messagesSnapshot.empty) {
        alert('O chat já está vazio.');
        return;
      }
      
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      alert(`${messagesSnapshot.size} mensagens excluídas com sucesso!`);
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
      alert('Erro ao limpar chat. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="loading">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1>
              <i className="bi bi-chat-dots-fill" style={{ marginRight: 12, color: '#4f46e5' }}></i>
              Comunidade
            </h1>
            <p>Participe das conversas com os alunos</p>
          </div>
        </div>

        <div className="admin-community-list">
          {categories.map(category => (
            <div
              key={category.id}
              className={`admin-community-card ${category.id === 'geral' ? 'general' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="admin-community-icon">
                <i className={`bi ${category.id === 'geral' ? 'bi-globe' : 'bi-chat-square-text-fill'}`}></i>
              </div>
              <div className="admin-community-info">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <div className="admin-community-actions">
                <button
                  className="btn-clear-chat"
                  onClick={(e) => handleClearChat(e, category.id, category.name)}
                  title="Limpar todas as mensagens"
                >
                  <i className="bi bi-trash"></i>
                </button>
                <button
                  className="btn-enter-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category.id);
                  }}
                >
                  Entrar no Chat →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

