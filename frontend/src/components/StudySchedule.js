import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Plus, BookOpen, Clock, TrendingUp, Target, BookMarked, Repeat, GraduationCap, AlertCircle, RefreshCw, WifiOff, Database, LayoutDashboard } from 'lucide-react';
import { weekSchedule } from '../data/mockScheduleData';
import WeeklyCalendar from './WeeklyCalendar';
import TopicsList from './TopicsList';
import TaskManager from './TaskManager';
import ProgressDashboard from './ProgressDashboard';
import StudyLog from './StudyLog';
import ReviewSchedule from './ReviewSchedule';
import RoadmapPlan from './RoadmapPlan';
import ExerciseSidebar from './ExerciseSidebar';
import { roadmapInfo as info110, phases as phases110, typeConfig as typeConfig110 } from '../data/roadmap110Days';
import { roadmapInfo as info16, phases as phases16, typeConfig as typeConfig16, disciplineConfig } from '../data/roadmap16Weeks';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND_URL ? `${BACKEND_URL}/api/schedule` : null;

const scheduleApi = API ? axios.create({ baseURL: API, timeout: 10000 }) : null;

const StudySchedule = () => {
  const [activeView, setActiveView] = useState('roadmap');
  const [roadmapChoice, setRoadmapChoice] = useState('weeks16');
  const [subjectsData, setSubjectsData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [attendedClasses, setAttendedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [exerciseSidebarOpen, setExerciseSidebarOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const loadLocalData = () => {
    try {
      const savedSessions = localStorage.getItem('studySessions');
      const savedAttended = localStorage.getItem('attendedClasses');
      const savedSubjects = localStorage.getItem('subjectsData');
      const savedTasks = localStorage.getItem('tasksData');
      
      if (savedSessions) setStudySessions(JSON.parse(savedSessions));
      if (savedAttended) setAttendedClasses(JSON.parse(savedAttended));
      if (savedSubjects) setSubjectsData(JSON.parse(savedSubjects));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (e) {
      console.error('Error loading local data:', e);
    }
  };

  const saveLocalData = () => {
    try {
      localStorage.setItem('studySessions', JSON.stringify(studySessions));
      localStorage.setItem('attendedClasses', JSON.stringify(attendedClasses));
      localStorage.setItem('subjectsData', JSON.stringify(subjectsData));
      localStorage.setItem('tasksData', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving local data:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('attendedClasses', JSON.stringify(attendedClasses));
  }, [attendedClasses]);

  useEffect(() => {
    localStorage.setItem('subjectsData', JSON.stringify(subjectsData));
  }, [subjectsData]);

  useEffect(() => {
    localStorage.setItem('tasksData', JSON.stringify(tasks));
  }, [tasks]);

  const checkBackendHealth = async () => {
    if (!BACKEND_URL) {
      setBackendStatus('unconfigured');
      return false;
    }
    try {
      await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
      setBackendStatus('connected');
      return true;
    } catch {
      setBackendStatus('disconnected');
      return false;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    loadLocalData();
    
    const isConnected = await checkBackendHealth();
    
    if (!isConnected) {
      toast.warning('Backend indisponível — usando dados locais');
      setIsLoading(false);
      return;
    }

    try {
      const [subjectsRes, tasksRes] = await Promise.all([
        scheduleApi.get('/subjects'),
        scheduleApi.get('/tasks')
      ]);
      
      const transformedSubjects = subjectsRes.data.map(subject => ({
        id: subject.subject_id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        topics: subject.topics
      }));
      
      setSubjectsData(transformedSubjects);
      setTasks(tasksRes.data);
      saveLocalData();
      toast.success('Dados sincronizados com o servidor');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao sincronizar — usando cache local');
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithBackend = async () => {
    if (!scheduleApi) {
      toast.error('Backend não configurado');
      return;
    }
    await loadData();
  };

  const toggleTopic = async (subjectId, topicId) => {
    if (!scheduleApi) {
      toast.error('Backend não disponível');
      return;
    }
    try {
      const response = await scheduleApi.put(`/subjects/${subjectId}/topics/${topicId}/toggle`);
      setSubjectsData(prev => 
        prev.map(subject => {
          if (subject.id === response.data.subject_id) {
            return { ...subject, topics: response.data.topics };
          }
          return subject;
        })
      );
      saveLocalData();
      toast.success('Tópico atualizado!');
    } catch (error) {
      console.error('Error toggling topic:', error);
      toast.error('Erro ao atualizar tópico');
    }
  };

  const addTask = async (newTask) => {
    if (!scheduleApi) {
      toast.error('Backend não disponível');
      return;
    }
    try {
      const response = await scheduleApi.post('/tasks', newTask);
      setTasks(prev => [...prev, response.data]);
      saveLocalData();
      toast.success('Tarefa adicionada!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erro ao adicionar tarefa');
    }
  };

  const toggleTask = async (taskId) => {
    if (!scheduleApi) {
      toast.error('Backend não disponível');
      return;
    }
    try {
      const response = await scheduleApi.put(`/tasks/${taskId}/toggle`);
      setTasks(prev => prev.map(task => task.id === taskId ? response.data : task));
      saveLocalData();
      toast.success('Tarefa atualizada!');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = async (taskId) => {
    if (!scheduleApi) {
      toast.error('Backend não disponível');
      return;
    }
    try {
      await scheduleApi.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      saveLocalData();
      toast.success('Tarefa excluída!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  const addStudySession = (session) => {
    setStudySessions(prev => [...prev, session]);
    saveLocalData();
    toast.success('Sessão de estudo registrada!');
  };

  const toggleAttendedClass = (day, time) => {
    const classKey = `${day}-${time}`;
    setAttendedClasses(prev => {
      if (prev.includes(classKey)) {
        toast.info('Aula desmarcada');
        return prev.filter(key => key !== classKey);
      } else {
        toast.success('Aula marcada como assistida!');
        return [...prev, classKey];
      }
    });
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    toast.success(`${exercise.topicName} - ${exercise.count} exercícios`);
    console.log('Exercício selecionado:', exercise);
  };

  const handleCloseSidebar = (open) => {
    setExerciseSidebarOpen(open);
  };

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return <Database className="text-green-400" size={18} />;
      case 'disconnected': return <WifiOff className="text-red-400" size={18} />;
      case 'unconfigured': return <AlertCircle className="text-amber-400" size={18} />;
      default: return <RefreshCw className="text-blue-400 animate-spin" size={18} />;
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Offline';
      case 'unconfigured': return 'Não configurado';
      default: return 'Verificando...';
    }
  };

  if (isLoading) {
    return (
      <div className="study-schedule-container">
        <div className="schedule-header">
          <div className="schedule-title-section">
            <BookOpen className="schedule-icon" size={32} />
            <div>
              <h1 className="schedule-title">Cronograma de Estudos</h1>
              <p className="schedule-subtitle">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study-schedule-container">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-title-section">
          <BookOpen className="schedule-icon" size={32} />
          <div>
            <h1 className="schedule-title">Cronograma de Estudos</h1>
            <p className="schedule-subtitle">IFG/Jataí-GO • Estrutura de Dados & Sistemas Digitais • Cálculo Numérico</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="backend-status" title={`Backend: ${getStatusText()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          <button
            onClick={syncWithBackend}
            disabled={backendStatus !== 'connected' || isLoading}
            className="sync-btn"
            title="Sincronizar com servidor"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
      </div>

      {/* Offline Banner */}
      {backendStatus !== 'connected' && (
        <div className="offline-banner">
          <WifiOff size={18} />
          <span>
            Modo offline — {backendStatus === 'unconfigured' 
              ? 'Configure REACT_APP_BACKEND_URL no Render' 
              : 'Dados do cache local. Clique em sincronizar quando o servidor voltar.'}
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="schedule-tabs">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`schedule-tab ${activeView === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          className={`schedule-tab ${activeView === 'calendar' ? 'active' : ''}`}
        >
          <Calendar size={18} />
          Calendário
        </button>
        <button
          onClick={() => setActiveView('topics')}
          className={`schedule-tab ${activeView === 'topics' ? 'active' : ''}`}
        >
          <Target size={18} />
          Tópicos
        </button>
        <button
          onClick={() => setActiveView('tasks')}
          className={`schedule-tab ${activeView === 'tasks' ? 'active' : ''}`}
        >
          <CheckCircle2 size={18} />
          Tarefas
        </button>
        <button
          onClick={() => setActiveView('studylog')}
          className={`schedule-tab ${activeView === 'studylog' ? 'active' : ''}`}
        >
          <BookMarked size={18} />
          Registro
        </button>
        <button
          onClick={() => setActiveView('roadmap')}
          className={`schedule-tab ${activeView === 'roadmap' ? 'active' : ''}`}
        >
          <GraduationCap size={18} />
          Roteiros
        </button>
        <button
          onClick={() => setActiveView('reviews')}
          className={`schedule-tab ${activeView === 'reviews' ? 'active' : ''}`}
        >
          <Repeat size={18} />
          Revisões
        </button>
      </div>

      {/* Content */}
      <div className="schedule-content">
        {activeView === 'dashboard' && (
          <ProgressDashboard subjects={subjectsData} tasks={tasks} />
        )}
        {activeView === 'calendar' && (
          <WeeklyCalendar 
            schedule={weekSchedule} 
            attendedClasses={attendedClasses}
            onToggleAttended={toggleAttendedClass}
          />
        )}
        {activeView === 'topics' && (
          <TopicsList subjects={subjectsData} onToggleTopic={toggleTopic} />
        )}
        {activeView === 'tasks' && (
          <TaskManager 
            tasks={tasks} 
            subjects={subjectsData}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        )}
        {activeView === 'studylog' && (
          <StudyLog 
            subjects={subjectsData}
            studySessions={studySessions}
            onAddSession={addStudySession}
          />
        )}
        {activeView === 'roadmap' && (
          <div className="roadmap-selector">
            <div className="roadmap-selector-tabs">
              <button
                onClick={() => setRoadmapChoice('weeks16')}
                className={`roadmap-selector-tab ${roadmapChoice === 'weeks16' ? 'active' : ''}`}
              >
                Cronograma 16 Semanas
              </button>
              <button
                onClick={() => setRoadmapChoice('weeks110')}
                className={`roadmap-selector-tab ${roadmapChoice === 'weeks110' ? 'active' : ''}`}
              >
                Roteiro 110 Dias
              </button>
            </div>
            {roadmapChoice === 'weeks16' ? (
              <RoadmapPlan
                info={info16}
                phases={phases16}
                typeConfig={typeConfig16}
                disciplineConfig={disciplineConfig}
                storageKey="roadmap16weeks_completed_v1"
              />
            ) : (
              <RoadmapPlan
                info={info110}
                phases={phases110}
                typeConfig={typeConfig110}
                storageKey="roadmap110_completed_v1"
              />
            )}
          </div>
        )}
        {activeView === 'reviews' && (
          <ReviewSchedule 
            subjects={subjectsData}
            studySessions={studySessions}
          />
        )}
      </div>

      {/* Exercise Sidebar */}
      <ExerciseSidebar
        isOpen={exerciseSidebarOpen}
        onClose={handleCloseSidebar}
        onSelectExercise={handleSelectExercise}
      />
    </div>
  );
};

export default StudySchedule;