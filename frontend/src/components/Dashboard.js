import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Award, Target, Clock, RefreshCw, Flame } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Dashboard({ stats, onRefresh }) {
  if (!stats) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white">Carregando estatísticas...</p>
      </Card>
    );
  }

  const accuracyData = [
    { name: 'Corretos', value: stats.correct_exercises },
    { name: 'Incorretos', value: stats.total_exercises - stats.correct_exercises }
  ];

  const weakTopicsData = stats.weak_topics.slice(0, 5).map(topic => ({
    name: topic.name.substring(0, 15) + '...',
    accuracy: topic.accuracy
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-green-400" size={24} />
            <span className="text-green-400 text-sm font-medium">PRECISÃO</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.accuracy}%</div>
          <div className="text-sm text-gray-400">{stats.correct_exercises}/{stats.total_exercises} corretos</div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-sky-900/40 border-blue-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-400" size={24} />
            <span className="text-blue-400 text-sm font-medium">HORAS</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.total_study_hours}h</div>
          <div className="text-sm text-gray-400">Tempo estudado</div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-purple-400" size={24} />
            <span className="text-purple-400 text-sm font-medium">DOMINADOS</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.topics_mastered.length}</div>
          <div className="text-sm text-gray-400">Tópicos</div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <Flame className="text-orange-400" size={24} />
            <span className="text-orange-400 text-sm font-medium">SEQUÊNCIA</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.streak_days}</div>
          <div className="text-sm text-gray-400">Dias consecutivos</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Pie Chart */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Desempenho Geral</h3>
            <Button onClick={onRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <RefreshCw size={16} />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={accuracyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accuracyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Weak Topics Bar Chart */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-6">Tópicos que Precisam de Atenção</h3>
          {weakTopicsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weakTopicsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="accuracy" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>Parabéns! Nenhum tópico fraco</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Topics Mastered */}
      {stats.topics_mastered.length > 0 && (
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="text-green-400" />
            Tópicos Dominados (≥ 80% de Acerto)
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topics_mastered.map((topic, i) => (
              <span key={i} className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                ✓ {topic}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Progress Message */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Continue Assim!</h3>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Você já completou {stats.total_exercises} exercícios com {stats.accuracy}% de precisão.
          {stats.weak_topics.length > 0 ? (
            <> Foque nos tópicos fracos para melhorar ainda mais seu desempenho!</>
          ) : (
            <> Você está indo muito bem em todos os tópicos!</>
          )}
        </p>
      </Card>
    </div>
  );
}