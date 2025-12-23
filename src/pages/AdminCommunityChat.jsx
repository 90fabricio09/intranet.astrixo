import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/AdminCommunityChat.css';

export default function AdminCommunityChat() {
  const { categoryId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Carregar dados da categoria
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const catDoc = await getDoc(doc(db, 'categories', categoryId));
        if (catDoc.exists()) {
          setCategory({ id: catDoc.id, ...catDoc.data() });
        }
      } catch (error) {
        console.error('Erro ao carregar categoria:', error);
      }
    };
    loadCategory();
  }, [categoryId]);

  // Escutar mensagens em tempo real
  useEffect(() => {
    const messagesRef = collection(db, 'communityMessages', categoryId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: false }, (snapshot) => {
      const msgs = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data()
        }))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || Date.now();
          const timeB = b.createdAt?.toMillis?.() || Date.now();
          return timeA - timeB;
        });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao escutar mensagens:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryId]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'communityMessages', categoryId, 'messages');
      await addDoc(messagesRef, {
        text,
        userId: currentUser.uid,
        userName: userProfile?.fullName || currentUser.displayName || currentUser.email,
        isAdmin: true,
        userPhoto: userProfile?.photoBase64 || null,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, originalText, msgUserId) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    const isOwnMessage = msgUserId === currentUser.uid;
    try {
      await updateDoc(doc(db, 'communityMessages', categoryId, 'messages', messageId), {
        deleted: true,
        deletedBy: isOwnMessage ? 'user' : 'admin',
        deletedByName: isOwnMessage ? null : (userProfile?.fullName || currentUser.email),
        originalText: originalText
      });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
    }
  };

  const handleEditMessage = async (messageId, currentText) => {
    const newText = prompt('Editar mensagem:', currentText);
    if (!newText || newText.trim() === currentText) return;
    try {
      await updateDoc(doc(db, 'communityMessages', categoryId, 'messages', messageId), {
        text: newText.trim(),
        edited: true
      });
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = msg.createdAt ? formatDate(msg.createdAt) : 'Agora';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="loading">
            <i className="bi bi-arrow-repeat loading-icon"></i>
            <span>Carregando chat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-chat-container">
        {/* Header */}
        <div className="admin-chat-header">
          <button className="admin-chat-back-btn" onClick={() => navigate('/admin/community')}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="admin-chat-header-info">
            <h2>{category?.name || 'Chat'}</h2>
            <span>{messages.length} mensagens</span>
          </div>
        </div>

        {/* Mensagens */}
        <div className="admin-chat-messages">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="admin-chat-date-divider">
                <span>{date}</span>
              </div>
              {msgs.map((msg) => {
                const isOwn = msg.userId === currentUser.uid;
                return (
                  <div key={msg.id} className={`admin-chat-message ${isOwn ? 'own' : ''}`}>
                    {!isOwn && (
                      <div className="admin-chat-message-avatar">
                        {msg.userPhoto ? (
                          <img src={msg.userPhoto} alt="" />
                        ) : (
                          <span>{(msg.userName || '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    <div className={`admin-chat-message-bubble ${msg.deleted ? 'deleted' : ''}`}>
                      {!isOwn && <div className="admin-chat-message-name">{msg.userName} {msg.isAdmin && <span className="admin-tag">ADMIN</span>}</div>}
                      {msg.deleted ? (
                        <div className="admin-chat-message-text deleted-text">
                          <i className="bi bi-trash"></i> 
                          {msg.deletedBy === 'admin' ? (
                            <>Removida por <span className="admin-tag">ADMIN</span> ({msg.deletedByName || 'Admin'})</>
                          ) : (
                            'Excluída pelo usuário'
                          )}
                          <div className="admin-original-text">Original: {msg.originalText || msg.text}</div>
                        </div>
                      ) : (
                        <div className="admin-chat-message-text">
                          {msg.text}
                          {msg.edited && <span className="edited-tag">(editada)</span>}
                        </div>
                      )}
                      <div className="admin-chat-message-footer">
                        <span className="admin-chat-message-time">{formatTime(msg.createdAt)}</span>
                        {isOwn && !msg.deleted && (
                          <button
                            className="admin-chat-edit-btn"
                            onClick={() => handleEditMessage(msg.id, msg.text)}
                            title="Editar mensagem"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {!msg.deleted && (
                          <button
                            className="admin-chat-delete-btn"
                            onClick={() => handleDeleteMessage(msg.id, msg.text, msg.userId)}
                            title="Excluir mensagem"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="admin-chat-input-bar" onSubmit={handleSend}>
          <textarea
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            disabled={sending}
            rows={1}
          />
          <button type="submit" disabled={sending || !newMessage.trim()}>
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

