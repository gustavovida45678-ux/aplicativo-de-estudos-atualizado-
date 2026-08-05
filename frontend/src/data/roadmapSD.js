// Roteiro de Estudos - Sistemas Digitais
// Professor Jose Antonio Lambert | IFG - Câmpus Jataí | Turma 20262.2.02004.1N (2026/2)
// 105 dias | 03 Agosto 2026 → 15 Novembro 2026

export const roadmapSDInfo = {
  title: 'Roteiro de Estudos — Sistemas Digitais',
  professor: 'Jose Antonio Lambert',
  institution: 'IFG - Câmpus Jataí',
  course: 'Turma 20262.2.02004.1N',
  subject: 'Sistemas Digitais',
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
// Conteúdo programático (plano de ensino): sistemas de numeração e códigos,
// álgebra booleana, circuitos combinacionais, circuitos sequenciais (flip-flops,
// registradores, contadores), conversores D/A e A/D, memórias e famílias lógicas.
export const roadmapSDPhases = [
  {
    id: 'phase1',
    number: 1,
    name: 'Fundamentos e Sistemas de Numeração',
    weeks: '1-3',
    totalDays: 21,
    color: '#3b82f6',
    icon: '🔢',
    description: 'Aplicações da eletrônica digital e sistemas decimal, binário, octal e hexadecimal',
    weeksData: [
      {
        number: 1,
        title: 'Introdução e Conversões Binário-Decimal',
        dateRange: '3-9 Agosto',
        days: [
          { range: '3-4', date: '3-4 Ago', topic: 'Aplicações da eletrônica digital na engenharia elétrica', type: 'study' },
          { range: '5-6', date: '5-6 Ago', topic: 'Sistemas decimal e binário; conversões', type: 'study' },
          { range: '7-8', date: '7-8 Ago', topic: 'Números binários e decimais fracionários', type: 'study' },
          { range: '9', date: '9 Ago', topic: 'EXERCÍCIOS conversões binário-decimal', type: 'exercise' },
        ],
      },
      {
        number: 2,
        title: 'Sistemas Octal e Hexadecimal',
        dateRange: '10-16 Agosto',
        days: [
          { range: '10-11', date: '10-11 Ago', topic: 'Sistema octal: conversões decimal e binária', type: 'study' },
          { range: '12-13', date: '12-13 Ago', topic: 'Sistema hexadecimal: conversões decimal e binária', type: 'study' },
          { range: '14-15', date: '14-15 Ago', topic: 'Relações octal/headecimal ↔ binário', type: 'study' },
          { range: '16', date: '16 Ago', topic: 'LISTA DE EXERCÍCIOS bases numéricas', type: 'exercise' },
        ],
      },
      {
        number: 3,
        title: 'Aritmética Binária e Códigos',
        dateRange: '17-23 Agosto',
        days: [
          { range: '17-18', date: '17-18 Ago', topic: 'Adição e subtração no sistema binário', type: 'study' },
          { range: '19-20', date: '19-20 Ago', topic: 'Multiplicação no sistema binário', type: 'study' },
          { range: '21-22', date: '21-22 Ago', topic: 'Códigos BCD e Gray', type: 'study' },
          { range: '23', date: '23 Ago', topic: 'REVISÃO Fase 1', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Portas Lógicas e Álgebra de Boole',
    weeks: '4-6',
    totalDays: 21,
    color: '#8b5cf6',
    icon: '⊻',
    description: 'Funções lógicas, tabelas verdade, De Morgan e mapas de Karnaugh',
    weeksData: [
      {
        number: 4,
        title: 'Funções e Portas Lógicas',
        dateRange: '24-30 Agosto',
        days: [
          { range: '24-25', date: '24-25 Ago', topic: 'Funções E, OU e NÃO (AND, OR, NOT)', type: 'study' },
          { range: '26-27', date: '26-27 Ago', topic: 'Portas NAND, NOR, XOR e XNOR', type: 'study' },
          { range: '28-29', date: '28-29 Ago', topic: 'Expressões booleanas e tabelas verdade', type: 'study' },
          { range: '30', date: '30 Ago', topic: 'EXERCÍCIOS portas lógicas', type: 'exercise' },
        ],
      },
      {
        number: 5,
        title: 'Álgebra de Boole',
        dateRange: '31 Agosto - 6 Setembro',
        days: [
          { range: '31-1', date: '31 Ago - 1 Set', topic: 'Postulados e propriedades da álgebra de Boole', type: 'study' },
          { range: '2-3', date: '2-3 Set', topic: 'Teoremas de De Morgan e identidades auxiliares', type: 'study' },
          { range: '4-5', date: '4-5 Set', topic: 'Simplificação de expressões booleanas', type: 'study' },
          { range: '6', date: '6 Set', topic: 'LISTA DE EXERCÍCIOS simplificação', type: 'exercise' },
        ],
      },
      {
        number: 6,
        title: 'Mapas de Veitch-Karnaugh',
        dateRange: '7-13 Setembro',
        days: [
          { range: '7-8', date: '7-8 Set', topic: 'Diagramas de Karnaugh com 2 variáveis', type: 'study' },
          { range: '9-10', date: '9-10 Set', topic: 'Karnaugh com 3 e 4 variáveis', type: 'study' },
          { range: '11-12', date: '11-12 Set', topic: 'Simplificação de funções com Karnaugh', type: 'study' },
          { range: '13', date: '13 Set', topic: 'REVISÃO Fase 2', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Circuitos Combinacionais',
    weeks: '7-8',
    totalDays: 14,
    color: '#ec4899',
    icon: '🧮',
    description: 'Projetos de circuitos, códigos, codificadores e decodificadores',
    weeksData: [
      {
        number: 7,
        title: 'Projetos de Circuitos Combinacionais',
        dateRange: '14-20 Setembro',
        days: [
          { range: '14-15', date: '14-15 Set', topic: 'Projetos com duas variáveis', type: 'study' },
          { range: '16-17', date: '16-17 Set', topic: 'Projetos com três e quatro variáveis', type: 'study' },
          { range: '18-19', date: '18-19 Set', topic: 'Códigos BCD 8421, excesso-3 e Gray', type: 'study' },
          { range: '20', date: '20 Set', topic: 'EXERCÍCIOS projetos combinacionais', type: 'exercise' },
        ],
      },
      {
        number: 8,
        title: 'Codificadores, Decodificadores e Display',
        dateRange: '21-27 Setembro',
        days: [
          { range: '21-22', date: '21-22 Set', topic: 'Codificador decimal/binário', type: 'study' },
          { range: '23-24', date: '23-24 Set', topic: 'Decodificador binário/decimal e projetos', type: 'study' },
          { range: '25-26', date: '25-26 Set', topic: 'Decodificador para display de 7 segmentos', type: 'study' },
          { range: '27', date: '27 Set', topic: 'REVISÃO Fase 3', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    name: 'Circuitos Sequenciais: Flip-Flops e Contadores',
    weeks: '9-11',
    totalDays: 21,
    color: '#10b981',
    icon: '🔄',
    description: 'Flip-flops RS, JK, T e D, registradores de deslocamento e contadores',
    weeksData: [
      {
        number: 9,
        title: 'Flip-Flops',
        dateRange: '28 Setembro - 4 Outubro',
        days: [
          { range: '28-29', date: '28-29 Set', topic: 'Flip-Flop RS básico e com clock', type: 'study' },
          { range: '30-1', date: '30 Set - 1 Out', topic: 'Flip-Flop JK, mestre-escravo, preset e clear', type: 'study' },
          { range: '2-3', date: '2-3 Out', topic: 'Flip-Flops T e D', type: 'study' },
          { range: '4', date: '4 Out', topic: 'LISTA DE EXERCÍCIOS flip-flops', type: 'exercise' },
        ],
      },
      {
        number: 10,
        title: 'Registradores de Deslocamento',
        dateRange: '5-11 Outubro',
        days: [
          { range: '5-6', date: '5-6 Out', topic: 'Registradores de deslocamento', type: 'study' },
          { range: '7-8', date: '7-8 Out', topic: 'Conversor série-paralelo', type: 'study' },
          { range: '9-10', date: '9-10 Out', topic: 'Conversor paralelo-série', type: 'study' },
          { range: '11', date: '11 Out', topic: 'EXERCÍCIOS registradores', type: 'exercise' },
        ],
      },
      {
        number: 11,
        title: 'Contadores',
        dateRange: '12-18 Outubro',
        days: [
          { range: '12-13', date: '12-13 Out', topic: 'Contadores assíncronos', type: 'study' },
          { range: '14-15', date: '14-15 Out', topic: 'Contadores síncronos', type: 'study' },
          { range: '16-17', date: '16-17 Out', topic: 'Temporizadores e relógio digital', type: 'study' },
          { range: '18', date: '18 Out', topic: 'REVISÃO Fase 4', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    name: 'Conversores, Memórias e Finalização',
    weeks: '12-15',
    totalDays: 28,
    color: '#f59e0b',
    icon: '💾',
    description: 'Conversores D/A e A/D, multiplex/demultiplex, memórias, famílias TTL/CMOS e avaliações',
    weeksData: [
      {
        number: 12,
        title: 'Conversores e Multiplex',
        dateRange: '19-25 Outubro',
        days: [
          { range: '19-20', date: '19-20 Out', topic: 'Conversores digital-analógico (D/A)', type: 'study' },
          { range: '21-22', date: '21-22 Out', topic: 'Conversores analógico-digital (A/D)', type: 'study' },
          { range: '23-24', date: '23-24 Out', topic: 'Circuitos multiplex e demultiplex', type: 'study' },
          { range: '25', date: '25 Out', topic: 'EXERCÍCIOS conversores', type: 'exercise' },
        ],
      },
      {
        number: 13,
        title: 'Memórias e Famílias Lógicas',
        dateRange: '26 Outubro - 1 Novembro',
        days: [
          { range: '26-27', date: '26-27 Out', topic: 'Classificação, estrutura e organização de memórias', type: 'study' },
          { range: '28-29', date: '28-29 Out', topic: 'Memórias ROM, PROM, EPROM, EEPROM e RAM', type: 'study' },
          { range: '30-31', date: '30-31 Out', topic: 'Famílias lógicas TTL e CMOS', type: 'study' },
          { range: '1', date: '1 Nov', topic: 'REVISÃO Fase 5', type: 'review' },
        ],
      },
      {
        number: 14,
        title: 'Simulados (critérios: VA + prova bimestral + projeto)',
        dateRange: '2-8 Novembro',
        days: [
          { range: '2-3', date: '2-3 Nov', topic: 'SIMULADO 1 - numeração, portas e álgebra de Boole', type: 'exercise' },
          { range: '4-5', date: '4-5 Nov', topic: 'SIMULADO 2 - combinacionais e sequenciais', type: 'exercise' },
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
          { range: '13-14', date: '13-14 Nov', topic: 'Preparação do projeto de circuito digital / avaliação', type: 'delivery' },
          { range: '15', date: '15 Nov', topic: 'ENTREGA FINAL - Prof. Jose Antonio Lambert', type: 'delivery' },
        ],
      },
    ],
  },
];
