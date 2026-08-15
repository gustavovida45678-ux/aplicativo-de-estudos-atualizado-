import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, FileText, Folder, Video, GraduationCap,
  Cpu, ArrowUpRight, Brain, Library, ChevronDown, ChevronUp,
  CalendarDays, Clock, MapPin, ClipboardList, Target, Sigma,
  RefreshCw, ListChecks, PlayCircle, BookOpenCheck, CheckCircle2,
  Circle, LayoutDashboard, BarChart3, Trophy, ChevronRight, X,
  AlertTriangle, TrendingDown, Lightbulb, PenLine, Calculator,
  Sparkles, MessageCircleQuestion, Loader2, Download,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';
import '../styles/studyMaterials.css';
import MindMapModal from './MindMap';
import DailySchedule from './DailySchedule';
import AssessmentPractice from './AssessmentPractice';

import { VIDEO_EXERCISES } from '../data/videoExercises';
import { getAvaliacaoByPart } from '../data/avaliacoesDisciplinas';
import { SIMULADOS_CRONOGRAMA } from '../data/simuladosCronograma';
import { BACKEND_URL } from '../lib/backendUrl';

const API = `${BACKEND_URL}/api/study`;

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const findSimuladoForTopic = (topic, discipline) => {
  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2);
  const topicWords = new Set(norm(topic.name));
  const kwWords = new Set((topic.keywords || []).flatMap(norm));
  let best = null;
  let bestScore = 0;
  for (const week of SIMULADOS_CRONOGRAMA) {
    for (const sim of week.simulados) {
      if (sim.discipline !== discipline.name) continue;
      const simWords = new Set([...norm(sim.title), ...norm(sim.discipline)]);
      let score = 0;
      topicWords.forEach((w) => {
        if (simWords.has(w)) score += 2;
      });
      kwWords.forEach((w) => {
        if (simWords.has(w)) score += 3;
      });
      if (score > bestScore) {
        bestScore = score;
        best = { week: week.week, simulado: sim };
      }
    }
  }
  return bestScore >= 3 ? best : null;
};

const EVALUATION_MODELS = {
  ed: {
    title: 'Mecanismo de Avaliação - Estrutura de Dados',
    formula: 'Média = (Lista × 2,0 + Simulado × 3,0 + Prova × 5,0) ÷ 10',
    pass: 6.0,
    parts: [
      { id: 'lista', label: 'Lista de exercícios', weight: 2.0 },
      { id: 'simulado', label: 'Exercícios simulados (plataforma online)', weight: 3.0 },
      { id: 'prova', label: 'Provas', weight: 5.0 },
    ],
    compute: (g) => {
      const w = { lista: 2.0, simulado: 3.0, prova: 5.0 };
      const total = w.lista + w.simulado + w.prova;
      const acc = (g.lista || 0) * w.lista + (g.simulado || 0) * w.simulado + (g.prova || 0) * w.prova;
      return { media: acc / total };
    },
  },
  sd: {
    title: 'Mecanismo de Avaliação - Sistemas Digitais',
    formula: 'MB1 = (VAE1 + PB1) ÷ 2  •  MB2 = (VAE2 + PRO + PB2) ÷ 3  •  MS = (MB1 + MB2) ÷ 2',
    pass: 6.0,
    parts: [
      { id: 'vae1', label: 'VAE1 - Avaliações parciais 1º Bimestre', weight: null },
      { id: 'pb1', label: 'PB1 - Prova bimestral 1º Bimestre', weight: null },
      { id: 'vae2', label: 'VAE2 - Avaliações parciais 2º Bimestre', weight: null },
      { id: 'pro', label: 'PRO - Projeto de circuito eletrônico digital', weight: null },
      { id: 'pb2', label: 'PB2 - Prova bimestral 2º Bimestre', weight: null },
    ],
    compute: (g) => {
      const mb1 = g.vae1 != null && g.pb1 != null ? (g.vae1 + g.pb1) / 2 : null;
      const mb2 = g.vae2 != null && g.pro != null && g.pb2 != null ? (g.vae2 + g.pro + g.pb2) / 3 : null;
      const media = mb1 != null && mb2 != null ? (mb1 + mb2) / 2 : null;
      return { mb1, mb2, media };
    },
  },
  al: {
    title: 'Mecanismo de Avaliação - Álgebra Linear',
    formula: 'Média = (Avaliação 1 + Avaliação 2 + Prova Final) ÷ 3',
    pass: 6.0,
    parts: [
      { id: 'a1', label: 'Avaliação 1', weight: null },
      { id: 'a2', label: 'Avaliação 2', weight: null },
      { id: 'prova_final', label: 'Prova final', weight: null },
    ],
    compute: (g) => {
      const vals = [g.a1, g.a2, g.prova_final].filter((v) => v != null);
      const media = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      return { media };
    },
  },
  rl: {
    title: 'Mecanismo de Avaliação - Raciocínio Lógico',
    formula: 'Média = (Avaliação 1 + Avaliação 2 + Prova Final) ÷ 3',
    pass: 6.0,
    parts: [
      { id: 'a1', label: 'Avaliação 1', weight: null },
      { id: 'a2', label: 'Avaliação 2', weight: null },
      { id: 'prova_final', label: 'Prova final', weight: null },
    ],
    compute: (g) => {
      const vals = [g.a1, g.a2, g.prova_final].filter((v) => v != null);
      const media = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      return { media };
    },
  },
};

const loadGrades = () => {
  try {
    return JSON.parse(localStorage.getItem('materialsGrades')) || {};
  } catch {
    return {};
  }
};

const materialsData = [
  {
    id: 'ed',
    name: 'Estrutura de Dados',
    professor: 'Prof. Roney Lopes Lima',
    course: 'Turma 20262.2.02004.1M • 54h/72 aulas',
    color: '#3b82f6',
    icon: Cpu,
    schedule: [
      { day: 'Quarta-feira', time: '08:45 - 10:15', room: 'Sala S403' },
      { day: 'Quarta-feira', time: '10:30 - 12:00', room: 'Sala S403' },
    ],
    evaluation: [
      'Lista de exercícios (2,0)',
      'Exercícios simulados em plataforma online (3,0)',
      'Provas (5,0)',
      'Aprovação conforme média do plano de ensino',
    ],
    structure: [
      { name: 'Apostila.pdf', type: 'file' },
      { name: 'Resumo.pdf', type: 'file' },
      { name: 'Mapa_Mental.pdf', type: 'file' },
      { name: 'Exercicios.pdf', type: 'file' },
      { name: 'Exercicios_Resolvidos.pdf', type: 'file' },
      { name: 'Simulados', type: 'folder' },
      { name: 'Gabaritos.pdf', type: 'file' },
      { name: 'Codigos_C', type: 'folder' },
      { name: 'Projetos', type: 'folder' },
    ],
    topics: [
      {
        id: 'ed-programacao-estruturada',
        topicId: 'ed_1',
        subject: 'Estrutura de Dados',
        name: 'Programação Estruturada e Modular',
        icon: '🛠️',
        keywords: ['Funções', 'Módulos', 'Escopo', 'Valor vs Referência', 'Protótipos'],
        videoaulas: [
          { title: 'Funções em C++ (Curso em Vídeo)', url: yt('funções em C++ curso em vídeo') },
          { title: 'Passagem por valor e por referência', url: yt('passagem por valor e por referência C++') },
        ],
        revisoes: [
          { title: 'Resumo de funções', note: 'Assinatura, escopo, valor vs referência' },
          { title: 'Módulos e headers', note: 'Organização do código em arquivos' },
        ],
        exercicios: [
          { name: 'Lista 1 - Funções e Modularização', count: 6, icon: '🛠️' },
        ],
      },
      {
        id: 'ed-analise-algoritmos',
        topicId: 'ed_2',
        subject: 'Estrutura de Dados',
        name: 'Análise de Algoritmos',
        icon: '📊',
        keywords: ['Big O', 'O(1)', 'O(n)', 'O(n²)', 'O(log n)'],
        videoaulas: [
          { title: 'Notação Big O (Prof. Guanabara)', url: yt('big O notação guanabara') },
          { title: 'Complexidade de algoritmos (Univesp)', url: yt('análise de complexidade de algoritmos univesp') },
        ],
        revisoes: [
          { title: 'Resumo de complexidade', note: 'O(1), O(n), O(log n), O(n²)' },
        ],
        exercicios: [
          { name: 'Lista 2 - Complexidade de Algoritmos', count: 6, icon: '📊' },
        ],
      },
      {
        id: 'ed-vetores-strings',
        topicId: 'ed_3',
        subject: 'Estrutura de Dados',
        name: 'Vetores e Strings',
        icon: '📚',
        keywords: ['Arrays', 'Índices', 'Busca linear', 'Ordenação', 'Strings'],
        videoaulas: [
          { title: 'Vetores e arrays em C++', url: yt('vetores e arrays em C++ aula') },
          { title: 'Ordenação bolha e inserção', url: yt('ordenação bolha inserção C++') },
        ],
        revisoes: [
          { title: 'Resumo de vetores e strings', note: 'Declaração, acesso, funções de string' },
        { title: 'Revisão Semana 3 - Vetores e listas', note: 'Conteúdo das semanas 1 a 3: C/ponteiros, alocação e vetores', week: 3 },
          ],
        exercicios: [
          { name: 'Lista 3 - Vetores e Strings', count: 7, icon: '📚' },
        ],
      },
      {
        id: 'ed-matrizes',
        topicId: 'ed_4',
        subject: 'Estrutura de Dados',
        name: 'Matrizes Multidimensionais',
        icon: '🔲',
        keywords: ['Linhas e colunas', 'Percurso', 'Alocação estática', 'Alocação dinâmica', 'Operações'],
        videoaulas: [
          { title: 'Matrizes em C++', url: yt('matrizes em C++ aula') },
          { title: 'Alocação dinâmica de matrizes', url: yt('alocação dinâmica de matrizes C++') },
        ],
        revisoes: [
          { title: 'Resumo de matrizes', note: 'Declaração, percurso, operações' },
        ],
        exercicios: [
          { name: 'Lista 4 - Matrizes', count: 6, icon: '🔲' },
        ],
      },
      {
        id: 'ed-estruturas-dinamicas',
        topicId: 'ed_5',
        subject: 'Estrutura de Dados',
        name: 'Estruturas Estáticas e Dinâmicas',
        icon: '🧩',
        keywords: ['Ponteiros', 'new', 'delete', 'Heap', 'Endereços'],
        videoaulas: [
          { title: 'Ponteiros em C++ (Curso em Vídeo)', url: yt('ponteiros C++ curso em vídeo') },
          { title: 'new e delete - alocação dinâmica', url: yt('alocação dinâmica C++ new delete') },
        ],
        revisoes: [
          { title: 'Resumo de ponteiros', note: 'Endereços, new/delete, memória' },
        ],
        exercicios: [
          { name: 'Lista 5 - Alocação Dinâmica', count: 6, icon: '🧩' },
        ],
      },
      {
        id: 'ed-pilhas-filas',
        topicId: 'ed_6',
        subject: 'Estrutura de Dados',
        name: 'Pilhas e Filas',
        icon: '🥞',
        keywords: ['LIFO', 'FIFO', 'push/pop', 'enqueue/dequeue', 'Topo/Frente'],
        videoaulas: [
          { title: 'Pilha (stack) - implementação', url: yt('pilha stack C++ implementação') },
          { title: 'Fila (queue) - implementação', url: yt('fila queue C++ implementação') },
        ],
        revisoes: [
          { title: 'Resumo LIFO/FIFO', note: 'Operações push/pop, enqueue/dequeue' },
        { title: 'Revisão Semana 6 - Pilhas e Filas', note: 'Semanas 4 a 6: listas encadeadas, pilhas e filas', week: 6 },
          ],
        exercicios: [
          { name: 'Lista 6 - Pilhas e Filas', count: 7, icon: '🥞' },
        ],
      },
      {
        id: 'ed-listas-encadeadas',
        topicId: 'ed_7',
        subject: 'Estrutura de Dados',
        name: 'Listas Encadeadas',
        icon: '🔗',
        keywords: ['Nós', 'next', 'prev', 'Circular', 'Inserção/remoção'],
        videoaulas: [
          { title: 'Lista simplesmente encadeada', url: yt('lista simplesmente encadeada C++') },
          { title: 'Lista duplamente encadeada', url: yt('lista duplamente encadeada C++') },
        ],
        revisoes: [
          { title: 'Resumo de listas encadeadas', note: 'Inserção, remoção, busca, circular' },
        { title: 'Revisão Semana 12 - Listas e avançado', note: 'Semanas 10 a 12: árvores B, hash e listas', week: 12 },
          ],
        exercicios: [
          { name: 'Lista 7 - Listas Encadeadas', count: 6, icon: '🔗' },
        ],
      },
      {
        id: 'ed-arvores',
        topicId: 'ed_8',
        subject: 'Estrutura de Dados',
        name: 'Árvores',
        icon: '🌳',
        keywords: ['Nó raiz', 'Folhas', 'BST', 'AVL', 'Rotações'],
        videoaulas: [
          { title: 'Árvores binárias - implementação', url: yt('árvores binárias C++') },
          { title: 'Árvore binária de busca (BST)', url: yt('árvore binária de busca C++') },
          { title: 'Balanceamento AVL', url: yt('árvore AVL C++') },
        ],
        revisoes: [
          { title: 'Resumo de árvores', note: 'Percursos, BST, AVL, balanceamento' },
        { title: 'Revisão Semana 9 - Árvores', note: 'Semanas 7 a 9: filas, árvores binárias e AVL', week: 9 },
          ],
        exercicios: [
          { name: 'Lista 8 - Árvores', count: 6, icon: '🌳' },
        ],
      },
      {
        id: 'ed-simulado',
        topicId: 'ed_simulado',
        subject: 'Estrutura de Dados',
        name: 'Simulado - Avaliação',
        icon: '📝',
        keywords: ['Prova', 'Lista 2,0', 'Simulado 3,0', 'Revisão', 'Estratégia'],
        videoaulas: [
          { title: 'Revisão completa de Estrutura de Dados', url: yt('revisão estrutura de dados prova') },
        ],
        revisoes: [
          { title: 'Roteiro de revisão', note: 'Lista (2,0) + Simulado (3,0) + Prova (5,0)' },
          { title: 'Provas anteriores', note: 'Questões resolvidas e comentadas' },
        ],
        exercicios: [
          { name: 'Simulado - formato da prova', count: 10, icon: '📝' },
        ],
      },
    ],
    books: [
      {
        title: 'Algoritmos e Estrutura de Dados (Guimarães)',
        note: 'Referência básica do plano de ensino (LTC, 1994)',
      },
      {
        title: 'Estrutura de Dados usando C (Tenenbaum)',
        note: 'Referência básica do plano de ensino (Pearson, 1995)',
      },
      {
        title: 'Estrutura de Dados (Veloso)',
        note: 'Referência básica do plano de ensino (Campus)',
      },
      {
        title: 'Estruturas de Dados (Edelweiss)',
        note: 'Referência básica do plano de ensino (Bookman, 2009)',
      },
      {
        title: 'Open Data Structures',
        note: 'Livro gratuito em acesso aberto (edição C/Java)',
        url: 'https://opendatastructures.org/',
      },
      {
        title: 'Problem Solving with Algorithms and Data Structures using Python',
        note: 'Livro interativo gratuito',
        url: 'https://runestone.academy/ns/books/published/pythonds3/index.html',
      },
    ],
  },
  {
    id: 'sd',
    name: 'Sistemas Digitais',
    professor: 'Prof. José Antonio Lambert',
    course: 'Turma 20262.2.02004.1N • 54h/72 aulas',
    color: '#f59e0b',
    icon: Brain,
    schedule: [
      { day: 'Segunda-feira', time: '19:00 - 20:30', room: 'Sala T407' },
      { day: 'Segunda-feira', time: '20:45 - 22:15', room: 'Sala T407' },
    ],
    evaluation: [
      'MB1 = (VAE1 + PB1) / 2',
      'MB2 = (VAE2 + PRO + PB2) / 3',
      'MS = (MB1 + MB2) / 2',
      'Aprovação: MS ≥ 6,0',
    ],
    structure: [
      { name: 'Apostila.pdf', type: 'file' },
      { name: 'Resumo.pdf', type: 'file' },
      { name: 'Mapa_Mental.pdf', type: 'file' },
      { name: 'Exercicios.pdf', type: 'file' },
      { name: 'Exercicios_Resolvidos.pdf', type: 'file' },
      { name: 'Simulados.pdf', type: 'file' },
      { name: 'Gabaritos.pdf', type: 'file' },
      { name: 'Videoaulas.md', type: 'file' },
    ],
    topics: [
      {
        id: 'sd-sistemas-numeracao',
        topicId: 'sd_1',
        subject: 'Sistemas Digitais',
        name: 'Sistemas de Numeração',
        icon: '🔢',
        keywords: ['Binário', 'Octal', 'Hexadecimal', 'BCD', 'Aritmética'],
        videoaulas: [
          { title: 'Conversão entre bases (Prof. João Lucas)', url: yt('conversão entre bases numéricas professor joão lucas') },
          { title: 'Number System Conversions (Neso Academy)', url: yt('neso academy number system conversion') },
          { title: 'Sistemas de Numeração (Univesp)', url: yt('univesp sistemas de numeração') },
        ],
        revisoes: [
          { title: 'Resumo + tabelas de conversão', note: 'Binário, octal, hexadecimal, aritmética e códigos' },
          { title: 'Questões resolvidas', note: 'Lista comentada passo a passo' },
        ],
        exercicios: [
          { name: 'Lista 1 - Conversão de Bases', count: 8, icon: '🔢' },
          { name: 'Lista 2 - Aritmética e Códigos', count: 8, icon: '🧮' },
        ],
      },
      {
        id: 'sd-portas-logicas',
        topicId: 'sd_2',
        subject: 'Sistemas Digitais',
        name: 'Portas e Funções Lógicas',
        icon: '⚡',
        keywords: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'Tabela-verdade'],
        videoaulas: [
          { title: 'Portas lógicas AND, OR, NOT (Prof. João Lucas)', url: yt('portas lógicas professor joão lucas') },
          { title: 'Logic Gates (Neso Academy)', url: yt('neso academy logic gates') },
          { title: 'Tabelas-verdade (Univesp)', url: yt('tabela verdade univesp') },
        ],
        revisoes: [
          { title: 'Resumo das portas e tabelas', note: 'AND, OR, NOT, NAND, NOR, XOR, XNOR' },
          { title: 'Mapa mental das portas', note: 'Símbolos, tabelas-verdade e circuitos' },
        ],
        exercicios: [
          { name: 'Lista 3 - Portas Lógicas', count: 7, icon: '⚡' },
          { name: 'Lista 4 - Tabelas-Verdade', count: 7, icon: '📋' },
        ],
      },
      {
        id: 'sd-algebra-boole',
        topicId: 'sd_3',
        subject: 'Sistemas Digitais',
        name: 'Álgebra de Boole e Simplificação',
        icon: '🧠',
        keywords: ['Postulados', 'De Morgan', 'Formas canônicas', 'Karnaugh', 'Simplificação'],
        videoaulas: [
          { title: 'Álgebra de Boole e De Morgan (Prof. João Lucas)', url: yt('álgebra de boole de morgan professor joão lucas') },
          { title: 'Boolean Algebra (Neso Academy)', url: yt('neso academy boolean algebra') },
          { title: 'Mapa de Karnaugh - simplificação', url: yt('mapa de karnaugh simplificação') },
        ],
        revisoes: [
          { title: 'Resumo postulados e teoremas', note: 'De Morgan, formas canônicas, identidades' },
          { title: 'Roteiro de simplificação', note: 'Passo a passo para usar Karnaugh' },
        { title: 'Revisão Semana 3 - Álgebra Booleana', note: 'Semanas 1 a 3: numeração, portas e Boole', week: 3 },
          ],
        exercicios: [
          { name: 'Lista 5 - Álgebra de Boole', count: 7, icon: '🧠' },
          { name: 'Lista 6 - Mapa de Karnaugh', count: 7, icon: '🗺️' },
        ],
      },
      {
        id: 'sd-circuitos-combinacionais',
        topicId: 'sd_4',
        subject: 'Sistemas Digitais',
        name: 'Circuitos Combinacionais',
        icon: '⚙️',
        keywords: ['Somadores', 'MUX', 'DEMUX', 'Decodificadores', 'Display 7 segmentos'],
        videoaulas: [
          { title: 'Somadores e subtratores (Prof. João Lucas)', url: yt('somadores subtratores circuitos digitais') },
          { title: 'MUX/DEMUX - circuitos combinacionais', url: yt('multiplexador demultiplexador sistemas digitais') },
          { title: 'Display de 7 segmentos', url: yt('display 7 segmentos circuitos digitais') },
        ],
        revisoes: [
          { title: 'Resumo de circuitos combinacionais', note: 'Somadores, comparadores, MUX, DEMUX, display' },
          { title: 'Roteiro de projeto', note: 'Do enunciado ao circuito implementado' },
        { title: 'Revisão Semana 6 - Circuitos combinacionais', note: 'Semanas 4 a 6: Karnaugh e combinacionais', week: 6 },
          ],
        exercicios: [
          { name: 'Lista 7 - Circuitos Combinacionais', count: 7, icon: '⚙️' },
          { name: 'Lista 8 - Projeto com MUX', count: 7, icon: '🧩' },
        ],
      },
      {
        id: 'sd-flipflops-contadores',
        topicId: 'sd_5',
        subject: 'Sistemas Digitais',
        name: 'Flip-Flops e Contadores',
        icon: '⏱️',
        keywords: ['RS', 'JK', 'D', 'T', 'Registradores', 'Síncrono/Assíncrono'],
        videoaulas: [
          { title: 'Flip-flops RS, JK, D e T (Prof. João Lucas)', url: yt('flip flop rs jk d t sistemas digitais') },
          { title: 'Registradores e contadores síncronos', url: yt('registradores contadores síncronos sistemas digitais') },
          { title: 'Sequential Circuits (Neso Academy)', url: yt('neso academy sequential circuits') },
        ],
        revisoes: [
          { title: 'Resumo dos flip-flops', note: 'Tabelas de excitação, características e aplicações' },
          { title: 'Mapa mental de contadores', note: 'Síncronos vs assíncronos, módulos' },
        { title: 'Revisão Semana 9 - Flip-Flops e Contadores', note: 'Semanas 7 a 9: registradores, flip-flops e contadores', week: 9 },
          ],
        exercicios: [
          { name: 'Lista 9 - Flip-Flops', count: 7, icon: '⏱️' },
          { name: 'Lista 10 - Registradores e Contadores', count: 7, icon: '🔢' },
        ],
      },
      {
        id: 'sd-conversores-memorias',
        topicId: 'sd_6',
        subject: 'Sistemas Digitais',
        name: 'Conversores, Multiplex e Memórias',
        icon: '💾',
        keywords: ['D/A', 'A/D', 'ROM', 'RAM', 'TTL', 'CMOS'],
        videoaulas: [
          { title: 'Conversor D/A e A/D', url: yt('conversor digital analógico analógico digital') },
          { title: 'Memórias ROM e RAM', url: yt('memórias rom ram sistemas digitais') },
          { title: 'Famílias lógicas TTL e CMOS', url: yt('famílias lógicas TTL CMOS') },
        ],
        revisoes: [
          { title: 'Resumo de conversores', note: 'D/A, A/D, resolução e aplicações' },
          { title: 'Resumo de memórias', note: 'ROM, RAM, organização e famílias TTL/CMOS' },
        { title: 'Revisão Semana 12 - Conversores e Memórias', note: 'Semanas 10 a 12: contadores, máquinas de estado e memórias', week: 12 },
          ],
        exercicios: [
          { name: 'Lista 11 - Conversores D/A e A/D', count: 7, icon: '💾' },
          { name: 'Lista 12 - Memórias e Famílias Lógicas', count: 7, icon: '🔌' },
        ],
      },
      {
        id: 'sd-microprocessadores',
        topicId: 'sd_microprocessadores',
        subject: 'Sistemas Digitais',
        name: 'Microprocessadores e Microcontroladores',
        icon: '🖥️',
        keywords: ['Arquitetura von Neumann', 'CPU', 'Barramentos', 'Microcontrolador', 'Programa'],
        videoaulas: [
          { title: 'Como funciona um processador', url: yt('como funciona um processador arquitetura') },
          { title: 'Microcontroladores - introdução', url: yt('introdução microcontroladores arquitetura') },
        ],
        revisoes: [
          { title: 'Resumo de microprocessadores', note: 'CPU, registradores, ciclo de instrução' },
          { title: 'Diferença micro vs microcontrolador', note: 'Arquitetura von Neumann x Harvard' },
          { title: 'Revisão Semana 6 - Microprocessadores', note: 'Semana 6: arquitetura, barramentos, microcontroladores', week: 6 },
        ],
        exercicios: [
          { name: 'Lista 13 - Microprocessadores', count: 6, icon: '🖥️' },
          { name: 'Lista 14 - Microcontroladores', count: 6, icon: '🎛️' },
        ],
      },
      {
        id: 'sd-projeto-digital',
        topicId: 'sd_projeto_digital',
        subject: 'Sistemas Digitais',
        name: 'Projeto de Circuitos Digitais (PRO)',
        icon: '🔧',
        keywords: ['Projeto', 'Protoboard', 'Voltímetro digital', 'Relógio digital', 'Documentação'],
        videoaulas: [
          { title: 'Como projetar um circuito digital', url: yt('como projetar circuito digital passo a passo') },
          { title: 'Montagem em protoboard', url: yt('montagem circuito digital protoboard') },
        ],
        revisoes: [
          { title: 'Roteiro do projeto (PRO)', note: 'Voltímetro, relógio, cronômetro, temporizador - vale nota em MB2' },
          { title: 'Do esquema à prática', note: 'Tabela-verdade → expressão → circuito → protótipo' },
          { title: 'Revisão Semana 12 - Projeto Digital (PRO)', note: 'Semana 12: voltímetro, relógio, cronômetro, documentação', week: 12 },
        ],
        exercicios: [
          { name: 'Projeto: voltímetro digital', count: 5, icon: '🔧' },
          { name: 'Projeto: relógio digital', count: 5, icon: '⏰' },
        ],
      },
      {
        id: 'sd-simulado',
        topicId: 'sd_simulado',
        subject: 'Sistemas Digitais',
        name: 'Simulado - Avaliação',
        icon: '📝',
        keywords: ['MB1', 'MB2', 'VAE', 'Prova bimestral', 'Projeto'],
        videoaulas: [
          { title: 'Revisão completa para a prova', url: yt('revisão sistemas digitais prova') },
        ],
        revisoes: [
          { title: 'Roteiro de revisão - MB1', note: 'VAE1 + Prova Bimestral 1' },
          { title: 'Roteiro de revisão - MB2', note: 'VAE2 + Projeto + Prova Bimestral 2' },
          { title: 'Provas anteriores', note: 'Formato e questões comentadas' },
        ],
        exercicios: [
          { name: 'Simulado - formato da prova', count: 10, icon: '📝' },
          { name: 'Mini-simulado - VAE', count: 5, icon: '✍️' },
        ],
      },
    ],
    books: [
      {
        title: 'Sistemas Digitais: Princípios e Aplicações (Tocci & Widmer)',
        note: 'Referência principal do plano de ensino',
      },
      {
        title: 'Elementos de Eletrônica Digital (Idoeta & Capuano)',
        note: 'Referência do plano de ensino',
      },
      {
        title: 'Eletrônica Digital (Tokheim)',
        note: 'Referência do plano de ensino',
      },
      {
        title: 'Sistemas Digitais (Costa)',
        note: 'Referência do plano de ensino',
      },
      {
        title: 'Fundamentos de Sistemas Digitais (Wagner)',
        note: 'Referência do plano de ensino',
      },
      {
        title: 'Digital Logic Design - UVIC',
        note: 'Materiais gratuitos de universidades',
        url: 'https://www.ece.uvic.ca/~fels/340/',
      },
      {
        title: 'Nand2Tetris',
        note: 'Construção de um computador do zero (gratuito)',
        url: 'https://www.nand2tetris.org/',
      },
    ],
  },
  {
    id: 'al',
    name: 'Álgebra Linear',
    professor: 'Prof. Daniel Akamatsu',
    course: 'Turma 11553.0001',
    color: '#8b5cf6',
    icon: Sigma,
    schedule: [
      { day: 'Segunda-feira', time: '07:00 - 08:30', room: 'Sala S403' },
      { day: 'Quarta-feira', time: '07:00 - 08:30', room: 'Sala S403' },
    ],
    structure: [
      { name: 'Apostila.pdf', type: 'file' },
      { name: 'Resumo.pdf', type: 'file' },
      { name: 'Mapa_Mental.pdf', type: 'file' },
      { name: 'Exercicios.pdf', type: 'file' },
      { name: 'Exercicios_Resolvidos.pdf', type: 'file' },
      { name: 'Simulados.pdf', type: 'file' },
      { name: 'Gabaritos.pdf', type: 'file' },
    ],
    topics: [
      {
        id: 'al-vetores',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Vetores no Plano e no Espaço',
        icon: '➡️',
        keywords: ['Produto escalar', 'Produto vetorial', 'Módulo', 'Ortogonalidade', 'Combinação'],
        videoaulas: [
          { title: 'Vectors - Essence of Linear Algebra (3Blue1Brown)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
          { title: 'Vetores (Prof. José Natal / IMPA)', url: yt('josé natal álgebra linear vetores') },
        ],
        revisoes: [
          { title: 'Resumo de vetores', note: 'Operações, produto escalar e vetorial' },
        ],
        exercicios: [
          { name: 'Lista 1 - Vetores', count: 10, icon: '➡️' },
        ],
      },
      {
        id: 'al-sistemas-lineares',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Sistemas Lineares e Matrizes',
        icon: '📐',
        keywords: ['Gauss', 'Escalonamento', 'Posto', 'Inversa', 'Matriz identidade'],
        videoaulas: [
          { title: 'Eliminação de Gauss (José Natal)', url: yt('eliminação de gauss álgebra linear josé natal') },
          { title: 'Matrizes e operações', url: yt('matrizes álgebra linear aula') },
        ],
        revisoes: [
          { title: 'Resumo de escalonamento', note: 'Forma escalonada, posto, inversa' },
        ],
        exercicios: [
          { name: 'Lista 2 - Sistemas Lineares', count: 10, icon: '📐' },
        ],
      },
      {
        id: 'al-espacos-vetoriais',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Espaços Vetoriais',
        icon: '🧠',
        keywords: ['Axiomas', 'Subespaços', 'Base', 'Dimensão', 'LI/LD'],
        videoaulas: [
          { title: 'Espaços vetoriais (José Natal)', url: yt('espaços vetoriais josé natal álgebra linear') },
          { title: 'Base e dimensão', url: yt('base e dimensão espaço vetorial') },
        ],
        revisoes: [
          { title: 'Resumo de subespaços', note: 'Combinação linear, base, dimensão' },
        ],
        exercicios: [
          { name: 'Lista 3 - Espaços Vetoriais', count: 8, icon: '🧠' },
        ],
      },
      {
        id: 'al-transformacoes',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Transformações Lineares',
        icon: '🔄',
        keywords: ['Núcleo', 'Imagem', 'Matriz associada', 'Linearidade', 'Injetora/Sobrejetora'],
        videoaulas: [
          { title: 'Transformações lineares (José Natal)', url: yt('transformações lineares josé natal') },
          { title: 'Matriz de uma transformação', url: yt('matriz de transformação linear') },
        ],
        revisoes: [
          { title: 'Resumo de transformações', note: 'Núcleo, imagem, matriz associada' },
        ],
        exercicios: [
          { name: 'Lista 4 - Transformações Lineares', count: 8, icon: '🔄' },
        ],
      },
      {
        id: 'al-determinantes',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Determinantes',
        icon: '🔢',
        keywords: ['Sarrus', 'Laplace', 'Propriedades', 'Singularidade', 'Inversibilidade'],
        videoaulas: [
          { title: 'Determinantes - Sarrus e Laplace', url: yt('determinantes regra de sarrus laplace') },
          { title: 'Propriedades dos determinantes', url: yt('propriedades dos determinantes') },
        ],
        revisoes: [
          { title: 'Resumo de determinantes', note: 'Sarrus, Laplace, propriedades' },
        ],
        exercicios: [
          { name: 'Lista 5 - Determinantes', count: 8, icon: '🔢' },
        ],
      },
      {
        id: 'al-autovalores',
        topicId: null,
        subject: 'Álgebra Linear',
        name: 'Autovalores e Autovetores',
        icon: '🔑',
        keywords: ['Polinômio característico', 'Autovetores', 'Diagonalização', 'Traço', 'Determinante'],
        videoaulas: [
          { title: 'Autovalores e autovetores (José Natal)', url: yt('autovalores e autovetores josé natal') },
          { title: 'Diagonalização de matrizes', url: yt('diagonalização de matrizes álgebra linear') },
        ],
        revisoes: [
          { title: 'Resumo de autovalores', note: 'Polinômio característico, diagonalização' },
        ],
        exercicios: [
          { name: 'Lista 6 - Autovalores e Diagonalização', count: 8, icon: '🔑' },
        ],
      },
    ],
    books: [
      {
        title: 'Álgebra Linear com Aplicações (Anton & Rorres)',
        note: 'Referência clássica para a disciplina',
      },
      {
        title: 'Álgebra Linear e suas Aplicações (David C. Lay)',
        note: 'Referência amplamente usada',
      },
      {
        title: 'Álgebra Linear (Boldrini, Costa, Figueiredo & Wetzler)',
        note: 'Referência em português da UNICAMP',
      },
      {
        title: 'MIT OpenCourseWare - 18.06 Linear Algebra',
        note: 'Curso completo gratuito do Prof. Strang',
        url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
      },
      {
        title: 'Álgebra Linear - Prof. Reginaldo Santos (UFMG)',
        note: 'Livro e material gratuitos',
        url: 'https://reginaldosantos.com.br/',
      },
    ],
  },
  {
    id: 'rl',
    name: 'Raciocínio Lógico',
    professor: 'Prof. a definir (verifique no Moodle)',
    course: 'Turma 20262 • Lógica e Argumentação',
    color: '#f97316',
    icon: Lightbulb,
    schedule: [],
    evaluation: [
      'Avaliações parciais',
      'Prova final',
      'Exercícios e simulados',
      'Aprovação conforme média do plano de ensino',
    ],
    structure: [
      { name: 'Apostila.pdf', type: 'file' },
      { name: 'Resumo.pdf', type: 'file' },
      { name: 'Mapa_Mental.pdf', type: 'file' },
      { name: 'Exercicios.pdf', type: 'file' },
      { name: 'Simulados', type: 'folder' },
      { name: 'Gabaritos.pdf', type: 'file' },
    ],
    topics: [
      {
        id: 'rl-proposicoes',
        topicId: 'rl_1',
        subject: 'Raciocínio Lógico',
        name: 'Proposições e Conectivos',
        icon: '🧠',
        keywords: ['Proposições', 'Conectivos', 'Negação', 'Conjunção', 'Disjunção', 'Condicional', 'Bicondicional'],
        videoaulas: [
          { title: 'Lógica proposicional - conceitos (Curso em Vídeo)', url: yt('lógica proposicional conceitos curso em vídeo') },
          { title: 'Conectivos lógicos e tabela verdade', url: yt('conectivos lógicos tabela verdade raciocínio lógico') },
        ],
        revisoes: [
          { title: 'Resumo de proposições', note: 'O que é proposição, valores lógicos V/F' },
          { title: 'Conectivos', note: 'e (∧), ou (∨), se...então (→), se e somente se (↔), não (¬)' },
        ],
        exercicios: [
          { name: 'Lista 1 - Proposições e Conectivos', count: 8, icon: '🧠' },
        ],
      },
      {
        id: 'rl-tabela-verdade',
        topicId: 'rl_2',
        subject: 'Raciocínio Lógico',
        name: 'Tabelas Verdade',
        icon: '📋',
        keywords: ['Tabela verdade', 'Verdade', 'Falso', 'Linhas', 'Valoração'],
        videoaulas: [
          { title: 'Tabela verdade passo a passo', url: yt('tabela verdade passo a passo raciocínio lógico') },
          { title: 'Tabela verdade com mais proposições', url: yt('tabela verdade 3 proposições raciocínio lógico') },
        ],
        revisoes: [
          { title: 'Construindo tabelas', note: 'Número de linhas = 2^n proposições' },
        ],
        exercicios: [
          { name: 'Lista 2 - Tabelas Verdade', count: 8, icon: '📋' },
        ],
      },
      {
        id: 'rl-equivalencias',
        topicId: 'rl_3',
        subject: 'Raciocínio Lógico',
        name: 'Equivalências Lógicas',
        icon: '⚖️',
        keywords: ['Equivalência', 'Leis de De Morgan', 'Contrapositiva', 'Dupla negação', 'Implicação'],
        videoaulas: [
          { title: 'Equivalências lógicas e Leis de De Morgan', url: yt('equivalências lógicas leis de de morgan raciocínio lógico') },
          { title: 'Contrapositiva e recíproca', url: yt('contrapositiva recíproca condicional lógica') },
        ],
        revisoes: [
          { title: 'De Morgan', note: '¬(A∧B) = ¬A∨¬B e ¬(A∨B) = ¬A∧¬B' },
          { title: 'Equivalências da condicional', note: 'A→B = ¬A∨B = ¬B→¬A (contrapositiva)' },
        ],
        exercicios: [
          { name: 'Lista 3 - Equivalências', count: 8, icon: '⚖️' },
        ],
      },
      {
        id: 'rl-argumentos',
        topicId: 'rl_4',
        subject: 'Raciocínio Lógico',
        name: 'Argumentos e Validade',
        icon: '🛡️',
        keywords: ['Argumento', 'Premissas', 'Conclusão', 'Válido', 'Inválido', 'Silogismo'],
        videoaulas: [
          { title: 'Argumentos válidos e inválidos', url: yt('argumentos válidos inválidos raciocínio lógico') },
          { title: 'Silogismos e regras de inferência', url: yt('silogismo regras de inferência lógica') },
        ],
        revisoes: [
          { title: 'Validade de argumentos', note: 'Argumento válido: conclusão segue das premissas' },
        ],
        exercicios: [
          { name: 'Lista 4 - Argumentos', count: 8, icon: '🛡️' },
        ],
      },
      {
        id: 'rl-quantificadores',
        topicId: 'rl_5',
        subject: 'Raciocínio Lógico',
        name: 'Quantificadores e Conjuntos',
        icon: '🔍',
        keywords: ['Quantificadores', 'Todo', 'Existe', 'Conjuntos', 'Pertinência'],
        videoaulas: [
          { title: 'Quantificadores: todo e existe', url: yt('quantificadores todo existe lógica') },
          { title: 'Operações com conjuntos', url: yt('operações com conjuntos união interseção diferença') },
        ],
        revisoes: [
          { title: 'Negação de quantificadores', note: '¬(∀x P) = ∃x ¬P' },
        ],
        exercicios: [
          { name: 'Lista 5 - Quantificadores e Conjuntos', count: 8, icon: '🔍' },
        ],
      },
      {
        id: 'rl-problemas',
        topicId: 'rl_6',
        subject: 'Raciocínio Lógico',
        name: 'Raciocínio Lógico em Problemas',
        icon: '🧩',
        keywords: ['Problemas de lógica', 'Sequências', 'Analogias', 'Verdades e mentiras'],
        videoaulas: [
          { title: 'Raciocínio lógico para concursos (IFG/IF)', url: yt('raciocínio lógico concursos questões resolvidas') },
          { title: 'Problemas de lógica: verdades e mentiras', url: yt('problemas de lógica verdades e mentiras') },
        ],
        revisoes: [
          { title: 'Estratégias de resolução', note: 'Ler com atenção, testar hipóteses, eliminar alternativas' },
        ],
        exercicios: [
          { name: 'Lista 6 - Problemas de Lógica', count: 8, icon: '🧩' },
        ],
      },
    ],
    books: [
      {
        title: 'Introdução à Lógica (Irving Copi)',
        note: 'Clássico sobre lógica e argumentação',
      },
      {
        title: 'Lógica para Computação (Sérgio C. Sampaio)',
        note: 'Foco em lógica proposicional e de predicados',
      },
      {
        title: 'Raciocínio Lógico (concursos IF)',
        note: 'Questões de lógica para provas de institutos federais',
      },
    ],
  },
];

