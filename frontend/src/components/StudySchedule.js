import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Plus, BookOpen, Clock, TrendingUp, Target, BookMarked, Repeat, GraduationCap } from 'lucide-react';
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
const API = `${BACKEND_URL}/api/schedule`;

// Create a separate axios instance to avoid interceptor conflicts
const scheduleApi = axios.create({
  baseURL: API,
});

const StudySchedule = () => {
  const [activeView, setActiveView] = useState('roadmap');
  const [roadmapChoice, setRoadmapChoice] = useState('weeks16');
  const [subjectsData, setSubjectsData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [attendedClasses, setAttendedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseSidebarOpen, setExerciseSidebarOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Load from backend and localStorage
  useEffect(() => {
    loadData();
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    // Load study sessions and attended classes from localStorage
    const savedSessions = localStorage.getItem('studySessions');
    const savedAttended = localStorage.getItem('attendedClasses');
    
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions));
    }
    if (savedAttended) {
      setAttendedClasses(JSON.parse(savedAttended));
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('attendedClasses', JSON.stringify(attendedClasses));
  }, [attendedClasses]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subjectsRes, tasksRes] = await Promise.all([
        scheduleApi.get('/subjects'),
        scheduleApi.get('/tasks')
      ]);
      
      // Transform backend data to match frontend format
      const transformedSubjects = subjectsRes.data.map(subject => ({
        id: subject.subject_id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        topics: subject.topics
      }));
      
      setSubjectsData(transformedSubjects);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = async (subjectId, topicId) => {
    try {
      const response = await scheduleApi.put(`/subjects/${subjectId}/topics/${topicId}/toggle`);
      
      // Update local state with response
      setSubjectsData(prev => 
        prev.map(subject => {
          if (subject.id === response.data.subject_id) {
            return {
              ...subject,
              topics: response.data.topics
            };
          }
          return subject;
        })
      );
      toast.success('Tópico atualizado!');
    } catch (error) {
      console.error('Error toggling topic:', error);
      toast.error('Erro ao atualizar tópico');
    }
  };

  const addTask = async (newTask) => {
    try {
      const response = await scheduleApi.post('/tasks', newTask);
      setTasks(prev => [...prev, response.data]);
      toast.success('Tarefa adicionada!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erro ao adicionar tarefa');
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const response = await scheduleApi.put(`/tasks/${taskId}/toggle`);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? response.data : task
        )
      );
      toast.success('Tarefa atualizada!');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await scheduleApi.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Tarefa excluída!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  const addStudySession = (session) => {
    setStudySessions(prev => [...prev, session]);
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
    // TODO: abrir modal de exercícios ou navegar para tela de prática
    toast.success(`${exercise.topicName} - ${exercise.count} exercícios`);
    console.log('Exercício selecionado:', exercise);
  };

  const handleCloseSidebar = (open) => {
    setExerciseSidebarOpen(open);
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
      </div>

      {/* Navigation Tabs */}
      <div className="schedule-tabs">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`schedule-tab ${activeView === 'dashboard' ? 'active' : ''}`}
        >
          <TrendingUp size={18} />
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
          Roteiro 110d
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
