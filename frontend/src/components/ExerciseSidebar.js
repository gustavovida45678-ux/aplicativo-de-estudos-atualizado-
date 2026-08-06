import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Target, CheckCircle2, Search, Filter } from 'lucide-react';
import { EXERCISES_BY_SUBJECT, getSubjectTotals, getTotalExercises } from '../data/exercisesData';

const ExerciseSidebar = ({ onSelectExercise, isOpen, onClose }) => {
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  const subjectTotals = getSubjectTotals();
  const totalExercises = getTotalExercises();

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  const filteredSubjects = Object.entries(EXERCISES_BY_SUBJECT).filter(([subject, data]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return subject.toLowerCase().includes(query) || 
           data.topics.some(t => t.name.toLowerCase().includes(query));
  });

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button
        className={`exercise-sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => onClose(!isOpen)}
        aria-label="Exercícios"
      >
        <BookOpen size={20} />
        <span>Exercícios ({totalExercises})</span>
        {isOpen && <ChevronDown size={18} />}
        {!isOpen && <ChevronRight size={18} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div className="exercise-sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar Panel */}
      <aside className={`exercise-sidebar ${isOpen ? 'open' : ''}`} role="complementary">
        <div className="exercise-sidebar-header">
          <div className="sidebar-title-section">
            <BookOpen className="sidebar-icon" size={24} />
            <div>
              <h2>Exercícios por Matéria</h2>
              <p className="sidebar-subtitle">{totalExercises} exercícios no total</p>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Fechar">
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="exercise-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar matéria ou tópico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Subject List */}
        <div className="exercise-subjects-list">
          {filteredSubjects.length === 0 ? (
            <div className="exercise-empty-state">
              <Target size={32} />
              <p>Nenhuma matéria encontrada</p>
            </div>
          ) : (
            filteredSubjects.map(([subject, data]) => {
              const isExpanded = expandedSubjects[subject];
              const total = subjectTotals[subject] || 0;
              const completed = 0; // TODO: conectar com progresso real
              
              return (
                <div key={subject} className="exercise-subject-card">
                  <button
                    className="exercise-subject-header"
                    onClick={() => toggleSubject(subject)}
                    style={{ borderLeftColor: data.color }}
                  >
                    <div className="subject-icon" style={{ background: data.color }}>
                      <span>{data.icon}</span>
                    </div>
                    <div className="subject-info">
                      <h3>{subject}</h3>
                      <p className="subject-meta">
                        {data.topics.length} tópicos • {total} exercícios
                      </p>
                    </div>
                    <div className="subject-progress">
                      <span className="progress-text">{completed}/{total}</span>
                      <ChevronDown 
                        size={16} 
                        className={isExpanded ? 'expanded' : ''}
                        style={{ color: data.color }}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="exercise-topics-list">
                      {data.topics.map((topic) => (
                        <button
                          key={topic.id}
                          className="exercise-topic-item"
                          onClick={() => {
                            onSelectExercise({
                              subject,
                              subjectIcon: data.icon,
                              subjectColor: data.color,
                              topicId: topic.id,
                              topicName: topic.name,
                              count: topic.count,
                              description: topic.description,
                            });
                          }}
                        >
                          <div className="topic-main">
                            <span className="topic-name">{topic.name}</span>
                            <span className="topic-count">{topic.count} ex.</span>
                          </div>
                          <p className="topic-description">{topic.description}</p>
                          <div className="topic-action">
                            <CheckCircle2 size={14} />
                            <span>Praticar</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default ExerciseSidebar;