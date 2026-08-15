/**
 * Exercícios estruturados por matéria e tópico para o Cronograma IFG Jataí
 * Baseado no plano de ensino das disciplinas
 */

export const EXERCISES_BY_SUBJECT = {
  'Cálculo 2': {
    icon: '📐',
    color: '#3b82f6',
    topics: [
      { id: 'funcoes-varias-variaveis', name: 'Funções de Várias Variáveis', count: 16, description: 'Limites, continuidade, derivadas parciais, diferencial total' },
      { id: 'derivadas-parciais', name: 'Derivadas Parciais', count: 22, description: 'Regra da cadeia, derivadas direcionais, gradiente, extremos' },
      { id: 'integrais-multiplas', name: 'Integrais Múltiplas', count: 20, description: 'Integrais duplas e triplas, mudança de variáveis, aplicações' },
    ]
  },
  'Cálculo 3': {
    icon: '📊',
    color: '#8b5cf6',
    topics: [
      { id: 'campos-vetoriais', name: 'Campos Vetoriais', count: 14, description: 'Campos escalares e vetoriais, rotacional, divergente' },
      { id: 'integrais-linha', name: 'Integrais de Linha', count: 18, description: 'Integrais de linha, independência de caminho, potencial' },
      { id: 'teoremas-green-stokes', name: 'Teoremas de Green e Stokes', count: 16, description: 'Teorema de Green, Stokes, Gauss, aplicações físicas' },
    ]
  },
  'Cálculo Numérico': {
    icon: '🔢',
    color: '#ec4899',
    topics: [
      { id: 'zeros-funcoes', name: 'Zeros de Funções', count: 12, description: 'Bisseção, Newton-Raphson, ponto fixo, convergência' },
      { id: 'sistemas-lineares', name: 'Sistemas Lineares', count: 15, description: 'Gauss, LU, Jacobi, Gauss-Seidel, condicionamento' },
      { id: 'interpolacao', name: 'Interpolação', count: 10, description: 'Lagrange, Newton, splines, mínimos quadrados' },
    ]
  },
  'Estrutura de Dados': {
    icon: '📦',
    color: '#10b981',
    topics: [
      { id: 'programacao-estruturada', name: 'Programação Estruturada e Modular', count: 6, description: 'C++, funções, passagem por valor/referência, modularização' },
      { id: 'analise-algoritmos', name: 'Análise de Algoritmos', count: 6, description: 'Complexidade O, notação assintótica, casos melhor/pior/médio' },
      { id: 'vetores-strings', name: 'Vetores e Strings', count: 7, description: 'Ordenação (bolha, inserção), busca, manipulação de strings' },
      { id: 'matrizes-multidimensionais', name: 'Matrizes Multidimensionais', count: 6, description: 'Operações com matrizes, alocação dinâmica, problemas' },
      { id: 'estruturas-estaticas-dinamicas', name: 'Estruturas Estáticas e Dinâmicas', count: 6, description: 'Alocação estática vs dinâmica, ponteiros, new/delete' },
      { id: 'pilhas-filas', name: 'Pilhas e Filas', count: 7, description: 'LIFO/FIFO, implementação vetor/dinâmica, aplicações' },
      { id: 'listas-encadeadas', name: 'Listas Encadeadas', count: 6, description: 'Simples, dupla, circular, inserção/remoção/busca' },
      { id: 'arvores', name: 'Árvores', count: 6, description: 'Binárias, BST, AVL, percursos, balanceamento' },
      { id: 'simulado-ed', name: 'Simulado - Estrutura de Dados (formato de prova)', count: 10, description: 'Questões no formato da avaliação (lista 2,0 | simulado 3,0 | prova 5,0)' },
    ]
  },
  'Sistemas Digitais': {
    icon: '🔧',
    color: '#f59e0b',
    topics: [
      { id: 'sistemas-numeracao', name: 'Sistemas de Numeração', count: 8, description: 'Binário, octal, hexadecimal, conversões, aritmética, códigos' },
      { id: 'portas-funcoes-logicas', name: 'Portas e Funções Lógicas', count: 7, description: 'AND, OR, NOT, NAND, NOR, XOR, XNOR, tabelas verdade' },
      { id: 'algebra-boole', name: 'Álgebra de Boole e Simplificação', count: 7, description: 'Postulados, De Morgan, simplificação, formas canônicas' },
      { id: 'circuitos-combinacionais', name: 'Circuitos Combinacionais', count: 7, description: 'Projetos, somadores, MUX/DEC, display 7 segmentos' },
      { id: 'flipflops-contadores', name: 'Flip-Flops e Contadores', count: 7, description: 'RS, JK, T, D, registradores, contadores síncronos/assíncronos' },
      { id: 'conversores-memorias', name: 'Conversores, Multiplex e Memórias', count: 7, description: 'D/A, A/D, MUX/DEMUX, ROM/RAM, famílias TTL/CMOS' },
      { id: 'simulado-sd', name: 'Simulado - Sistemas Digitais (formato de prova)', count: 10, description: 'Questões no formato da avaliação (VA + prova bimestral + projeto)' },
    ]
  },
};

// Helper to get all exercises as flat list for search/filter
export const getAllExercisesFlat = () => {
  const flat = [];
  Object.entries(EXERCISES_BY_SUBJECT).forEach(([subject, data]) => {
    data.topics.forEach(topic => {
      flat.push({
        subject,
        subjectIcon: data.icon,
        subjectColor: data.color,
        topicId: topic.id,
        topicName: topic.name,
        count: topic.count,
        description: topic.description,
      });
    });
  });
  return flat;
};

// Get total exercises per subject
export const getSubjectTotals = () => {
  const totals = {};
  Object.entries(EXERCISES_BY_SUBJECT).forEach(([subject, data]) => {
    totals[subject] = data.topics.reduce((sum, t) => sum + t.count, 0);
  });
  return totals;
};

// Get exercise count by subject
export const getTotalExercises = () => {
  return Object.values(getSubjectTotals()).reduce((sum, v) => sum + v, 0);
};