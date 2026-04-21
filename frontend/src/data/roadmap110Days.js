// Roteiro de Estudos - Cálculo Numérico (Equações Diferenciais)
// Professor Thiago Vedovato | IFJ - Jataí/GO | Engenharia Elétrica
// 110 dias | 01 Abril 2026 → 10 Julho 2026

export const roadmapInfo = {
  professor: 'Thiago Vedovato',
  institution: 'IFJ - Jataí/GO',
  course: 'Engenharia Elétrica',
  subject: 'Cálculo Numérico (Equações Diferenciais)',
  startDate: '2026-04-01',
  endDate: '2026-07-10',
  totalDays: 110,
  totalWeeks: 15,
  breakdown: {
    content: 70,
    exercises: 25,
    reviews: 10,
    finalization: 5,
  },
};

// type: 'study' | 'exercise' | 'review' | 'delivery'
// Each phase contains weeks, each week contains days
export const phases = [
  {
    id: 'phase1',
    number: 1,
    name: 'Revisão e Fundamentos',
    weeks: '1-3',
    totalDays: 21,
    color: '#3b82f6',
    icon: '📐',
    description: 'Reforço de matemática básica, matrizes e cálculo essencial',
    weeksData: [
      {
        number: 1,
        title: 'Reforço de Matemática Básica',
        dateRange: '1-7 Abril',
        days: [
          { range: '1-2', date: '1-2 Abr', topic: 'Operações fundamentais e propriedades', type: 'study' },
          { range: '3-4', date: '3-4 Abr', topic: 'Funções e gráficos', type: 'study' },
          { range: '5-6', date: '5-6 Abr', topic: 'Exercícios práticos', type: 'exercise' },
          { range: '7', date: '7 Abr', topic: 'REVISÃO + Avaliação de conhecimento', type: 'review' },
        ],
      },
      {
        number: 2,
        title: 'Matrizes e Sistemas Lineares',
        dateRange: '8-14 Abril',
        days: [
          { range: '8-9', date: '8-9 Abr', topic: 'Operações com matrizes', type: 'study' },
          { range: '10-11', date: '10-11 Abr', topic: 'Determinantes e inversas', type: 'study' },
          { range: '12-13', date: '12-13 Abr', topic: 'Sistemas lineares (Gauss, Cramer)', type: 'study' },
          { range: '14', date: '14 Abr', topic: 'EXERCÍCIOS + Lista de atividades', type: 'exercise' },
        ],
      },
      {
        number: 3,
        title: 'Cálculo e Geometria Analítica',
        dateRange: '15-21 Abril',
        days: [
          { range: '15-16', date: '15-16 Abr', topic: 'Limites e continuidade', type: 'study' },
          { range: '17-18', date: '17-18 Abr', topic: 'Derivadas e integrais (revisão)', type: 'study' },
          { range: '19-20', date: '19-20 Abr', topic: 'Vetores, retas e planos', type: 'study' },
          { range: '21', date: '21 Abr', topic: 'REVISÃO GERAL Fase 1', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    name: 'Equações Diferenciais Básicas',
    weeks: '4-7',
    totalDays: 28,
    color: '#8b5cf6',
    icon: '∂',
    description: 'Introdução às EDOs e equações de 1ª ordem',
    weeksData: [
      {
        number: 4,
        title: 'Introdução às EDOs',
        dateRange: '22-28 Abril',
        days: [
          { range: '22-23', date: '22-23 Abr', topic: 'Conceitos fundamentais e classificação', type: 'study' },
          { range: '24-25', date: '24-25 Abr', topic: 'Soluções gerais e particulares', type: 'study' },
          { range: '26-27', date: '26-27 Abr', topic: 'Problemas de valor inicial (PVI)', type: 'study' },
          { range: '28', date: '28 Abr', topic: 'EXERCÍCIOS Introdução', type: 'exercise' },
        ],
      },
      {
        number: 5,
        title: 'EDOs de 1ª Ordem - Parte I',
        dateRange: '29 Abril - 5 Maio',
        days: [
          { range: '29-30', date: '29-30 Abr', topic: 'Equações separáveis', type: 'study' },
          { range: '1-2', date: '1-2 Mai', topic: 'Equações lineares de 1ª ordem', type: 'study' },
          { range: '3-4', date: '3-4 Mai', topic: 'Fator integrante', type: 'study' },
          { range: '5', date: '5 Mai', topic: 'LISTA DE EXERCÍCIOS 1ª ordem', type: 'exercise' },
        ],
      },
      {
        number: 6,
        title: 'EDOs de 1ª Ordem - Parte II',
        dateRange: '6-12 Maio',
        days: [
          { range: '6-7', date: '6-7 Mai', topic: 'Equações exatas', type: 'study' },
          { range: '8-9', date: '8-9 Mai', topic: 'Equações de Bernoulli', type: 'study' },
          { range: '10-11', date: '10-11 Mai', topic: 'Aplicações práticas (circuitos RC)', type: 'study' },
          { range: '12', date: '12 Mai', topic: 'REVISÃO 1ª ordem', type: 'review' },
        ],
      },
      {
        number: 7,
        title: 'Consolidação EDOs 1ª Ordem',
        dateRange: '13-19 Maio',
        days: [
          { range: '13-14', date: '13-14 Mai', topic: 'Resolução de problemas complexos', type: 'study' },
          { range: '15-16', date: '15-16 Mai', topic: 'Aplicações em engenharia elétrica', type: 'study' },
          { range: '17-18', date: '17-18 Mai', topic: 'ATIVIDADE AVALIATIVA 1', type: 'exercise' },
          { range: '19', date: '19 Mai', topic: 'REVISÃO Fase 2', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    name: 'Séries e Métodos',
    weeks: '8-10',
    totalDays: 21,
    color: '#ec4899',
    icon: 'Σ',
    description: 'Sequências, séries infinitas e séries de potência',
    weeksData: [
      {
        number: 8,
        title: 'Sequências e Séries',
        dateRange: '20-26 Maio',
        days: [
          { range: '20-21', date: '20-21 Mai', topic: 'Definição e convergência de sequências', type: 'study' },
          { range: '22-23', date: '22-23 Mai', topic: 'Séries infinitas e testes de convergência', type: 'study' },
          { range: '24-25', date: '24-25 Mai', topic: 'Séries de potências', type: 'study' },
          { range: '26', date: '26 Mai', topic: 'EXERCÍCIOS Séries', type: 'exercise' },
        ],
      },
      {
        number: 9,
        title: 'Séries de Potência',
        dateRange: '27 Maio - 2 Junho',
        days: [
          { range: '27-28', date: '27-28 Mai', topic: 'Desenvolvimento em séries de Taylor', type: 'study' },
          { range: '29-30', date: '29-30 Mai', topic: 'Raio de convergência', type: 'study' },
          { range: '31-1', date: '31 Mai - 1 Jun', topic: 'Aplicações em EDOs', type: 'study' },
          { range: '2', date: '2 Jun', topic: 'REVISÃO Séries', type: 'review' },
        ],
      },
      {
        number: 10,
        title: 'Métodos das Séries',
        dateRange: '3-9 Junho',
        days: [
          { range: '3-4', date: '3-4 Jun', topic: 'Soluções em pontos ordinários', type: 'study' },
          { range: '5-6', date: '5-6 Jun', topic: 'Soluções em pontos singulares', type: 'study' },
          { range: '7-8', date: '7-8 Jun', topic: 'LISTA EXERCÍCIOS Métodos', type: 'exercise' },
          { range: '9', date: '9 Jun', topic: 'REVISÃO Fase 3', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    name: 'EDOs de Ordem Superior',
    weeks: '11-13',
    totalDays: 21,
    color: '#10b981',
    icon: 'd²',
    description: 'Equações de 2ª ordem homogêneas e não-homogêneas',
    weeksData: [
      {
        number: 11,
        title: 'EDOs de 2ª Ordem Homogêneas',
        dateRange: '10-16 Junho',
        days: [
          { range: '10-11', date: '10-11 Jun', topic: 'Equações lineares homogêneas', type: 'study' },
          { range: '12-13', date: '12-13 Jun', topic: 'Raízes reais distintas', type: 'study' },
          { range: '14-15', date: '14-15 Jun', topic: 'Raízes complexas e repetidas', type: 'study' },
          { range: '16', date: '16 Jun', topic: 'EXERCÍCIOS 2ª ordem', type: 'exercise' },
        ],
      },
      {
        number: 12,
        title: 'EDOs de 2ª Ordem Não-Homogêneas',
        dateRange: '17-23 Junho',
        days: [
          { range: '17-18', date: '17-18 Jun', topic: 'Método dos coeficientes indeterminados', type: 'study' },
          { range: '19-20', date: '19-20 Jun', topic: 'Variação de parâmetros', type: 'study' },
          { range: '21-22', date: '21-22 Jun', topic: 'Aplicações em circuitos RLC e vibrações', type: 'study' },
          { range: '23', date: '23 Jun', topic: 'LISTA EXERCÍCIOS Não-homogêneas', type: 'exercise' },
        ],
      },
      {
        number: 13,
        title: 'Aplicações Avançadas e Consolidação',
        dateRange: '24-30 Junho',
        days: [
          { range: '24-25', date: '24-25 Jun', topic: 'Sistemas de EDOs lineares', type: 'study' },
          { range: '26-27', date: '26-27 Jun', topic: 'Transformada de Laplace - Introdução', type: 'study' },
          { range: '28-29', date: '28-29 Jun', topic: 'ATIVIDADE AVALIATIVA 2', type: 'exercise' },
          { range: '30', date: '30 Jun', topic: 'REVISÃO Fase 4', type: 'review' },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    name: 'Métodos Numéricos para EDOs',
    weeks: '14-15',
    totalDays: 14,
    color: '#f59e0b',
    icon: '≈',
    description: 'Métodos computacionais: Euler, Runge-Kutta e aplicações',
    weeksData: [
      {
        number: 14,
        title: 'Métodos Numéricos - Introdução',
        dateRange: '1-7 Julho',
        days: [
          { range: '1-2', date: '1-2 Jul', topic: 'Método de Euler e Euler Melhorado', type: 'study' },
          { range: '3-4', date: '3-4 Jul', topic: 'Método de Runge-Kutta (2ª e 4ª ordem)', type: 'study' },
          { range: '5-6', date: '5-6 Jul', topic: 'Análise de erro e estabilidade', type: 'study' },
          { range: '7', date: '7 Jul', topic: 'EXERCÍCIOS Métodos Numéricos', type: 'exercise' },
        ],
      },
      {
        number: 15,
        title: 'Finalização e Entrega',
        dateRange: '8-10 Julho',
        days: [
          { range: '8', date: '8 Jul', topic: 'Revisão geral e resumo final', type: 'review' },
          { range: '9', date: '9 Jul', topic: 'Preparação do trabalho / portfólio', type: 'delivery' },
          { range: '10', date: '10 Jul', topic: 'ENTREGA FINAL - Prof. Thiago Vedovato', type: 'delivery' },
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
