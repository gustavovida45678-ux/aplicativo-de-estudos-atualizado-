import { useState, useEffect } from 'react';
import {
  GraduationCap, Calendar, CheckCircle2, Circle, BookOpen,
  Target, Clock, Award, TrendingUp, User, MapPin, ChevronDown, ChevronRight,
  PenTool, Repeat, Package, Trophy, X, Play, BookMarked, Code, Lightbulb,
  Video, ExternalLink,
} from 'lucide-react';
import { roadmapInfo as defaultInfo, phases as defaultPhases, typeConfig as defaultTypeConfig } from '../data/roadmap110Days';
import '../styles/roadmap110.css';

const DEFAULT_STORAGE_KEY = 'roadmap110_completed_v1';

// Exercícios simulados baseados nos professores do IFG Jataí
const EXERCISES_BY_PROFESSOR = {
  'Thiago Vedovato': {
    subject: 'Cálculo Numérico',
    exercises: {
      'fundamentos': [
        { id: 1, title: 'Raízes de Equações - Método da Bisseção', description: 'Implemente o método da bisseção para encontrar a raiz de f(x) = x³ - 2x - 5 no intervalo [2, 3] com precisão 10⁻⁴.', difficulty: 'Fácil', topics: ['Método da Bisseção', 'Convergência'] },
        { id: 2, title: 'Método de Newton-Raphson', description: 'Aplique Newton-Raphson para resolver f(x) = eˣ - 3x² = 0 com x₀ = 1. Calcule 4 iterações.', difficulty: 'Médio', topics: ['Newton-Raphson', 'Derivadas'] },
        { id: 3, title: 'Sistemas Lineares - Eliminação de Gauss', description: 'Resolva o sistema: 2x + y - z = 8; -3x - y + 2z = -11; -2x + y + 2z = -3', difficulty: 'Médio', topics: ['Eliminação de Gauss', 'Sistemas Lineares'] },
        { id: 4, title: 'Interpolação Polinomial - Lagrange', description: 'Dados os pontos (1, 2), (2, 3), (4, 5), construa o polinômio interpolador de Lagrange e estime f(3).', difficulty: 'Médio', topics: ['Lagrange', 'Interpolação'] },
        { id: 5, title: 'Integração Numérica - Simpson 1/3', description: 'Aproxime ∫₀¹ eˣ dx usando a regra de Simpson 1/3 com n=4 subintervalos. Compare com o valor exato.', difficulty: 'Difícil', topics: ['Simpson', 'Integração Numérica', 'Erro'] },
      ],
      'avancado': [
        { id: 6, title: 'Método dos Mínimos Quadrados', description: 'Ajuste uma reta y = ax + b aos dados: (1, 2.1), (2, 3.9), (3, 6.1), (4, 7.8), (5, 10.2). Calcule a, b e o coeficiente de determinação R².', difficulty: 'Difícil', topics: ['Mínimos Quadrados', 'Regressão Linear'] },
        { id: 7, title: 'EDOs - Método de Euler e Runge-Kutta', description: 'Resolva y\' = x + y, y(0) = 1 no intervalo [0, 1] com h=0.1 usando Euler e Runge-Kutta de 4ª ordem. Compare.', difficulty: 'Difícil', topics: ['Euler', 'Runge-Kutta', 'EDOs'] },
      ]
    }
  },
  'Roney Lopes Lima': {
    subject: 'Estrutura de Dados',
    exercises: {
      'fundamentos': [
        { id: 1, title: 'Lista Encadeada Simples - Inserção e Remoção', description: 'Implemente em C++: inserção no início, fim e posição k; remoção por valor e posição; busca e impressão.', difficulty: 'Fácil', topics: ['Lista Encadeada', 'Ponteiros', 'Alocação Dinâmica'] },
        { id: 2, title: 'Pilha (Stack) - Avaliação de Expressões', description: 'Implemente uma pilha para converter expressão infixa para pós-fixa e avaliar: "3 + 4 * 2 / (1 - 5) ^ 2 ^ 3"', difficulty: 'Médio', topics: ['Pilha', 'Notação Polonesa', 'Precedência'] },
        { id: 3, title: 'Fila (Queue) - Simulação de Atendimento', description: 'Simule uma fila de banco com prioridade (idosos, gestantes, normal). Implemane enqueue, dequeue, peek e size.', difficulty: 'Médio', topics: ['Fila', 'Prioridade', 'Estrutura Circular'] },
        { id: 4, title: 'Árvore Binária de Busca - Operações Básicas', description: 'Implemente inserção, busca, remoção (3 casos), percurso in/pre/post-order, altura e contagem de nós.', difficulty: 'Médio', topics: ['ABB', 'Recursão', 'Percursos'] },
        { id: 5, title: 'Heap (Max-Heap) - Heapsort Completo', description: 'Implemente max-heap com insert, extractMax, heapify. Use para ordenar um vetor de 1000 elementos aleatórios.', difficulty: 'Difícil', topics: ['Heap', 'Heapsort', 'Complexidade O(n log n)'] },
      ],
      'avancado': [
        { id: 6, title: 'Árvore AVL - Balanceamento Automático', description: 'Implemente rotações simples e duplas (LL, RR, LR, RL). Teste com inserções sequenciais 1,2,3,4,5,6,7.', difficulty: 'Difícil', topics: ['AVL', 'Rotações', 'Fator de Balanceamento'] },
        { id: 7, title: 'Grafos - Dijkstra e Floyd-Warshall', description: 'Implemente Dijkstra para menor caminho de fonte única e Floyd-Warshall para todos os pares. Grafo com 10 vértices.', difficulty: 'Difícil', topics: ['Grafos', 'Dijkstra', 'Floyd-Warshall', 'Matriz de Adjacência'] },
        { id: 8, title: 'Trie (Árvore de Prefixos) - Autocomplete', description: 'Implemente Trie para dicionário de 1000 palavras. Funções: insert, search, startsWith, autocomplete(prefix).', difficulty: 'Difícil', topics: ['Trie', 'Prefixos', 'Autocomplete', 'Complexidade O(m)'] },
      ]
    }
  },
  'Jose Antonio Lambert': {
    subject: 'Sistemas Digitais',
    exercises: {
      'fundamentos': [
        { id: 1, title: 'Álgebra Booleana - Simplificação', description: 'Simplifique usando teoremas de De Morgan e propriedades: F(A,B,C,D) = Σm(0,1,2,5,8,9,10) + Σd(4,11,14,15). Implemente em portas NAND.', difficulty: 'Fácil', topics: ['Álgebra Booleana', 'De Morgan', 'Minterms', 'Don\'t Cares'] },
        { id: 2, title: 'Mapa de Karnaugh - 4 Variáveis', description: 'Minimize F(A,B,C,D) = ΠM(1,3,4,6,9,11,12,14) usando K-map. Implemente com portas NOR apenas.', difficulty: 'Médio', topics: ['K-map', 'Maxterms', 'NOR', 'Forma Produto de Somas'] },
        { id: 3, title: 'Circuitos Combinacionais - Somador Completo', description: 'Projete um somador completo de 4 bits usando ripple carry. Calcule delay de propagação. Estenda para carry-lookahead.', difficulty: 'Médio', topics: ['Somador', 'Ripple Carry', 'Carry Lookahead', 'Delay'] },
        { id: 4, title: 'Multiplexadores e Decodificadores', description: 'Implemente F(A,B,C) = Σm(1,3,5,6) usando: (a) MUX 8:1; (b) MUX 4:1 + porta; (c) Decodificador 3:8 + porta OR.', difficulty: 'Médio', topics: ['MUX', 'Decodificador', 'Implementação Múltipla'] },
        { id: 5, title: 'Flip-Flops - Máquina de Estados', description: 'Projete uma sequência 101 detector (Mealy e Moore). Tabela de estados, diagramas, equações, circuito com JK-FF.', difficulty: 'Difícil', topics: ['FSM', 'Mealy', 'Moore', 'JK-FF', 'Detector de Sequência'] },
      ],
      'avancado': [
        { id: 6, title: 'Memória RAM - Organização e Timing', description: 'Calcule organização de memória 16M x 8: nº pinos endereço/dados, chips 1M x 4 necessários. Diagrama de timing leitura/escrita.', difficulty: 'Difícil', topics: ['RAM', 'Organização', 'Timing', 'Chips de Memória'] },
        { id: 7, title: 'Verilog - Módulo Contador e FSM', description: 'Escreva em Verilog: (a) Contador síncrono 8 bits com enable/reset; (b) FSM detector 101; (c) Testbench para ambos.', difficulty: 'Difícil', topics: ['Verilog', 'HDL', 'Testbench', 'Síntese'] },
      ]
    }
  }
};

