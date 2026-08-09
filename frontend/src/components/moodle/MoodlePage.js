import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BookOpen, ExternalLink, RefreshCw, Loader2, Calendar, AlertTriangle,
  CheckCircle2, Clock, Bell, FolderOpen, User, Settings, X, ChevronRight,
  Download, Upload, Search, Filter, MoreVertical, Eye, Edit, Trash2,
  GraduationCap, Globe, Shield, Key, Unlock, LogIn, LogOut, ArrowRight,
  FileText, MessageSquare, HelpCircle
} from 'lucide-react';
import { BACKEND_URL } from '../../lib/backendUrl';

const API = `${BACKEND_URL}/api/moodle`;

const MOODLE_URL = 'https://moodle.ifg.edu.br/my/';

export function MoodlePage({ onClose }) {
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState({ courses: false, activities: false, deadlines: false, announcements: false });
  const [error, setError] = useState(null);
  const [showLoginHelp, setShowLoginHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('activities');
  const [lastSync, setLastSync] = useState(null);
  const [moodleConfigured, setMoodleConfigured] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [useTokenOption, setUseTokenOption] = useState(false);

  const connectMoodle = async () => {
    if (connecting) return;
    if (!useTokenOption && (!username.trim() || !password)) return;
    if (useTokenOption && !tokenInput.trim()) return;
    setConnecting(true);
    try {
      const payload = useTokenOption
        ? { token: tokenInput.trim() }
        : { username: username.trim(), password };
      const res = await axios.post(`${API}/${useTokenOption ? 'token' : 'connect'}`, payload);
      if (res.data.valid) {
        toast.success('Moodle conectado com sucesso!');
        setMoodleConfigured(true);
        setUsername('');
        setPassword('');
        setTokenInput('');
        setLastSync(new Date());
        try {
          await axios.post(`${API}/sync`);
        } catch (e) {
          console.error('Sincronização inicial falhou:', e);
        }
        await fetchAll();
      } else {
        toast.error('Falha na conexão. Verifique os dados e tente novamente.');
      }
    } catch (e) {
      console.error('Erro ao conectar ao Moodle:', e);
      const detail = e.response?.data?.detail;
      toast.error(detail ? `Não foi possível conectar: ${detail}` : 'Não foi possível conectar ao Moodle. Verifique CPF e senha.');
    } finally {
      setConnecting(false);
    }
  };

  const checkMoodleConfig = async () => {
    try {
      const res = await axios.get(`${API}/status`);
      const configured = !!res.data.configured;
      setMoodleConfigured(configured);
      if (res.data.last_sync) setLastSync(new Date(res.data.last_sync));
      return configured;
    } catch (e) {
      console.error('Erro ao verificar configuração do Moodle:', e);
      return false;
    } finally {
      setConfigChecked(true);
    }
  };

  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchCourses(),
      fetchActivities(),
      fetchDeadlines(),
      fetchAnnouncements(),
    ]);
  }, []);

  const didAutoSync = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const configured = await checkMoodleConfig();
      if (cancelled) return;
      if (configured) {
        await fetchAll();
        const hasData =
          (courses.length || activities.length || deadlines.length || announcements.length) > 0;
        if (!hasData && !didAutoSync.current) {
          didAutoSync.current = true;
          try {
            await axios.post(`${API}/sync`);
          } catch (e) {
            console.error('Auto-sync do Moodle falhou:', e);
          }
          await fetchAll();
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    setLoading(prev => ({ ...prev, courses: true }));
    try {
      const res = await axios.get(`${API}/courses`);
      setCourses(res.data.courses || []);
    } catch (e) {
      console.error('Erro ao buscar cursos:', e);
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchActivities = async () => {
    setLoading(prev => ({ ...prev, activities: true }));
    try {
      const res = await axios.get(`${API}/activities`);
      setActivities(res.data.activities || []);
    } catch (e) {
      console.error('Erro ao buscar atividades:', e);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const fetchDeadlines = async () => {
    setLoading(prev => ({ ...prev, deadlines: true }));
    try {
      const res = await axios.get(`${API}/deadlines`);
      setDeadlines(res.data.deadlines || []);
    } catch (e) {
      console.error('Erro ao buscar prazos:', e);
    } finally {
      setLoading(prev => ({ ...prev, deadlines: false }));
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(prev => ({ ...prev, announcements: true }));
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data.announcements || []);
    } catch (e) {
      console.error('Erro ao buscar avisos:', e);
    } finally {
      setLoading(prev => ({ ...prev, announcements: false }));
    }
  };

  const syncMoodle = async () => {
    setLoading(prev => ({ ...prev, sync: true }));
    try {
      const res = await axios.post(`${API}/sync`);
      setLastSync(new Date());
      toast.success('Sincronização concluída!');
      fetchAll();
    } catch (e) {
      console.error('Erro ao sincronizar:', e);
      toast.error('Erro na sincronização. Verifique se o token está configurado.');
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  };

  const openMoodle = () => {
    window.open(MOODLE_URL, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sem data';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { label: 'Sem prazo', class: '' };
    const now = new Date();
    const due = new Date(deadline);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Atrasado', class: 'overdue' };
    if (diffDays === 0) return { label: 'Hoje', class: 'today' };
    if (diffDays <= 3) return { label: `${diffDays} dia(s)`, class: 'soon' };
    return { label: `${diffDays} dias`, class: '' };
  };

  return (
    <div className="moodle-page" onClick={onClose}>
      <div className="moodle-panel" onClick={(e) => e.stopPropagation()}>
        <div className="moodle-header">
          <div className="moodle-title">
            <GraduationCap size={28} color="#e74c3c" />
            <div>
              <h2>Moodle IFG</h2>
              <p>Instituto Federal de Goiás - Ambiente Virtual de Aprendizagem</p>
            </div>
          </div>
          <div className="moodle-actions">
            <button className="moodle-btn secondary" onClick={openMoodle}>
              <ExternalLink size={16} /> Abrir Moodle
            </button>
            <button className="moodle-btn primary" onClick={syncMoodle} disabled={loading.sync || !moodleConfigured}>
              <RefreshCw size={16} className={loading.sync ? 'spin' : ''} />
              {loading.sync ? 'Sincronizando...' : 'Atualizar'}
            </button>
            <button className="moodle-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {!configChecked && (
          <div className="moodle-not-configured">
            <Loader2 size={48} className="spin" color="#3b82f6" />
            <h3>Conectando ao Moodle...</h3>
            <p>Verificando a configuração da integração.</p>
          </div>
        )}

        {configChecked && !moodleConfigured && (
          <div className="moodle-not-configured">
            <Shield size={48} color="#f59e0b" />
            <h3>Moodle não conectado</h3>
            <p>Conecte com seu CPF e senha do IFG para ver atividades, prazos, disciplinas e avisos direto no app.</p>
            <div className="moodle-login-form">
              <input
                type="text"
                inputMode="numeric"
                placeholder="CPF (somente números)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') connectMoodle(); }}
                disabled={connecting}
              />
              <input
                type="password"
                placeholder="Senha do IFG"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') connectMoodle(); }}
                disabled={connecting}
              />
              <button className="moodle-btn primary" onClick={connectMoodle} disabled={connecting || !username.trim() || !password}>
                {connecting ? <><Loader2 size={16} className="spin" /> Conectando...</> : <><Unlock size={16} /> Entrar no Moodle</>}
              </button>
              {!useTokenOption ? (
                <button className="moodle-btn secondary" onClick={() => setUseTokenOption(true)} disabled={connecting}>
                  <Key size={14} /> Já tenho um token
                </button>
              ) : (
                <div className="moodle-token-form">
                  <input
                    type="text"
                    placeholder="Cole aqui o token do Moodle"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') connectMoodle(); }}
                    disabled={connecting}
                  />
                  <button className="moodle-btn primary" onClick={connectMoodle} disabled={connecting || !tokenInput.trim()}>
                    {connecting ? <><Loader2 size={16} className="spin" /> Conectando...</> : 'Conectar'}
                  </button>
                  <button className="moodle-btn secondary" onClick={() => setUseTokenOption(false)} disabled={connecting}>
                    Usar CPF
                  </button>
                </div>
              )}
            </div>
            <button className="moodle-btn secondary" onClick={openMoodle}>
              <ExternalLink size={16} /> Abrir Moodle IFG
            </button>
          </div>
        )}

        {moodleConfigured && (
          <div className="moodle-tabs">
            <button className={activeTab === 'activities' ? 'active' : ''} onClick={() => setActiveTab('activities')}>
              <FolderOpen size={16} /> Atividades
              {loading.activities && <Loader2 size={14} className="spin" />}
            </button>
            <button className={activeTab === 'deadlines' ? 'active' : ''} onClick={() => setActiveTab('deadlines')}>
              <Calendar size={16} /> Prazos
              {loading.deadlines && <Loader2 size={14} className="spin" />}
              {deadlines.filter(d => d.due_date && new Date(d.due_date) < new Date()).length > 0 && (
                <span className="tab-badge">{deadlines.filter(d => d.due_date && new Date(d.due_date) < new Date()).length}</span>
              )}
            </button>
            <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
              <BookOpen size={16} /> Disciplinas
              {loading.courses && <Loader2 size={14} className="spin" />}
            </button>
            <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>
              <Bell size={16} /> Avisos
              {loading.announcements && <Loader2 size={14} className="spin" />}
            </button>
          </div>
        )}

        {moodleConfigured && activeTab === 'activities' && (
          <div className="moodle-content">
            {loading.activities ? (
              <div className="moodle-loading"><Loader2 size={32} className="spin" /><p>Carregando atividades...</p></div>
            ) : activities.length === 0 ? (
              <div className="moodle-empty">
                <FolderOpen size={48} color="#64748b" />
                <h3>Nenhuma atividade encontrada</h3>
                <p>As atividades aparecerão aqui após a sincronização.</p>
              </div>
            ) : (
              <div className="activities-list">
                {activities.map((activity, i) => (
                  <div key={activity.id || i} className="activity-card">
                    <div className="activity-icon">
                      {activity.type === 'assign' && <FolderOpen size={20} color="#3b82f6" />}
                      {activity.type === 'quiz' && <HelpCircle size={20} color="#8b5cf6" />}
                      {activity.type === 'forum' && <MessageSquare size={20} color="#10b981" />}
                      {activity.type === 'resource' && <FileText size={20} color="#f59e0b" />}
                      {activity.type === 'url' && <Globe size={20} color="#ec4899" />}
                    </div>
                    <div className="activity-info">
                      <h4>{activity.name}</h4>
                      <p className="activity-course">{activity.course_name || 'Disciplina não informada'}</p>
                      <div className="activity-meta">
                        {activity.due_date && (
                          <span className={`deadline ${getDeadlineStatus(activity.due_date).class}`}>
                            <Calendar size={12} /> {formatDate(activity.due_date)}
                          </span>
                        )}
                        {activity.type && <span className="activity-type">{activity.type}</span>}
                      </div>
                    </div>
                    <div className="activity-actions">
                      {activity.url && (
                        <a href={activity.url} target="_blank" rel="noopener noreferrer" className="moodle-btn small">
                          <ArrowRight size={14} /> Abrir
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {moodleConfigured && activeTab === 'deadlines' && (
          <div className="moodle-content">
            {loading.deadlines ? (
              <div className="moodle-loading"><Loader2 size={32} className="spin" /><p>Carregando prazos...</p></div>
            ) : deadlines.length === 0 ? (
              <div className="moodle-empty">
                <Calendar size={48} color="#64748b" />
                <h3>Nenhum prazo encontrado</h3>
              </div>
            ) : (
              <div className="deadlines-list">
                {deadlines
                  .filter(d => d.due_date)
                  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  .map((deadline, i) => {
                    const status = getDeadlineStatus(deadline.due_date);
                    return (
                      <div key={deadline.id || i} className={`deadline-card ${status.class}`}>
                        <div className="deadline-date">
                          <span className="day">{new Date(deadline.due_date).getDate()}</span>
                          <span className="month">{new Date(deadline.due_date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        </div>
                        <div className="deadline-info">
                          <h4>{deadline.name}</h4>
                          <p>{deadline.course_name}</p>
                        </div>
                        <div className="deadline-status">
                          <span className={status.class}>{status.label}</span>
                        </div>
                        <div className="deadline-actions">
                          {deadline.url && (
                            <a href={deadline.url} target="_blank" rel="noopener noreferrer" className="moodle-btn small">
                              <ArrowRight size={14} /> Ver
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {moodleConfigured && activeTab === 'courses' && (
          <div className="moodle-content">
            {loading.courses ? (
              <div className="moodle-loading"><Loader2 size={32} className="spin" /><p>Carregando disciplinas...</p></div>
            ) : courses.length === 0 ? (
              <div className="moodle-empty">
                <BookOpen size={48} color="#64748b" />
                <h3>Nenhuma disciplina encontrada</h3>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course, i) => (
                  <div key={course.id || i} className="course-card">
                    <div className="course-header">
                      <h4>{course.fullname || course.shortname}</h4>
                      <span className="course-code">{course.shortname}</span>
                    </div>
                    <p className="course-category">{course.category}</p>
                    {course.progress !== undefined && (
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span>{course.progress}% concluído</span>
                      </div>
                    )}
                    <div className="course-actions">
                      {course.url && (
                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="moodle-btn small">
                          <ArrowRight size={14} /> Acessar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {moodleConfigured && activeTab === 'announcements' && (
          <div className="moodle-content">
            {loading.announcements ? (
              <div className="moodle-loading"><Loader2 size={32} className="spin" /><p>Carregando avisos...</p></div>
            ) : announcements.length === 0 ? (
              <div className="moodle-empty">
                <Bell size={48} color="#64748b" />
                <h3>Nenhum aviso recente</h3>
              </div>
            ) : (
              <div className="announcements-list">
                {announcements.map((announcement, i) => (
                  <div key={announcement.id || i} className="announcement-card">
                    <div className="announcement-header">
                      <h4>{announcement.subject}</h4>
                      <span className="announcement-course">{announcement.course_name}</span>
                    </div>
                    <p className="announcement-message">{announcement.message}</p>
                    <div className="announcement-meta">
                      <span><User size={14} /> {announcement.author}</span>
                      <span><Clock size={14} /> {formatDate(announcement.created)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {lastSync && (
          <div className="moodle-footer">
            <Clock size={14} /> Última sincronização: {formatDate(lastSync.toISOString())}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodlePage;