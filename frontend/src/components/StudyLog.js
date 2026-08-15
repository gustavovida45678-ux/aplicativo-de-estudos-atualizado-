import { useState } from 'react';
import { CheckCircle, Clock, BookOpen, Repeat, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const StudyLog = ({ subjects, studySessions, onAddSession }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: '',
    topicsStudied: '',
    duration: 60,
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newSession.subject && newSession.topicsStudied) {
      onAddSession({
        ...newSession,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      });
      setNewSession({
        subject: '',
        topicsStudied: '',
        duration: 60,
        date: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
    }
  };

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#6b7280';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Desconhecido';
  };

  // Calculate total study time
  const totalStudyTime = studySessions.reduce((sum, session) => sum + session.duration, 0);
  const totalHours = Math.floor(totalStudyTime / 60);
  const totalMinutes = totalStudyTime % 60;

  // Calculate sessions per subject
  const sessionsBySubject = subjects.map(subject => {
    const subjectSessions = studySessions.filter(s => s.subject === subject.id);
    const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);
    return {
      ...subject,
      sessionsCount: subjectSessions.length,
      totalTime: totalTime,
    };
  });

  return (
    <div className="study-log-container">
      {/* Stats Cards */}
      <div className="study-stats-grid">
        <div className="study-stat-card">
          <Clock size={24} className="stat-icon" />
          <div>
            <div className="stat-value">{totalHours}h {totalMinutes}min</div>
            <div className="stat-label">Tempo Total de Estudo</div>
          </div>
        </div>
        <div className="study-stat-card">
          <BookOpen size={24} className="stat-icon" />
          <div>
            <div className="stat-value">{studySessions.length}</div>
            <div className="stat-label">Sessões de Estudo</div>
          </div>
        </div>
        <div className="study-stat-card">
          <CheckCircle size={24} className="stat-icon" />
          <div>
            <div className="stat-value">{studySessions.filter(s => s.duration >= 60).length}</div>
            <div className="stat-label">Sessões Completas (1h+)</div>
          </div>
        </div>
      </div>

      {/* Add Session Button */}
      <div className="study-log-header">
        <h2 className="study-log-title">Registro de Estudos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="add-session-btn">
              <BookOpen size={18} className="mr-2" />
              Registrar Estudo
            </Button>
          </DialogTrigger>
          <DialogContent className="study-dialog">
            <DialogHeader>
              <DialogTitle>Registrar Sessão de Estudo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="study-form">
              <div className="form-field">
                <Label htmlFor="subject">Matéria</Label>
                <Select value={newSession.subject} onValueChange={(value) => setNewSession({ ...newSession, subject: value })}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="topics">Tópicos Estudados</Label>
                <Textarea
                  id="topics"
                  value={newSession.topicsStudied}
                  onChange={(e) => setNewSession({ ...newSession, topicsStudied: e.target.value })}
                  placeholder="Ex: Limites laterais, continuidade, exercícios 1-10"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Select value={newSession.duration.toString()} onValueChange={(value) => setNewSession({ ...newSession, duration: parseInt(value) })}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="180">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="date">Data</Label>
                <input
                  id="date"
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="date-input"
                />
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!newSession.subject || !newSession.topicsStudied}>
                  Registrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions by Subject */}
      <div className="sessions-by-subject">
        {sessionsBySubject.map(subject => (
          <div key={subject.id} className="subject-sessions-card">
            <div className="subject-sessions-header" style={{ borderLeftColor: subject.color }}>
              <span className="subject-icon-large" style={{ color: subject.color }}>{subject.icon}</span>
              <div className="subject-sessions-info">
                <h3>{subject.name}</h3>
                <div className="subject-sessions-stats">
                  <span>{subject.sessionsCount} sessões</span>
                  <span>•</span>
                  <span>{Math.floor(subject.totalTime / 60)}h {subject.totalTime % 60}min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="recent-sessions">
        <h3 className="recent-sessions-title">Sessões Recentes</h3>
        {studySessions.length === 0 ? (
          <div className="empty-sessions">
            <BookOpen size={48} />
            <p>Nenhuma sessão registrada ainda</p>
          </div>
        ) : (
          <div className="sessions-list">
            {studySessions.slice().reverse().slice(0, 10).map(session => (
              <div key={session.id} className="session-item">
                <div 
                  className="session-indicator" 
                  style={{ backgroundColor: getSubjectColor(session.subject) }}
                />
                <div className="session-content">
                  <div className="session-header">
                    <span className="session-subject" style={{ color: getSubjectColor(session.subject) }}>
                      {getSubjectName(session.subject)}
                    </span>
                    <span className="session-date">
                      {new Date(session.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="session-topics">{session.topicsStudied}</p>
                  <div className="session-duration">
                    <Clock size={14} />
                    {Math.floor(session.duration / 60)}h {session.duration % 60}min
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyLog;