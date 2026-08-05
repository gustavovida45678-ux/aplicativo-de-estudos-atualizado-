// Roteiro de Estudos - Estrutura de Dados
// Professor Roney Lopes Lima | IFG - Câmpus Jataí | Turma 20262.2.02004.1M (2026/2)
// 105 dias | 03 Agosto 2026 → 15 Novembro 2026

export const roadmapEDInfo = {
  title: 'Roteiro de Estudos — Estrutura de Dados',
  professor: 'Roney Lopes Lima',
  institution: 'IFG - Câmpus Jataí',
  course: 'Turma 20262.2.02004.1M',
  subject: 'Estrutura de Dados',
  startDate: '2026-08-03',
  endDate: '2026-11-15',
  startLabel: '3 Agosto 2026',
  endLabel: '15 Novembro 2026',
  totalDays: 105,
  totalWeeks: 15,
  breakdown: {
    content: 60,
    exercises: 32,
    reviews: 9,
    finalization: 4,
  },
};

// type: 'study' | 'exercise' | 'review' | 'delivery'
// Conteúdo programático (plano de ensino): programação estruturada e modular,
// análise de algoritmos, vetores e strings, matrizes multidimensionais,
// estruturas estáticas/dinâmicas, pilhas, filas, listas e árvores.
export const roadmapEDPhases = [
  {
    id: 'phase1',
    number: 1,
    name: 'Fundamentos de Programação Estruturada',
    weeks: '1-3',
    totalDays: 21,
    color: '#3b82f6',
    icon: '⚙',
    description: 'Linguagem C++, estruturas de controle, funções, registros e ponteiros',
    weeksData: [
      {
        number: 1,
        title: 'Introdução à Linguagem C++',
        dateRange: '3-9 Agosto',
        days: [
          { range: '3-4', date: '3-4 Ago', topic: 'Estrutura de um programa, entrada/saída (cout, cin)', type: 'study' },
          { range: '5-6', date: '5-6 Ago', topic: 'Tipos de dados, variáveis e operadores', type: 'study' },
          { range: '7-8', date: '7-8 Ago', topic: 'Estruturas de decisão (if/else, switch)', type: 'study' },
          { range: '9', date: '9 Ago', topic: 'EXERCÍCIOS fundamentos de C++', type: 'exercise' },
        ],
      },
      {
        number: 2,
        title: 'Repetição e Modularização',
        dateRange: '10-16 Agosto',
        days: [
          { range: '10-11', date: '10-11 Ago', topic: 'Laços for, while e do-while', type: 'study' },
          { range: '12-13', date: '12-13 Ago', topic: 'Funções: parâmetros, retorno e escopo', type: 'study' },
          { range: '14-15', date: '14-15 Ago', topic: 'Passagem por valor e por referência', type: 'study' },
          { range: '16', date: '16 Ago', topic: 'LISTA DE EXERCÍCIOS modularização', type: 'exercise' },
        ],
      },
      {
        number: 3,
        title: 'Registros, Ponteiros e Modularidade',
        dateRange: '17-23 Agosto',
        days: [
          { range: '17-18', date: '17-18 Ago', topic: 'Structs (registros)', type: 'study' },
          { range: '19-20', date: '19-20 Ago', topic: 'Ponteiros e endereços de memória', type: 'study' },
          { range: '21-22', date: '21-22 Ago', topic: 'Programação modular e arquivos de cabeçalho (.h)', type: 'study' },
          { range: '23', date: '23 Ago', topic: 'REVISÃO Fase 1', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Análise de Algoritmos, Vetores e Strings',
    weeks: '4-6',
    totalDays: 21,
    color: '#8b5cf6',
    icon: '📊',
    description: 'Complexidade de algoritmos, vetores unidimensionais e strings',
    weeksData: [
      {
        number: 4,
        title: 'Análise de Algoritmos',
        dateRange: '24-30 Agosto',
        days: [
          { range: '24-25', date: '24-25 Ago', topic: 'Complexidade de tempo e notação O', type: 'study' },
          { range: '26-27', date: '26-27 Ago', topic: 'Análise de laços e funções', type: 'study' },
          { range: '28-29', date: '28-29 Ago', topic: 'Comparação: busca linear vs binária', type: 'study' },
          { range: '30', date: '30 Ago', topic: 'EXERCÍCIOS complexidade', type: 'exercise' },
        ],
      },
      {
        number: 5,
        title: 'Vetores',
        dateRange: '31 Agosto - 6 Setembro',
        days: [
          { range: '31-1', date: '31 Ago - 1 Set', topic: 'Vetores: declaração, inicialização e percurso', type: 'study' },
          { range: '2-3', date: '2-3 Set', topic: 'Ordenação: bolha e inserção', type: 'study' },
          { range: '4-5', date: '4-5 Set', topic: 'Busca, contagem e problemas com vetores', type: 'study' },
          { range: '6', date: '6 Set', topic: 'LISTA DE EXERCÍCIOS vetores', type: 'exercise' },
        ],
      },
      {
        number: 6,
        title: 'Strings',
        dateRange: '7-13 Setembro',
        days: [
          { range: '7-8', date: '7-8 Set', topic: 'Strings em C/C++: vetores de char e terminador \\0', type: 'study' },
          { range: '9-10', date: '9-10 Set', topic: 'Funções de manipulação de strings', type: 'study' },
          { range: '11-12', date: '11-12 Set', topic: 'Problemas práticos com strings', type: 'study' },
          { range: '13', date: '13 Set', topic: 'REVISÃO Fase 2', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Matrizes e Estruturas Estáticas/Dinâmicas',
    weeks: '7-8',
    totalDays: 14,
    color: '#ec4899',
    icon: '▦',
    description: 'Matrizes multidimensionais e alocação de memória estática e dinâmica',
    weeksData: [
      {
        number: 7,
        title: 'Matrizes Multidimensionais',
        dateRange: '14-20 Setembro',
        days: [
          { range: '14-15', date: '14-15 Set', topic: 'Matrizes: declaração e percurso linha x coluna', type: 'study' },
          { range: '16-17', date: '16-17 Set', topic: 'Operações com matrizes (soma, produto)', type: 'study' },
          { range: '18-19', date: '18-19 Set', topic: 'Problemas: transposta, diagonal, quadrado mágico', type: 'study' },
          { range: '20', date: '20 Set', topic: 'EXERCÍCIOS matrizes', type: 'exercise' },
        ],
      },
      {
        number: 8,
        title: 'Alocação Estática e Dinâmica',
        dateRange: '21-27 Setembro',
        days: [
          { range: '21-22', date: '21-22 Set', topic: 'Alocação estática vs dinâmica (new/delete)', type: 'study' },
          { range: '23-24', date: '23-24 Set', topic: 'Vetores e matrizes dinâmicos', type: 'study' },
          { range: '25-26', date: '25-26 Set', topic: 'Gerenciamento de memória e ponteiros', type: 'study' },
          { range: '27', date: '27 Set', topic: 'REVISÃO Fase 3', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    name: 'Pilhas, Filas e Listas',
    weeks: '9-11',
    totalDays: 21,
    color: '#10b981',
    icon: '⬓',
    description: 'Estruturas de dados lineares e suas implementações em C++',
    weeksData: [
      {
        number: 9,
        title: 'Pilhas',
        dateRange: '28 Setembro - 4 Outubro',
        days: [
          { range: '28-29', date: '28-29 Set', topic: 'Conceito LIFO e operações push/pop', type: 'study' },
          { range: '30-1', date: '30 Set - 1 Out', topic: 'Implementação com vetor e com alocação dinâmica', type: 'study' },
          { range: '2-3', date: '2-3 Out', topic: 'Aplicações: parênteses balanceados e pós-fixa', type: 'study' },
          { range: '4', date: '4 Out', topic: 'LISTA DE EXERCÍCIOS pilhas', type: 'exercise' },
        ],
      },
      {
        number: 10,
        title: 'Filas',
        dateRange: '5-11 Outubro',
        days: [
          { range: '5-6', date: '5-6 Out', topic: 'Conceito FIFO e operações enqueue/dequeue', type: 'study' },
          { range: '7-8', date: '7-8 Out', topic: 'Fila circular com vetor', type: 'study' },
          { range: '9-10', date: '9-10 Out', topic: 'Aplicações de filas', type: 'study' },
          { range: '11', date: '11 Out', topic: 'EXERCÍCIOS filas', type: 'exercise' },
        ],
      },
      {
        number: 11,
        title: 'Listas Encadeadas',
        dateRange: '12-18 Outubro',
        days: [
          { range: '12-13', date: '12-13 Out', topic: 'Listas simplesmente encadeadas: nós e percurso', type: 'study' },
          { range: '14-15', date: '14-15 Out', topic: 'Inserção, remoção e busca na lista', type: 'study' },
          { range: '16-17', date: '16-17 Out', topic: 'Lista duplamente encadeada', type: 'study' },
          { range: '18', date: '18 Out', topic: 'REVISÃO Fase 4', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    name: 'Árvores e Finalização',
    weeks: '12-15',
    totalDays: 28,
    color: '#f59e0b',
    icon: '🌳',
    description: 'Árvores binárias, BST e preparação para avaliações (lista 2,0 | simulado 3,0 | prova 5,0)',
    weeksData: [
      {
        number: 12,
        title: 'Árvores Binárias',
        dateRange: '19-25 Outubro',
        days: [
          { range: '19-20', date: '19-20 Out', topic: 'Conceitos: raiz, nós, altura e níveis', type: 'study' },
          { range: '21-22', date: '21-22 Out', topic: 'Percursos pré-ordem, in-ordem e pós-ordem', type: 'study' },
          { range: '23-24', date: '23-24 Out', topic: 'Implementação de nós em C++', type: 'study' },
          { range: '25', date: '25 Out', topic: 'EXERCÍCIOS árvores', type: 'exercise' },
        ],
      },
      {
        number: 13,
        title: 'Árvores Binárias de Busca',
        dateRange: '26 Outubro - 1 Novembro',
        days: [
          { range: '26-27', date: '26-27 Out', topic: 'Propriedades e inserção na BST', type: 'study' },
          { range: '28-29', date: '28-29 Out', topic: 'Busca e remoção na BST', type: 'study' },
          { range: '30-31', date: '30-31 Out', topic: 'EXERCÍCIOS BST + revisão', type: 'exercise' },
          { range: '1', date: '1 Nov', topic: 'REVISÃO Fase 5', type: 'review' },
        ],
      },
      {
        number: 14,
        title: 'Simulados (critérios: lista 2,0 / simulado 3,0 / prova 5,0)',
        dateRange: '2-8 Novembro',
        days: [
          { range: '2-3', date: '2-3 Nov', topic: 'SIMULADO 1 - fundamentos, vetores e matrizes', type: 'exercise' },
          { range: '4-5', date: '4-5 Nov', topic: 'SIMULADO 2 - pilhas, filas e listas', type: 'exercise' },
          { range: '6-7', date: '6-7 Nov', topic: 'Revisão geral de todos os conteúdos', type: 'review' },
          { range: '8', date: '8 Nov', topic: 'Correção dos simulados e pontos fracos', type: 'review' },
        ],
      },
      {
        number: 15,
        title: 'Finalização e Entrega',
        dateRange: '9-15 Novembro',
        days: [
          { range: '9-10', date: '9-10 Nov', topic: 'SIMULADO FINAL completo', type: 'exercise' },
          { range: '11-12', date: '11-12 Nov', topic: 'Revisão dos pontos fracos', type: 'review' },
          { range: '13-14', date: '13-14 Nov', topic: 'Preparação da avaliação / portfólio', type: 'delivery' },
          { range: '15', date: '15 Nov', topic: 'ENTREGA FINAL - Prof. Roney Lopes Lima', type: 'delivery' },
        ],
      },
    ],
  },
];
