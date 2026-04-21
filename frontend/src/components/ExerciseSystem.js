import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ExerciseList from './ExerciseList';
import StudyTimer from './StudyTimer';
import ExerciseGenerator from './ExerciseGenerator';
import { BookOpen, Clock, Calendar, BarChart3, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function ExerciseSystem() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/study/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats if API fails
      setStats({
        totalExercises: 0,
        completedExercises: 0,
        studyTime: 0
      });
    }
  };

  return (
    <div className="min-h-screen neural-void-bg p-4">
      <div className="noise-overlay" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold mb-2" style={{ 
            fontFamily: 'Space Grotesk', 
            background: 'linear-gradient(to right, #10b981, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Sistema de Exercícios e Estudos
          </h1>
          <p className="text-gray-400">Pratique, acompanhe seu progresso e alcance seus objetivos</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="exercises" className="data-[state=active]:bg-green-600">
              <BookOpen className="mr-2" size={18} />
              Exercícios
            </TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-purple-600">
              <Sparkles className="mr-2" size={18} />
              Gerar
            </TabsTrigger>
            <TabsTrigger value="timer" className="data-[state=active]:bg-blue-600">
              <Clock className="mr-2" size={18} />
              Cronômetro
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-600">
              <BarChart3 className="mr-2" size={18} />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-6">
            <ExerciseList onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="generator" className="mt-6">
            <ExerciseGenerator />
          </TabsContent>

          <TabsContent value="timer" className="mt-6">
            <StudyTimer onSessionComplete={loadStats} />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <div className="text-center py-12 text-gray-400">
              <BarChart3 size={64} className="mx-auto mb-4 opacity-50" />
              <p>Dashboard de estatísticas em breve...</p>
              <p className="text-sm mt-2">Use o Cronograma na aba principal para acompanhar seu progresso</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}