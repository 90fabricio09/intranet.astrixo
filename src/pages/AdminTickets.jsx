import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/AdminTickets.css';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar localmente
      ticketsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Atualiza o ticket selecionado quando os tickets mudam
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets]);

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    
    // Marca como lido pelo admin
    if (ticket.lastResponseBy === 'user' && !ticket.adminRead) {
      try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, { adminRead: true });
      } catch (error) {
        console.error('Erro ao marcar como lido:', error);
      }
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!response.trim() || !selectedTicket) return;

    setSubmitting(true);
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: arrayUnion({
          message: response.trim(),
          isAdmin: true,
          createdAt: new Date().toISOString()
        }),
        status: 'in_progress',
        lastResponseBy: 'admin',
        userRead: false,
        updatedAt: serverTimestamp()
      });

      setResponse('');
      // Atualiza o ticket selecionado localmente
      setSelectedTicket(prev => ({
        ...prev,
        responses: [...(prev.responses || []), {
          message: response.trim(),
          isAdmin: true,
          createdAt: new Date().toISOString()
        }],
        status: 'in_progress'
      }));
    } catch (error) {
      console.error('Erro ao responder ticket:', error);
      alert('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDeleteTicket = async (e, ticketId) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      alert('Erro ao excluir ticket.');
    }
  };

  const isUnread = (ticket) => {
    return ticket.adminRead === false || 
           (ticket.adminRead === undefined && ticket.status !== 'closed' && ticket.status !== 'resolved');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Aberto', class: 'status-open' },
      in_progress: { label: 'Em Atendimento', class: 'status-progress' },
      resolved: { label: 'Resolvido', class: 'status-resolved' },
      closed: { label: 'Fechado', class: 'status-closed' }
    };
    return statusMap[status] || statusMap.open;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="loading">
            <i className="bi bi-arrow-repeat loading-icon"></i>
            <span>Carregando...</span>
          </div>
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
              <i className="bi bi-ticket-detailed-fill" style={{ marginRight: 12, color: '#4f46e5' }}></i>
              Tickets de Suporte
              {openTicketsCount > 0 && (
                <span className="tickets-badge">{openTicketsCount}</span>
              )}
            </h1>
            <p>Gerencie os chamados de suporte dos usuários</p>
          </div>
        </div>

        {/* Desktop: botões | Mobile: select */}
        <div className="tickets-filters desktop-only">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({tickets.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Abertos ({tickets.filter(t => t.status === 'open').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            Em Atendimento ({tickets.filter(t => t.status === 'in_progress').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolvidos ({tickets.filter(t => t.status === 'resolved').length})
          </button>
        </div>

        <div className="tickets-filter-mobile mobile-only">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos ({tickets.length})</option>
            <option value="open">Abertos ({tickets.filter(t => t.status === 'open').length})</option>
            <option value="in_progress">Em Atendimento ({tickets.filter(t => t.status === 'in_progress').length})</option>
            <option value="resolved">Resolvidos ({tickets.filter(t => t.status === 'resolved').length})</option>
          </select>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-tickets">
            <i className="bi bi-inbox"></i>
            <h3>Nenhum ticket encontrado</h3>
            <p>Não há tickets com este filtro</p>
          </div>
        ) : (
          <div className="admin-tickets-list">
            {filteredTickets.map(ticket => {
              const status = getStatusBadge(ticket.status);
              const unread = isUnread(ticket);

              return (
                <div 
                  key={ticket.id} 
                  className={`admin-ticket-card ${unread ? 'is-unread' : ''}`}
                  onClick={() => handleOpenTicket(ticket)}
                >
                  {unread && (
                    <span className="unread-badge">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  )}
                  <div className="ticket-header">
                    <h3>{ticket.subject}</h3>
                    <span className={`ticket-status ${status.class}`}>{status.label}</span>
                  </div>
                  <div className="ticket-user">
                    <i className="bi bi-person-fill"></i>
                    {ticket.userName || ticket.userEmail}
                  </div>
                  <p className="ticket-preview">{ticket.message.substring(0, 100)}...</p>
                  <div className="ticket-footer">
                    <div className="ticket-footer-left">
                      <span className="ticket-date">
                        <i className="bi bi-clock"></i>
                        {formatDate(ticket.createdAt)}
                      </span>
                      <span className="ticket-responses">
                        <i className="bi bi-chat-left-text"></i>
                        {ticket.responses?.length || 0} resposta(s)
                      </span>
                    </div>
                    <button 
                      className="btn-delete-ticket"
                      onClick={(e) => handleDeleteTicket(e, ticket.id)}
                      title="Excluir ticket"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Detalhes do Ticket */}
        {selectedTicket && (
          <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="modal-content ticket-detail" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{selectedTicket.subject}</h2>
                  <span className="ticket-user-info">
                    <i className="bi bi-person-fill"></i>
                    {selectedTicket.userName || selectedTicket.userEmail}
                  </span>
                </div>
                <button className="modal-close" onClick={() => setSelectedTicket(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="ticket-status-bar">
                <span>Status:</span>
                <select 
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>

              <div className="chat-messages">
                {/* Mensagem inicial do usuário */}
                <div className="chat-message user">
                  <div className="message-bubble">
                    <p>{selectedTicket.message}</p>
                    <span className="message-time">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="message-user-info">
                    <div className="user-avatar-chat">
                      {selectedTicket.userPhoto ? (
                        <img src={selectedTicket.userPhoto} alt="" />
                      ) : (
                        (selectedTicket.userName || selectedTicket.userEmail || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="message-user-name">{selectedTicket.userName || selectedTicket.userEmail}</span>
                  </div>
                </div>

                {selectedTicket.responses?.map((resp, index) => (
                  <div 
                    key={index} 
                    className={`chat-message ${resp.isAdmin ? 'admin' : 'user'}`}
                  >
                    <div className="message-bubble">
                      <p>{resp.message}</p>
                      <span className="message-time">{formatDate(resp.createdAt)}</span>
                    </div>
                    <div className="message-user-info">
                      {resp.isAdmin ? (
                        <>
                          <span className="message-user-name">Suporte</span>
                          <div className="admin-avatar">
                            <i className="bi bi-shield-check"></i>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="user-avatar-chat">
                            {selectedTicket.userPhoto ? (
                              <img src={selectedTicket.userPhoto} alt="" />
                            ) : (
                              (selectedTicket.userName || selectedTicket.userEmail || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="message-user-name">{selectedTicket.userName || selectedTicket.userEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form className="response-form" onSubmit={handleRespond}>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={3}
                  required
                />
                <button type="submit" disabled={submitting || !response.trim()}>
                  {submitting ? 'Enviando...' : 'Enviar Resposta'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

