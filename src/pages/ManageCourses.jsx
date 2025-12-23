import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import AdminSidebar from '../components/AdminSidebar';
import ImageUpload from '../components/ImageUpload';
import '../styles/ManageCourses.css';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [showLessonFormModal, setShowLessonFormModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [editingLesson, setEditingLesson] = useState(null);
  const [courseLessonCounts, setCourseLessonCounts] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    coverUrl: ''
  });
  
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    order: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar categorias
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      // Carregar cursos
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
      
      // Carregar contagem de aulas para cada curso
      const counts = {};
      for (const course of coursesData) {
        const lessonsSnapshot = await getDocs(collection(db, 'courses', course.id, 'lessons'));
        counts[course.id] = lessonsSnapshot.size;
      }
      setCourseLessonCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId) => {
    try {
      const lessonsQuery = query(
        collection(db, 'courses', courseId, 'lessons'),
        orderBy('order', 'asc')
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessonsData = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLessons(lessonsData);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      alert('Erro ao carregar aulas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), formData);
        alert('Curso atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'courses'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        alert('Curso criado com sucesso!');
      }
      
      setShowModal(false);
      setFormData({ name: '', description: '', categoryId: '', coverUrl: '' });
      setEditingCourse(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      alert('Erro ao salvar curso');
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) return;

    try {
      if (editingLesson) {
        // Atualizar aula existente
        await updateDoc(
          doc(db, 'courses', selectedCourse.id, 'lessons', editingLesson.id),
          lessonFormData
        );
        alert('Aula atualizada com sucesso!');
      } else {
        // Criar nova aula
        await addDoc(collection(db, 'courses', selectedCourse.id, 'lessons'), {
          ...lessonFormData,
          createdAt: new Date().toISOString()
        });
        alert('Aula adicionada com sucesso!');
      }
      
      setShowLessonFormModal(false);
      setLessonFormData({ title: '', description: '', videoUrl: '', order: 1 });
      setEditingLesson(null);
      loadLessons(selectedCourse.id);
      loadData(); // Atualizar contagem
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Erro ao salvar aula');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta aula?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', selectedCourse.id, 'lessons', lessonId));
      alert('Aula excluída com sucesso!');
      loadLessons(selectedCourse.id);
      loadData(); // Atualizar contagem
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      alert('Erro ao excluir aula');
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      order: lesson.order
    });
    setShowLessonFormModal(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      categoryId: course.categoryId || '',
      coverUrl: course.coverUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Tem certeza que deseja excluir este curso? Todas as aulas serão excluídas também.')) {
      return;
    }

    try {
      // Deletar aulas primeiro
      const lessonsSnapshot = await getDocs(collection(db, 'courses', courseId, 'lessons'));
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonDoc.id));
      }
      
      // Deletar curso
      await deleteDoc(doc(db, 'courses', courseId));
      alert('Curso excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert('Erro ao excluir curso');
    }
  };

  const openNewModal = () => {
    setEditingCourse(null);
    setFormData({ name: '', description: '', categoryId: '', coverUrl: '' });
    setShowModal(true);
  };

  const openLessonsManager = async (course) => {
    setSelectedCourse(course);
    await loadLessons(course.id);
    setShowLessonsModal(true);
  };

  const openNewLessonModal = () => {
    setEditingLesson(null);
    setLessonFormData({ title: '', description: '', videoUrl: '', order: lessons.length + 1 });
    setShowLessonFormModal(true);
  };

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
            <h1>Gerenciar Cursos</h1>
            <p>Crie cursos e gerencie suas aulas</p>
          </div>
          <button className="btn-primary" onClick={openNewModal}>
            + Novo Curso
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum curso cadastrado</p>
            <button className="btn-primary" onClick={openNewModal}>
              Criar primeiro curso
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-card-header">
                  <h3>{course.name}</h3>
                  <div className="course-meta">
                    <span className="course-category">
                      <i className="bi bi-folder-fill"></i>
                      {categories.find(c => c.id === course.categoryId)?.name || 'Sem categoria'}
                    </span>
                    <span className="course-lessons-count">
                      <i className="bi bi-camera-video-fill"></i>
                      {courseLessonCounts[course.id] || 0} {courseLessonCounts[course.id] === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-actions">
                  <button 
                    className="btn-manage-lessons"
                    onClick={() => openLessonsManager(course)}
                  >
                    <i className="bi bi-list-ul"></i>
                    Gerenciar Aulas
                  </button>
                  <button 
                    className="btn-edit-small"
                    onClick={() => handleEdit(course)}
                  >
                    <i className="bi bi-pencil-fill"></i>
                  </button>
                  <button 
                    className="btn-delete-small"
                    onClick={() => handleDelete(course.id)}
                  >
                    <i className="bi bi-trash-fill"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Curso */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nome do Curso</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: HTML e CSS Básico"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="categoryId">Categoria</label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descrição</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Descreva o conteúdo do curso"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Capa do Curso (opcional)</label>
                  <ImageUpload
                    currentImageUrl={formData.coverUrl}
                    onUploadComplete={(url) => setFormData({ ...formData, coverUrl: url })}
                  />
                  <small style={{ color: '#999', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                    A imagem será automaticamente comprimida
                  </small>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCourse ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Gerenciar Aulas */}
        {showLessonsModal && (
          <div className="modal-overlay" onClick={() => setShowLessonsModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Aulas - {selectedCourse?.name}</h2>
                  <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '4px' }}>
                    {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} cadastradas
                  </p>
                </div>
                <button className="modal-close" onClick={() => setShowLessonsModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="lessons-header">
                  <button className="btn-primary" onClick={openNewLessonModal}>
                    <i className="bi bi-plus-lg"></i>
                    Nova Aula
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <div className="empty-state-small">
                    <i className="bi bi-camera-video" style={{ fontSize: '3rem', color: '#666' }}></i>
                    <p>Nenhuma aula cadastrada</p>
                    <button className="btn-primary" onClick={openNewLessonModal}>
                      Adicionar primeira aula
                    </button>
                  </div>
                ) : (
                  <div className="lessons-list">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="lesson-item">
                        <div className="lesson-order">
                          <span className="lesson-number">{lesson.order}</span>
                        </div>
                        <div className="lesson-info">
                          <h4>{lesson.title}</h4>
                          <p>{lesson.description}</p>
                          <div className="lesson-video-link-wrapper">
                          <a 
                            href={lesson.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="lesson-video-link"
                          >
                            <i className="bi bi-play-circle"></i>
                            {lesson.videoUrl}
                          </a>
                          </div>
                        </div>
                        <div className="lesson-actions">
                          <button 
                            className="btn-icon btn-edit"
                            onClick={() => handleEditLesson(lesson)}
                            title="Editar aula"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            title="Excluir aula"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Formulário de Aula */}
        {showLessonFormModal && (
          <div className="modal-overlay" onClick={() => setShowLessonFormModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h2>
                <button className="modal-close" onClick={() => setShowLessonFormModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleLessonSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Título da Aula</label>
                  <input
                    type="text"
                    id="title"
                    value={lessonFormData.title}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                    required
                    placeholder="Ex: Introdução ao HTML"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="order">Ordem</label>
                  <input
                    type="number"
                    id="order"
                    value={lessonFormData.order}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, order: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                  <small style={{ color: '#999', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Define a ordem de exibição da aula
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="videoUrl">URL do Vídeo</label>
                  <input
                    type="url"
                    id="videoUrl"
                    value={lessonFormData.videoUrl}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                    required
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lessonDescription">Descrição</label>
                  <textarea
                    id="lessonDescription"
                    value={lessonFormData.description}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                    required
                    placeholder="Descreva o conteúdo da aula"
                    rows="4"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowLessonFormModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingLesson ? 'Atualizar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
