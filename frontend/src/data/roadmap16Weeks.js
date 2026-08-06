// Cronograma de Estudos - 16 Semanas
// Estrutura de Dados (Prof. Roney Lopes Lima) | Sistemas Digitais (Prof. Jose Antonio Lambert)
// IFG - Câmpus Jataí/GO

export const roadmapInfo = {
  title: 'Cronograma 16 Semanas',
  professor: 'Roney Lopes Lima & Jose Antonio Lambert',
  institution: 'IFG - Câmpus Jataí/GO',
  course: '2º Período',
  subject: 'Estrutura de Dados & Sistemas Digitais',
  totalWeeks: 16,
  totalDays: 32,
  breakdown: {
    content: 28,
    exercises: 2,
    reviews: 2,
    finalization: 0,
  },
  // Individual professors per discipline for exercise mapping
  professors: {
    ED: 'Roney Lopes Lima',
    SD: 'Jose Antonio Lambert',
  },
};

export const disciplineConfig = {
  ED: {
    label: 'Estrutura de Dados',
    short: 'ED',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  SD: {
    label: 'Sistemas Digitais',
    short: 'SD',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
};

// type: 'study' | 'exercise' | 'review' | 'delivery'
// Cada semana possui 2 blocos: um por disciplina (ED / SD)
export const phases = [
  {
    id: 'phase1',
    number: 1,
    name: 'Fundamentos & Sistemas de Numeração',
    weeks: '1-5',
    totalDays: 10,
    color: '#3b82f6',
    icon: 'C',
    description: 'Revisão de C/ponteiros, alocação dinâmica e sistemas de numeração',
    weeksData: [
      {
        number: 1,
        title: 'Revisão de C e Sistemas de Numeração',
        dateRange: 'Semana 1',
        days: [
          { range: '1', date: 'ED', topic: 'Revisão de C e ponteiros', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Sistemas de numeração', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 2,
        title: 'Alocação Dinâmica e Conversão de Bases',
        dateRange: 'Semana 2',
        days: [
          { range: '1', date: 'ED', topic: 'Alocação dinâmica', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Conversão entre bases', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 3,
        title: 'Vetores, Listas e Álgebra Booleana',
        dateRange: 'Semana 3',
        days: [
          { range: '1', date: 'ED', topic: 'Vetores e listas', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Álgebra Booleana', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 4,
        title: 'Listas Encadeadas e Portas Lógicas',
        dateRange: 'Semana 4',
        days: [
          { range: '1', date: 'ED', topic: 'Listas encadeadas', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Portas lógicas', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 5,
        title: 'Listas Duplas e Mapas de Karnaugh',
        dateRange: 'Semana 5',
        days: [
          { range: '1', date: 'ED', topic: 'Listas duplas', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Simplificação com Mapas de Karnaugh', type: 'study', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Estruturas Lineares & Circuitos Lógicos',
    weeks: '6-10',
    totalDays: 10,
    color: '#8b5cf6',
    icon: '∞',
    description: 'Pilhas, filas, árvores e circuitos combinacionais/sequenciais',
    weeksData: [
      {
        number: 6,
        title: 'Pilhas e Circuitos Combinacionais',
        dateRange: 'Semana 6',
        days: [
          { range: '1', date: 'ED', topic: 'Pilhas', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Circuitos combinacionais', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 7,
        title: 'Filas, Multiplexadores e Decodificadores',
        dateRange: 'Semana 7',
        days: [
          { range: '1', date: 'ED', topic: 'Filas', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Multiplexadores e decodificadores', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 8,
        title: 'Árvores Binárias e Flip-Flops',
        dateRange: 'Semana 8',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores binárias', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Flip-Flops', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 9,
        title: 'Árvores AVL e Registradores',
        dateRange: 'Semana 9',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores AVL', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Registradores', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 10,
        title: 'Árvores B e Contadores',
        dateRange: 'Semana 10',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores B', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Contadores', type: 'study', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Estruturas Avançadas & Arquitetura',
    weeks: '11-14',
    totalDays: 8,
    color: '#ec4899',
    icon: '#',
    description: 'Hash, grafos, busca, ordenação e máquinas de estados/memórias',
    weeksData: [
      {
        number: 11,
        title: 'Tabelas Hash e Máquinas de Estados',
        dateRange: 'Semana 11',
        days: [
          { range: '1', date: 'ED', topic: 'Tabelas Hash', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Máquinas de estados', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 12,
        title: 'Grafos e Memórias',
        dateRange: 'Semana 12',
        days: [
          { range: '1', date: 'ED', topic: 'Grafos', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Memórias', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 13,
        title: 'Busca e Introdução a Processadores',
        dateRange: 'Semana 13',
        days: [
          { range: '1', date: 'ED', topic: 'Algoritmos de busca', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Introdução a processadores', type: 'study', discipline: 'SD' },
        ],
      },
      {
        number: 14,
        title: 'Ordenação e Projeto Digital',
        dateRange: 'Semana 14',
        days: [
          { range: '1', date: 'ED', topic: 'Algoritmos de ordenação', type: 'study', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Projeto digital', type: 'study', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    name: 'Provas e Revisão Geral',
    weeks: '15-16',
    totalDays: 4,
    color: '#10b981',
    icon: '✓',
    description: 'Exercícios de provas e revisão geral das duas disciplinas',
    weeksData: [
      {
        number: 15,
        title: 'Exercícios de Provas',
        dateRange: 'Semana 15',
        days: [
          { range: '1', date: 'ED', topic: 'Exercícios de provas - Estrutura de Dados', type: 'exercise', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Exercícios de provas - Sistemas Digitais', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 16,
        title: 'Revisão Geral',
        dateRange: 'Semana 16',
        days: [
          { range: '1', date: 'ED', topic: 'Revisão geral - Estrutura de Dados', type: 'review', discipline: 'ED' },
          { range: '2', date: 'SD', topic: 'Revisão geral - Sistemas Digitais', type: 'review', discipline: 'SD' },
        ],
      },
    ],
  },
];

export const typeConfig = {
  study: {
    label: 'Estudo',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  exercise: {
    label: 'Exercícios',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  review: {
    label: 'Revisão',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  delivery: {
    label: 'Entrega',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
};
