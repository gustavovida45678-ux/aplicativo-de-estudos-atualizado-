import { useState } from 'react';
import {
  BookOpen, FileText, Folder, Video, ListChecks, GraduationCap,
  Cpu, ArrowUpRight, Brain, Library, ChevronDown, ChevronUp,
} from 'lucide-react';
import '../styles/studyMaterials.css';

const materialsData = [
  {
    id: 'ed',
    name: 'Estrutura de Dados',
    professor: 'Prof. Roney Lima',
    color: '#3b82f6',
    icon: Cpu,
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
      'Vetores', 'Listas encadeadas', 'Pilhas', 'Filas', 'Árvores',
      'Hash', 'Grafos', 'Ordenação', 'Busca',
    ],
  },
  {
    id: 'sd',
    name: 'Sistemas Digitais',
    professor: 'Prof. José Lambert',
    color: '#f59e0b',
    icon: Brain,
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
    books: [
      {
        title: 'Digital Logic Design',
        note: 'Materiais gratuitos de universidades',
        url: 'https://www.ece.uvic.ca/~fels/340/',
      },
      {
        title: 'Apostilas de Sistemas Digitais - UFRGS',
        note: 'Material de circuitos digitais da UFRGS',
        url: 'https://www.inf.ufrgs.br/~espiredo/digital/',
      },
      {
        title: 'Apostilas de Sistemas Digitais - UFSC',
        note: 'Material de sistemas digitais da UFSC',
        url: 'https://www.inf.ufsc/~bosco/sdb/',
      },
      {
        title: 'Apostilas de Sistemas Digitais - USP',
        note: 'Material de introdção a sistemas digitais da USP (SCC0202)',
        url: 'http://www.lisa.ee.usp.br/scc0202/',
      },
      {
        title: 'Nand2Tetris',
        note: 'Construção de um computador do zero (gratuito)',
        url: 'https://www.nand2tetris.org/',
      },
    ],
    videos: [
      { title: 'Neso Academy - Digital Electronics', url: 'https://www.youtube.com/@NesoAcademy' },
      { title: 'Univesp - Sistemas Digitais', url: 'https://www.youtube.com/@univesptv' },
      { title: 'MIT OpenCourseWare - Digital Systems', url: 'https://ocw.mit.edu/' },
      { title: 'Digital Electronics - NPTEL', url: 'https://www.youtube.com/@nptelhrd' },
      { title: 'Sistemas Digitais - Prof. João Lucas', url: 'https://www.youtube.com/@profjoaolucas' },
    ],
    exercises: [
      'Conversão de bases', 'Álgebra Booleana', 'Karnaugh',
      'Circuitos combinacionais', 'Flip-Flops', 'Registradores',
      'Contadores', 'Máquinas de Estados',
    ],
  },
];

const ExerciseList = ({ items }) => (
  <div className="materials-tags">
    {items.map((item) => (
      <span className="materials-tag" key={item}>{item}</span>
    ))}
  </div>
);

const StudyMaterials = () => {
  const [openDiscipline, setOpenDiscipline] = useState(null);

  return (
    <div className="materials-page">
      <div className="materials-header">
        <div className="materials-header-icon">
          <Library size={40} />
        </div>
        <div className="materials-header-text">
          <div className="materials-header-badge">IFG - Câmpus Jataí/GO</div>
          <h1 className="materials-title">Materiais de Estudo</h1>
          <p className="materials-subtitle">
            Livros, videoaulas, exercícios e estrutura de arquivos por disciplina
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
                  </div>
                </div>
                {isOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </button>

              {isOpen && (
                <div className="materials-card-body">
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
                      Livros
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
                    <ExerciseList items={discipline.exercises} />
                  </section>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyMaterials;
