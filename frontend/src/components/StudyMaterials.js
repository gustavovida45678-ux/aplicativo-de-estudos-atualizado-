import { useState } from 'react';
import {
  BookOpen, FileText, Folder, Video, ListChecks, GraduationCap,
  Cpu, ArrowUpRight, Brain, Library, ChevronDown, ChevronUp,
  CalendarDays, Clock, MapPin, ClipboardList, Target, Sigma,
} from 'lucide-react';
import '../styles/studyMaterials.css';
import ExerciseSidebar from './ExerciseSidebar';

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
    structure: [
      { name: 'Apostila.pdf', type: 'file' },
      { name: 'Resumo.pdf', type: 'file' },
      { name: 'Mapa_Mental.pdf', type: 'file' },
      { name: 'Exercicios.pdf', type: 'file' },
      { name: 'Exercicios_Resolvidos.pdf', type: 'file' },
      { name: 'Simulados', type: 'folder' },
      { name: 'Gabaritos.pdf', type: 'file' },
      { name: 'Videoaulas.md', type: 'file' },
      { name: 'Codigos_C', type: 'folder' },
      { name: 'Projetos', type: 'folder' },
    ],
    units: [
      'Programação estruturada e modular (funções, passagem por valor/referência)',
      'Análise de algoritmos e complexidade (notação O, casos melhor/pior/médio)',
      'Vetores e strings (ordenação bolha/inserção, busca, manipulação)',
      'Matrizes multidimensionais e alocação dinâmica',
      'Estruturas estáticas e dinâmicas (ponteiros, new/delete)',
      'Pilhas e filas (LIFO/FIFO, implementações e aplicações)',
      'Listas encadeadas (simples, dupla, circular)',
      'Árvores (binárias, BST, AVL, percursos e balanceamento)',
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
    videos: [
      { title: 'Curso de Estruturas de Dados - Univesp', url: 'https://www.youtube.com/@univesptv' },
      { title: 'Curso de Estruturas de Dados - Prof. Guanabara', url: 'https://www.youtube.com/@CursoemVideo' },
      { title: 'Curso de Algoritmos - Unicamp', url: 'https://www.youtube.com/results?search_query=curso+de+algoritmos+unicamp' },
      { title: 'Estruturas de Dados - Coursera (USP)', url: 'https://www.coursera.org/learn/estruturas-de-dados' },
      { title: 'Algoritmos em C e C++ - Futuro Dev', url: 'https://www.youtube.com/@FuturoDev' },
    ],
    exercises: [
      'Programação Estruturada', 'Análise de Algoritmos', 'Vetores e Strings',
      'Matrizes', 'Pilhas e Filas', 'Listas Encadeadas', 'Árvores', 'Simulado',
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
    units: [
      'Sistemas de numeração: binário, octal, hexadecimal, conversões, aritmética e códigos',
      'Portas e funções lógicas: AND, OR, NOT, NAND, NOR, XOR, XNOR e tabelas verdade',
      'Álgebra de Boole: postulados, teoremas de De Morgan, simplificação e formas canônicas',
      'Circuitos combinacionais: somadores, subtratores, comparadores, MUX/DEMUX, display 7 segmentos',
      'Flip-flops e circuitos sequenciais: RS, JK, D, T, registradores e contadores',
      'Conversores D/A e A/D e suas aplicações',
      'Memórias ROM/RAM, multiplexadores e famílias lógicas TTL/CMOS',
    ],
    evaluation: [
      'MB1 = (VAE1 + PB1) / 2',
      'MB2 = (VAE2 + PRO + PB2) / 3',
      'MS = (MB1 + MB2) / 2',
      'Aprovação: MS ≥ 6,0',
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
    videos: [
      { title: 'Sistemas Digitais - Prof. João Lucas', url: 'https://www.youtube.com/@profjoaolucas' },
      { title: 'Neso Academy - Digital Electronics', url: 'https://www.youtube.com/@NesoAcademy' },
      { title: 'Univesp - Sistemas Digitais', url: 'https://www.youtube.com/@univesptv' },
      { title: 'MIT OpenCourseWare - Digital Systems', url: 'https://ocw.mit.edu/' },
      { title: 'Digital Electronics - NPTEL', url: 'https://www.youtube.com/@nptelhrd' },
    ],
    exercises: [
      'Sistemas de Numeração', 'Portas Lógicas', 'Álgebra de Boole', 'Karnaugh',
      'Circuitos Combinacionais', 'Flip-Flops', 'Contadores', 'Conversores e Memórias', 'Simulado',
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
      { name: 'Videoaulas.md', type: 'file' },
    ],
    units: [
      'Vetores no plano e no espaço (operações, produto escalar e vetorial)',
      'Sistemas lineares e matrizes (escalonamento, posto, inversa)',
      'Espaços vetoriais, subespaços, base e dimensão',
      'Transformações lineares e matrizes associadas',
      'Determinantes e suas propriedades',
      'Autovalores e autovetores',
      'Diagonalização de matrizes e aplicações',
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
    videos: [
      { title: 'Essence of Linear Algebra - 3Blue1Brown', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
      { title: 'Álgebra Linear - Prof. José Natal (IMPA)', url: 'https://www.youtube.com/results?search_query=algebra+linear+professor+jos%C3%A9+natal+impa' },
      { title: 'MIT 18.06 - Linear Algebra (Gilbert Strang)', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/video_galleries/video-lectures/' },
      { title: 'Curso de Álgebra Linear - Univesp', url: 'https://www.youtube.com/@univesptv' },
      { title: 'Álgebra Linear - Prof. Claudio Possani', url: 'https://www.youtube.com/results?search_query=algebra+linear+prof+claudio+possani' },
    ],
    exercises: [
      'Vetores', 'Sistemas Lineares', 'Matrizes', 'Determinantes',
      'Espaços Vetoriais', 'Transformações Lineares', 'Autovalores e Autovetores',
    ],
  },
];

const ExerciseList = ({ items, onSelect }) => (
  <div className="materials-tags">
    {items.map((item) => (
      <span
        className="materials-tag materials-tag-clickable"
        key={item}
        onClick={() => onSelect(item)}
      >
        {item}
      </span>
    ))}
  </div>
);

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
  const [exerciseSidebarOpen, setExerciseSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
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
              Horários, plano de ensino, livros, videoaulas e exercícios por disciplina
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
                        Conteúdo Programático
                      </h3>
                      <ul className="materials-units">
                        {discipline.units.map((unit, idx) => (
                          <li key={idx}>{unit}</li>
                        ))}
                      </ul>
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

                    <section className="materials-section">
                      <h3 className="materials-section-title">
                        <Video size={18} />
                        Videoaulas
                      </h3>
                      <ul className="materials-links">
                        {discipline.videos.map((video, idx) => (
                          <li key={idx}>
                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="materials-link">
                              <span className="materials-link-title">{video.title}</span>
                              <ArrowUpRight size={16} />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="materials-section">
                      <h3 className="materials-section-title">
                        <ListChecks size={18} />
                        Listas de Exercícios
                      </h3>
                      <ExerciseList items={discipline.exercises} onSelect={handleOpenSidebar} />
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
      />
    </div>
  );
};

export default StudyMaterials;
