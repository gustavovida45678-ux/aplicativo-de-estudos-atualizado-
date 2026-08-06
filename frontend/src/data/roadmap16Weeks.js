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
  totalDays: 64,
  breakdown: {
    content: 32,
    exercises: 16,
    reviews: 12,
    finalization: 4,
  },
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

// Video aulas sugeridas (YouTube/Plataformas gratuitas)
const VIDEOS_ED = {
  'Revisão de C e ponteiros': [
    { title: 'C++ Ponteiros - Completo', url: 'https://www.youtube.com/watch?v=Z3sQbqCV9vE', source: 'YouTube' },
    { title: 'Revisão C++ para Estruturas de Dados', url: 'https://www.youtube.com/watch?v=Rub-JsjMhWY', source: 'YouTube' },
  ],
  'Alocação dinâmica': [
    { title: 'Alocação Dinâmica em C++ (new/delete)', url: 'https://www.youtube.com/watch?v=GQp1zzTwrIk', source: 'YouTube' },
    { title: 'Memória Heap vs Stack', url: 'https://www.youtube.com/watch?v=_3xkZ16wwKY', source: 'YouTube' },
  ],
  'Vetores e listas': [
    { title: 'Vetores e Arrays em C++', url: 'https://www.youtube.com/watch?v=RDHZdatgC6g', source: 'YouTube' },
    { title: 'Lista Encadeada - Conceito e Implementação', url: 'https://www.youtube.com/watch?v=3dpUvdU26O0', source: 'YouTube' },
  ],
  'Listas encadeadas': [
    { title: 'Lista Encadeada Simples - Inserção e Remoção', url: 'https://www.youtube.com/watch?v=WwfhLC16bis', source: 'YouTube' },
    { title: 'Lista Duplamente Encadeada', url: 'https://www.youtube.com/watch?v=JdQeNxWCguQ', source: 'YouTube' },
  ],
  'Listas duplas': [
    { title: 'Lista Duplamente Encadeada Completa', url: 'https://www.youtube.com/watch?v=JdQeNxWCguQ', source: 'YouTube' },
  ],
  'Pilhas': [
    { title: 'Pilha (Stack) - Estrutura de Dados', url: 'https://www.youtube.com/watch?v=Y2Gc-JqxJh8', source: 'YouTube' },
    { title: 'Aplicação de Pilha: Expressões Pós-fixas', url: 'https://www.youtube.com/watch?v=W1P5AZkZ1Y0', source: 'YouTube' },
  ],
  'Filas': [
    { title: 'Fila (Queue) - Estrutura de Dados', url: 'https://www.youtube.com/watch?v=OKrloDzz08Y', source: 'YouTube' },
    { title: 'Fila Circular e Prioridade', url: 'https://www.youtube.com/watch?v=R3YwGQkP2Xc', source: 'YouTube' },
  ],
  'Árvores binárias': [
    { title: 'Árvore Binária de Busca - Inserção e Busca', url: 'https://www.youtube.com/watch?v=9RHOa8ZlrQ8', source: 'YouTube' },
    { title: 'Percursos: Pré, In, Pós-ordem', url: 'https://www.youtube.com/watch?v=gm8DUJJhmY4', source: 'YouTube' },
  ],
  'Árvores AVL': [
    { title: 'Árvore AVL - Rotações e Balanceamento', url: 'https://www.youtube.com/watch?v=jDM6_TnYIqE', source: 'YouTube' },
  ],
  'Árvores B': [
    { title: 'Árvore B - Conceito e Operações', url: 'https://www.youtube.com/watch?v=CqD11JhCFFg', source: 'YouTube' },
  ],
  'Tabelas Hash': [
    { title: 'Tabela Hash - Hashing e Colisões', url: 'https://www.youtube.com/watch?v=MfhjkfocRR0', source: 'YouTube' },
  ],
  'Grafos': [
    { title: 'Grafos - Conceitos Básicos', url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU', source: 'YouTube' },
    { title: 'Dijkstra e Algoritmos de Caminho Mínimo', url: 'https://www.youtube.com/watch?v=pVfj6mxhdMw', source: 'YouTube' },
  ],
  'Algoritmos de busca': [
    { title: 'Busca Binária e Linear', url: 'https://www.youtube.com/watch?v=P3YID7liBug', source: 'YouTube' },
    { title: 'Busca em Grafos: BFS e DFS', url: 'https://www.youtube.com/watch?v=PCaaxZV4E0k', source: 'YouTube' },
  ],
  'Algoritmos de ordenação': [
    { title: 'QuickSort, MergeSort, HeapSort', url: 'https://www.youtube.com/watch?v=WaNLJf8xzC4', source: 'YouTube' },
    { title: 'Análise de Complexidade', url: 'https://www.youtube.com/watch?v=7qFzjqQ8Q2A', source: 'YouTube' },
  ],
  'Exercícios de provas - Estrutura de Dados': [
    { title: 'Simulado Estrutura de Dados - Questões Comentadas', url: 'https://www.youtube.com/watch?v=V5Qz8xY7w1A', source: 'YouTube' },
  ],
  'Revisão geral - Estrutura de Dados': [
    { title: 'Revisão Completa Estrutura de Dados', url: 'https://www.youtube.com/watch?v=AT149uCFJqo', source: 'YouTube' },
  ],
};

const VIDEOS_SD = {
  'Sistemas de numeração': [
    { title: 'Sistemas de Numeração - Binário, Octal, Hexadecimal', url: 'https://www.youtube.com/watch?v=4shb-9kY5a4', source: 'YouTube' },
    { title: 'Conversão entre Bases Numéricas', url: 'https://www.youtube.com/watch?v=qTxXq9Jm5nY', source: 'YouTube' },
  ],
  'Conversão entre bases': [
    { title: 'Conversão Decimal-Binário-Hexadecimal', url: 'https://www.youtube.com/watch?v=Th87C-3vV7o', source: 'YouTube' },
  ],
  'Álgebra Booleana': [
    { title: 'Álgebra de Boole - Leis e Teoremas', url: 'https://www.youtube.com/watch?v=qRfL9aL1z7M', source: 'YouTube' },
  ],
  'Portas lógicas': [
    { title: 'Portas Lógicas: AND, OR, NOT, NAND, NOR, XOR', url: 'https://www.youtube.com/watch?v=VbD4zVh7Q7c', source: 'YouTube' },
  ],
  'Simplificação com Mapas de Karnaugh': [
    { title: 'Mapa de Karnaugh - Simplificação 3 e 4 variáveis', url: 'https://www.youtube.com/watch?v=5wz8xY9vQ2E', source: 'YouTube' },
  ],
  'Circuitos combinacionais': [
    { title: 'Circuitos Combinacionais - Somadores, MUX, DEC', url: 'https://www.youtube.com/watch?v=Kv3X9yQ7R1w', source: 'YouTube' },
  ],
  'Multiplexadores e decodificadores': [
    { title: 'Multiplexadores e Decodificadores', url: 'https://www.youtube.com/watch?v=L4yP7zR8Q3t', source: 'YouTube' },
  ],
  'Flip-Flops': [
    { title: 'Flip-Flops RS, JK, T, D', url: 'https://www.youtube.com/watch?v=M9R8yQ7zX4w', source: 'YouTube' },
  ],
  'Registradores': [
    { title: 'Registradores de Deslocamento', url: 'https://www.youtube.com/watch?v=P8Q7zR9X4w', source: 'YouTube' },
  ],
  'Contadores': [
    { title: 'Contadores Síncronos e Assíncronos', url: 'https://www.youtube.com/watch?v=Q9R8zX5wV3u', source: 'YouTube' },
  ],
  'Máquinas de estados': [
    { title: 'Máquina de Estados Finitos (Moore/Mealy)', url: 'https://www.youtube.com/watch?v=R9X5wV4uQ8z', source: 'YouTube' },
  ],
  'Memórias': [
    { title: 'Memórias ROM, RAM, Cache', url: 'https://www.youtube.com/watch?v=S9X4wV3uR8Q', source: 'YouTube' },
  ],
  'Introdução a processadores': [
    { title: 'Arquitetura de Processadores', url: 'https://www.youtube.com/watch?v=T9X3uR8Q7z', source: 'YouTube' },
  ],
  'Projeto digital': [
    { title: 'Projeto de Circuitos Digitais', url: 'https://www.youtube.com/watch?v=U9X2R8Q6z', source: 'YouTube' },
  ],
  'Exercícios de provas - Sistemas Digitais': [
    { title: 'Simulado Sistemas Digitais - Questões Comentadas', url: 'https://www.youtube.com/watch?v=V9X1Q7R6z', source: 'YouTube' },
  ],
  'Revisão geral - Sistemas Digitais': [
    { title: 'Revisão Completa Sistemas Digitais', url: 'https://www.youtube.com/watch?v=W9X0Q6R5z', source: 'YouTube' },
  ],
};

function getVideosForTopic(topic, discipline) {
  const videos = discipline === 'ED' ? VIDEOS_ED : VIDEOS_SD;
  return videos[topic] || [];
}

export const phases = [
  {
    id: 'phase1',
    number: 1,
    name: 'Fundamentos & Sistemas de Numeração',
    weeks: '1-5',
    totalDays: 20,
    color: '#3b82f6',
    icon: 'C',
    description: 'Revisão de C/ponteiros, alocação dinâmica e sistemas de numeração',
    weeksData: [
      {
        number: 1,
        title: 'Revisão de C e Sistemas de Numeração',
        dateRange: 'Semana 1',
        days: [
          { range: '1', date: 'ED', topic: 'Revisão de C e ponteiros', type: 'study', discipline: 'ED', videos: getVideosForTopic('Revisão de C e ponteiros', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Ponteiros e Structs', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Sistemas de numeração', type: 'study', discipline: 'SD', videos: getVideosForTopic('Sistemas de numeração', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Conversão de bases', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 2,
        title: 'Alocação Dinâmica e Conversão de Bases',
        dateRange: 'Semana 2',
        days: [
          { range: '1', date: 'ED', topic: 'Alocação dinâmica', type: 'study', discipline: 'ED', videos: getVideosForTopic('Alocação dinâmica', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: new/delete e vetores dinâmicos', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Conversão entre bases', type: 'study', discipline: 'SD', videos: getVideosForTopic('Conversão entre bases', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Aritmética binária', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 3,
        title: 'Vetores, Listas e Álgebra Booleana',
        dateRange: 'Semana 3',
        days: [
          { range: '1', date: 'ED', topic: 'Vetores e listas', type: 'study', discipline: 'ED', videos: getVideosForTopic('Vetores e listas', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Ordenação e busca em vetores', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Álgebra Booleana', type: 'study', discipline: 'SD', videos: getVideosForTopic('Álgebra Booleana', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Simplificação booleana', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 4,
        title: 'Listas Encadeadas e Portas Lógicas',
        dateRange: 'Semana 4',
        days: [
          { range: '1', date: 'ED', topic: 'Listas encadeadas', type: 'study', discipline: 'ED', videos: getVideosForTopic('Listas encadeadas', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Inserção/remoção em listas', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Portas lógicas', type: 'study', discipline: 'SD', videos: getVideosForTopic('Portas lógicas', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Tabelas verdade', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 5,
        title: 'Listas Duplas e Mapas de Karnaugh',
        dateRange: 'Semana 5',
        days: [
          { range: '1', date: 'ED', topic: 'Listas duplas', type: 'study', discipline: 'ED', videos: getVideosForTopic('Listas duplas', 'ED') },
          { range: '2', date: 'ED', topic: 'Revisão Fase 1 - ED', type: 'review', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Simplificação com Mapas de Karnaugh', type: 'study', discipline: 'SD', videos: getVideosForTopic('Simplificação com Mapas de Karnaugh', 'SD') },
          { range: '4', date: 'SD', topic: 'Revisão Fase 1 - SD', type: 'review', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Estruturas Lineares & Circuitos Lógicos',
    weeks: '6-10',
    totalDays: 20,
    color: '#8b5cf6',
    icon: '∞',
    description: 'Pilhas, filas, árvores e circuitos combinacionais/sequenciais',
    weeksData: [
      {
        number: 6,
        title: 'Pilhas e Circuitos Combinacionais',
        dateRange: 'Semana 6',
        days: [
          { range: '1', date: 'ED', topic: 'Pilhas', type: 'study', discipline: 'ED', videos: getVideosForTopic('Pilhas', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Expressões pós-fixas', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Circuitos combinacionais', type: 'study', discipline: 'SD', videos: getVideosForTopic('Circuitos combinacionais', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Somadores e MUX', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 7,
        title: 'Filas, Multiplexadores e Decodificadores',
        dateRange: 'Semana 7',
        days: [
          { range: '1', date: 'ED', topic: 'Filas', type: 'study', discipline: 'ED', videos: getVideosForTopic('Filas', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Fila circular e prioridade', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Multiplexadores e decodificadores', type: 'study', discipline: 'SD', videos: getVideosForTopic('Multiplexadores e decodificadores', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Display 7 segmentos', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 8,
        title: 'Árvores Binárias e Flip-Flops',
        dateRange: 'Semana 8',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores binárias', type: 'study', discipline: 'ED', videos: getVideosForTopic('Árvores binárias', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Percursos e BST', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Flip-Flops', type: 'study', discipline: 'SD', videos: getVideosForTopic('Flip-Flops', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Tabelas de excitação', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 9,
        title: 'Árvores AVL e Registradores',
        dateRange: 'Semana 9',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores AVL', type: 'study', discipline: 'ED', videos: getVideosForTopic('Árvores AVL', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Rotações LL, RR, LR, RL', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Registradores', type: 'study', discipline: 'SD', videos: getVideosForTopic('Registradores', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Conversores série-paralelo', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 10,
        title: 'Árvores B e Contadores',
        dateRange: 'Semana 10',
        days: [
          { range: '1', date: 'ED', topic: 'Árvores B', type: 'study', discipline: 'ED', videos: getVideosForTopic('Árvores B', 'ED') },
          { range: '2', date: 'ED', topic: 'Revisão Fase 2 - ED', type: 'review', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Contadores', type: 'study', discipline: 'SD', videos: getVideosForTopic('Contadores', 'SD') },
          { range: '4', date: 'SD', topic: 'Revisão Fase 2 - SD', type: 'review', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Estruturas Avançadas & Arquitetura',
    weeks: '11-14',
    totalDays: 16,
    color: '#ec4899',
    icon: '#',
    description: 'Hash, grafos, busca, ordenação e máquinas de estados/memórias',
    weeksData: [
      {
        number: 11,
        title: 'Tabelas Hash e Máquinas de Estados',
        dateRange: 'Semana 11',
        days: [
          { range: '1', date: 'ED', topic: 'Tabelas Hash', type: 'study', discipline: 'ED', videos: getVideosForTopic('Tabelas Hash', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Colisões e sondagem', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Máquinas de estados', type: 'study', discipline: 'SD', videos: getVideosForTopic('Máquinas de estados', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Diagramas Moore/Mealy', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 12,
        title: 'Grafos e Memórias',
        dateRange: 'Semana 12',
        days: [
          { range: '1', date: 'ED', topic: 'Grafos', type: 'study', discipline: 'ED', videos: getVideosForTopic('Grafos', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Dijkstra e BFS/DFS', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Memórias', type: 'study', discipline: 'SD', videos: getVideosForTopic('Memórias', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Organização e timing', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 13,
        title: 'Busca e Introdução a Processadores',
        dateRange: 'Semana 13',
        days: [
          { range: '1', date: 'ED', topic: 'Algoritmos de busca', type: 'study', discipline: 'ED', videos: getVideosForTopic('Algoritmos de busca', 'ED') },
          { range: '2', date: 'ED', topic: 'Exercícios: Busca binária e em grafos', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Introdução a processadores', type: 'study', discipline: 'SD', videos: getVideosForTopic('Introdução a processadores', 'SD') },
          { range: '4', date: 'SD', topic: 'Exercícios: Arquitetura von Neumann', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 14,
        title: 'Ordenação e Projeto Digital',
        dateRange: 'Semana 14',
        days: [
          { range: '1', date: 'ED', topic: 'Algoritmos de ordenação', type: 'study', discipline: 'ED', videos: getVideosForTopic('Algoritmos de ordenação', 'ED') },
          { range: '2', date: 'ED', topic: 'Revisão Fase 3 - ED', type: 'review', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Projeto digital', type: 'study', discipline: 'SD', videos: getVideosForTopic('Projeto digital', 'SD') },
          { range: '4', date: 'SD', topic: 'Revisão Fase 3 - SD', type: 'review', discipline: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    name: 'Provas e Revisão Geral',
    weeks: '15-16',
    totalDays: 8,
    color: '#10b981',
    icon: '✓',
    description: 'Exercícios de provas e revisão geral das duas disciplinas',
    weeksData: [
      {
        number: 15,
        title: 'Exercícios de Provas',
        dateRange: 'Semana 15',
        days: [
          { range: '1', date: 'ED', topic: 'Exercícios de provas - Estrutura de Dados', type: 'exercise', discipline: 'ED', videos: getVideosForTopic('Exercícios de provas - Estrutura de Dados', 'ED') },
          { range: '2', date: 'ED', topic: 'Simulado 1 - ED', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Exercícios de provas - Sistemas Digitais', type: 'exercise', discipline: 'SD', videos: getVideosForTopic('Exercícios de provas - Sistemas Digitais', 'SD') },
          { range: '4', date: 'SD', topic: 'Simulado 1 - SD', type: 'exercise', discipline: 'SD' },
        ],
      },
      {
        number: 16,
        title: 'Revisão Geral e Entrega',
        dateRange: 'Semana 16',
        days: [
          { range: '1', date: 'ED', topic: 'Revisão geral - Estrutura de Dados', type: 'review', discipline: 'ED', videos: getVideosForTopic('Revisão geral - Estrutura de Dados', 'ED') },
          { range: '2', date: 'ED', topic: 'Simulado Final - ED', type: 'exercise', discipline: 'ED' },
          { range: '3', date: 'SD', topic: 'Revisão geral - Sistemas Digitais', type: 'review', discipline: 'SD', videos: getVideosForTopic('Revisão geral - Sistemas Digitais', 'SD') },
          { range: '4', date: 'SD', topic: 'Simulado Final - SD', type: 'exercise', discipline: 'SD' },
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