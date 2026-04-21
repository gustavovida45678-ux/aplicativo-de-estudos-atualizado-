import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronRight, CheckCircle, XCircle, BookOpen, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/study`;

export default function ExerciseList({ onStatsUpdate }) {
  const [topics, setTopics] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await axios.get(`${API}/topics`);
      setTopics(response.data || {});
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Erro ao carregar tópicos');
      setTopics({});
    }
  };

  const selectTopic = async (topicId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/topics/${topicId}/exercises`);
      setSelectedTopic(response.data.topic);
      setExercises(response.data.exercises);
      if (response.data.exercises.length > 0) {
        setCurrentExercise(response.data.exercises[0]);
        setStartTime(Date.now());
      }
      toast.success(`${response.data.total} exercícios carregados!`);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Erro ao carregar exercícios');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null) {
      toast.error('Selecione uma resposta');
      return;
    }

    const isCorrect = selectedAnswer === currentExercise.correct_answer;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await axios.post(`${API}/exercises/attempt`, {
        user_id: 'default_user',
        exercise_id: currentExercise.id,
        topic_id: currentExercise.topic_id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_spent: timeSpent
      });

      setShowResult(true);
      if (isCorrect) {
        toast.success('Resposta correta! 🎉');
      } else {
        toast.error('Resposta incorreta. Veja a explicação.');
      }
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Erro ao enviar resposta');
    }
  };

  const nextExercise = () => {
    const currentIndex = exercises.findIndex(e => e.id === currentExercise.id);
    if (currentIndex < exercises.length - 1) {
      setCurrentExercise(exercises[currentIndex + 1]);
      setSelectedAnswer(null);
      setShowResult(false);
      setStartTime(Date.now());
    } else {
      toast.success('Você completou todos os exercícios deste tópico!');
      setSelectedTopic(null);
      setExercises([]);
      setCurrentExercise(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Básico': return 'bg-green-600';
      case 'Intermediário': return 'bg-yellow-600';
      case 'Avançado': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty) {
      case 'Básico': return <BookOpen size={16} />;
      case 'Intermediário': return <Brain size={16} />;
      case 'Avançado': return <Zap size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  if (!selectedTopic) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-white/20 p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Escolha um Tópico para Praticar</h2>
          <p className="text-gray-300 text-lg">Selecione um tópico para começar a resolver exercícios</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(topics).map(([subjectKey, subjectData]) => (
            <Card key={subjectKey} className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 backdrop-blur-xl border-violet-400/30 p-6 hover:border-violet-400/60 transition-all duration-300 hover:scale-105 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-5 tracking-tight">{subjectData.name}</h3>
              <div className="space-y-3">
                {subjectData.topics && subjectData.topics.map(topic => (
                  <Button
                    key={topic.id}
                    onClick={() => selectTopic(topic.id)}
                    variant="outline"
                    className="w-full justify-between border-white/20 hover:bg-white/15 hover:border-white/40 text-left py-3 px-4 transition-all duration-200 backdrop-blur-sm"
                    disabled={isLoading}
                  >
                    <span className="text-sm font-semibold text-white">{topic.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-bold bg-violet-500/30 text-violet-100 border-violet-400/40">
                        {topic.exercises_count} ex.
                      </Badge>
                      <ChevronRight size={18} className="text-violet-300" />
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white">Carregando exercícios...</p>
      </Card>
    );
  }

  if (!currentExercise) {
    return null;
  }

  const progress = ((exercises.findIndex(e => e.id === currentExercise.id) + 1) / exercises.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{selectedTopic.name}</h2>
            <p className="text-gray-400">{selectedTopic.category}</p>
          </div>
          <Badge className={getDifficultyColor(selectedTopic.difficulty)}>
            {selectedTopic.difficulty}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progresso</span>
            <span>{exercises.findIndex(e => e.id === currentExercise.id) + 1} de {exercises.length}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </Card>

      {/* Question */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
            {exercises.findIndex(e => e.id === currentExercise.id) + 1}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-6">{currentExercise.question}</h3>
            <div className="space-y-3">
              {currentExercise.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentExercise.correct_answer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedAnswer(index)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showCorrect ? 'border-green-500 bg-green-500/20' :
                      showWrong ? 'border-red-500 bg-red-500/20' :
                      isSelected ? 'border-blue-500 bg-blue-500/20' :
                      'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white">{option}</span>
                      {showCorrect && <CheckCircle className="text-green-400" size={20} />}
                      {showWrong && <XCircle className="text-red-400" size={20} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {showResult && (
          <div className={`mt-6 p-4 rounded-lg ${selectedAnswer === currentExercise.correct_answer ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
            <h4 className="font-semibold text-white mb-2">
              {selectedAnswer === currentExercise.correct_answer ? '✅ Correto!' : '❌ Incorreto'}
            </h4>
            <p className="text-gray-200 text-sm">{currentExercise.explanation}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {!showResult ? (
            <Button
              onClick={submitAnswer}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={selectedAnswer === null}
            >
              Enviar Resposta
            </Button>
          ) : (
            <Button
              onClick={nextExercise}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Próximo Exercício <ChevronRight size={18} className="ml-2" />
            </Button>
          )}
          <Button
            onClick={() => {
              setSelectedTopic(null);
              setExercises([]);
              setCurrentExercise(null);
            }}
            variant="outline"
            className="border-white/10"
          >
            Voltar
          </Button>
        </div>
      </Card>
    </div>
  );
}