const TOPIC_ID_TO_KEY = Object.fromEntries(
  materialsData.flatMap((d) => d.topics.map((t) => [t.topicId, t.id]))
);

const loadProgress = () => {
  try {
    return JSON.parse(localStorage.getItem('materialsProgress')) || {};
  } catch {
    return {};
  }
};

const toggleIndex = (arr, idx) =>
  arr.includes(idx) ? arr.filter((i) => i !== idx) : [...arr, idx];

const ScheduleBlock = ({ schedule }) => (
  <div className="materials-schedule">
    {schedule.map((slot, idx) => (
      <div className="materials-schedule-row" key={idx}>
        <span className="materials-schedule-day">
          <CalendarDays size={14} />
          {slot.day}
        </span>
        <span className="materials-schedule-time">
          <Clock size={14} />
          {slot.time}
        </span>
        <span className="materials-schedule-room">
          <MapPin size={14} />
          {slot.room}
        </span>
      </div>
    ))}
  </div>
);

const ExercisePractice = ({ topicInfo, onBack, onAnswer, localExercises }) => {
  const [exercises, setExercises] = useState(localExercises || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(!localExercises);
  const [error, setError] = useState(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    try {
      const res = await axios.get(`${API}/topics/${topicInfo.topicId}/exercises`);
      const list = res.data.exercises || [];
      setExercises(list);
      if (list.length === 0) setError('Nenhum exercício disponível para este tópico.');
    } catch (e) {
      console.error('Error loading exercises:', e);
      setError('Erro ao carregar exercícios. Verifique a conexão com o backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!localExercises) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicInfo.topicId]);

  const submitAnswer = () => {
    if (selectedAnswer === null || showResult) return;
    const ex = exercises[currentIndex];
    const isCorrect = selectedAnswer === ex.correct_answer;
    setShowResult(true);
    if (onAnswer) onAnswer(topicInfo.topicKey || topicInfo.topicId, isCorrect);
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      toast.success(`Você completou todos os ${exercises.length} exercícios!`);
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="materials-practice-card">
        <div className="materials-practice-loading">
          <RefreshCw size={28} className="materials-spin" />
          <p>Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="materials-practice-card">
        <div className="materials-practice-error">
          <p>{error}</p>
          <button className="materials-practice-btn" onClick={load}>
            Tentar novamente
          </button>
          <button className="materials-practice-btn secondary" onClick={onBack}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const ex = exercises[currentIndex];
  const progressPct = ((currentIndex + 1) / exercises.length) * 100;

  return (
    <div className="materials-practice">
      <div className="materials-practice-top">
        <button className="materials-practice-back" onClick={onBack}>
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          Voltar
        </button>
        <div className="materials-practice-title-block">
          <h3>{topicInfo.name}</h3>
          <span>{topicInfo.subject} • {currentIndex + 1} de {exercises.length}</span>
        </div>
        <div className="materials-practice-bar">
          <div className="materials-practice-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="materials-practice-question">
        <div className="materials-practice-number">{currentIndex + 1}</div>
        <p className="materials-practice-text">{ex.question}</p>

        <div className="materials-practice-options">
          {ex.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = showResult && index === ex.correct_answer;
            const isWrong = showResult && isSelected && !isCorrect;
            let cls = 'materials-practice-option';
            if (showResult && isCorrect) cls += ' correct';
            if (isWrong) cls += ' wrong';
            else if (isSelected && !showResult) cls += ' selected';
            return (
              <button
                key={index}
                className={cls}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
              >
                <span className="materials-practice-option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="materials-practice-option-text">{option}</span>
                {showResult && isCorrect && <CheckCircle2 size={18} className="ok" />}
                {isWrong && <X size={18} className="no" />}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`materials-practice-result ${selectedAnswer === ex.correct_answer ? 'correct' : 'wrong'}`}>
            <h4>{selectedAnswer === ex.correct_answer ? '✅ Correto!' : '❌ Incorreto'}</h4>
            <p>{ex.explanation}</p>
          </div>
        )}

        <div className="materials-practice-actions">
          {!showResult ? (
            <button className="materials-practice-btn" onClick={submitAnswer} disabled={selectedAnswer === null}>
              Enviar Resposta
            </button>
          ) : (
            <button className="materials-practice-btn" onClick={nextExercise}>
              {currentIndex < exercises.length - 1 ? 'Próximo Exercício' : 'Concluir'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DoubtBotModal = ({ topic, onClose }) => {
  const [screenshot, setScreenshot] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const captureScreen = async () => {
    try {
      setError(null);
      setAnswer('');
      toast.info('Capturando a tela do tópico...');
      const canvas = await html2canvas(document.body, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#0B1220',
        logging: false,
        onclone: (doc) => {
          doc.querySelectorAll('.materials-doubt-bot, .materials-doubt-fab').forEach((el) => el.remove());
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshot(dataUrl);
      toast.success('Tela capturada! Agora escreva sua dúvida.');
    } catch (e) {
      console.error('Error capturing screen:', e);
      setError('Não foi possível capturar a tela: ' + e.message);
    }
  };

  const askDoubt = async () => {
    if (!question.trim()) {
      toast.warning('Escreva sua dúvida primeiro.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnswer('');
    try {
      const formData = new FormData();
      const system_prompt = `Você é um professor de ${topic?.subject || 'programação'} no IFG Jataí.
O aluno está estudando o tópico "${topic?.name || ''}" e enviou um PRINT da tela.
Analise o print, identifique onde o aluno está errando ou com dúvida, e:
1. Explique o erro/confusão de forma clara e didática
2. Mostre o passo a passo correto
3. Dê um exemplo prático
4. Responda de forma amigável e encorajadora
Contexto do tópico: ${topic?.keywords?.join(', ') || ''}`;
      formData.append('system_prompt', system_prompt);
      formData.append('message', `Minha dúvida sobre "${topic?.name}": ${question}`);
      formData.append('provider', 'auto');

      if (screenshot) {
        const byteString = atob(screenshot.split(',')[1]);
        const mimeString = screenshot.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: mimeString });
        formData.append('image', blob, 'print-duvida.png');
      }

      const res = await axios.post(`${BACKEND_URL}/api/chat/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnswer(
        res.data?.assistant_message?.content ||
          res.data?.response ||
          'Não consegui processar sua dúvida. Tente novamente.'
      );
    } catch (e) {
      console.error('Error asking doubt:', e);
      const detail =
        typeof e.response?.data?.detail === 'string'
          ? e.response.data.detail
          : (e.response?.data?.detail && e.response.data.detail.message) || null;
      setError(
        detail ||
          'O robô de dúvidas não conseguiu responder agora. Verifique se há uma chave de IA configurada (Configurar API Keys).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="materials-doubt-overlay" onClick={onClose}>
      <div className="materials-doubt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="materials-doubt-header">
          <div className="materials-doubt-title-block">
            <MessageCircleQuestion size={20} />
            <h3>Robô de Dúvidas - {topic?.name}</h3>
          </div>
          <button className="materials-doubt-close" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="materials-doubt-body">
          <div className="materials-doubt-actions">
            <button className="materials-doubt-btn" onClick={captureScreen} disabled={isLoading}>
              <Download size={16} />
              {screenshot ? 'Recapturar tela' : '📸 Capturar print da videoaula'}
            </button>
            {screenshot && (
              <img src={screenshot} alt="Print capturado" className="materials-doubt-screenshot" />
            )}
          </div>

          <textarea
            className="materials-doubt-input"
            placeholder="Ex: não entendi por que nesta parte o ponteiro é passado por referência e em outra não..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            disabled={isLoading}
          />

          <button className="materials-doubt-btn primary" onClick={askDoubt} disabled={isLoading || !question.trim()}>
            {isLoading ? <Loader2 size={16} className="materials-spin" /> : <Sparkles size={16} />}
            {isLoading ? 'Analisando...' : 'Tirar dúvida'}
          </button>

          {error && <div className="materials-doubt-error">{error}</div>}

          {answer && (
            <div className="materials-doubt-answer">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudyMaterials = () => {
  const [activeTab, setActiveTab] = useState('topics');
  const [openDiscipline, setOpenDiscipline] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [progress, setProgress] = useState(loadProgress);
  const [practicing, setPracticing] = useState(null);
  const [takingAssessment, setTakingAssessment] = useState(null);
  const [backendTopics, setBackendTopics] = useState(null);
  const [grades, setGrades] = useState(loadGrades);
  const [mindMapTopic, setMindMapTopic] = useState(null);
  const [doubtTopic, setDoubtTopic] = useState(null);
  const [generatingTopic, setGeneratingTopic] = useState(null);

  const generateExercises = async (topic, discipline) => {
    // Local/offline fallback: generate exercises from topic data without backend
    const generateLocalExercises = (topic, discipline) => {
      const keywords = topic.keywords || [];
      const videoTitles = topic.videoaulas?.map(v => v.title) || [];
      const reviewTitles = topic.revisoes?.map(r => r.title) || [];
      const exTitles = topic.exercicios?.map(e => e.name) || [];
      
      const templates = [
        {
          question: `Qual das seguintes alternativas melhor descreve o conceito principal de "${topic.name}"?`,
          options: [
            `Um conceito avançado sem aplicação prática`,
            `Um tema fundamental que envolve ${keywords.slice(0, 3).join(', ') || 'conceitos-chave da disciplina'}`,
            `Um tópico isolado sem relação com outras matérias`,
            `Uma revisão de conteúdo básico do ensino médio`
          ],
          correct_answer: 1,
          explanation: `O tópico "${topic.name}" aborda ${keywords.slice(0, 3).join(', ') || 'conceitos essenciais da disciplina'}. É um tema central para a compreensão da ${discipline.name}.`,
          difficulty: 'Fácil',
          topic: topic.name
        },
        {
          question: `Ao estudar "${topic.name}", qual das seguintes habilidades é mais importante desenvolver?`,
          options: [
            `Memorização de fórmulas sem entendimento`,
            `Capacidade de aplicar ${keywords[0] || 'conceitos fundamentais'} na resolução de problemas`,
            `Leitura rápida sem anotações`,
            `Foco apenas na teoria sem prática`
          ],
          correct_answer: 1,
          explanation: `O estudo de "${topic.name}" exige a aplicação prática de ${keywords[0] || 'conceitos fundamentais'}. A resolução de exercícios (${exTitles.join(', ') || 'listas de exercícios'}) é essencial para consolidar o aprendizado.`,
          difficulty: 'Médio',
          topic: topic.name
        },
        {
          question: `Qual das videoaulas abaixo seria mais relevante para entender "${topic.name}"?`,
          options: [
            videoTitles[0] || `Introdução a ${topic.name}`,
            `História da ${discipline.name} no Brasil`,
            `Carreiras em ${discipline.name}`,
            `Ferramentas de produtividade para estudantes`
          ],
          correct_answer: 0,
          explanation: `A videoaula "${videoTitles[0] || 'Introdução ao tópico'}" aborda diretamente os conceitos de "${topic.name}". Assista também às revisões: ${reviewTitles.slice(0, 2).join(' e ') || 'revisões disponíveis'}.`,
          difficulty: 'Fácil',
          topic: topic.name
        },
        {
          question: `Para se preparar para a avaliação de "${topic.name}", qual estratégia é mais eficaz?`,
          options: [
            `Estudar apenas na véspera da prova`,
            `Resolver exercícios das listas: ${exTitles.slice(0, 2).join(' e ') || 'exercícios disponíveis'} e revisar ${reviewTitles[0] || 'as revisões'}`,
            `Ler apenas o resumo sem praticar`,
            `Copiar anotações de colegas sem entender`
          ],
          correct_answer: 1,
          explanation: `A melhor preparação combina prática ativa (resolução de exercícios) com revisão teórica. As listas de exercícios (${exTitles.join(', ') || 'disponíveis na plataforma'}) cobrem os principais tipos de questões.`,
          difficulty: 'Médio',
          topic: topic.name
        },
        {
          question: `Qual conceito-chave de "${topic.name}" está frequentemente presente nas provas do IFG Jataí?`,
          options: [
            `${keywords[0] || 'Conceito fundamental do tópico'}`,
            `História da instituição`,
            `Datas de feriados acadêmicos`,
            `Regimento interno do campus`
          ],
          correct_answer: 0,
          explanation: `As provas do IFG Jataí focam nos conceitos técnicos. "${keywords[0] || 'O conceito principal'}" é um dos tópicos mais cobrados em "${topic.name}". Revise também: ${keywords.slice(1, 3).join(', ') || 'outros conceitos do tópico'}.`,
          difficulty: 'Médio',
          topic: topic.name
        }
      ];

      return templates.slice(0, 5).map((t, i) => ({
        ...t,
        correct_answer: t.correct_answer,
        options: t.options,
        explanation: `${t.explanation}\n\n💡 Dica: Pratique com as listas de exercícios (${exTitles.join(', ') || 'disponíveis'}) e assista às videoaulas (${videoTitles.slice(0, 2).join(', ') || 'disponíveis'}).`,
        generated: true,
        source: `Gerado localmente a partir dos dados do tópico "${topic.name}"`
      }));
    };

    setGeneratingTopic(topic.id);
    
    // First try local generation (works offline)
    const localExercises = generateLocalExercises(topic, discipline);
    const key = `generated_${topic.id}`;
    const merged = [...(JSON.parse(localStorage.getItem(key) || '[]')), ...localExercises];
    localStorage.setItem(key, JSON.stringify(merged));
    
    toast.success(`${localExercises.length} exercícios gerados localmente! (funciona offline)`);
    setPracticing({
      topicId: null,
      topicKey: topic.id,
      name: `${topic.name} (Gerado localmente)`,
      subject: topic.subject,
      localExercises: merged,
    });
    setActiveTab('exercises');
    setGeneratingTopic(null);
    return;

    // Backend generation (requires API key) - commented out for offline use
    // if (!BACKEND_URL) {
    //   toast.error('Backend não configurado.');
    //   return;
    // }
    // try {
    //   const matched = findSimuladoForTopic(topic, discipline);
    //   if (matched) {
    //     // ... existing simulado code
    //   }
    //   // ... existing backend API call code
    // } catch (e) {
    //   // fallback to local
    // }
  };

  useEffect(() => {
    try {
      localStorage.setItem('materialsProgress', JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem('materialsGrades', JSON.stringify(grades));
    } catch (e) {
      console.error('Error saving grades:', e);
    }
  }, [grades]);

  const setGrade = (disciplineId, partId, value) => {
    setGrades((prev) => ({
      ...prev,
      [disciplineId]: { ...(prev[disciplineId] || {}), [partId]: value },
    }));
  };

  useEffect(() => {
    if (!BACKEND_URL) return;
    axios
      .get(`${API}/topics`)
      .then((res) => setBackendTopics(res.data))
      .catch(() => setBackendTopics(null));
  }, []);

  const updateTopicProgress = (topicId, patch) => {
    setProgress((prev) => ({
      ...prev,
      [topicId]: { ...(prev[topicId] || {}), ...patch },
    }));
  };

  const toggleVideo = (topicId, idx) => {
    const done = progress[topicId]?.videos || [];
    updateTopicProgress(topicId, { videos: toggleIndex(done, idx) });
  };

  const toggleReview = (topicId, idx) => {
    const done = progress[topicId]?.reviews || [];
    updateTopicProgress(topicId, { reviews: toggleIndex(done, idx) });
  };

  const toggleTopicDone = (topicId) => {
    updateTopicProgress(topicId, { done: !(progress[topicId]?.done || false) });
  };

  const recordAnswer = (topicId, isCorrect) => {
    const p = progress[topicId] || {};
    updateTopicProgress(topicId, {
      attempts: (p.attempts || 0) + 1,
      correct: (p.correct || 0) + (isCorrect ? 1 : 0),
    });
  };

  const startPractice = (topic) => {
    if (!topic.topicId) {
      toast.info('Exercícios deste tópico estarão disponíveis em breve.');
      return;
    }
    setPracticing({ topicId: topic.topicId, topicKey: topic.id, name: topic.name, subject: topic.subject });
    setActiveTab('exercises');
  };

  const startVideoPractice = (topic, videoIdx) => {
    const list = VIDEO_EXERCISES[`${topic.id}:${videoIdx}`];
    if (!list || list.length === 0) {
      toast.info('Exercícios desta videoaula estarão disponíveis em breve.');
      return;
    }
    setPracticing({
      topicId: null,
      topicKey: topic.id,
      name: `${topic.name} - ${topic.videoaulas[videoIdx].title}`,
      subject: topic.subject,
      localExercises: list,
    });
    setActiveTab('exercises');
  };

  const getTopicStats = (topic) => {
    const p = progress[topic.id] || {};
    return {
      videos: p.videos || [],
      reviews: p.reviews || [],
      done: !!p.done,
      attempts: p.attempts || 0,
      correct: p.correct || 0,
    };
  };

  const getDisciplineStats = (discipline) => {
    let totalVideos = 0;
    let watchedVideos = 0;
    let totalReviews = 0;
    let doneReviews = 0;
    let topicsDone = 0;
    let attempts = 0;
    let correct = 0;
    discipline.topics.forEach((topic) => {
      const s = getTopicStats(topic);
      totalVideos += topic.videoaulas.length;
      watchedVideos += s.videos.length;
      totalReviews += topic.revisoes.length;
      doneReviews += s.reviews.length;
      if (s.done) topicsDone += 1;
      attempts += s.attempts;
      correct += s.correct;
    });
    return {
      totalVideos,
      watchedVideos,
      totalReviews,
      doneReviews,
      topicsDone,
      totalTopics: discipline.topics.length,
      attempts,
      correct,
    };
  };

  const overall = materialsData.reduce(
    (acc, d) => {
      const s = getDisciplineStats(d);
      acc.videos += s.watchedVideos;
      acc.totalVideos += s.totalVideos;
      acc.reviews += s.doneReviews;
      acc.totalReviews += s.totalReviews;
      acc.done += s.topicsDone;
      acc.totalTopics += s.totalTopics;
      acc.attempts += s.attempts;
      acc.correct += s.correct;
      return acc;
    },
    { videos: 0, totalVideos: 0, reviews: 0, totalReviews: 0, done: 0, totalTopics: 0, attempts: 0, correct: 0 }
  );

  const accuracyData = useMemo(() => {
    return materialsData.flatMap((discipline) =>
      discipline.topics
        .filter((topic) => {
          const p = progress[topic.id] || {};
          return (p.attempts || 0) > 0;
        })
        .map((topic) => {
          const p = progress[topic.id] || {};
          const correct = p.correct || 0;
          const attempts = p.attempts || 0;
          return {
            name: topic.name.length > 24 ? `${topic.name.slice(0, 23)}…` : topic.name,
            fullName: topic.name,
            discipline: discipline.name,
            acertos: correct,
            erros: attempts - correct,
            attempts,
            pct: Math.round((correct / attempts) * 100),
          };
        })
    );
  }, [progress]);

  const improvementData = useMemo(() => {
    return materialsData.flatMap((discipline) =>
      discipline.topics.map((topic) => {
        const p = progress[topic.id] || {};
        const attempts = p.attempts || 0;
        const correct = p.correct || 0;
        const pct = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
        return { topic, discipline: discipline.name, attempts, correct, pct };
      })
    );
  }, [progress]);

  const needsImprovement = useMemo(() => {
    const withData = improvementData.filter((i) => i.attempts > 0 && i.pct < 70);
    const withoutData = improvementData.filter((i) => i.attempts === 0);
    return [...withData.sort((a, b) => a.pct - b.pct), ...withoutData];
  }, [improvementData]);

  const CHART_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];

  return (
    <div className="materials-page-wrapper">
      <div className="materials-page">
        <div className="materials-header">
          <div className="materials-header-icon">
            <Library size={40} />
          </div>
          <div className="materials-header-text">
            <div className="materials-header-badge">IFG - Câmpus Jataí/GO</div>
            <h1 className="materials-title">Materiais de Estudo</h1>
            <p className="materials-subtitle">
              Tópicos, videoaulas, revisões e exercícios por disciplina
            </p>
          </div>
        </div>

        <div className="schedule-tabs">
          <button
            onClick={() => setActiveTab('topics')}
            className={`schedule-tab ${activeTab === 'topics' ? 'active' : ''}`}
          >
            <Target size={18} />
            Tópicos
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`schedule-tab ${activeTab === 'exercises' ? 'active' : ''}`}
          >
            <ListChecks size={18} />
            Exercícios
          </button>
          <button
            onClick={() => setActiveTab('avaliacoes')}
            className={`schedule-tab ${activeTab === 'avaliacoes' ? 'active' : ''}`}
          >
            <Calculator size={18} />
            Avaliações
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`schedule-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`schedule-tab ${activeTab === 'daily' ? 'active' : ''}`}
          >
            <CalendarDays size={18} />
            Cronograma Diário
          </button>
        </div>

        <div className="materials-content">
          {activeTab === 'daily' && <DailySchedule />}
          {activeTab === 'topics' && (
            <div className="materials-grid">
              {materialsData.map((discipline) => {
                const DisciplineIcon = discipline.icon;
                const isOpen = openDiscipline === discipline.id;
                const dStats = getDisciplineStats(discipline);

                return (
                  <div
                    key={discipline.id}
                    className={`materials-card ${isOpen ? 'open' : ''}`}
                    style={{ borderTopColor: discipline.color }}
                  >
                    <button
                      className="materials-card-header"
                      onClick={() => setOpenDiscipline(isOpen ? null : discipline.id)}
                    >
                      <div className="materials-card-title-row">
                        <div className="materials-card-icon" style={{ background: `${discipline.color}22`, color: discipline.color }}>
                          <DisciplineIcon size={26} />
                        </div>
                        <div className="materials-card-title-block">
                          <h2 className="materials-card-title">{discipline.name}</h2>
                          <span className="materials-card-professor">{discipline.professor}</span>
                          <span className="materials-card-course">{discipline.course}</span>
                        </div>
                      </div>
                      <div className="materials-card-header-right">
                        <span className="materials-progress-chip">
                          {dStats.topicsDone}/{dStats.totalTopics} tópicos
                        </span>
                        {isOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="materials-card-body">
                        <section className="materials-section">
                          <h3 className="materials-section-title">
                            <CalendarDays size={18} />
                            Horários das Aulas
                          </h3>
                          <ScheduleBlock schedule={discipline.schedule} />
                        </section>

                        <section className="materials-section">
                          <h3 className="materials-section-title">
                            <Target size={18} />
                            Tópicos - Videoaulas, Revisões e Exercícios
                          </h3>
                          <div className="materials-topics-list">
                            {discipline.topics.map((topic) => {
                              const stats = getTopicStats(topic);
                              const isTopicOpen = openTopic === topic.id;
                              const videosTotal = topic.videoaulas.length;
                              const reviewsTotal = topic.revisoes.length;
                              const exTotal = topic.exercicios.reduce((s, e) => s + e.count, 0);

                              return (
                                <div className={`materials-topic ${stats.done ? 'done' : ''}`} key={topic.id}>
                                  <button
                                    className="materials-topic-header"
                                    onClick={() => setOpenTopic(isTopicOpen ? null : topic.id)}
                                  >
                                    <span className="materials-topic-icon">{topic.icon}</span>
                                    <span className="materials-topic-title-block">
                                      <span className="materials-topic-name">{topic.name}</span>
                                      <span className="materials-topic-meta">
                                        {videosTotal} videoaulas • {reviewsTotal} revisões • {exTotal} questões
                                      </span>
                                    </span>
                                    <span className="materials-topic-status" onClick={(e) => { e.stopPropagation(); toggleTopicDone(topic.id); }} title={stats.done ? 'Marcar como pendente' : 'Marcar como concluído'}>
                                      {stats.done ? <CheckCircle2 size={18} className="ok" /> : <Circle size={18} />}
                                    </span>
                                    <span
                                      className="materials-topic-mindmap"
                                      onClick={(e) => { e.stopPropagation(); setMindMapTopic(topic); }}
                                      title="Criar mapa mental deste tópico"
                                    >
                                      <Brain size={17} />
                                    </span>
                                    <span
                                      className="materials-topic-mindmap doubt"
                                      onClick={(e) => { e.stopPropagation(); setDoubtTopic(topic); }}
                                      title="Robô de dúvidas - tire dúvida com print da videoaula"
                                    >
                                      <MessageCircleQuestion size={17} />
                                    </span>
                                    {isTopicOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>

                                  {isTopicOpen && (
                                    <div className="materials-topic-body">
                                      {topic.videoaulas.length > 0 && (
                                        <div className="materials-topic-block">
                                          <h5 className="materials-topic-block-title">
                                            <PlayCircle size={16} />
                                            Videoaulas
                                            <span className="materials-topic-count">{stats.videos.length}/{videosTotal}</span>
                                          </h5>
                                          <ul className="materials-topic-links">
                                            {topic.videoaulas.map((video, idx) => {
                                              const watched = stats.videos.includes(idx);
                                              const videoEx = VIDEO_EXERCISES[`${topic.id}:${idx}`];
                                              const exCount = videoEx ? videoEx.length : 0;
                                              return (
                                                <li key={idx} className="materials-topic-link-row">
                                                  <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`materials-topic-link ${watched ? 'done' : ''}`}
                                                    onClick={() => toggleVideo(topic.id, idx)}
                                                  >
                                                    <span className="materials-topic-link-title">{video.title}</span>
                                                    {watched ? <CheckCircle2 size={14} className="ok" /> : <ArrowUpRight size={14} />}
                                                  </a>
                                                  {exCount > 0 && (
                                                    <button
                                                      className="materials-video-ex-btn"
                                                      onClick={() => startVideoPractice(topic, idx)}
                                                      title={`${exCount} exercícios sobre "${video.title}"`}
                                                    >
                                                      <PenLine size={13} />
                                                      {exCount} ex.
                                                    </button>
                                                  )}
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}

                                      {topic.revisoes.length > 0 && (
                                        <div className="materials-topic-block">
                                          <h5 className="materials-topic-block-title">
                                            <RefreshCw size={16} />
                                            Revisões
                                            <span className="materials-topic-count">{stats.reviews.length}/{reviewsTotal}</span>
                                          </h5>
                                          <ul className="materials-topic-links">
                                            {topic.revisoes.map((review, idx) => {
                                              const done = stats.reviews.includes(idx);
                                              return (
                                                <li key={idx}>
                                                  <button
                                                    className={`materials-topic-link materials-topic-link-btn ${done ? 'done' : ''}`}
                                                    onClick={() => toggleReview(topic.id, idx)}
                                                  >
                                                    <span>
                                                      <span className="materials-topic-link-title">{review.title}</span>
                                                      <span className="materials-topic-link-note">
                                                        {review.week ? <span className="materials-review-week">Semana {review.week}</span> : null}
                                                        {review.note}
                                                      </span>
                                                    </span>
                                                    {done ? <CheckCircle2 size={14} className="ok" /> : <BookOpenCheck size={14} />}
                                                  </button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}

                                      {topic.exercicios.length > 0 && (
                                        <div className="materials-topic-block">
                                          <h5 className="materials-topic-block-title">
                                            <ListChecks size={16} />
                                            Exercícios - IFG Jataí
                                            {stats.attempts > 0 && (
                                              <span className="materials-topic-count">
                                                {stats.correct}/{stats.attempts} acertos
                                              </span>
                                            )}
                                          </h5>
                                          <div className="materials-exercise-grid">
                                            {topic.exercicios.map((ex, idx) => (
                                              <button
                                                className="materials-exercise-btn"
                                                key={idx}
                                                onClick={() => startPractice(topic)}
                                              >
                                                <span className="materials-exercise-icon">{ex.icon}</span>
                                                <span className="materials-exercise-info">
                                                  <span className="materials-exercise-title">{ex.name}</span>
                                                  <span className="materials-exercise-meta">{ex.count} questões • IFG Jataí</span>
                                                </span>
                                                <span className="materials-exercise-action">Praticar</span>
                                              </button>
                                            ))}
                                            <button
                                              className="materials-generate-btn"
                                              onClick={() => generateExercises(topic, discipline)}
                                              disabled={generatingTopic === topic.id}
                                            >
                                              {generatingTopic === topic.id ? (
                                                <>
                                                  <Loader2 size={15} className="materials-spin" />
                                                  Gerando com IA...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles size={15} />
                                                  Gerar Exercícios Automaticamente
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        {discipline.evaluation && (
                          <section className="materials-section">
                            <h3 className="materials-section-title">
                              <ClipboardList size={18} />
                              Avaliação
                            </h3>
                            <ul className="materials-units materials-evaluation">
                              {discipline.evaluation.map((rule, idx) => (
                                <li key={idx}>{rule}</li>
                              ))}
                            </ul>
                          </section>
                        )}

                        <section className="materials-section">
                          <h3 className="materials-section-title">
                            <GraduationCap size={18} />
                            Estrutura de Materiais
                          </h3>
                          <div className="materials-folder">
                            {discipline.structure.map((item, idx) => (
                              <div
                                key={idx}
                                className={`materials-file ${item.type === 'folder' ? 'folder' : ''}`}
                              >
                                {item.type === 'folder' ? (
                                  <Folder size={16} />
                                ) : (
                                  <FileText size={16} />
                                )}
                                <span>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="materials-section">
                          <h3 className="materials-section-title">
                            <BookOpen size={18} />
                            Livros e Referências
                          </h3>
                          <ul className="materials-links">
                            {discipline.books.map((book, idx) => (
                              <li key={idx}>
                                {book.url ? (
                                  <a href={book.url} target="_blank" rel="noopener noreferrer" className="materials-link">
                                    <span>
                                      <span className="materials-link-title">{book.title}</span>
                                      <span className="materials-link-note">{book.note}</span>
                                    </span>
                                    <ArrowUpRight size={16} />
                                  </a>
                                ) : (
                                  <span className="materials-link materials-link-plain">
                                    <span>
                                      <span className="materials-link-title">{book.title}</span>
                                      <span className="materials-link-note">{book.note}</span>
                                    </span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'exercises' && (
            practicing ? (
              <ExercisePractice
                topicInfo={practicing}
                onBack={() => setPracticing(null)}
                onAnswer={recordAnswer}
                localExercises={practicing.localExercises}
              />
            ) : (
              <div className="materials-exercise-browse">
                <div className="materials-exercise-browse-header">
                  <h2>Escolha um Tópico para Praticar</h2>
                  <p>Os exercícios são os mesmos da plataforma de Exercícios (IFG Jataí)</p>
                </div>
                {!backendTopics ? (
                  <div className="materials-practice-error">
                    <p>Não foi possível carregar os tópicos do backend.</p>
                  </div>
                ) : (
                  <div className="materials-exercise-browse-grid">
                    {Object.entries(backendTopics)
                      .filter(([, data]) => ['Estrutura de Dados', 'Sistemas Digitais'].includes(data.name))
                      .map(([key, data]) => (
                        <div className="materials-exercise-subject" key={key}>
                          <h3>{data.name}</h3>
                          <div className="materials-exercise-subject-topics">
                            {data.topics.map((topic) => (
                              <button
                                key={topic.id}
                                className="materials-exercise-browse-btn"
                                onClick={() => startPractice({ topicId: topic.id, topicKey: TOPIC_ID_TO_KEY[topic.id] || topic.id, name: topic.name, subject: data.name })}
                              >
                                <span className="materials-exercise-browse-name">{topic.name}</span>
                                <span className="materials-exercise-browse-count">{topic.exercises_count} ex.</span>
                                <ChevronRight size={16} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'avaliacoes' && (
            takingAssessment ? (
              <AssessmentPractice
                assessment={takingAssessment.assessment}
                disciplineName={takingAssessment.disciplineName}
                onBack={() => setTakingAssessment(null)}
                onRegister={(score) => setGrade(takingAssessment.disciplineId, takingAssessment.partId, Math.max(0, Math.min(10, score)))}
              />
            ) : (
            <div className="materials-avaliacoes">
              <div className="materials-avaliacoes-header">
                <Calculator size={24} />
                <div>
                  <h2>Mecanismos de Avaliação</h2>
                  <p>Calcule sua média em cada disciplina conforme o plano de ensino (mínimo {EVALUATION_MODELS.ed.pass.toFixed(1).replace('.', ',')} para aprovação)</p>
                </div>
              </div>
              <div className="materials-avaliacoes-grid">
                {materialsData.map((discipline) => {
                  const model = EVALUATION_MODELS[discipline.id];
                  if (!model) return null;
                  const dGrades = grades[discipline.id] || {};
                  const result = model.compute(dGrades);
                  const media = result.media;
                  const isPass = media != null && media >= model.pass;
                  return (
                    <div
                      className={`materials-avaliacao-card ${media != null ? (isPass ? 'pass' : 'fail') : ''}`}
                      key={discipline.id}
                      style={{ borderTopColor: discipline.color }}
                    >
                      <div className="materials-avaliacao-head">
                        <span className="materials-avaliacao-icon" style={{ background: `${discipline.color}22`, color: discipline.color }}>
                          {discipline.icon === Cpu ? <Cpu size={22} /> : discipline.icon === Brain ? <Brain size={22} /> : discipline.icon === Lightbulb ? <Lightbulb size={22} /> : <Sigma size={22} />}
                        </span>
                        <div>
                          <h3>{model.title}</h3>
                          <p className="materials-avaliacao-formula">{model.formula}</p>
                        </div>
                      </div>

                      <div className="materials-avaliacao-parts">
                        {model.parts.map((part) => {
                          const assessment = getAvaliacaoByPart(discipline.id, part.id);
                          return (
                          <div className="materials-avaliacao-part" key={part.id}>
                            <label htmlFor={`grade-${discipline.id}-${part.id}`}>{part.label}</label>
                            <div className="materials-avaliacao-input-row">
                            <input
                              id={`grade-${discipline.id}-${part.id}`}
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              placeholder="0,0"
                              value={dGrades[part.id] ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setGrade(discipline.id, part.id, v === '' ? null : Math.max(0, Math.min(10, Number(v))));
                              }}
                            />
                            {assessment && (
                              <button
                                className="materials-avaliacao-do"
                                onClick={() =>
                                  setTakingAssessment({
                                    disciplineId: discipline.id,
                                    partId: part.id,
                                    disciplineName: model.title,
                                    assessment,
                                  })
                                }
                              >
                                <PenLine size={14} />
                                Fazer avaliação
                              </button>
                            )}
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      <div className="materials-avaliacao-result">
                        {model.mb1 != null && (
                          <div className="materials-avaliacao-sub">
                            <span>MB1</span>
                            <b>{result.mb1?.toFixed(1).replace('.', ',')}</b>
                          </div>
                        )}
                        {model.mb2 != null && (
                          <div className="materials-avaliacao-sub">
                            <span>MB2</span>
                            <b>{result.mb2?.toFixed(1).replace('.', ',')}</b>
                          </div>
                        )}
                        <div className="materials-avaliacao-media">
                          <span>Média</span>
                          {media != null ? (
                            <b className={isPass ? 'ok' : 'no'}>{media.toFixed(1).replace('.', ',')}</b>
                          ) : (
                            <b className="dim">—</b>
                          )}
                          <span className={`materials-avaliacao-status ${media != null ? (isPass ? 'pass' : 'fail') : ''}`}>
                            {media == null ? 'Preencha as notas' : isPass ? 'APROVADO' : 'REPROVADO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )
          )}

          {activeTab === 'dashboard' && (
            <div className="materials-dashboard">
              <div className="materials-dashboard-stats">
                <div className="materials-dashboard-stat">
                  <Trophy size={20} />
                  <span className="materials-dashboard-stat-value">{overall.done}/{overall.totalTopics}</span>
                  <span className="materials-dashboard-stat-label">Tópicos concluídos</span>
                </div>
                <div className="materials-dashboard-stat">
                  <PlayCircle size={20} />
                  <span className="materials-dashboard-stat-value">{overall.videos}/{overall.totalVideos}</span>
                  <span className="materials-dashboard-stat-label">Videoaulas assistidas</span>
                </div>
                <div className="materials-dashboard-stat">
                  <RefreshCw size={20} />
                  <span className="materials-dashboard-stat-value">{overall.reviews}/{overall.totalReviews}</span>
                  <span className="materials-dashboard-stat-label">Revisões concluídas</span>
                </div>
                <div className="materials-dashboard-stat">
                  <ListChecks size={20} />
                  <span className="materials-dashboard-stat-value">
                    {overall.attempts > 0 ? `${Math.round((overall.correct / overall.attempts) * 100)}%` : '—'}
                  </span>
                  <span className="materials-dashboard-stat-label">{overall.correct}/{overall.attempts} acertos em exercícios</span>
                </div>
              </div>

              <div className="materials-dashboard-charts">
                <div className="materials-chart-card">
                  <h3>Acertos vs Erros por Tópico</h3>
                  <p>Desempenho nos exercícios (plataforma IFG Jataí + videoaulas)</p>
                  {accuracyData.length === 0 ? (
                    <div className="materials-chart-empty">
                      <Lightbulb size={22} />
                      <p>Pratique exercícios nos tópicos para ver seu desempenho aqui.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={accuracyData} barSize={22}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip
                          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
                          labelStyle={{ color: '#e2e8f0' }}
                          formatter={(value, name) => [value, name === 'acertos' ? 'Acertos' : 'Erros']}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="acertos" stackId="a" fill="#10b981" />
                        <Bar dataKey="erros" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="materials-chart-card">
                  <h3>Taxa de Acerto por Tópico</h3>
                  <p>Percentual de acertos nos exercícios</p>
                  {accuracyData.length === 0 ? (
                    <div className="materials-chart-empty">
                      <Lightbulb size={22} />
                      <p>Sem dados ainda. Responda exercícios para gerar o gráfico.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={accuracyData}
                          dataKey="pct"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={(entry) => `${entry.pct}%`}
                          labelLine={false}
                          fontSize={11}
                        >
                          {accuracyData.map((entry, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
                          labelStyle={{ color: '#e2e8f0' }}
                          formatter={(value, name, item) => [`${value}% de acerto`, item.payload.fullName]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="materials-chart-card materials-improve-card">
                <h3 className="materials-improve-title">
                  <TrendingDown size={18} />
                  Conteúdo que precisa melhorar
                </h3>
                <p>Menos de 70% de acerto ou ainda não praticado - foque nestes tópicos</p>
                {needsImprovement.length === 0 ? (
                  <div className="materials-chart-empty">
                    <Lightbulb size={22} />
                    <p>Todos os tópicos estão com bom desempenho (70%+). Continue assim!</p>
                  </div>
                ) : (
                  <ul className="materials-improve-list">
                    {needsImprovement.map((item, idx) => (
                      <li className="materials-improve-item" key={idx}>
                        <span className="materials-improve-rank">{idx + 1}</span>
                        <div className="materials-improve-info">
                          <span className="materials-improve-name">{item.topic.name}</span>
                          <span className="materials-improve-sub">
                            {item.discipline} • {item.attempts} tentativas, {item.correct} acertos
                          </span>
                          <div className="materials-improve-bar">
                            <div
                              className={`materials-improve-bar-fill ${item.attempts === 0 ? 'none' : item.pct < 50 ? 'low' : 'mid'}`}
                              style={{ width: `${item.attempts === 0 ? 4 : item.pct}%` }}
                            />
                          </div>
                        </div>
                        <span className={`materials-improve-pct ${item.attempts === 0 ? 'none' : item.pct < 50 ? 'low' : 'mid'}`}>
                          {item.attempts === 0 ? 'Não praticado' : `${item.pct}%`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="materials-dashboard-cards">
                {materialsData.map((discipline) => {
                  const s = getDisciplineStats(discipline);
                  const pct = s.totalTopics > 0 ? Math.round((s.topicsDone / s.totalTopics) * 100) : 0;
                  return (
                    <div className="materials-dashboard-card" key={discipline.id} style={{ borderTopColor: discipline.color }}>
                      <h3>{discipline.name}</h3>
                      <div className="materials-dashboard-card-row">
                        <span>Tópicos</span>
                        <b>{s.topicsDone}/{s.totalTopics}</b>
                      </div>
                      <div className="materials-dashboard-card-row">
                        <span>Videoaulas</span>
                        <b>{s.watchedVideos}/{s.totalVideos}</b>
                      </div>
                      <div className="materials-dashboard-card-row">
                        <span>Revisões</span>
                        <b>{s.doneReviews}/{s.totalReviews}</b>
                      </div>
                      <div className="materials-dashboard-card-row">
                        <span>Exercícios</span>
                        <b>{s.correct}/{s.attempts}</b>
                      </div>
                      <div className="materials-dashboard-bar">
                        <div className="materials-dashboard-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {mindMapTopic && (
        <MindMapModal topic={mindMapTopic} onClose={() => setMindMapTopic(null)} />
      )}

      {doubtTopic && (
        <DoubtBotModal topic={doubtTopic} onClose={() => setDoubtTopic(null)} />
      )}
    </div>
  );
};

export default StudyMaterials;
