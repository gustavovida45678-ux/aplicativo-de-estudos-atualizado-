// Cronograma Diário de Estudos (IFG Jataí)
// Combina horários reais de aula com blocos de estudo do roadmap 16 semanas

// Ajuste aqui a data de início do plano de 16 semanas (segunda-feira)
export const WEEK_START = '2026-07-20';

export const CLASSES_SCHEDULE = [
  {
    day: 'Segunda-feira',
    blocks: [
      { type: 'class', discipline: 'Álgebra Linear', time: '07:00 - 08:30', room: 'Sala S403', icon: '➗' },
      { type: 'study', discipline: 'Estrutura de Dados', time: '09:00 - 11:00', room: 'Estudo (ED)', icon: '💻' },
      { type: 'study', discipline: 'Sistemas Digitais', time: '14:00 - 16:00', room: 'Estudo (SD)', icon: '🔌' },
      { type: 'break', discipline: 'Intervalo', time: '16:00 - 19:00', room: 'Descanso / Jantar', icon: '🍽️' },
      { type: 'class', discipline: 'Sistemas Digitais', time: '19:00 - 20:30', room: 'Sala T407', icon: '🔌' },
      { type: 'class', discipline: 'Sistemas Digitais', time: '20:45 - 22:15', room: 'Sala T407', icon: '🔌' },
    ],
  },
  {
    day: 'Terça-feira',
    blocks: [
      { type: 'study', discipline: 'Estrutura de Dados', time: '08:00 - 10:00', room: 'Revisão de videoaula', icon: '💻' },
      { type: 'study', discipline: 'Exercícios (ED)', time: '10:30 - 12:30', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Sistemas Digitais', time: '14:00 - 16:00', room: 'Revisão de videoaula', icon: '🔌' },
      { type: 'study', discipline: 'Exercícios (SD)', time: '16:30 - 18:30', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Álgebra Linear', time: '19:00 - 21:00', room: 'Resumo e exercícios', icon: '➗' },
    ],
  },
  {
    day: 'Quarta-feira',
    blocks: [
      { type: 'class', discipline: 'Álgebra Linear', time: '07:00 - 08:30', room: 'Sala S403', icon: '➗' },
      { type: 'study', discipline: 'Preparação', time: '08:30 - 08:45', room: 'Ir para a sala', icon: '🏃' },
      { type: 'class', discipline: 'Estrutura de Dados', time: '08:45 - 10:15', room: 'Sala S403', icon: '💻' },
      { type: 'class', discipline: 'Estrutura de Dados', time: '10:30 - 12:00', room: 'Sala S403', icon: '💻' },
      { type: 'study', discipline: 'Sistemas Digitais', time: '14:00 - 16:00', room: 'Revisão de videoaula', icon: '🔌' },
      { type: 'study', discipline: 'Exercícios (SD)', time: '16:30 - 18:30', room: 'Prática de exercícios', icon: '📝' },
    ],
  },
  {
    day: 'Quinta-feira',
    blocks: [
      { type: 'study', discipline: 'Estrutura de Dados', time: '08:00 - 10:00', room: 'Revisão de videoaula', icon: '💻' },
      { type: 'study', discipline: 'Exercícios (ED)', time: '10:30 - 12:30', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Sistemas Digitais', time: '14:00 - 16:00', room: 'Revisão de videoaula', icon: '🔌' },
      { type: 'study', discipline: 'Exercícios (SD)', time: '16:30 - 18:30', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Álgebra Linear', time: '19:00 - 21:00', room: 'Resumo e exercícios', icon: '➗' },
    ],
  },
  {
    day: 'Sexta-feira',
    blocks: [
      { type: 'study', discipline: 'Revisão da Semana', time: '08:00 - 10:00', room: 'Resumo de tudo que estudou', icon: '📚' },
      { type: 'study', discipline: 'Exercícios extras (ED)', time: '10:30 - 12:30', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Exercícios extras (SD)', time: '14:00 - 16:00', room: 'Prática de exercícios', icon: '📝' },
      { type: 'study', discipline: 'Simulado Semanal', time: '16:30 - 18:30', room: 'Simulado do cronograma', icon: '🏆' },
    ],
  },
  {
    day: 'Sábado',
    blocks: [
      { type: 'study', discipline: 'Reposição / Lista pendente', time: '09:00 - 11:00', room: 'Fechar pendências', icon: '📌' },
      { type: 'study', discipline: 'Simulado de Prova (ED)', time: '14:00 - 16:00', room: 'Estilo prova IFG', icon: '🏆' },
      { type: 'study', discipline: 'Simulado de Prova (SD)', time: '16:30 - 18:30', room: 'Estilo prova IFG', icon: '🏆' },
    ],
  },
  {
    day: 'Domingo',
    blocks: [
      { type: 'rest', discipline: 'Descanso', time: 'Livre', room: 'Descanso total (importante!)', icon: '😴' },
    ],
  },
];

// Rótulos dos blocos de estudo (para legenda)
export const BLOCK_TYPE_LABELS = {
  class: { label: 'Aula presencial', color: '#3b82f6', short: 'Aula' },
  study: { label: 'Estudo individual', color: '#8b5cf6', short: 'Estudo' },
  break: { label: 'Intervalo', color: '#f59e0b', short: 'Intervalo' },
  rest: { label: 'Descanso', color: '#10b981', short: 'Descanso' },
};
