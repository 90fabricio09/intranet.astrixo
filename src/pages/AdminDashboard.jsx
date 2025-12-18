import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCategorias: 0,
    totalCursos: 0,
    totalAulas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Buscar total de categorias
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const totalCategorias = categoriesSnapshot.size;

      // Buscar total de cursos
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const totalCursos = coursesSnapshot.size;

      // Buscar total de aulas (percorrer todos os cursos)
      let totalAulas = 0;
      for (const courseDoc of coursesSnapshot.docs) {
        const lessonsSnapshot = await getDocs(collection(db, 'courses', courseDoc.id, 'lessons'));
        totalAulas += lessonsSnapshot.size;
      }

      setStats({
        totalCategorias,
        totalCursos,
        totalAulas
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Categorias',
      description: 'Gerencie as categorias do curso',
      icon: 'bi-folder-fill',
      path: '/admin/categories',
      color: '#4f46e5'
    },
    {
      title: 'Cursos',
      description: 'Adicione e edite cursos',
      icon: 'bi-book-fill',
      path: '/admin/courses',
      color: '#4f46e5'
    },
    {
      title: 'Usuários',
      description: 'Crie contas de acesso',
      icon: 'bi-people-fill',
      path: '/admin/users',
      color: '#4f46e5'
    }
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Painel Administrativo</h1>
          <p>Gerencie o conteúdo da plataforma</p>
        </div>

        <div className="quick-stats">
          <h2>
            <i className="bi bi-graph-up-arrow section-icon"></i>
            <span>Estatísticas em Tempo Real</span>
          </h2>
          <div className="stats-grid">
            <div className="stat-card stat-card-purple">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <i className="bi bi-folder-fill"></i>
                </div>
                <span className="stat-badge">Ativo</span>
              </div>
              <div className="stat-body">
                <p className="stat-value">{loading ? '...' : stats.totalCategorias}</p>
                <p className="stat-label">Categorias</p>
              </div>
              <div className="stat-footer">
                <i className="bi bi-arrow-up"></i>
                <span>Organizando conteúdo</span>
              </div>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <i className="bi bi-book-fill"></i>
                </div>
                <span className="stat-badge">Publicado</span>
              </div>
              <div className="stat-body">
                <p className="stat-value">{loading ? '...' : stats.totalCursos}</p>
                <p className="stat-label">Cursos</p>
              </div>
              <div className="stat-footer">
                <i className="bi bi-graph-up"></i>
                <span>Disponíveis na plataforma</span>
              </div>
            </div>

            <div className="stat-card stat-card-green">
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  <i className="bi bi-camera-video-fill"></i>
                </div>
                <span className="stat-badge">Online</span>
              </div>
              <div className="stat-body">
                <p className="stat-value">{loading ? '...' : stats.totalAulas}</p>
                <p className="stat-label">Aulas</p>
              </div>
              <div className="stat-footer">
                <i className="bi bi-play-circle"></i>
                <span>Conteúdo de vídeo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <h2>
            <i className="bi bi-bar-chart-fill section-icon"></i>
            <span>Visão Geral de Conteúdo</span>
          </h2>
          
          <div className="charts-grid">
            {/* Gráfico de Barras - Distribuição */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Distribuição de Conteúdo</h3>
                <span className="chart-subtitle">Por categoria</span>
              </div>
              <div className="chart-body">
                <div className="bar-chart">
                  <div className="bar-item">
                    <div className="bar-label">
                      <span>Categorias</span>
                      <strong>{stats.totalCategorias}</strong>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill bar-fill-purple" 
                        style={{ width: `${stats.totalCategorias > 0 ? (stats.totalCategorias / Math.max(stats.totalCategorias, stats.totalCursos, stats.totalAulas)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">
                      <span>Cursos</span>
                      <strong>{stats.totalCursos}</strong>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill bar-fill-blue" 
                        style={{ width: `${stats.totalCursos > 0 ? (stats.totalCursos / Math.max(stats.totalCategorias, stats.totalCursos, stats.totalAulas)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">
                      <span>Aulas</span>
                      <strong>{stats.totalAulas}</strong>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill bar-fill-green" 
                        style={{ width: `${stats.totalAulas > 0 ? (stats.totalAulas / Math.max(stats.totalCategorias, stats.totalCursos, stats.totalAulas)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Pizza - Proporção */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Proporção de Conteúdo</h3>
                <span className="chart-subtitle">Total de itens</span>
              </div>
              <div className="chart-body chart-body-center">
                <div className="donut-chart">
                  <svg viewBox="0 0 100 100" className="donut-svg">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="20"
                      strokeDasharray={`${(stats.totalCategorias / (stats.totalCategorias + stats.totalCursos + stats.totalAulas || 1)) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      className="donut-segment donut-purple"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="20"
                      strokeDasharray={`${(stats.totalCursos / (stats.totalCategorias + stats.totalCursos + stats.totalAulas || 1)) * 251.2} 251.2`}
                      strokeDashoffset={`-${(stats.totalCategorias / (stats.totalCategorias + stats.totalCursos + stats.totalAulas || 1)) * 251.2}`}
                      transform="rotate(-90 50 50)"
                      className="donut-segment donut-blue"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="20"
                      strokeDasharray={`${(stats.totalAulas / (stats.totalCategorias + stats.totalCursos + stats.totalAulas || 1)) * 251.2} 251.2`}
                      strokeDashoffset={`-${((stats.totalCategorias + stats.totalCursos) / (stats.totalCategorias + stats.totalCursos + stats.totalAulas || 1)) * 251.2}`}
                      transform="rotate(-90 50 50)"
                      className="donut-segment donut-green"
                    />
                  </svg>
                  <div className="donut-center">
                    <div className="donut-total">{stats.totalCategorias + stats.totalCursos + stats.totalAulas}</div>
                    <div className="donut-label">Total</div>
                  </div>
                </div>
                <div className="donut-legend">
                  <div className="legend-item legend-purple">
                    <span className="legend-dot"></span>
                    <span>Categorias ({stats.totalCategorias})</span>
                  </div>
                  <div className="legend-item legend-blue">
                    <span className="legend-dot"></span>
                    <span>Cursos ({stats.totalCursos})</span>
                  </div>
                  <div className="legend-item legend-green">
                    <span className="legend-dot"></span>
                    <span>Aulas ({stats.totalAulas})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Métricas Rápidas */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Métricas Rápidas</h3>
                <span className="chart-subtitle">Indicadores principais</span>
              </div>
              <div className="chart-body">
                <div className="metrics-list">
                  <div className="metric-item">
                    <div className="metric-icon metric-icon-purple">
                      <i className="bi bi-collection"></i>
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Média de Cursos</span>
                      <strong className="metric-value">
                        {stats.totalCategorias > 0 ? (stats.totalCursos / stats.totalCategorias).toFixed(1) : '0'}
                      </strong>
                      <span className="metric-unit">por categoria</span>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon metric-icon-blue">
                      <i className="bi bi-stack"></i>
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Média de Aulas</span>
                      <strong className="metric-value">
                        {stats.totalCursos > 0 ? (stats.totalAulas / stats.totalCursos).toFixed(1) : '0'}
                      </strong>
                      <span className="metric-unit">por curso</span>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon metric-icon-green">
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">Conteúdo Total</span>
                      <strong className="metric-value">
                        {stats.totalAulas > 0 ? (stats.totalAulas * 15).toFixed(0) : '0'}
                      </strong>
                      <span className="metric-unit">min estimados</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-cards-grid">
          {adminCards.map(card => (
            <div 
              key={card.path}
              className="admin-card"
              onClick={() => navigate(card.path)}
            >
              <div className="admin-card-icon" style={{ background: card.color }}>
                <i className={card.icon}></i>
              </div>
              <div className="admin-card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <div className="admin-card-arrow">
                <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