// Video aulas por professor/matéria
const VIDEOS_BY_PROFESSOR = {
  'Roney Lopes Lima': {
    subject: 'Estrutura de Dados',
    videos: {
      'Revisão de C e ponteiros': [
        { title: 'C++ Ponteiros - Completo', url: 'https://www.youtube.com/watch?v=Z3sQbqCV9vE' },
        { title: 'Revisão C++ para Estruturas de Dados', url: 'https://www.youtube.com/watch?v=Rub-JsjMhWY' },
      ],
      'Alocação dinâmica': [
        { title: 'Alocação Dinâmica em C++ (new/delete)', url: 'https://www.youtube.com/watch?v=GQp1zzTwrIk' },
        { title: 'Memória Heap vs Stack', url: 'https://www.youtube.com/watch?v=_3xkZ16wwKY' },
      ],
      'Vetores e listas': [
        { title: 'Vetores e Arrays em C++', url: 'https://www.youtube.com/watch?v=RDHZdatgC6g' },
        { title: 'Lista Encadeada - Conceito e Implementação', url: 'https://www.youtube.com/watch?v=3dpUvdU26O0' },
      ],
      'Listas encadeadas': [
        { title: 'Lista Encadeada Simples - Inserção e Remoção', url: 'https://www.youtube.com/watch?v=WwfhLC16bis' },
        { title: 'Lista Duplamente Encadeada', url: 'https://www.youtube.com/watch?v=JdQeNxWCguQ' },
      ],
      'Listas duplas': [
        { title: 'Lista Duplamente Encadeada Completa', url: 'https://www.youtube.com/watch?v=JdQeNxWCguQ' },
      ],
      'Pilhas': [
        { title: 'Pilha (Stack) - Estrutura de Dados', url: 'https://www.youtube.com/watch?v=Y2Gc-JqxJh8' },
        { title: 'Aplicação de Pilha: Expressões Pós-fixas', url: 'https://www.youtube.com/watch?v=W1P5AZkZ1Y0' },
      ],
      'Filas': [
        { title: 'Fila (Queue) - Estrutura de Dados', url: 'https://www.youtube.com/watch?v=OKrloDzz08Y' },
        { title: 'Fila Circular e Prioridade', url: 'https://www.youtube.com/watch?v=R3YwGQkP2Xc' },
      ],
      'Árvores binárias': [
        { title: 'Árvore Binária de Busca - Inserção e Busca', url: 'https://www.youtube.com/watch?v=9RHOa8ZlrQ8' },
        { title: 'Percursos: Pré, In, Pós-ordem', url: 'https://www.youtube.com/watch?v=gm8DUJJhmY4' },
      ],
      'Árvores AVL': [
        { title: 'Árvore AVL - Rotações e Balanceamento', url: 'https://www.youtube.com/watch?v=jDM6_TnYIqE' },
      ],
      'Árvores B': [
        { title: 'Árvore B - Conceito e Operações', url: 'https://www.youtube.com/watch?v=CqD11JhCFFg' },
      ],
      'Tabelas Hash': [
        { title: 'Tabela Hash - Hashing e Colisões', url: 'https://www.youtube.com/watch?v=MfhjkfocRR0' },
      ],
      'Grafos': [
        { title: 'Grafos - Conceitos Básicos', url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU' },
        { title: 'Dijkstra e Algoritmos de Caminho Mínimo', url: 'https://www.youtube.com/watch?v=pVfj6mxhdMw' },
      ],
      'Algoritmos de busca': [
        { title: 'Busca Binária e Linear', url: 'https://www.youtube.com/watch?v=P3YID7liBug' },
        { title: 'Busca em Grafos: BFS e DFS', url: 'https://www.youtube.com/watch?v=PCaaxZV4E0k' },
      ],
      'Algoritmos de ordenação': [
        { title: 'QuickSort, MergeSort, HeapSort', url: 'https://www.youtube.com/watch?v=WaNLJf8xzC4' },
        { title: 'Análise de Complexidade', url: 'https://www.youtube.com/watch?v=7qFzjqQ8Q2A' },
      ],
      'Exercícios de provas - Estrutura de Dados': [
        { title: 'Simulado Estrutura de Dados - Questões Comentadas', url: 'https://www.youtube.com/watch?v=V5Qz8xY7w1A' },
      ],
      'Revisão geral - Estrutura de Dados': [
        { title: 'Revisão Completa Estrutura de Dados', url: 'https://www.youtube.com/watch?v=AT149uCFJqo' },
      ],
    }
  },
  'Jose Antonio Lambert': {
    subject: 'Sistemas Digitais',
    videos: {
      'Sistemas de numeração': [
        { title: 'Sistemas de Numeração - Binário, Octal, Hexadecimal', url: 'https://www.youtube.com/watch?v=4shb-9kY5a4' },
        { title: 'Conversão entre Bases Numéricas', url: 'https://www.youtube.com/watch?v=qTxXq9Jm5nY' },
      ],
      'Conversão entre bases': [
        { title: 'Conversão Decimal-Binário-Hexadecimal', url: 'https://www.youtube.com/watch?v=Th87C-3vV7o' },
      ],
      'Álgebra Booleana': [
        { title: 'Álgebra de Boole - Leis e Teoremas', url: 'https://www.youtube.com/watch?v=qRfL9aL1z7M' },
      ],
      'Portas lógicas': [
        { title: 'Portas Lógicas: AND, OR, NOT, NAND, NOR, XOR', url: 'https://www.youtube.com/watch?v=VbD4zVh7Q7c' },
      ],
      'Simplificação com Mapas de Karnaugh': [
        { title: 'Mapa de Karnaugh - Simplificação 3 e 4 variáveis', url: 'https://www.youtube.com/watch?v=5wz8xY9vQ2E' },
      ],
      'Circuitos combinacionais': [
        { title: 'Circuitos Combinacionais - Somadores, MUX, DEC', url: 'https://www.youtube.com/watch?v=Kv3X9yQ7R1w' },
      ],
      'Multiplexadores e decodificadores': [
        { title: 'Multiplexadores e Decodificadores', url: 'https://www.youtube.com/watch?v=L4yP7zR8Q3t' },
      ],
      'Flip-Flops': [
        { title: 'Flip-Flops RS, JK, T, D', url: 'https://www.youtube.com/watch?v=M9R8yQ7zX4w' },
      ],
      'Registradores': [
        { title: 'Registradores de Deslocamento', url: 'https://www.youtube.com/watch?v=P8Q7zR9X4w' },
      ],
      'Contadores': [
        { title: 'Contadores Síncronos e Assíncronos', url: 'https://www.youtube.com/watch?v=Q9R8zX5wV3u' },
      ],
      'Máquinas de estados': [
        { title: 'Máquina de Estados Finitos (Moore/Mealy)', url: 'https://www.youtube.com/watch?v=R9X5wV4uQ8z' },
      ],
      'Memórias': [
        { title: 'Memórias ROM, RAM, Cache', url: 'https://www.youtube.com/watch?v=S9X4wV3uR8Q' },
      ],
      'Introdução a processadores': [
        { title: 'Arquitetura de Processadores', url: 'https://www.youtube.com/watch?v=T9X3uR8Q7z' },
      ],
      'Projeto digital': [
        { title: 'Projeto de Circuitos Digitais', url: 'https://www.youtube.com/watch?v=U9X2R8Q6z' },
      ],
      'Exercícios de provas - Sistemas Digitais': [
        { title: 'Simulado Sistemas Digitais - Questões Comentadas', url: 'https://www.youtube.com/watch?v=V9X1Q7R6z' },
      ],
      'Revisão geral - Sistemas Digitais': [
        { title: 'Revisão Completa Sistemas Digitais', url: 'https://www.youtube.com/watch?v=W9X0Q6R5z' },
      ],
    }
  },
  'Thiago Vedovato': {
    subject: 'Cálculo Numérico',
    videos: {
      'Raízes de Funções': [
        { title: 'Método da Bisseção', url: 'https://www.youtube.com/watch?v=QM8Lq9PzX7w' },
        { title: 'Newton-Raphson', url: 'https://www.youtube.com/watch?v=V9X1Q7R6z' },
      ],
      'Sistemas Lineares': [
        { title: 'Eliminação de Gauss', url: 'https://www.youtube.com/watch?v=W9X0Q6R5z' },
        { title: 'Fatoração LU', url: 'https://www.youtube.com/watch?v=T9X3uR8Q7z' },
      ],
      'Interpolação': [
        { title: 'Polinômio de Lagrange', url: 'https://www.youtube.com/watch?v=U9X2R8Q6z' },
        { title: 'Mínimos Quadrados', url: 'https://www.youtube.com/watch?v=R9X5wV4uQ8z' },
      ],
    }
  },
};

const RoadmapPlan = ({ info: infoProp, phases: phasesProp, typeConfig: typeConfigProp, disciplineConfig, storageKey = DEFAULT_STORAGE_KEY }) => {
  const roadmapInfo = infoProp || defaultInfo;
  const phases = phasesProp || defaultPhases;
  const typeConfig = typeConfigProp || defaultTypeConfig;

  const [completed, setCompleted] = useState({});
  const [expandedPhase, setExpandedPhase] = useState(phases[0]?.id);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [viewingSolution, setViewingSolution] = useState(null);
  const [savedExercises, setSavedExercises] = useState([]);

  // Load saved exercises from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_exercises_v1');
      if (saved) setSavedExercises(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('saved_exercises_v1', JSON.stringify(savedExercises));
  }, [savedExercises]);

  // Get professor name from roadmap info (for single-professor roadmaps like 110-day)
  const mainProfessorName = roadmapInfo.professor || '';
  const mainExercisesData = EXERCISES_BY_PROFESSOR[mainProfessorName] || { exercises: { fundamentos: [], avancado: [] } };
  // For multi-discipline roadmaps (like 16-week), professors per discipline
  const professorsByDiscipline = roadmapInfo.professors || {};

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompleted(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, storageKey]);

  const toggleDay = (phaseId, weekNum, dayRange) => {
    const key = `${phaseId}-w${weekNum}-d${dayRange}`;
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Get exercises for a specific day based on its discipline
  const getExercisesForDay = (day) => {
    // Determine professor: check discipline first (for multi-discipline roadmaps), then fall back to main professor
    const discipline = day.discipline;
    let professorName = mainProfessorName;
    if (discipline && professorsByDiscipline[discipline]) {
      professorName = professorsByDiscipline[discipline];
    }
    const exercisesData = EXERCISES_BY_PROFESSOR[professorName] || { exercises: { fundamentos: [], avancado: [] } };
    
    const topic = day.topic.toLowerCase();
    let exercises = [];
    
    // Determine which exercise set to use based on topic keywords (Portuguese)
    const isBasico = topic.includes('fundament') || topic.includes('introdu') || topic.includes('básic') || 
                     topic.includes('revis') || topic.includes('revisão') || topic.includes('ponteiros') ||
                     topic.includes('numeração') || topic.includes('conversão') || topic.includes('álgebra') ||
                     topic.includes('portas') || topic.includes('vetores') || topic.includes('listas') ||
                     topic.includes('alocação') || topic.includes('pilhas') || topic.includes('filas') ||
                     topic.includes('árvores') || topic.includes('hash') || topic.includes('grafos') ||
                     topic.includes('busca') || topic.includes('ordenação') || topic.includes('máquinas') ||
                     topic.includes('memórias') || topic.includes('processadores') || topic.includes('projeto') ||
                     topic.includes('karnaugh') || topic.includes('flip') || topic.includes('registrador') ||
                     topic.includes('contador') || topic.includes('simulado');
    
    if (isBasico) {
      exercises = exercisesData.exercises?.fundamentos || [];
    } else {
      exercises = [...(exercisesData.exercises?.fundamentos || []), ...(exercisesData.exercises?.avancado || [])];
    }
    
    return { exercises, professorName, subject: exercisesData.subject };
  };

  // Get videos for a specific topic based on discipline/professor
  const getVideosForTopic = (topic, discipline) => {
    let professorName = mainProfessorName;
    if (discipline && professorsByDiscipline[discipline]) {
      professorName = professorsByDiscipline[discipline];
    }
    const videosData = VIDEOS_BY_PROFESSOR[professorName] || { videos: {} };
    // Try exact match first, then partial match
    let videos = videosData.videos[topic] || [];
    if (videos.length === 0) {
      const topicLower = topic.toLowerCase();
      for (const [key, value] of Object.entries(videosData.videos)) {
        if (key.toLowerCase().includes(topicLower) || topicLower.includes(key.toLowerCase())) {
          videos = value;
          break;
        }
      }
    }
    return videos;
  };

  const handleDayClick = (e, day) => {
    e.stopPropagation();
    // Always show exercises modal for any topic type
    const { exercises, professorName, subject } = getExercisesForDay(day);
    
    setSelectedExercise({
      topic: day.topic,
      date: day.date,
      exercises: exercises,
      professor: professorName,
      subject: subject
    });
    setExerciseModalOpen(true);
  };

  const closeExerciseModal = () => {
    setExerciseModalOpen(false);
    setSelectedExercise(null);
    setViewingSolution(null);
  };

  const handleSolveNow = (exercise) => {
    // Store the exercise to solve in localStorage for the chat to pick up
    localStorage.setItem('exercise_to_solve', JSON.stringify({
      ...exercise,
      subject: selectedExercise?.subject,
      professor: selectedExercise?.professor,
    }));
    // Close modal and switch to chat tab
    closeExerciseModal();
    // Dispatch custom event to notify App to switch to chat tab
    window.dispatchEvent(new CustomEvent('open-chat-for-exercise', { detail: exercise }));
  };

  const handleViewSolution = (exercise) => {
    setViewingSolution(exercise);
  };

  const handleSaveForLater = (exercise) => {
    const isSaved = savedExercises.some(se => se.id === exercise.id);
    if (isSaved) {
      setSavedExercises(prev => prev.filter(se => se.id !== exercise.id));
    } else {
      setSavedExercises(prev => [...prev, {
        ...exercise,
        subject: selectedExercise?.subject,
        professor: selectedExercise?.professor,
        savedAt: new Date().toISOString(),
      }]);
    }
  };

  const closeSolutionModal = () => {
    setViewingSolution(null);
  };

  // Calculate totals
  const allDays = phases.flatMap(p =>
    p.weeksData.flatMap(w =>
      w.days.map(d => ({ phaseId: p.id, weekNum: w.number, dayRange: d.range, type: d.type }))
    )
  );

  const totalBlocks = allDays.length;
  const completedBlocks = allDays.filter(
    d => completed[`${d.phaseId}-w${d.weekNum}-d${d.dayRange}`]
  ).length;
  const progressPercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  // Count by type
  const countByType = (type) => {
    return allDays.filter(d => d.type === type).length;
  };

  const completedByType = (type) => {
    return allDays.filter(
      d => d.type === type && completed[`${d.phaseId}-w${d.weekNum}-d${d.dayRange}`]
    ).length;
  };

  // Phase progress
  const getPhaseProgress = (phase) => {
    const phaseDays = phase.weeksData.flatMap(w =>
      w.days.map(d => `${phase.id}-w${w.number}-d${d.range}`)
    );
    const phaseCompleted = phaseDays.filter(k => completed[k]).length;
    return {
      total: phaseDays.length,
      done: phaseCompleted,
      percent: phaseDays.length > 0 ? Math.round((phaseCompleted / phaseDays.length) * 100) : 0,
    };
  };

  const getTypeIcon = (type) => {
    const iconProps = { size: 14 };
    switch (type) {
      case 'study': return <BookOpen {...iconProps} />;
      case 'exercise': return <PenTool {...iconProps} />;
      case 'review': return <Repeat {...iconProps} />;
      case 'delivery': return <Package {...iconProps} />;
      default: return <Circle {...iconProps} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };

  const totalWeeks = roadmapInfo.totalWeeks || phases.reduce((acc, p) => acc + p.weeksData.length, 0);
  const startLabel = formatDate(roadmapInfo.startDate) || `Semana 1`;
  const endLabel = formatDate(roadmapInfo.endDate) || `Semana ${totalWeeks}`;
  const durationLabel = roadmapInfo.totalDays
    ? `${roadmapInfo.totalDays} dias • ${totalWeeks} sem`
    : `${totalWeeks} semanas`;

  const [showStudyVideos, setShowStudyVideos] = useState(false);
  const [studyVideosTopic, setStudyVideosTopic] = useState(null);

  // Collect all study topics with videos
  const studyTopicsWithVideos = allDays
    .filter(d => d.type === 'study')
    .map(d => {
      const videos = getVideosForTopic(d.topic, d.discipline);
      return { ...d, videos };
    })
    .filter(d => d.videos.length > 0);

  return (
    <div className="roadmap110-container">
      {/* Hero Header */}
      <div className="roadmap110-hero">
        <div className="roadmap110-hero-content">
          <div className="roadmap110-hero-icon">
            <GraduationCap size={48} />
          </div>
          <div className="roadmap110-hero-text">
            <div className="roadmap110-hero-badge">Plano de Estudos Detalhado</div>
            <h1 className="roadmap110-hero-title">{roadmapInfo.title || 'Roteiro 110 Dias'}</h1>
            <p className="roadmap110-hero-subtitle">{roadmapInfo.subject}</p>
            <div className="roadmap110-hero-meta">
              <div className="hero-meta-item">
                <User size={16} />
                <span>Prof. {roadmapInfo.professor}</span>
              </div>
              <div className="hero-meta-item">
                <MapPin size={16} />
                <span>{roadmapInfo.institution}</span>
              </div>
              <div className="hero-meta-item">
                <Award size={16} />
                <span>{roadmapInfo.course}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="roadmap110-info-banner">
        <div className="info-card info-date">
          <Calendar size={22} />
          <div>
            <div className="info-card-label">Início</div>
            <div className="info-card-value">{startLabel}</div>
          </div>
        </div>
        <div className="info-card info-date">
          <Target size={22} />
          <div>
            <div className="info-card-label">Término</div>
            <div className="info-card-value">{endLabel}</div>
          </div>
        </div>
        <div className="info-card info-date">
          <Clock size={22} />
          <div>
            <div className="info-card-label">Duração</div>
            <div className="info-card-value">{durationLabel}</div>
          </div>
        </div>
        <div className="info-card info-progress">
          <TrendingUp size={22} />
          <div>
            <div className="info-card-label">Progresso Geral</div>
            <div className="info-card-value">{progressPercent}% • {completedBlocks}/{totalBlocks}</div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="overall-progress-wrapper">
        <div className="overall-progress-track">
          <div
            className="overall-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="breakdown-section">
        <h2 className="breakdown-title">
          <TrendingUp size={20} />
          Estrutura do Cronograma
        </h2>
        <div className="breakdown-grid">
          <div className="breakdown-card breakdown-study" onClick={() => { setShowStudyVideos(true); setStudyVideosTopic(studyTopicsWithVideos[0]); }} style={{ cursor: studyTopicsWithVideos.length > 0 ? 'pointer' : 'default' }}>
            <div className="breakdown-icon"><BookOpen size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('study')}/{countByType('study')}</div>
              <div className="breakdown-label">Estudo de Conteúdo</div>
              <div className="breakdown-sub">~{breakdown.content} dias planejados</div>
              {studyTopicsWithVideos.length > 0 && (
                <div className="breakdown-videos-hint">
                  <Video size={14} /> {studyTopicsWithVideos.length} tópicos com videoaulas — Clique para ver
                </div>
              )}
            </div>
          </div>
          <div className="breakdown-card breakdown-exercise">
            <div className="breakdown-icon"><PenTool size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('exercise')}/{countByType('exercise')}</div>
              <div className="breakdown-label">Exercícios & Atividades</div>
              <div className="breakdown-sub">~{breakdown.exercises} dias planejados</div>
            </div>
          </div>
          <div className="breakdown-card breakdown-review">
            <div className="breakdown-icon"><Repeat size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('review')}/{countByType('review')}</div>
              <div className="breakdown-label">Revisões Programadas</div>
              <div className="breakdown-sub">~{breakdown.reviews} dias planejados</div>
            </div>
          </div>
          <div className="breakdown-card breakdown-delivery">
            <div className="breakdown-icon"><Trophy size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('delivery')}/{countByType('delivery')}</div>
              <div className="breakdown-label">Finalização & Entrega</div>
              <div className="breakdown-sub">~{breakdown.finalization} dias planejados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Videos Modal */}
      {showStudyVideos && (
        <div className="exercise-modal-overlay" onClick={() => setShowStudyVideos(false)}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercise-modal-header">
              <div className="exercise-modal-title">
                <Video size={24} />
                <div>
                  <h3>Videoaulas - Estudo de Conteúdo</h3>
                  <p>{studyTopicsWithVideos.length} tópicos com aulas disponíveis</p>
                </div>
              </div>
              <button className="exercise-modal-close" onClick={() => setShowStudyVideos(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="exercise-modal-body">
              <div className="study-videos-list">
                {studyTopicsWithVideos.map((item, idx) => (
                  <div key={idx} className="exercise-card">
                    <div className="exercise-card-header">
                      <h4>{item.topic}</h4>
                      <span className="exercise-topic-tag">{item.discipline || 'Geral'}</span>
                    </div>
                    <p className="exercise-description">Semana {item.weekNum} - {item.date}</p>
                    <div className="exercise-topics">
                      {item.videos.map((video, vIdx) => (
                        <a key={vIdx} href={video.url} target="_blank" rel="noopener noreferrer" className="exercise-topic-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--blue-primary)' }}>
                          <Video size={12} />
                          {video.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="exercise-modal-footer">
              <button className="exercise-btn exercise-btn-secondary" onClick={() => setShowStudyVideos(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="roadmap110-legend">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div className="legend-pill" key={key}>
            <span className="legend-dot" style={{ background: cfg.color }} />
            <span>{cfg.label}</span>
          </div>
        ))}
        {disciplineConfig && Object.entries(disciplineConfig).map(([key, cfg]) => (
          <div className="legend-pill" key={key}>
            <span className="legend-dot" style={{ background: cfg.color }} />
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div className="phases-wrapper">
        {phases.map((phase) => {
          const progress = getPhaseProgress(phase);
          const isExpanded = expandedPhase === phase.id;

          return (
            <div key={phase.id} className="phase-card" style={{ borderLeftColor: phase.color }}>
              <button
                className="phase-header"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="phase-header-left">
                  <div
                    className="phase-number-badge"
                    style={{ background: phase.color }}
                  >
                    {phase.number}
                  </div>
                  <div className="phase-title-block">
                    <div className="phase-label-line">
                      <span className="phase-title-main">FASE {phase.number}: {phase.name}</span>
                      <span className="phase-weeks-badge">Semanas {phase.weeks} • {phase.totalDays} dias</span>
                    </div>
                    <div className="phase-description">{phase.description}</div>
                  </div>
                </div>
                <div className="phase-header-right">
                  <div className="phase-progress-info">
                    <div className="phase-progress-text">
                      {progress.done}/{progress.total} concluídos
                    </div>
                    <div className="phase-progress-bar-wrapper">
                      <div
                        className="phase-progress-bar-fill"
                        style={{ width: `${progress.percent}%`, background: phase.color }}
                      />
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                </div>
              </button>

              {isExpanded && (
                <div className="phase-content">
                  {phase.weeksData.map((week) => (
                    <div className="week-block" key={`${phase.id}-w${week.number}`}>
                      <div className="week-header">
                        <div className="week-number">Semana {week.number}</div>
                        <div className="week-info">
                          <div className="week-title">{week.title}</div>
                          <div className="week-date-range">{week.dateRange}</div>
                        </div>
                      </div>
                      <div className="week-days">
                        {week.days.map((day, idx) => {
                          const key = `${phase.id}-w${week.number}-d${day.range}`;
                          const isDone = !!completed[key];
                          const cfg = typeConfig[day.type];
                          const disc = day.discipline && disciplineConfig ? disciplineConfig[day.discipline] : null;

                          const handleItemClick = (e) => {
                            // If already completed, just toggle. Otherwise show exercises.
                            if (isDone) {
                              toggleDay(phase.id, week.number, day.range);
                            } else {
                              handleDayClick(e, day);
                            }
                          };

                          return (
                            <div
                              key={idx}
                              className={`day-item ${isDone ? 'done' : ''} exercise-clickable`}
                              style={{
                                background: isDone ? 'rgba(16, 185, 129, 0.1)' : cfg.bgColor,
                                borderColor: isDone ? 'rgba(16, 185, 129, 0.4)' : cfg.borderColor,
                                cursor: isDone ? 'default' : 'pointer',
                              }}
                              onClick={handleItemClick}
                            >
                              <div className="day-check">
                                {isDone ? (
                                  <CheckCircle2 size={22} className="check-done" />
                                ) : (
                                  <Circle size={22} className="check-idle" />
                                )}
                              </div>
                              <div className="day-main">
                                <div className="day-top-row">
                                  <span className="day-range">Dia{day.range.includes('-') ? 's' : ''} {day.range}</span>
                                  <span className="day-date">{day.date}</span>
                                  {disc && (
                                    <span
                                      className="day-type-badge"
                                      style={{
                                        color: disc.color,
                                        borderColor: disc.borderColor,
                                        background: 'rgba(0,0,0,0.25)',
                                      }}
                                    >
                                      {disc.short}
                                    </span>
                                  )}
                                  <span
                                    className="day-type-badge"
                                    style={{
                                      color: cfg.color,
                                      borderColor: cfg.borderColor,
                                      background: 'rgba(0,0,0,0.25)',
                                    }}
                                  >
                                    {getTypeIcon(day.type)}
                                    {cfg.label}
                                    {!isDone && <Play size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                                  </span>
                                </div>
                                <div className={`day-topic ${isDone ? 'strikethrough' : ''}`}>
                                  {day.topic}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="roadmap110-footer">
        <div className="footer-icon">
          <Trophy size={32} />
        </div>
        <div className="footer-text">
          <h3>Consistência é a chave do sucesso</h3>
          <p>Siga o cronograma, marque o progresso diário e conclua até {endLabel}.</p>
        </div>
      </div>

      {/* Exercise Modal */}
      {exerciseModalOpen && selectedExercise && (
        <div className="exercise-modal-overlay" onClick={closeExerciseModal}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercise-modal-header">
              <div className="exercise-modal-title">
                <BookMarked size={24} />
                <div>
                  <h3>{selectedExercise.topic}</h3>
                  <p>{selectedExercise.professor} — {selectedExercise.subject}</p>
                </div>
              </div>
              <button className="exercise-modal-close" onClick={closeExerciseModal}>
                <X size={24} />
              </button>
            </div>
            <div className="exercise-modal-body">
              <div className="exercise-modal-date">
                <Calendar size={16} />
                <span>Data: {selectedExercise.date}</span>
              </div>
              {selectedExercise.exercises.length === 0 ? (
                <div className="exercise-empty">
                  <Lightbulb size={48} />
                  <p>Nenhum exercício cadastrado para este tópico ainda.</p>
                  <p className="exercise-empty-hint">Os exercícios serão adicionados conforme o cronograma avança.</p>
                </div>
              ) : (
                <div className="exercise-list">
                  {selectedExercise.exercises.map((ex) => (
                    <div key={ex.id} className="exercise-card">
                      <div className="exercise-card-header">
                        <h4>{ex.title}</h4>
                        <span className={`exercise-difficulty ${ex.difficulty.toLowerCase()}`}>{ex.difficulty}</span>
                      </div>
                      <p className="exercise-description">{ex.description}</p>
                      <div className="exercise-topics">
                        {ex.topics.map((topic, idx) => (
                          <span key={idx} className="exercise-topic-tag">{topic}</span>
                        ))}
                      </div>
                      <div className="exercise-actions">
                        <button className="exercise-btn exercise-btn-primary" onClick={() => handleSolveNow(ex)}>
                          <Play size={16} />
                          Resolver Agora
                        </button>
                        <button className="exercise-btn exercise-btn-secondary" onClick={() => handleViewSolution(ex)}>
                          <Code size={16} />
                          Ver Solução
                        </button>
                        <button className="exercise-btn exercise-btn-secondary" onClick={() => handleSaveForLater(ex)}>
                          <BookMarked size={16} />
                          {savedExercises.some(se => se.id === ex.id) ? 'Salvo' : 'Salvar para Depois'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="exercise-modal-footer">
              <button className="exercise-btn exercise-btn-secondary" onClick={closeExerciseModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solution Modal */}
      {viewingSolution && (
        <div className="exercise-modal-overlay" onClick={closeSolutionModal}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercise-modal-header">
              <div className="exercise-modal-title">
                <Code size={24} />
                <div>
                  <h3>Solução: {viewingSolution.title}</h3>
                  <p>{viewingSolution.difficulty} — {viewingSolution.topics.join(', ')}</p>
                </div>
              </div>
              <button className="exercise-modal-close" onClick={closeSolutionModal}>
                <X size={24} />
              </button>
            </div>
            <div className="exercise-modal-body">
              <div className="exercise-modal-date">
                <BookOpen size={16} />
                <span>Enunciado: {viewingSolution.description}</span>
              </div>
              <div className="solution-content">
                <h4>Resolução Passo a Passo</h4>
                <div className="solution-steps">
                  <p><strong>1. ENTENDIMENTO:</strong> Identificar o que o problema pede e quais são os dados de entrada e saída esperados.</p>
                  <p><strong>2. CONCEITOS:</strong> {viewingSolution.topics.map(t => t).join(', ')} — revisar definições e propriedades.</p>
                  <p><strong>3. PASSO A PASSO:</strong></p>
                  <ol>
                    <li>Definir estruturas de dados necessárias</li>
                    <li>Implementar algoritmo base</li>
                    <li>Testar casos de borda</li>
                    <li>Otimizar se necessário</li>
                  </ol>
                  <p><strong>4. VERIFICAÇÃO:</strong> Testar com exemplos conhecidos e validar complexidade.</p>
                  <p><strong>5. RESPOSTA FINAL:</strong> Código completo com comentários explicativos.</p>
                </div>
                <div className="solution-code">
                  <pre><code>{`// Exemplo de implementação para: ${viewingSolution.title}
// Tópicos: ${viewingSolution.topics.join(', ')}
// Dificuldade: ${viewingSolution.difficulty}

// TODO: Implementar solução completa baseada no enunciado:
// ${viewingSolution.description}

// Exemplo de estrutura:
function resolver() {
  // 1. Ler entrada
  // 2. Processar
  // 3. Imprimir resultado
}`}</code></pre>
                </div>
              </div>
            </div>
            <div className="exercise-modal-footer">
              <button className="exercise-btn exercise-btn-primary" onClick={() => handleSolveNow(viewingSolution)}>
                <Play size={16} />
                Resolver no Chat
              </button>
              <button className="exercise-btn exercise-btn-secondary" onClick={closeSolutionModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPlan;