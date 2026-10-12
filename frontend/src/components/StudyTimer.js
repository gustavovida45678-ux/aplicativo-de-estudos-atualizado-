import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Clock, Brain, BookOpen, Calendar, Download, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { BACKEND_URL } from '../lib/backendUrl';

const API = `${BACKEND_URL}/api`;

const REVIEW_INTERVALS = [
  { label: '24 horas', value: 1, days: '1d' },
  { label: '2 dias', value: 2, days: '2d' },
  { label: '3 dias', value: 3, days: '3d' },
  { label: '6 dias', value: 6, days: '6d' },
  { label: '9 dias', value: 9, days: '9d' },
];

export default function StudyTimer({ onSessionComplete }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [exercisesCorrect, setExercisesCorrect] = useState(0);
  const [activeTab, setActiveTab] = useState('timer');
  
  // Summary & Mental Map states
  const [sessionSummary, setSessionSummary] = useState(null);
  const [mentalMap, setMentalMap] = useState(null);
  const [reviewSchedules, setReviewSchedules] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [selectedReviewIntervals, setSelectedReviewIntervals] = useState([1, 3, 6]);

  const intervalRef = React.useRef(null);

  useEffect(() => {
    loadTopics();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadTopics = async () => {
    try {
      const response = await axios.get(`${API}/study/topics`);
      const allTopics = [];
      Object.values(response.data.topics).forEach(category => {
        Object.values(category).forEach(topicsList => {
          allTopics.push(...topicsList);
        });
      });
      setTopics(allTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const startSession = async () => {
    if (!selectedTopic) {
      toast.error('Selecione um tópico primeiro');
      return;
    }

    try {
      const response = await axios.post(`${API}/study/session/start?topic_id=${selectedTopic}`);
      setSessionId(response.data.session_id);
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      toast.success('Sessão iniciada!');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Erro ao iniciar sessão');
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resumeSession = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const endSession = async () => {
    if (!sessionId) return;

    pauseSession();
    const duration = Math.floor(elapsedTime / 60);

    try {
      const response = await axios.post(
        `${API}/study/session/end?session_id=${sessionId}&duration=${duration}&exercises_completed=${exercisesCompleted}&exercises_correct=${exercisesCorrect}`
      );
      toast.success(`Sessão finalizada! Duração: ${duration} minutos`);
      
      // Generate summary automatically
      await generateSummary(sessionId, exercisesCompleted, exercisesCorrect);
      
      setActiveTab('summary');
      resetSession();
      if (onSessionComplete) onSessionComplete();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Erro ao finalizar sessão');
    }
  };

  const generateSummary = async (sessionIdParam, completed, correct) => {
    setIsGeneratingSummary(true);
    try {
      const response = await axios.post(`${API}/study/generate-summary`, {
        session_id: sessionIdParam,
        exercises_completed: completed,
        exercises_correct: correct,
        accuracy: correct > 0 ? Math.round((correct / completed) * 100) : 0
      });
      
      setSessionSummary(response.data);
      toast.success('Resumo gerado com sucesso!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Erro ao gerar resumo');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateMentalMap = async () => {
    if (!sessionSummary) {
      toast.error('Complete a sessão primeiro');
      return;
    }

    setIsGeneratingMap(true);
    try {
      const response = await axios.post(`${API}/study/generate-mental-map`, {
        summary: sessionSummary,
        topic: selectedTopic
      });
      
      setMentalMap(response.data);
      toast.success('Mapa mental gerado!');
    } catch (error) {
      console.error('Error generating mental map:', error);
      toast.error('Erro ao gerar mapa mental');
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const scheduleReviews = async () => {
    if (!sessionSummary || selectedReviewIntervals.length === 0) {
      toast.error('Selecione pelo menos um intervalo de revisão');
      return;
    }

    try {
      const response = await axios.post(`${API}/study/schedule-reviews`, {
        session_id: sessionId,
        intervals_days: selectedReviewIntervals,
        topic_id: selectedTopic
      });
      
      setReviewSchedules(response.data.schedules);
      toast.success('Revisões agendadas com sucesso!');
    } catch (error) {
      console.error('Error scheduling reviews:', error);
      toast.error('Erro ao agendar revisões');
    }
  };

  const downloadSummary = () => {
    if (!sessionSummary) return;
    
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(sessionSummary, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `resumo-estudo-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetSession = () => {
    setElapsedTime(0);
    setSessionId(null);
    setIsRunning(false);
    setExercisesCompleted(0);
    setExercisesCorrect(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNextReviewDate = (intervalDays) => {
    const date = new Date();
    date.setDate(date.getDate() + intervalDays);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-xl">
          <TabsTrigger value="timer" className="data-[state=active]:bg-blue-600">
            <Clock className="mr-2" size={18} />
            Cronômetro
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-green-600">
            <BookOpen className="mr-2" size={18} />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="mentalmap" className="data-[state=active]:bg-purple-600">
            <Brain className="mr-2" size={18} />
            Mapa Mental
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-orange-600">
            <Calendar className="mr-2" size={18} />
            Revisões
          </TabsTrigger>
        </TabsList>

        {/* Timer Tab */}
        <TabsContent value="timer" className="mt-6">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Cronômetro de Estudos</h2>
            
            {/* Topic Selection */}
            {!sessionId && (
              <div className="mb-6">
                <label className="text-white font-medium mb-2 block">Selecione o Tópico de Estudo:</label>
                <select
                  value={selectedTopic || ''}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Escolha um tópico...</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Timer Display */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-12 mb-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-4" style={{ fontFamily: 'JetBrains Mono' }}>
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-gray-400">Tempo de estudo</div>
              </div>
            </div>

            {/* Stats */}
            {sessionId && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-white/5 border-white/10 p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{exercisesCompleted}</div>
                    <div className="text-sm text-gray-400">Exercícios Completos</div>
                  </div>
                </Card>
                <Card className="bg-white/5 border-white/10 p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{exercisesCorrect}</div>
                    <div className="text-sm text-gray-400">Exercícios Corretos</div>
                  </div>
                </Card>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 flex-wrap">
              {!sessionId ? (
                <Button
                  onClick={startSession}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                  disabled={!selectedTopic}
                >
                  <Clock size={20} className="mr-2" />
                  Iniciar Sessão
                </Button>
              ) : (
                <>
                  {isRunning ? (
                    <Button
                      onClick={pauseSession}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3"
                    >
                      ⏸ Pausar
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeSession}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
                    >
                      ▶ Continuar
                    </Button>
                  )}
                  <Button
                    onClick={endSession}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                  >
                    ✓ Finalizar
                  </Button>
                  <Button
                    onClick={resetSession}
                    variant="outline"
                    className="border-white/10 py-3"
                  >
                    ↻
                  </Button>
                </>
              )}
            </div>

            {/* Manual Exercise Counter */}
            {sessionId && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-white font-medium mb-3 text-center">Registre seus exercícios manualmente:</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setExercisesCompleted(prev => prev + 1)}
                    variant="outline"
                    className="flex-1 border-blue-500/30"
                  >
                    + Exercício
                  </Button>
                  <Button
                    onClick={() => {
                      setExercisesCompleted(prev => prev + 1);
                      setExercisesCorrect(prev => prev + 1);
                    }}
                    variant="outline"
                    className="flex-1 border-green-500/30"
                  >
                    + Acertei
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6">
          {sessionSummary ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  <BookOpen className="inline mr-2" size={28} />
                  Resumo da Sessão
                </h3>
                <Button onClick={downloadSummary} variant="outline" className="border-white/10">
                  <Download size={18} className="mr-2" />
                  Baixar
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{sessionSummary.total_exercises}</div>
                  <div className="text-sm text-gray-400">Total de exercícios</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{sessionSummary.accuracy}%</div>
                  <div className="text-sm text-gray-400">Acurácia</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{sessionSummary.study_duration}</div>
                  <div className="text-sm text-gray-400">Tempo de estudo</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">{sessionSummary.main_topics?.length || 0}</div>
                  <div className="text-sm text-gray-400">Tópicos principais</div>
                </div>
              </div>

              {/* Topics Covered */}
              {sessionSummary.main_topics && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Principais Tópicos Cobertos:</h4>
                  <div className="space-y-2">
                    {sessionSummary.main_topics.map((topic, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Badge className="bg-blue-600 mt-1">✓</Badge>
                        <p className="text-gray-300 text-sm">{topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Learnings */}
              {sessionSummary.key_learnings && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Principais Aprendizados:</h4>
                  <div className="space-y-3">
                    {sessionSummary.key_learnings.map((learning, idx) => (
                      <div key={idx} className="text-gray-300 text-sm">
                        <span className="text-yellow-400 font-medium">•</span> {learning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {sessionSummary.recommendations && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-green-400 mb-3">Recomendações:</h4>
                  <div className="space-y-2">
                    {sessionSummary.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400">→</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">Nenhum resumo disponível</p>
              <p className="text-gray-500 text-sm mt-2">Complete uma sessão de estudos para gerar um resumo</p>
            </Card>
          )}
        </TabsContent>

        {/* Mental Map Tab */}
        <TabsContent value="mentalmap" className="mt-6">
          {sessionSummary ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  <Brain className="inline mr-2" size={28} />
                  Mapa Mental
                </h3>
                <Button 
                  onClick={generateMentalMap}
                  disabled={isGeneratingMap}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles size={18} className="mr-2" />
                  {isGeneratingMap ? 'Gerando...' : 'Gerar Mapa Mental'}
                </Button>
              </div>

              {mentalMap ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-6">
                    {mentalMap.image_url ? (
                      <img 
                        src={mentalMap.image_url} 
                        alt="Mapa Mental" 
                        className="w-full rounded-lg border border-white/10"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Visualização do mapa mental</p>
                        <div className="mt-4 bg-purple-900/30 rounded-lg p-6">
                          <pre className="text-left text-xs text-purple-300 overflow-auto max-h-96">
                            {JSON.stringify(mentalMap.structure, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {mentalMap.description && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-300 text-sm">{mentalMap.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-8 text-center">
                  <Brain size={48} className="mx-auto mb-4 text-purple-400" />
                  <p className="text-gray-400">Clique no botão acima para gerar um mapa mental com base no seu resumo</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">Nenhum mapa mental disponível</p>
              <p className="text-gray-500 text-sm mt-2">Complete uma sessão de estudos primeiro</p>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-6">
          {sessionSummary ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6 space-y-6">
              <h3 className="text-2xl font-bold text-white">
                <Calendar className="inline mr-2" size={28} />
                Cronograma de Revisões (Spaced Repetition)
              </h3>

              {/* Interval Selection */}
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-medium mb-3">Selecione quando revisar:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {REVIEW_INTERVALS.map(interval => (
                    <Button
                      key={interval.value}
                      onClick={() => {
                        setSelectedReviewIntervals(prev =>
                          prev.includes(interval.value)
                            ? prev.filter(v => v !== interval.value)
                            : [...prev, interval.value]
                        );
                      }}
                      className={`text-sm ${
                        selectedReviewIntervals.includes(interval.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Calendar size={14} className="mr-1" />
                      {interval.label}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={scheduleReviews}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 py-2"
                >
                  <Calendar size={18} className="mr-2" />
                  Agendar Revisões
                </Button>
              </div>

              {/* Scheduled Reviews */}
              {reviewSchedules.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Revisões Agendadas:</h4>
                  {reviewSchedules.map((schedule, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">Revisão {idx + 1}</p>
                        <p className="text-gray-400 text-sm">
                          Agendada para: <span className="text-yellow-400">{schedule.scheduled_date}</span>
                        </p>
                      </div>
                      <Badge className="bg-orange-600">
                        {schedule.days_from_now} dias
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-8 text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-orange-400" />
                  <p className="text-gray-400">Nenhuma revisão agendada</p>
                  <p className="text-gray-500 text-sm mt-2">Selecione os intervalos acima e clique em "Agendar Revisões"</p>
                </div>
              )}

              {/* Spaced Repetition Info */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">💡 Sobre Repetição Espaçada:</h4>
                <p className="text-gray-300 text-sm">
                  A repetição espaçada é uma técnica de aprendizagem que consiste em revisar o material em intervalos crescentes para maximizar a retenção de conhecimento. Estudos mostram que revisões em 1, 3, 6 e 9 dias otimizam a aprendizagem a longo prazo.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">Nenhuma revisão disponível</p>
              <p className="text-gray-500 text-sm mt-2">Complete uma sessão de estudos para agendar revisões</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
        <h3 className="font-semibold text-white mb-3">💡 Dicas para Estudar Melhor:</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Use a técnica Pomodoro: 25 min de estudo, 5 min de pausa</li>
          <li>• Elimine distrações durante a sessão</li>
          <li>• Faça anotações enquanto estuda</li>
          <li>• Revise o conteúdo nos intervalos agendados</li>
          <li>• Use mapas mentais para visualizar conexões entre conceitos</li>
        </ul>
      </Card>
    </div>
  );
}
