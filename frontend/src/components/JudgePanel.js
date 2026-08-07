import { useState } from 'react';
import axios from 'axios';
import {
  Code2, Star, CheckCircle2, XCircle, Loader2, ArrowLeft,
  FileCode2, Play, Send, Trophy, ListOrdered, Sparkles, Youtube,
  Lightbulb, ChevronDown, ChevronUp, Wand2, BookOpen, AlertTriangle,
  Brain, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { JUDGE_PROBLEMS } from '../data/judgeProblems';
import '../styles/studyMaterials.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/judge`;

const STARTERS = {
  c: `#include <stdio.h>\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n`,
  python: `# seu codigo aqui\n`,
};

const LANG_NAMES = { c: 'C', cpp: 'C++', python: 'Python 3' };

const loadProgress = () => {
  try { return JSON.parse(localStorage.getItem('judgeProgress') || '{}'); } catch { return {}; }
};

const JudgePanel = () => {
  const [problems] = useState(JUDGE_PROBLEMS);
  const [selected, setSelected] = useState(null);
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState('');
  const [progress, setProgress] = useState(loadProgress);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [createTopic, setCreateTopic] = useState('variaveis');
  const [createDifficulty, setCreateDifficulty] = useState(1);
  const [newExercise, setNewExercise] = useState(null);
  const [creatingExercise, setCreatingExercise] = useState(false);

  const [showExplanation, setShowExplanation] = useState(false);
  const [expandedStep, setExpandedStep] = useState(0);

  const saveCode = (id, lang, c) => { localStorage.setItem(`judge_code_${id}_${lang}`, c); };

  const openProblem = (p) => {
    const saved = localStorage.getItem(`judge_code_${p.id}_${language}`);
    setSelected(p);
    setCode(saved || STARTERS[language]);
    setResult(null);
    setShowExplanation(false);
    setExpandedStep(0);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (selected) {
      const saved = localStorage.getItem(`judge_code_${selected.id}_${lang}`);
      setCode(saved || STARTERS[lang]);
    }
    if (newExercise) setNewExercise(null);
  };

  const submit = async (runOnly) => {
    if (!selected && !newExercise) return;
    if (!code.trim()) { toast.warning('Escreva seu codigo antes de enviar.'); return; }
    setRunning(true);
    setResult(null);
    setShowExplanation(false);
    setExpandedStep(0);
    try {
      const testCases = runOnly
        ? (selected || newExercise).test_cases.slice(0, 1)
        : (selected || newExercise).test_cases;
      const res = await axios.post(`${API}/submit`, { language, code, test_cases: testCases });
      saveCode((selected || newExercise).id || 'custom', language, code);
      setResult(res.data);
      const s = res.data.summary;
      if (s?.accepted) {
        const next = { ...progress, [(selected || newExercise).id || 'custom']: { solved: true, attempts: (progress[(selected || newExercise).id || 'custom']?.attempts || 0) + 1 } };
        setProgress(next);
        localStorage.setItem('judgeProgress', JSON.stringify(next));
        toast.success(`Accepted! ${s.passed}/${s.total} casos passaram.`);
      } else if (!runOnly && s) {
        toast.info(`${s.passed}/${s.total} casos passaram.`);
        if (res.data.explanation) { setShowExplanation(true); }
      }
    } catch (e) {
      console.error('Judge error:', e);
      toast.error(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Erro ao submeter.');
    } finally { setRunning(false); }
  };

  const generateExercise = async () => {
    setCreatingExercise(true);
    setNewExercise(null);
    setSelected(null);
    try {
      const res = await axios.post(`${API}/generate-exercise`, { topic: createTopic, difficulty: createDifficulty, language });
      setNewExercise(res.data);
      setCode(res.data.starter_code || STARTERS[language]);
      toast.success('Novo exercicio gerado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar exercicio.');
    } finally { setCreatingExercise(false); }
  };

  const solvedCount = Object.values(progress).filter((p) => p?.solved).length;
  const activeExercise = selected || newExercise;

  if (activeExercise) {
    const explanation = result?.explanation;
    return (
      <div className="materials-judge">
        <button className="materials-judge-back" onClick={() => { setSelected(null); setNewExercise(null); setResult(null); setShowExplanation(false); }}>
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="materials-judge-problem-head">
          <div>
            <span className="materials-judge-problem-id">{(activeExercise.id || 'CUSTOM').toUpperCase()}</span>
            <h3>{activeExercise.title}</h3>
            <p>{activeExercise.topic} - Dificuldade: {[1,2,3,4,5].map(i => <Star key={i} size={13} className={i <= activeExercise.difficulty ? 'filled' : ''} />)}</p>
          </div>
          {progress[activeExercise.id]?.solved && <span className="materials-judge-solved-badge"><CheckCircle2 size={15} /> Resolvido</span>}
        </div>

        <div className="materials-judge-statement">
          <p>{activeExercise.statement}</p>
          <div className="materials-judge-box"><b>Entrada</b><p>{activeExercise.inputFormat}</p></div>
          <div className="materials-judge-box"><b>Saida</b><p>{activeExercise.outputFormat}</p></div>
          <div className="materials-judge-examples">
            {(activeExercise.examples || activeExercise.test_cases || []).slice(0, 3).map((ex, i) => (
              <div className="materials-judge-example" key={i}>
                <div><b>Entrada</b><pre>{ex.input}</pre></div>
                <div><b>Saida</b><pre>{ex.output || ex.expected}</pre></div>
              </div>
            ))}
          </div>
        </div>

        <div className="materials-judge-editor">
          <div className="materials-judge-editor-top">
            <div className="materials-judge-langs">
              {Object.entries(LANG_NAMES).map(([key, label]) => (
                <button key={key} className={language === key ? 'active' : ''} onClick={() => changeLanguage(key)}>{label}</button>
              ))}
            </div>
            <span className="materials-judge-cases"><ListOrdered size={13} /> {(activeExercise.test_cases || []).length} testes</span>
          </div>
          <textarea className="materials-judge-code" spellCheck="false" value={code} onChange={(e) => { setCode(e.target.value); saveCode(activeExercise.id || 'custom', language, e.target.value); }} />
          <div className="materials-judge-actions">
            <button className="materials-judge-run" onClick={() => submit(true)} disabled={running}>
              {running ? <Loader2 size={15} className="materials-spin" /> : <Play size={15} />} Executar (1o caso)
            </button>
            <button className="materials-judge-submit" onClick={() => submit(false)} disabled={running}>
              {running ? <Loader2 size={15} className="materials-spin" /> : <Send size={15} />}
              {running ? 'Executando...' : 'Enviar para o juiz'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`materials-judge-result ${result.summary?.accepted ? 'accepted' : ''}`}>
            <div className="materials-judge-result-head">
              <Trophy size={17} />
              <b>{result.summary?.accepted ? 'Accepted! Todos os casos passaram.' : `Veredito: ${result.summary?.passed}/${result.summary?.total} casos passaram`}</b>
            </div>

            {result.compile?.stderr && !result.compile?.ok && (
              <div className="materials-judge-compile-error">
                <b>Erro de compilacao:</b><pre>{result.compile.stderr}</pre>
              </div>
            )}

            {result.tests.length > 0 && (
              <div className="materials-judge-tests">
                {result.tests.map((t) => (
                  <div className={`materials-judge-test ${t.passed ? 'pass' : 'fail'}`} key={t.index}>
                    <span className="materials-judge-test-icon">{t.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</span>
                    <div className="materials-judge-test-info">
                      <b>Caso {t.index}</b>
                      {!t.passed && (<>
                        <small>Esperado: <pre>{t.expected}</pre></small>
                        <small>Recebido: <pre>{t.actual || '(sem saida)'}</pre></small>
                      </>)}
                      {t.stderr && <small className="err">stderr: {t.stderr}</small>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {explanation && showExplanation && (
              <div style={{
                marginTop: 16, borderRadius: 12, overflow: 'hidden',
                border: '2px solid #f59e0b',
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Brain size={20} color="#000" />
                  <b style={{ fontSize: 16, color: '#000' }}>Analise do Erro</b>
                </div>

                {/* Content */}
                <div style={{ background: '#111', padding: 16 }}>

                  {/* Error Type */}
                  <div style={{
                    background: '#1e1e1e', borderRadius: 8, padding: 12, marginBottom: 12,
                    borderLeft: '4px solid #f59e0b',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <b style={{ color: '#f59e0b', fontSize: 14 }}>Tipo do erro:</b>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>{explanation.error_type}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#a3a3a3', lineHeight: 1.5 }}>{explanation.analysis}</p>
                  </div>

                  {/* Steps */}
                  {explanation.step_by_step?.map((step, i) => (
                    <div key={i} style={{
                      background: expandedStep === i ? '#1a1a2e' : '#1a1a1a',
                      borderRadius: 8, marginBottom: 8,
                      border: `1px solid ${expandedStep === i ? '#3b82f6' : '#333'}`,
                      overflow: 'hidden', transition: 'all 0.2s',
                    }}>
                      <button
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 14px', background: 'transparent', border: 'none',
                          cursor: 'pointer', textAlign: 'left', color: '#fff',
                        }}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: expandedStep === i ? '#3b82f6' : '#333',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                          transition: 'background 0.2s',
                        }}>{step.step}</span>
                        <div style={{ flex: 1 }}>
                          <b style={{ fontSize: 14, color: '#fff' }}>{step.title}</b>
                          {step.concept && expandedStep !== i && (
                            <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>
                              <BookOpen size={10} style={{ display: 'inline' }} /> {step.concept}
                            </div>
                          )}
                        </div>
                        {expandedStep === i ? <ChevronUp size={16} color="#a3a3a3" /> : <ChevronDown size={16} color="#a3a3a3" />}
                      </button>
                      {expandedStep === i && (
                        <div style={{ padding: '0 14px 14px 52px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.7, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>{step.detail}</p>
                          {step.concept && (
                            <div style={{
                              background: '#0f172a', borderRadius: 6, padding: '8px 10px',
                              marginBottom: 8, border: '1px solid #1e40af',
                            }}>
                              <BookOpen size={12} color="#60a5fa" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                              <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>Conceito: </span>
                              <span style={{ color: '#93c5fd', fontSize: 12 }}>{step.concept}</span>
                            </div>
                          )}
                          {step.code_hint && (
                            <pre style={{
                              background: '#0d1117', color: '#7ee787', padding: 10,
                              borderRadius: 6, fontSize: 12, overflow: 'auto', margin: 0,
                              border: '1px solid #30363d',
                            }}>{step.code_hint}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Suggestion */}
                  {explanation.suggestion && (
                    <div style={{
                      background: '#052e16', borderRadius: 8, padding: 12, marginTop: 8,
                      borderLeft: '4px solid #22c55e',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Lightbulb size={14} color="#22c55e" />
                        <b style={{ color: '#4ade80', fontSize: 13 }}>Dica:</b>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#86efac', lineHeight: 1.5 }}>{explanation.suggestion}</p>
                    </div>
                  )}

                  {/* Corrected Code */}
                  {explanation.corrected_code && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Code2 size={14} color="#22c55e" />
                        <b style={{ color: '#4ade80', fontSize: 13 }}>Codigo Corrigido:</b>
                      </div>
                      <pre style={{
                        background: '#0d1117', color: '#7ee787', padding: 12,
                        borderRadius: 8, fontSize: 12, overflow: 'auto', margin: 0,
                        border: '1px solid #30363d', whiteSpace: 'pre-wrap',
                      }}>{explanation.corrected_code}</pre>
                    </div>
                  )}

                  {/* YouTube Videos */}
                  {explanation.youtube_videos?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <Youtube size={18} color="#fff" />
                        <b style={{ color: '#fff', fontSize: 14 }}>Videoaulas para Aprender</b>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {explanation.youtube_videos.map((vid, i) => (
                          <a
                            key={i}
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                              background: '#1a1a1a', borderRadius: 8, textDecoration: 'none',
                              color: '#fff', border: '1px solid #333',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#dc2626'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; }}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: 6, overflow: 'hidden',
                              background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {vid.thumbnail ? (
                                <img src={vid.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Youtube size={20} color="#dc2626" />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5' }}>{vid.title}</span>
                            </div>
                            <ExternalLink size={14} color="#a3a3a3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {explanation && !showExplanation && !result.summary?.accepted && (
              <button
                onClick={() => setShowExplanation(true)}
                style={{
                  marginTop: 12, width: '100%', padding: '12px 16px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 15, fontWeight: 700,
                }}
              >
                <Lightbulb size={18} />
                Por que errou? Ver analise passo a passo
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="materials-judge">
      <div className="materials-judge-hero">
        <div className="materials-judge-hero-icon"><Code2 size={26} /></div>
        <div className="materials-judge-hero-text">
          <h2>Juiz Online</h2>
          <p>Resolva problemas de programacao. O juiz analisa seus erros e explica como corrigir com videoaulas.</p>
        </div>
        <div className="materials-judge-hero-stats"><Trophy size={14} /><b>{solvedCount}</b>/{problems.length} resolvidos</div>
      </div>

      <div style={{
        background: '#111',
        borderRadius: 16, padding: 20, marginBottom: 20, color: '#fff',
        border: '1px solid #333',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Wand2 size={20} color="#a78bfa" />
          <b style={{ fontSize: 16 }}>Criar Novo Exercicio</b>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={createTopic} onChange={(e) => setCreateTopic(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #444', fontSize: 13, flex: 1, minWidth: 150, background: '#1a1a1a', color: '#fff' }}>
            <option value="variaveis">Variaveis e Tipos</option>
            <option value="condicionais">Condicionais</option>
            <option value="loops">Loops</option>
            <option value="strings">Strings</option>
            <option value="arrays">Arrays/Listas</option>
            <option value="estruturas_dados">Estruturas de Dados</option>
            <option value="recursao">Recursao</option>
          </select>
          <select value={createDifficulty} onChange={(e) => setCreateDifficulty(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #444', fontSize: 13, minWidth: 100, background: '#1a1a1a', color: '#fff' }}>
            <option value={1}>Facil</option>
            <option value={2}>Medio</option>
            <option value={3}>Dificil</option>
          </select>
          <select value={language} onChange={(e) => changeLanguage(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #444', fontSize: 13, minWidth: 90, background: '#1a1a1a', color: '#fff' }}>
            {Object.entries(LANG_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={generateExercise} disabled={creatingExercise} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff',
            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            {creatingExercise ? <Loader2 size={14} className="materials-spin" /> : <Sparkles size={14} />} Gerar
          </button>
        </div>
      </div>

      <div className="materials-judge-list">
        {problems.map((p) => {
          const st = progress[p.id]; const solved = st?.solved;
          return (
            <button className={`materials-judge-card ${solved ? 'solved' : ''}`} key={p.id} onClick={() => openProblem(p)}>
              <span className="materials-judge-card-icon">{solved ? <CheckCircle2 size={17} /> : <FileCode2 size={17} />}</span>
              <div className="materials-judge-card-body"><b>{p.title}</b><small>{p.topic}</small></div>
              <div className="materials-judge-card-diff">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= p.difficulty ? 'filled' : ''} />)}</div>
              <span className={`materials-judge-card-status ${solved ? 'solved' : st ? 'tried' : ''}`}>{solved ? 'Resolvido' : st ? 'Tentado' : 'Novo'}</span>
            </button>
          );
        })}
      </div>

      <div className="materials-judge-hint">
        <Sparkles size={15} />
        <span>Dica: use <b>Executar</b> para testar o primeiro caso antes de enviar.</span>
      </div>
    </div>
  );
};

export default JudgePanel;
