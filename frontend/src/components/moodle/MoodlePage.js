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

const txt = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export function MoodlePage({ onClose }) {
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState({ courses: false, activities: false, deadlines: false, announcements: false });
  const [error, setError] = useState(null);
  const [showLoginHelp, setShowLoginHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('deadlines');
  const [lastSync, setLastSync] = useState(null);
  const [moodleConfigured, setMoodleConfigured] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [useTokenOption, setUseTokenOption] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const [studyActivity, setStudyActivity] = useState(null);
  const [studyTab, setStudyTab] = useState('solution');
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyError, setStudyError] = useState(null);
  const [studyData, setStudyData] = useState(null);

  const startStudy = async (activity, force = false) => {
    setStudyActivity(activity);
    setStudyTab('solution');
    setStudyLoading(true);
    setStudyError(null);
    setStudyData(null);
    try {
      const res = await axios.post(`${API}/study`, {
        activity_id: String(activity.id || activity.cmid || ''),
        force,
      });
      setStudyData(res.data);
    } catch (e) {
      console.error('Erro ao gerar estudo:', e);
      setStudyError(e.response?.data?.detail || 'Não foi possível gerar o estudo da atividade.');
    } finally {
      setStudyLoading(false);
    }
  };

  const applySyncResult = (res) => {
    const counts = res.data?.counts || {};
    const errors = res.data?.errors || [];
    const warnings = res.data?.warnings || [];
    setSyncInfo(errors.length ? { errors, counts, warnings } : (warnings.length ? { errors: [], counts, warnings } : null));
    const total = (counts.courses || 0) + (counts.activities || 0) + (counts.deadlines || 0) + (counts.announcements || 0);
    if (errors.length) {
      toast.warning('Conexão OK, mas o Moodle devolveu erros ao buscar dados.');
    } else if (total === 0 && warnings.length) {
      toast.warning('Conectado, mas o Moodle não liberou os dados para esta conta.');
    } else if (total === 0) {
      toast.warning('Conectado, mas nenhuma atividade/disciplina encontrada no Moodle.');
    }
    return counts;
  };

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
          const syncRes = await axios.post(`${API}/sync`);
          applySyncResult(syncRes);
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
      toast.error(detail ? `Não foi possível conectar: ${detail}` : 'Não foi possível conectar ao Moodle. Verifique matrícula e senha.');
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
      applySyncResult(res);
      toast.success('Sincronização concluída!');
      fetchAll();
    } catch (e) {
      console.error('Erro ao sincronizar:', e);
      setSyncInfo({ errors: [e.response?.data?.detail || 'Falha ao sincronizar com o backend.'], counts: {} });
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
            <p>Conecte com seu número de matrícula e senha do IFG para ver atividades, prazos, disciplinas e avisos direto no app.</p>
            <div className="moodle-login-form">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Número de matrícula"
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
                    Usar matrícula
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

        {moodleConfigured && syncInfo && syncInfo.errors && syncInfo.errors.length > 0 && (
          <div className="moodle-sync-error">
            <AlertTriangle size={18} color="#f59e0b" />
            <div>
              <strong>O Moodle não retornou todos os dados.</strong>
              <ul>
                {syncInfo.errors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <button className="moodle-btn secondary" onClick={syncMoodle} disabled={loading.sync}>
              <RefreshCw size={14} className={loading.sync ? 'spin' : ''} /> Tentar novamente
            </button>
          </div>
        )}

        {moodleConfigured && syncInfo && syncInfo.errors.length === 0 && syncInfo.warnings && syncInfo.warnings.length > 0 && (
          <div className="moodle-sync-warning">
            <AlertTriangle size={14} color="#94a3b8" />
            <span>Parte dos dados não está disponível no webservice do Moodle ({syncInfo.warnings.length} item(ns)). Os prazos das tarefas e as disciplinas continuam listados.</span>
          </div>
        )}

        {moodleConfigured && activeTab === 'activities' && (
          <div className="moodle-content">
            {loading.activities ? (
              <div className="moodle-loading"><Loader2 size={32} className="spin" /><p>Carregando atividades...</p></div>
            ) : activities.filter(a => a.priority).length === 0 ? (
              <div className="moodle-empty">
                <FolderOpen size={48} color="#64748b" />
                <h3>Nenhuma atividade prioritária</h3>
                <p>Atividades de Sistemas Digitais, Estrutura de Dados e Álgebra Linear aparecerão aqui.</p>
                <button className="moodle-btn secondary" onClick={syncMoodle} disabled={loading.sync}>
                  <RefreshCw size={14} className={loading.sync ? 'spin' : ''} /> Atualizar
                </button>
              </div>
            ) : (
              <div className="activities-list">
                {activities.filter(a => a.priority).map((activity, i) => (
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
                        {activity.priority && <span className="priority-badge">Prioridade</span>}
                        {activity.resolved && <span className="priority-badge resolved">Resolução pronta</span>}
                      </div>
                    </div>
                    <div className="activity-actions">
                      <button
                        className="moodle-btn small study-btn"
                        onClick={() => startStudy(activity)}
                        title="Resolução passo a passo, resumo e 10 exercícios gerados pela IA"
                      >
                        <GraduationCap size={14} /> {activity.resolved ? 'Ver resolução' : 'Estudar'}
                      </button>
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
                <button className="moodle-btn secondary" onClick={syncMoodle} disabled={loading.sync}>
                  <RefreshCw size={14} className={loading.sync ? 'spin' : ''} /> Atualizar
                </button>
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
                          {deadline.priority && <span className="priority-badge">Prioridade</span>}
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
                <p>Verifique se você está matriculado em disciplinas no Moodle e tente atualizar.</p>
                <button className="moodle-btn secondary" onClick={syncMoodle} disabled={loading.sync}>
                  <RefreshCw size={14} className={loading.sync ? 'spin' : ''} /> Atualizar
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course, i) => (
                  <div key={course.id || i} className="course-card">
                    <div className="course-header">
                      <h4>{course.fullname || course.shortname}</h4>
                      <span className="course-code">{course.shortname}</span>
                    </div>
                    <div className="course-meta">
                      {course.priority && <span className="priority-badge">Prioridade</span>}
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
                <button className="moodle-btn secondary" onClick={syncMoodle} disabled={loading.sync}>
                  <RefreshCw size={14} className={loading.sync ? 'spin' : ''} /> Atualizar
                </button>
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

        {studyActivity && (
          <div className="moodle-study-overlay" onClick={() => setStudyActivity(null)}>
            <div className="moodle-study-panel" onClick={(e) => e.stopPropagation()}>
              <div className="moodle-study-header">
                <div>
                  <h3>{txt(studyData?.activity_name || studyActivity.name)}</h3>
                  <p>{txt(studyData?.course_name || studyActivity.course_name)}</p>
                  {studyData?.files && studyData.files.length > 0 && (
                    <p className="moodle-study-files">Arquivos escaneados: {txt(studyData.files.join(', '))}</p>
                  )}
                </div>
                <button className="moodle-close" onClick={() => setStudyActivity(null)}>
                  <X size={20} />
                </button>
              </div>

              {studyLoading && (
                <div className="moodle-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Baixando e escaneando a atividade...</p>
                  <p className="moodle-study-hint">Gerando resolução passo a passo, resumo e 10 exercícios (pode levar ~1 min).</p>
                </div>
              )}

              {!studyLoading && studyError && (
                <div className="moodle-sync-error">
                  <AlertTriangle size={18} color="#f59e0b" />
                  <div>
                    <strong>Não foi possível gerar o estudo.</strong>
                    <ul><li>{studyError}</li></ul>
                  </div>
                  <button className="moodle-btn secondary" onClick={() => startStudy(studyActivity, true)}>
                    <RefreshCw size={14} /> Tentar novamente
                  </button>
                </div>
              )}

              {!studyLoading && !studyError && studyData && (
                <>
                  <div className="moodle-study-tabs">
                    <button className={studyTab === 'solution' ? 'active' : ''} onClick={() => setStudyTab('solution')}>
                      <Edit size={15} /> Resolução passo a passo
                    </button>
                    <button className={studyTab === 'summary' ? 'active' : ''} onClick={() => setStudyTab('summary')}>
                      <FileText size={15} /> Resumo
                    </button>
                    <button className={studyTab === 'exercises' ? 'active' : ''} onClick={() => setStudyTab('exercises')}>
                      <HelpCircle size={15} /> Exercícios ({studyData.exercises?.length || 0})
                    </button>
                  </div>

                  <div className="moodle-study-content">
                    {studyTab === 'solution' && (
                      <div className="study-solution">
                        {studyData.solution?.question_summary && (
                          <p className="study-question-summary">{txt(studyData.solution.question_summary)}</p>
                        )}
                        {(studyData.solution?.solution || []).map((step, i) => (
                          <div key={i} className="study-step">
                            <span className="study-step-num">{i + 1}</span>
                            <div>
                              <strong>{txt(step.step)}</strong>
                              <p>{txt(step.explanation)}</p>
                            </div>
                          </div>
                        ))}
                        {studyData.solution?.final_answer && (
                          <div className="study-final-answer">
                            <h4>Resposta final</h4>
                            <p>{txt(studyData.solution.final_answer)}</p>
                          </div>
                        )}
                        {studyData.solution?.khan_style && (
                          <div className="study-khan">
                            <h4>Explicação de colega</h4>
                            <p>{txt(studyData.solution.khan_style)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {studyTab === 'summary' && (
                      <div className="study-summary">
                        {studyData.summary?.title && <h3>{txt(studyData.summary.title)}</h3>}
                        {studyData.summary?.general_summary && (
                          <p className="study-general">{txt(studyData.summary.general_summary)}</p>
                        )}
                        {(studyData.summary?.topics || []).map((t, i) => (
                          <div key={i} className="study-topic">
                            <h4>{txt(t.name)}
                              {t.priority && <span className={`topic-priority ${txt(t.priority)}`}>{txt(t.priority)}</span>}
                            </h4>
                            {t.explanation && <p>{txt(t.explanation)}</p>}
                            {t.key_concepts?.length > 0 && (
                              <ul>{t.key_concepts.map((k, j) => <li key={j}>• {txt(k)}</li>)}</ul>
                            )}
                            {t.formulas?.length > 0 && (
                              <div className="study-formulas">{t.formulas.map((f, j) => <code key={j}>{txt(f)}</code>)}</div>
                            )}
                            {t.examples?.length > 0 && (
                              <div className="study-examples">
                                <strong>Exemplos:</strong>
                                {t.examples.map((ex, j) => <p key={j}>– {txt(ex)}</p>)}
                              </div>
                            )}
                            {t.common_errors?.length > 0 && (
                              <div className="study-errors">
                                <strong>Erros comuns:</strong>
                                {t.common_errors.map((er, j) => <p key={j}>⚠ {txt(er)}</p>)}
                              </div>
                            )}
                          </div>
                        ))}
                        {studyData.summary?.study_tips?.length > 0 && (
                          <div className="study-tips">
                            <h4>Dicas de estudo</h4>
                            {studyData.summary.study_tips.map((tip, i) => <p key={i}>💡 {txt(tip)}</p>)}
                          </div>
                        )}
                        {studyData.summary?.formulas_summary?.length > 0 && (
                          <div className="study-formulas-all">
                            <h4>Fórmulas</h4>
                            {studyData.summary.formulas_summary.map((f, i) => <code key={i}>{txt(f)}</code>)}
                          </div>
                        )}
                      </div>
                    )}

                    {studyTab === 'exercises' && (
                      <div className="study-exercises">
                        {(studyData.exercises || []).map((ex, i) => (
                          <div key={i} className="study-exercise">
                            <div className="study-exercise-head">
                              <span className="study-exercise-num">{i + 1}</span>
                              <span className="activity-type">{txt(ex.type)}</span>
                              {ex.difficulty && <span className="topic-priority medio">{txt(ex.difficulty)}</span>}
                            </div>
                            <p className="study-exercise-q">{txt(ex.question)}</p>
                            {ex.options?.length > 0 && (
                              <div className="study-options">
                                {ex.options.map((o, j) => <p key={j}>{txt(o)}</p>)}
                              </div>
                            )}
                            <div className="study-answer">
                              <strong>Resposta: {txt(ex.correct_answer)}</strong>
                              {ex.explanation && <p>{txt(ex.explanation)}</p>}
                              {ex.solution_steps?.length > 0 && (
                                <ol>{ex.solution_steps.map((s, j) => <li key={j}>{txt(s)}</li>)}</ol>
                              )}
                            </div>
                            {ex.topic && <p className="study-exercise-topic">Tópico: {txt(ex.topic)}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodlePage;