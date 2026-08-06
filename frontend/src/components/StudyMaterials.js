import { useState } from 'react';
import {
  BookOpen, FileText, Folder, Video, GraduationCap,
  Cpu, ArrowUpRight, Brain, Library, ChevronDown, ChevronUp,
  CalendarDays, Clock, MapPin, ClipboardList, Target, Sigma,
  RefreshCw, ListChecks, PlayCircle, BookOpenCheck,
} from 'lucide-react';
import '../styles/studyMaterials.css';
import ExerciseSidebar from './ExerciseSidebar';

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const materialsData = [
  {
    id: 'ed',
    name: 'Estrutura de Dados',
    professor: 'Prof. Roney Lopes Lima',
    course: 'Turma 11611.0001',
    color: '#3b82f6',
    icon: Cpu,
    schedule: [
      { day: 'Quarta-feira', time: '08:45 - 10:15', room: 'Sala S403' },
      { day: 'Quarta-feira', time: '10:30 - 12:00', room: 'Sala S403' },
    ],
    evaluation: [
      'Lista (2,0) + Simulado (3,0) + Prova (5,0)',
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
        name: 'Programação Estruturada e Modular',
        icon: '🛠️',
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
        name: 'Análise de Algoritmos',
        icon: '📊',
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
        name: 'Vetores e Strings',
        icon: '📚',
        videoaulas: [
          { title: 'Vetores e arrays em C++', url: yt('vetores e arrays em C++ aula') },
          { title: 'Ordenação bolha e inserção', url: yt('ordenação bolha inserção C++') },
        ],
        revisoes: [
          { title: 'Resumo de vetores e strings', note: 'Declaração, acesso, funções de string' },
        ],
        exercicios: [
          { name: 'Lista 3 - Vetores e Strings', count: 7, icon: '📚' },
        ],
      },
      {
        id: 'ed-matrizes',
        name: 'Matrizes Multidimensionais',
        icon: '🔲',
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
        name: 'Estruturas Estáticas e Dinâmicas',
        icon: '🧩',
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
        name: 'Pilhas e Filas',
        icon: '🥞',
        videoaulas: [
          { title: 'Pilha (stack) - implementação', url: yt('pilha stack C++ implementação') },
          { title: 'Fila (queue) - implementação', url: yt('fila queue C++ implementação') },
        ],
        revisoes: [
          { title: 'Resumo LIFO/FIFO', note: 'Operações push/pop, enqueue/dequeue' },
        ],
        exercicios: [
          { name: 'Lista 6 - Pilhas e Filas', count: 7, icon: '🥞' },
        ],
      },
      {
        id: 'ed-listas-encadeadas',
        name: 'Listas Encadeadas',
        icon: '🔗',
        videoaulas: [
          { title: 'Lista simplesmente encadeada', url: yt('lista simplesmente encadeada C++') },
          { title: 'Lista duplamente encadeada', url: yt('lista duplamente encadeada C++') },
        ],
        revisoes: [
          { title: 'Resumo de listas encadeadas', note: 'Inserção, remoção, busca, circular' },
        ],
        exercicios: [
          { name: 'Lista 7 - Listas Encadeadas', count: 6, icon: '🔗' },
        ],
      },
      {
        id: 'ed-arvores',
        name: 'Árvores',
        icon: '🌳',
        videoaulas: [
          { title: 'Árvores binárias - implementação', url: yt('árvores binárias C++') },
          { title: 'Árvore binária de busca (BST)', url: yt('árvore binária de busca C++') },
          { title: 'Balanceamento AVL', url: yt('árvore AVL C++') },
        ],
        revisoes: [
          { title: 'Resumo de árvores', note: 'Percursos, BST, AVL, balanceamento' },
        ],
        exercicios: [
          { name: 'Lista 8 - Árvores', count: 6, icon: '🌳' },
        ],
      },
      {
        id: 'ed-simulado',
        name: 'Simulado - Avaliação',
        icon: '📝',
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
        title: 'Open Data Structures',
        note: 'Livro gratuito em acesso aberto (edição C/Java)',
        url: 'https://opendatastructures.org/',
      },
      {
        title: 'Problem Solving with Algorithms and Data Structures using Python',
        note: 'Livro interativo gratuito',
        url: 'https://runestone.academy/ns/books/published/pythonds3/index.html',
      },
      {
        title: 'Estruturas de Dados e Algoritmos - UNICAMP',
        note: 'Apostilas e materiais da disciplina de Estruturas de Dados da UNICAMP',
        url: 'https://www.ic.unicamp.br/~riezebom/ed1/',
      },
      {
        title: 'Algoritmos e Estruturas de Dados - USP',
        note: 'Material de apoio da disciplina MAC0121 da USP',
        url: 'https://www.ime.usp.br/~pf/algoritmos_para_bolsas/',
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
        name: 'Sistemas de Numeração',
        icon: '🔢',
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
        name: 'Portas e Funções Lógicas',
        icon: '⚡',
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
        name: 'Álgebra de Boole e Simplificação',
        icon: '🧠',
        videoaulas: [
          { title: 'Álgebra de Boole e De Morgan (Prof. João Lucas)', url: yt('álgebra de boole de morgan professor joão lucas') },
          { title: 'Boolean Algebra (Neso Academy)', url: yt('neso academy boolean algebra') },
          { title: 'Mapa de Karnaugh - simplificação', url: yt('mapa de karnaugh simplificação') },
        ],
        revisoes: [
          { title: 'Resumo postulados e teoremas', note: 'De Morgan, formas canônicas, identidades' },
          { title: 'Roteiro de simplificação', note: 'Passo a passo para usar Karnaugh' },
        ],
        exercicios: [
          { name: 'Lista 5 - Álgebra de Boole', count: 7, icon: '🧠' },
          { name: 'Lista 6 - Mapa de Karnaugh', count: 7, icon: '🗺️' },
        ],
      },
      {
        id: 'sd-circuitos-combinacionais',
        name: 'Circuitos Combinacionais',
        icon: '⚙️',
        videoaulas: [
          { title: 'Somadores e subtratores (Prof. João Lucas)', url: yt('somadores subtratores circuitos digitais') },
          { title: 'MUX/DEMUX - circuitos combinacionais', url: yt('multiplexador demultiplexador sistemas digitais') },
          { title: 'Display de 7 segmentos', url: yt('display 7 segmentos circuitos digitais') },
        ],
        revisoes: [
          { title: 'Resumo de circuitos combinacionais', note: 'Somadores, comparadores, MUX, DEMUX, display' },
          { title: 'Roteiro de projeto', note: 'Do enunciado ao circuito implementado' },
        ],
        exercicios: [
          { name: 'Lista 7 - Circuitos Combinacionais', count: 7, icon: '⚙️' },
          { name: 'Lista 8 - Projeto com MUX', count: 7, icon: '🧩' },
        ],
      },
      {
        id: 'sd-flipflops-contadores',
        name: 'Flip-Flops e Contadores',
        icon: '⏱️',
        videoaulas: [
          { title: 'Flip-flops RS, JK, D e T (Prof. João Lucas)', url: yt('flip flop rs jk d t sistemas digitais') },
          { title: 'Registradores e contadores síncronos', url: yt('registradores contadores síncronos sistemas digitais') },
          { title: 'Sequential Circuits (Neso Academy)', url: yt('neso academy sequential circuits') },
        ],
        revisoes: [
          { title: 'Resumo dos flip-flops', note: 'Tabelas de excitação, características e aplicações' },
          { title: 'Mapa mental de contadores', note: 'Síncronos vs assíncronos, módulos' },
        ],
        exercicios: [
          { name: 'Lista 9 - Flip-Flops', count: 7, icon: '⏱️' },
          { name: 'Lista 10 - Registradores e Contadores', count: 7, icon: '🔢' },
        ],
      },
      {
        id: 'sd-conversores-memorias',
        name: 'Conversores, Multiplex e Memórias',
        icon: '💾',
        videoaulas: [
          { title: 'Conversor D/A e A/D', url: yt('conversor digital analógico analógico digital') },
          { title: 'Memórias ROM e RAM', url: yt('memórias rom ram sistemas digitais') },
          { title: 'Famílias lógicas TTL e CMOS', url: yt('famílias lógicas TTL CMOS') },
        ],
        revisoes: [
          { title: 'Resumo de conversores', note: 'D/A, A/D, resolução e aplicações' },
          { title: 'Resumo de memórias', note: 'ROM, RAM, organização e famílias TTL/CMOS' },
        ],
        exercicios: [
          { name: 'Lista 11 - Conversores D/A e A/D', count: 7, icon: '💾' },
          { name: 'Lista 12 - Memórias e Famílias Lógicas', count: 7, icon: '🔌' },
        ],
      },
      {
        id: 'sd-simulado',
        name: 'Simulado - Avaliação',
        icon: '📝',
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
        name: 'Vetores no Plano e no Espaço',
        icon: '➡️',
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
        name: 'Sistemas Lineares e Matrizes',
        icon: '📐',
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
        name: 'Espaços Vetoriais',
        icon: '🧠',
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
        name: 'Transformações Lineares',
        icon: '🔄',
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
        name: 'Determinantes',
        icon: '🔢',
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
        name: 'Autovalores e Autovetores',
        icon: '🔑',
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
];

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

const StudyMaterials = () => {
  const [openDiscipline, setOpenDiscipline] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [exerciseSidebarOpen, setExerciseSidebarOpen] = useState(false);
  const [highlightSubject, setHighlightSubject] = useState(null);

  const handleOpenSidebar = (subject) => {
    setHighlightSubject(subject || null);
    setExerciseSidebarOpen(true);
  };

  const handleCloseSidebar = (open) => {
    setExerciseSidebarOpen(open);
  };

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
              Tópicos com videoaulas, revisões e exercícios (IFG Jataí) por disciplina
            </p>
          </div>
        </div>

        <div className="materials-grid">
          {materialsData.map((discipline) => {
            const DisciplineIcon = discipline.icon;
            const isOpen = openDiscipline === discipline.id;

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
                  {isOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
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
                        {discipline.topics.map((topic) => (
                          <div className="materials-topic" key={topic.id}>
                            <button
                              className="materials-topic-header"
                              onClick={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
                            >
                              <span className="materials-topic-icon">{topic.icon}</span>
                              <span className="materials-topic-title-block">
                                <span className="materials-topic-name">{topic.name}</span>
                                <span className="materials-topic-meta">
                                  {topic.videoaulas.length} videoaulas • {topic.revisoes.length} revisões • {topic.exercicios.reduce((s, e) => s + e.count, 0)} questões
                                </span>
                              </span>
                              {openTopic === topic.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {openTopic === topic.id && (
                              <div className="materials-topic-body">
                                {topic.videoaulas.length > 0 && (
                                  <div className="materials-topic-block">
                                    <h5 className="materials-topic-block-title">
                                      <PlayCircle size={16} />
                                      Videoaulas
                                    </h5>
                                    <ul className="materials-topic-links">
                                      {topic.videoaulas.map((video, idx) => (
                                        <li key={idx}>
                                          <a href={video.url} target="_blank" rel="noopener noreferrer" className="materials-topic-link">
                                            <span className="materials-topic-link-title">{video.title}</span>
                                            <ArrowUpRight size={14} />
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {topic.revisoes.length > 0 && (
                                  <div className="materials-topic-block">
                                    <h5 className="materials-topic-block-title">
                                      <RefreshCw size={16} />
                                      Revisões
                                    </h5>
                                    <ul className="materials-topic-links">
                                      {topic.revisoes.map((review, idx) => (
                                        <li key={idx}>
                                          <button
                                            className="materials-topic-link materials-topic-link-btn"
                                            onClick={() => handleOpenSidebar(discipline.name)}
                                          >
                                            <span>
                                              <span className="materials-topic-link-title">{review.title}</span>
                                              <span className="materials-topic-link-note">{review.note}</span>
                                            </span>
                                            <BookOpenCheck size={14} />
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {topic.exercicios.length > 0 && (
                                  <div className="materials-topic-block">
                                    <h5 className="materials-topic-block-title">
                                      <ListChecks size={16} />
                                      Exercícios - IFG Jataí
                                    </h5>
                                    <div className="materials-exercise-grid">
                                      {topic.exercicios.map((ex, idx) => (
                                        <button
                                          className="materials-exercise-btn"
                                          key={idx}
                                          onClick={() => handleOpenSidebar(discipline.name)}
                                        >
                                          <span className="materials-exercise-icon">{ex.icon}</span>
                                          <span className="materials-exercise-info">
                                            <span className="materials-exercise-title">{ex.name}</span>
                                            <span className="materials-exercise-meta">{ex.count} questões • IFG Jataí</span>
                                          </span>
                                          <span className="materials-exercise-action">Praticar</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
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
      </div>

      <ExerciseSidebar
        isOpen={exerciseSidebarOpen}
        onClose={handleCloseSidebar}
        onSelectExercise={handleOpenSidebar}
        highlightSubject={highlightSubject}
      />
    </div>
  );
};

export default StudyMaterials;
