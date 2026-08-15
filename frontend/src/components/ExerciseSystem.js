import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ExerciseList from './ExerciseList';
import StudyTimer from './StudyTimer';
import ExerciseGenerator from './ExerciseGenerator';
import { BookOpen, Clock, Calendar, BarChart3, Sparkles } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../lib/backendUrl';

export default function ExerciseSystem() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/study/stats`);
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
    <div className="min-h-screen neural-void-bg p-2 sm:p-4">
      <div className="noise-overlay" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 pt-4 sm:pt-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ 
            fontFamily: 'Space Grotesk', 
            background: 'linear-gradient(to right, #10b981, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Sistema de Exercícios e Estudos
          </h1>
          <p className="text-gray-400 text-sm sm:text-base px-2">Pratique, acompanhe seu progresso e alcance seus objetivos</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl">
            <TabsTrigger value="exercises" className="data-[state=active]:bg-green-600 py-2.5 sm:py-3 px-1 text-xs sm:text-sm">
              <BookOpen className="sm:mr-2 shrink-0" size={16} />
              <span>Exercícios</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-purple-600 py-2.5 sm:py-3 px-1 text-xs sm:text-sm">
              <Sparkles className="sm:mr-2 shrink-0" size={16} />
              <span>Gerar</span>
            </TabsTrigger>
            <TabsTrigger value="timer" className="data-[state=active]:bg-blue-600 py-2.5 sm:py-3 px-1 text-xs sm:text-sm">
              <Clock className="sm:mr-2 shrink-0" size={16} />
              <span>Cronômetro</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-600 py-2.5 sm:py-3 px-1 text-xs sm:text-sm">
              <BarChart3 className="sm:mr-2 shrink-0" size={16} />
              <span>Estatísticas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-4 sm:mt-6">
            <ExerciseList onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="generator" className="mt-4 sm:mt-6">
            <ExerciseGenerator />
          </TabsContent>

          <TabsContent value="timer" className="mt-4 sm:mt-6">
            <StudyTimer onSessionComplete={loadStats} />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4 sm:mt-6">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.totalExercises ?? 0}</p>
                <p className="text-xs sm:text-sm text-gray-400">Exercícios</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center">
                <p className="text-2xl sm:text-3xl font-bold">{stats?.completedExercises ?? 0}</p>
                <p className="text-xs sm:text-sm text-gray-400">Concluídos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center">
                <p className="text-2xl sm:text-3xl font-bold">{Math.floor((stats?.studyTime ?? 0) / 60)}h {Math.round((stats?.studyTime ?? 0) % 60)}m</p>
                <p className="text-xs sm:text-sm text-gray-400">Tempo de estudo</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}