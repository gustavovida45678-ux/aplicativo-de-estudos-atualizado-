import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/study`;

export default function StudyTimer({ onSessionComplete }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [exercisesCorrect, setExercisesCorrect] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadTopics();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadTopics = async () => {
    try {
      const response = await axios.get(`${API}/topics`);
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
      const response = await axios.post(`${API}/session/start?topic_id=${selectedTopic}`);
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
        `${API}/session/end?session_id=${sessionId}&duration=${duration}&exercises_completed=${exercisesCompleted}&exercises_correct=${exercisesCorrect}`
      );
      toast.success(`Sessão finalizada! Duração: ${duration} minutos`);
      resetSession();
      if (onSessionComplete) onSessionComplete();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Erro ao finalizar sessão');
    }
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Cronômetro de Estudos</h2>
        
        {/* Topic Selection */}
        {!sessionId && (
          <div className="mb-6">
            <label className="text-white font-medium mb-2 block">Selecione o Tópico de Estudo:</label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Escolha um tópico..." />
              </SelectTrigger>
              <SelectContent>
                {topics.map(topic => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name} ({topic.difficulty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <div className="flex gap-3">
          {!sessionId ? (
            <Button
              onClick={startSession}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!selectedTopic}
            >
              <Play size={20} className="mr-2" />
              Iniciar Sessão
            </Button>
          ) : (
            <>
              {isRunning ? (
                <Button
                  onClick={pauseSession}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  <Pause size={20} className="mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  onClick={resumeSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Play size={20} className="mr-2" />
                  Continuar
                </Button>
              )}
              <Button
                onClick={endSession}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={20} className="mr-2" />
                Finalizar
              </Button>
              <Button
                onClick={resetSession}
                variant="outline"
                className="border-white/10"
              >
                <RotateCcw size={20} />
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
                + Exercício Completo
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

      {/* Tips */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
        <h3 className="font-semibold text-white mb-3">💡 Dicas para Estudar Melhor:</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Use a técnica Pomodoro: 25 min de estudo, 5 min de pausa</li>
          <li>• Elimine distrações durante a sessão</li>
          <li>• Faça anotações enquanto estuda</li>
          <li>• Revise o conteúdo após cada sessão</li>
        </ul>
      </Card>
    </div>
  );
}