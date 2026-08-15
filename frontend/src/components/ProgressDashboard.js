import { TrendingUp, BookOpen, CheckCircle2, Target, Award, Clock } from 'lucide-react';

const ProgressDashboard = ({ subjects, tasks }) => {
  // Calculate overall progress
  const totalTopics = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
  const completedTopics = subjects.reduce(
    (sum, subject) => sum + subject.topics.filter(t => t.completed).length,
    0
  );
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Calculate tasks stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  // Calculate progress for each subject
  const subjectsProgress = subjects.map(subject => {
    const completed = subject.topics.filter(t => t.completed).length;
    const total = subject.topics.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...subject, completed, total, progress };
  });

  // Get upcoming tasks
  const upcomingTasks = tasks
    .filter(t => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Desconhecido';
  };

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#6b7280';
  };

  return (
    <div className="dashboard-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card overall-progress">
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Progresso Geral</span>
            <span className="stat-value">{overallProgress}%</span>
            <span className="stat-detail">{completedTopics} de {totalTopics} tópicos</span>
          </div>
          <div className="stat-progress">
            <div className="stat-progress-bar" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <div className="stat-card tasks-stat">
          <div className="stat-icon">
            <CheckCircle2 size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tarefas</span>
            <span className="stat-value">{completedTasks}/{totalTasks}</span>
            <span className="stat-detail">{pendingTasks} pendentes</span>
          </div>
        </div>

        <div className="stat-card subjects-stat">
          <div className="stat-icon">
            <BookOpen size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Matérias</span>
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-detail">disciplinas de cálculo</span>
          </div>
        </div>

        <div className="stat-card achievement-stat">
          <div className="stat-icon">
            <Award size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Meta Semanal</span>
            <span className="stat-value">{Math.min(completedTopics, 10)}/10</span>
            <span className="stat-detail">tópicos esta semana</span>
          </div>
        </div>
      </div>

      {/* Subjects Progress */}
      <div className="subjects-progress-section">
        <h2 className="section-title">
          <Target size={24} />
          Progresso por Matéria
        </h2>
        <div className="subjects-progress-grid">
          {subjectsProgress.map(subject => (
            <div key={subject.id} className="subject-progress-card">
              <div className="subject-progress-header">
                <div className="subject-info-dash">
                  <span className="subject-icon-dash" style={{ color: subject.color }}>
                    {subject.icon}
                  </span>
                  <span className="subject-name-dash">{subject.name}</span>
                </div>
                <span className="subject-percentage" style={{ color: subject.color }}>
                  {subject.progress}%
                </span>
              </div>
              <div className="progress-bar-dash">
                <div 
                  className="progress-fill-dash" 
                  style={{ 
                    width: `${subject.progress}%`,
                    backgroundColor: subject.color 
                  }}
                />
              </div>
              <div className="subject-stats">
                <span>{subject.completed}/{subject.total} tópicos concluídos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="upcoming-tasks-section">
          <h2 className="section-title">
            <Clock size={24} />
            Próximas Tarefas
          </h2>
          <div className="upcoming-tasks-list">
            {upcomingTasks.map(task => {
              const daysUntil = Math.ceil(
                (new Date(task.dueDate + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24)
              );
              const isUrgent = daysUntil <= 2;

              return (
                <div key={task.id} className={`upcoming-task-item ${isUrgent ? 'urgent' : ''}`}>
                  <div 
                    className="task-subject-indicator" 
                    style={{ backgroundColor: getSubjectColor(task.subject) }}
                  />
                  <div className="upcoming-task-content">
                    <span className="upcoming-task-subject">{getSubjectName(task.subject)}</span>
                    <p className="upcoming-task-description">{task.task}</p>
                    <span className="upcoming-task-date">
                      {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}
                    </span>
                  </div>
                  {isUrgent && (
                    <div className="urgent-badge">🔥</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Study Tips */}
      <div className="study-tips-section">
        <h2 className="section-title">
          <BookOpen size={24} />
          Dicas de Estudo
        </h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-emoji">📚</div>
            <h3>Revisão Espaçada</h3>
            <p>Revise o conteúdo após 1 dia, 3 dias, 1 semana e 1 mês para fixação de longo prazo.</p>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">✍️</div>
            <h3>Pratique Ativamente</h3>
            <p>Resolva muitos exercícios. Matemática se aprende fazendo, não apenas lendo.</p>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">🧑‍🏫</div>
            <h3>Explique para Alguém</h3>
            <p>Se você consegue explicar um conceito, significa que realmente entendeu.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
