import { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import {
  Code2, Star, CheckCircle2, XCircle, Loader2, ArrowLeft,
  FileCode2, Play, Send, Trophy, ListOrdered, Sparkles, Youtube,
  Lightbulb, ChevronDown, ChevronUp, Wand2, BookOpen, AlertTriangle,
  Brain, ExternalLink, RefreshCw, StepBack, StepForward, Pause, X, ListChecks,
  HelpCircle, MessageSquare, Calendar as CalendarIcon, TrendingUp,
  NotebookPen, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { JUDGE_PROBLEMS } from '../data/judgeProblems';
import '../styles/studyMaterials.css';
import { BACKEND_URL } from '../lib/backendUrl';

const API = `${BACKEND_URL}/api/judge`;

const STARTERS = {
  c: `#include <stdio.h>\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n`,
  python: `# seu codigo aqui\n`,
};

const LANG_NAMES = { c: 'C', cpp: 'C++', python: 'Python 3' };

const wtCtrl = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid #444',
  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const wtCtrlDisabled = { opacity: 0.35, cursor: 'default' };

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
  const [generatingSimilar, setGeneratingSimilar] = useState(false);

  const [walk, setWalk] = useState(null);
  const [walkIdx, setWalkIdx] = useState(0);
  const [walkLoading, setWalkLoading] = useState(false);
  const [walkPlay, setWalkPlay] = useState(false);

  const [showQuestionTab, setShowQuestionTab] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [showNotesTab, setShowNotesTab] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSavedAt, setNotesSavedAt] = useState(null);
  const [showReviewCalendar, setShowReviewCalendar] = useState(false);
  const [reviewSessions, setReviewSessions] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);

  const [vismoPrompt, setVismoPrompt] = useState('');
  const [vismoLoading, setVismoLoading] = useState(false);
  const [showVismo, setShowVismo] = useState(false);

  useEffect(() => {
    if (!walkPlay || !walk) return;
    const t = setInterval(() => {
      setWalkIdx((i) => {
        if (i >= walk.steps.length - 1) { setWalkPlay(false); return i; }
        return i + 1;
      });
    }, 1800);
    return () => clearInterval(t);
  }, [walkPlay, walk]);

  const saveCode = (id, lang, c) => { localStorage.setItem(`judge_code_${id}_${lang}`, c); };

  const notesKey = (id) => `judge_notes_${id || 'custom'}`;

  const hasNotes = (id) => {
    try { return !!(localStorage.getItem(notesKey(id)) || '').trim(); } catch { return false; }
  };

  const saveNotes = (id, text) => {
    localStorage.setItem(notesKey(id), text);
    setNotesSavedAt(new Date());
  };

  const clearNotes = (id) => {
    localStorage.removeItem(notesKey(id));
    setNotes('');
    setNotesSavedAt(null);
    toast.success('Anotacoes apagadas');
  };

  const recordAttempt = (exercise, accepted) => {
    const topicKey = exercise?.topic || 'default';
    const attemptsStr = localStorage.getItem('judgeAttempts') || '{}';
    let attempts;
    try { attempts = JSON.parse(attemptsStr); } catch { attempts = {}; }
    attempts[topicKey] = attempts[topicKey] || { successes: 0, total: 0, lastWrongTopics: [] };
    attempts[topicKey].total += 1;
    if (accepted) attempts[topicKey].successes += 1;
    localStorage.setItem('judgeAttempts', JSON.stringify(attempts));
  };

  const getTopicProgress = (topic) => {
    try {
      const attemptsStr = localStorage.getItem('judgeAttempts') || '{}';
      const attempts = JSON.parse(attemptsStr);
      const t = attempts[topic];
      if (!t || !t.total) return { successRate: 0, total: 0, successes: 0 };
      return { successRate: Math.round((t.successes / t.total) * 100), total: t.total, successes: t.successes };
    } catch { return { successRate: 0, total: 0, successes: 0 }; }
  };

  const openProblem = (p) => {
    const tp = p.topic || 'default';
    const progress = getTopicProgress(tp);
    if (!progress.successes && progress.total === 0) {
      // First attempt on this topic, allow opening
    } else if (progress.successRate < 90) {
      toast.warning(
        `Sua taxa de acerto em "${tp}" e de apenas ${progress.successRate}% (${progress.successes}/${progress.total}). ` +
        'Estude os topicos de erro e faca as revoes antes de avancar.',
        { duration: 7000 }
      );
      return;
    }
    const saved = localStorage.getItem(`judge_code_${p.id}_${language}`);
    setSelected(p);
    setCode(saved || STARTERS[language]);
    setResult(null);
    setShowExplanation(false);
    setExpandedStep(0);
    setShowQuestionTab(false);
    setQuestionHistory([]);
    setNotes(localStorage.getItem(notesKey(p.id)) || '');
    setNotesSavedAt(null);
    setGeneratedReport(null);
    setShowReviewCalendar(false);
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
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ['#7c3aed', '#a78bfa', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.35 }, colors });
        const frame = () => {
          confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors });
          confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
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
      setNotes(localStorage.getItem(notesKey(res.data.id)) || '');
      setNotesSavedAt(null);
      setShowNotesTab(false);
      toast.success('Novo exercicio gerado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar exercicio.');
    } finally { setCreatingExercise(false); }
  };

  const runWalkthrough = async () => {
    if (!code.trim()) { toast.warning('Escreva seu codigo primeiro.'); return; }
    setWalkLoading(true);
    setWalk(null);
    setWalkIdx(0);
    setWalkPlay(false);
    try {
      const tc = (selected || newExercise)?.test_cases || [];
      const stmt = (selected || newExercise)?.statement || '';
      const res = await axios.post(`${API}/walkthrough`, {
        language, code, test_cases: tc,
        statement: stmt,
        expected: tc[0]?.expected || '',
      });
      if (!res.data.steps?.length) {
        toast.error('Nao foi possivel gerar o passo a passo.');
        return;
      }
      setWalk(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar o passo a passo.');
    } finally { setWalkLoading(false); }
  };

  const generateSimilar = async () => {
    setGeneratingSimilar(true);
    try {
      const topic = (selected || newExercise)?.topic || createTopic;
      const baseDiff = (selected || newExercise)?.difficulty || createDifficulty;
      const diff = Math.min(5, baseDiff + 1);
      const title = (selected || newExercise)?.title || '';
      const res = await axios.post(`${API}/generate-similar`, { topic, difficulty: diff, language, original_title: title });
      setSelected(null);
      setNewExercise(res.data);
      setCode(res.data.starter_code || STARTERS[language]);
      setNotes(localStorage.getItem(notesKey(res.data.id)) || '');
      setNotesSavedAt(null);
      setShowNotesTab(false);
      setResult(null);
      setShowExplanation(false);
      setExpandedStep(0);
      toast.success(`Exercicio parecido gerado! (Dificuldade: ${diff})`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar exercicio parecido.');
    } finally { setGeneratingSimilar(false); }
  };

  const generateVismoPrompt = async () => {
    if (!code.trim()) { toast.warning('Escreva seu codigo primeiro.'); return; }
    setVismoLoading(true);
    try {
      const tc = (selected || newExercise)?.test_cases || [];
      const stmt = (selected || newExercise)?.statement || '';
      const res = await axios.post(`${API}/vismo-prompt`, {
        language,
        code,
        statement: stmt,
        title: (selected || newExercise)?.title || '',
        input: tc[0]?.input || '',
      });
      if (!res.data.prompt) {
        toast.error('Nao foi possivel gerar o prompt.');
        return;
      }
      setVismoPrompt(res.data.prompt);
      setShowVismo(true);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar o prompt do Vismo.');
    } finally { setVismoLoading(false); }
  };

  const copyVismoPrompt = () => {
    navigator.clipboard?.writeText(vismoPrompt).then(
      () => toast.success('Prompt copiado! Cole no vismo.studio/create'),
      () => toast.error('Nao foi possivel copiar.')
    );
  };

  const askQuestion = async () => {
    if (!questionInput.trim() || questionLoading) return;

    const question = questionInput.trim();
    const userMsg = { id: Date.now().toString(), role: 'user', content: question, timestamp: new Date().toISOString() };
    setQuestionHistory((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setQuestionLoading(true);

    try {
      const ex = activeExercise;
      const res = await axios.post(`${API}/question`, {
        language,
        code,
        statement: ex?.statement || '',
        topic: ex?.topic || '',
        question,
      });
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date().toISOString(),
      };
      setQuestionHistory((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof e.response?.data?.detail === 'string'
          ? e.response.data.detail
          : 'Erro ao consultar o professor virtual. Tente novamente.',
        timestamp: new Date().toISOString(),
      };
      setQuestionHistory((prev) => [...prev, assistantMsg]);
    } finally { setQuestionLoading(false); }
  };

  const generateReviewCalendar = async () => {
    const ex = activeExercise;
    if (!ex) return;
    try {
      const res = await axios.post(`${API}/review-calendar`, {
        topic: ex.topic || 'variaveis',
        topic_name: ex.title || ex.topic,
        difficulty: ex.difficulty || 1,
        failed: !result?.summary?.accepted,
      });
      setReviewSessions(res.data.reviews || []);
      setShowReviewCalendar(true);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar calendario de revisoes.');
    }
  };

  const detectWrongTopics = (exercise, result) => {
    const topic = exercise?.topic || '';
    const errorType = result?.explanation?.error_type || '';
    const stderr = result?.compile?.stderr || '';
    const testInfo = result?.tests?.filter(t => !t.passed) || [];

    const wrongTopics = [];
    const allTopics = {
      'variaveis': ['Variaveis', 'Tipos de dados', 'Entrada e saida', 'Operadores aritmeticos'],
      'condicionais': ['Condicionais (if/else)', 'Operadores logicos', 'Comparacao de valores'],
      'loops': ['Loops (for/while)', 'Contagem', 'Acumulacao'],
      'strings': ['Manipulacao de strings', 'Funcoes de string'],
      'arrays': ['Arrays/Listas', 'Iteracao em arrays', 'Indexacao'],
      'estruturas_dados': ['Pilhas', 'Filas', 'Listas encadeadas'],
      'recursao': ['Recursao', 'Casos base', 'Chamadas recursivas'],
    };

    const topicLower = topic?.toLowerCase() || '';
    let topicKey = Object.keys(allTopics).find(k => topicLower.includes(k));
    if (!topicKey && testInfo.some(t => t.stderr?.toLowerCase().includes('segmentation') || t.stderr?.toLowerCase().includes('pointer'))) {
      topicKey = 'ponteiros';
    }
    if (!topicKey) topicKey = 'variaveis';

    const candidates = allTopics[topicKey] || allTopics['variaveis'];

    if (stderr.toLowerCase().includes('undeclared') || stderr.toLowerCase().includes('nao declarada')) {
      wrongTopics.push('Declaracao e inicializacao de variaveis');
    }
    if (stderr.toLowerCase().includes('syntax') || stderr.toLowerCase().includes('syntaxe')) {
      wrongTopics.push('Sintaxe da linguagem');
    }
    if (testInfo.length > 0) {
      wrongTopics.push('Logica do problema (saida incorreta)');
      if (result.explanation?.analysis) {
        wrongTopics.push(...candidates);
      }
    }
    if (stderr.toLowerCase().includes('segmentation fault') || stderr.toLowerCase().includes('segmentation')) {
      wrongTopics.push('Acesso invalido a memoria (ponteiros)');
    }

    return [...new Set(wrongTopics)];
  };

  const buildErrorReport = (exercise, result) => {
    const wrongTopics = detectWrongTopics(exercise, result);
    const studySummary = result?.explanation?.analysis || result?.explanation?.suggestion || 'Revise o conceito e tente novamente.';
    const errorType = result?.explanation?.error_type || (result?.summary?.accepted ? '' : 'Erro de logica');

    const report = {
      exerciseTitle: exercise?.title || 'Exercicio',
      topic: exercise?.topic || '',
      difficulty: exercise?.difficulty || 1,
      errorType,
      wrongTopics,
      studySummary,
      testCasesPassed: result?.summary?.passed || 0,
      testCasesTotal: result?.summary?.total || 0,
      successRate: result ? Math.round((result.summary?.passed / result.summary?.total) * 100) : 0,
    };
    return report;
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
             <button className="materials-judge-steps" onClick={runWalkthrough} disabled={running || walkLoading}>
               {walkLoading ? <Loader2 size={15} className="materials-spin" /> : <ListChecks size={15} />}
               Passo a Passo
             </button>
             <button
               onClick={generateVismoPrompt}
               disabled={vismoLoading}
               className="materials-judge-vismo"
               title="Gerar prompt de video no Vismo Studio (explica passo a passo e o por que de cada variavel)"
             >
               {vismoLoading ? <Loader2 size={14} className="materials-spin" /> : <Youtube size={14} />}
               Video (Vismo)
             </button>
             <button
               onClick={generateSimilar}
               disabled={generatingSimilar}
               className="materials-judge-similar"
               title="Gerar exercicio similar com dificuldade +1"
             >
               {generatingSimilar ? <Loader2 size={14} className="materials-spin" /> : <RefreshCw size={14} />}
               Exercicio Parecido
             </button>
             <button
               onClick={() => setShowQuestionTab(!showQuestionTab)}
               className="materials-judge-question"
               title="Tire duvidas sobre este exercicio"
             >
               <HelpCircle size={14} />
               Duvidas
             </button>
             <button
               onClick={() => setShowNotesTab(!showNotesTab)}
               className={`materials-judge-notes-toggle ${showNotesTab ? 'active' : ''}`}
               title="Bloco de anotacoes deste exercicio (salvo automaticamente)"
             >
               <NotebookPen size={14} />
               Anotacoes
             </button>
             <button className="materials-judge-submit" onClick={() => submit(false)} disabled={running}>
               {running ? <Loader2 size={15} className="materials-spin" /> : <Send size={15} />}
               {running ? 'Executando...' : 'Enviar para o juiz'}
             </button>
           </div>
         </div>

         {showQuestionTab && (
           <div className="materials-judge-question-tab">
             <div style={{
               marginTop: 14, borderRadius: 12, overflow: 'hidden',
               border: '2px solid #06b6d4', background: '#111',
             }}>
               <div style={{
                 background: '#0f172a', padding: '12px 16px',
                 borderBottom: '1px solid #333',
                 display: 'flex', alignItems: 'center', gap: 10,
               }}>
                 <MessageSquare size={18} color="#67e8f9" />
                 <b style={{ fontSize: 15, color: '#67e8f9' }}>Duvidas sobre este Exercicio</b>
                 <span style={{ flex: 1 }} />
                 <button
                   onClick={() => setShowQuestionTab(false)}
                   style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 2 }}
                 >
                   <X size={16} />
                 </button>
               </div>

               <div style={{
                 padding: 14,
                 display: 'flex',
                 flexDirection: 'column',
                 gap: 10,
                 maxHeight: 280,
                 overflowY: 'auto',
               }}>
                 {questionHistory.length === 0 ? (
                   <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                     Faca perguntas sobre este exercicio! O professor virtual vai ajudar.
                   </p>
                 ) : (
                   questionHistory.map((msg) => (
                     <div key={msg.id} style={{
                       display: 'flex', flexDirection: 'column', gap: 4,
                       alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                       maxWidth: '80%',
                     }}>
                       <div style={{
                         padding: '8px 12px', borderRadius: 10, fontSize: 13,
                         lineHeight: 1.5, whiteSpace: 'pre-wrap',
                         background: msg.role === 'user' ? '#1e3a5f' : '#1a1a1a',
                         color: msg.role === 'user' ? '#93c5fd' : '#d4d4d4',
                         border: '1px solid ' + (msg.role === 'user' ? '#3b82f6' : '#333'),
                       }}>
                         {msg.content}
                       </div>
                     </div>
                   ))
                 )}
                 {questionLoading && (
                   <div style={{ display: 'flex', gap: 4, color: '#64748b', fontSize: 12 }}>
                     <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 0.9s infinite' }} />
                     <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 0.9s infinite 0.2s' }} />
                     <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 0.9s infinite 0.4s' }} />
                   </div>
                 )}
               </div>

               <div style={{
                 padding: '10px 12px', borderTop: '1px solid #333',
                 display: 'flex', gap: 8, alignItems: 'center',
               }}>
                 <input
                   type="text"
                   value={questionInput}
                   onChange={(e) => setQuestionInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                   placeholder="Digite sua duvida aqui..."
                   style={{
                     flex: 1, padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #333', background: '#0d1117',
                     color: '#fff', fontSize: 13, outline: 'none',
                   }}
                   disabled={questionLoading}
                 />
                 <button
                   onClick={askQuestion}
                   disabled={questionLoading || !questionInput.trim()}
                   style={{
                     padding: '8px 14px', borderRadius: 8, border: 'none',
                     background: '#06b6d4', color: '#fff', fontWeight: 700,
                     cursor: 'pointer', fontSize: 13,
                   }}
                 >
                   {questionLoading ? <Loader2 size={14} className="materials-spin" /> : <Send size={14} />}
                   Enviar
                 </button>
               </div>
             </div>
           </div>
         )}

         {showNotesTab && (
           <div className="materials-judge-notes-tab">
             <div className="materials-judge-notes-head">
               <NotebookPen size={18} color="#a78bfa" />
               <b>Bloco de Anotacoes</b>
               <span className="materials-judge-notes-sub">Salvas automaticamente neste dispositivo</span>
               <span style={{ flex: 1 }} />
               {notesSavedAt && (
                 <span className="materials-judge-notes-saved">
                   <CheckCircle2 size={12} /> Salvo {notesSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
               )}
               <button
                 onClick={() => clearNotes(activeExercise.id)}
                 className="materials-judge-notes-clear"
                 title="Apagar anotacoes deste exercicio"
               >
                 <Trash2 size={14} /> Limpar
               </button>
             </div>
             <textarea
               className="materials-judge-notes-area"
               placeholder={'Anote aqui: raciocinio, erros cometidos, como o juiz espera a saida, dicas...'}
               value={notes}
               onChange={(e) => {
                 setNotes(e.target.value);
                 saveNotes(activeExercise.id, e.target.value);
               }}
             />
             <div className="materials-judge-notes-foot">
               <span>{notes.length} caracteres</span>
             </div>
           </div>
         )}

         {showVismo && vismoPrompt && (
          <div style={{
            marginTop: 14, borderRadius: 12, overflow: 'hidden',
            border: '2px solid #dc2626', background: '#111',
          }}>
            <div style={{
              background: '#1f0b0b', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid #dc2626',
            }}>
              <Youtube size={18} color="#f87171" />
              <b style={{ fontSize: 15, color: '#f87171' }}>Prompt para Video no Vismo Studio</b>
              <span style={{ flex: 1 }} />
              <a
                href="https://vismo.studio/create"
                target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: 12, color: '#f87171', textDecoration: 'none',
                  border: '1px solid #dc2626', padding: '5px 10px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                }}
              >
                <ExternalLink size={13} /> Abrir vismo.studio/create
              </a>
              <button
                onClick={copyVismoPrompt}
                style={{
                  fontSize: 12, color: '#fff', background: '#dc2626', border: 'none',
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <FileCode2 size={13} /> Copiar prompt
              </button>
              <button onClick={() => setShowVismo(false)} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', padding: 2 }}>
                <X size={16} />
              </button>
            </div>
            <textarea
              readOnly
              value={vismoPrompt}
              onFocus={(e) => e.target.select()}
              spellCheck="false"
              style={{
                width: '100%', minHeight: 260, background: '#0a0a0a', color: '#fca5a5',
                border: 'none', padding: 14, fontSize: 12.5, fontFamily: 'Menlo, Consolas, monospace',
                resize: 'vertical', outline: 'none', lineHeight: 1.6,
              }}
            />
          </div>
         )}

         {walk && walk.steps.length > 0 && (
          <div style={{
            marginTop: 14, borderRadius: 12, overflow: 'hidden',
            border: '2px solid #7c3aed', background: '#111',
          }}>
            <div style={{
              background: '#1a0b2e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid #7c3aed',
            }}>
              <ListChecks size={18} color="#a78bfa" />
              <b style={{ fontSize: 15, color: '#a78bfa' }}>Passo a Passo - Execucao do Codigo</b>
              <span style={{ flex: 1 }} />
              {walk.stdin ? (
                <span style={{ fontSize: 11, color: '#94a3b8', background: '#111', padding: '4px 8px', borderRadius: 6, border: '1px solid #333' }}>
                  Entrada: {walk.stdin.replace(/\n/g, ' ')}
                </span>
              ) : null}
              <button onClick={() => { setWalk(null); setWalkPlay(false); }} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', padding: 2 }}>
                <X size={16} />
              </button>
            </div>

            {walk.template && (
              <div style={{
                background: 'rgba(124, 58, 237, 0.12)', borderBottom: '1px solid #7c3aed',
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                <Sparkles size={15} color="#a78bfa" />
                <span style={{ fontSize: 12.5, color: '#c4b5fd', flex: 1, minWidth: 200 }}>
                  Codigo vazio detectado: a solucao abaixo foi <b>preenchida automaticamente</b> para demonstrar como o exercicio deve ser resolvido.
                </span>
                {walk.corrected_code && (
                  <button
                    onClick={() => {
                      setCode(walk.corrected_code);
                      saveCode(activeExercise.id || 'custom', language, walk.corrected_code);
                      toast.success('Solucao preenchida no editor!');
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff',
                      fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Wand2 size={13} /> Usar solucao no editor
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(() => {
                const cur = walk.steps[walkIdx];
                const shownCode = (walk.template && walk.corrected_code) ? walk.corrected_code : code;
                const codeLines = shownCode.split('\n');
                return (
                  <>
                    <div style={{
                      background: '#0d1117', padding: '12px 0', borderBottom: '1px solid #333',
                      fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: 12.5, lineHeight: 1.7,
                    }}>
                      {walk.template && walk.corrected_code && (
                        <div style={{
                          padding: '2px 12px 6px', fontSize: 10.5, color: '#a78bfa', fontFamily: 'inherit',
                          letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 700,
                        }}>Codigo preenchido automaticamente (simulacao)</div>
                      )}
                      {codeLines.map((line, i) => {
                        const n = i + 1;
                        const isActive = cur && n === cur.line;
                        const isDone = cur && n < cur.line;
                        return (
                          <div key={i} style={{
                            display: 'flex', padding: '1px 12px',
                            background: isActive ? '#3b0764' : isDone ? '#161616' : 'transparent',
                            borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                          }}>
                            <span style={{ width: 30, color: '#4b5563', userSelect: 'none', flexShrink: 0 }}>{n}</span>
                            <span style={{
                              color: isActive ? '#fff' : isDone ? '#9ca3af' : '#d4d4d4',
                              whiteSpace: 'pre', flex: 1,
                            }}>{line || ' '}</span>
                            {isActive && <StepForward size={14} color="#a78bfa" style={{ marginTop: 3 }} />}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ padding: 14, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 260px', minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: '50%', background: '#7c3aed', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold',
                          }}>{walkIdx + 1}</span>
                          <b style={{ color: '#fff', fontSize: 13 }}>Passo {walkIdx + 1} de {walk.steps.length}</b>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#d4d4d4', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {cur?.explanation || ''}
                        </p>
                      </div>
                      <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>VARIAVEIS</div>
                        <pre style={{
                          margin: 0, background: '#0f172a', borderRadius: 6, padding: 8, fontSize: 11.5,
                          color: '#93c5fd', border: '1px solid #1e40af', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
                        }}>{Object.keys(cur?.variables || {}).length
                          ? JSON.stringify(cur.variables, null, 2)
                          : '(nenhuma variavel ainda)'}</pre>
                        {cur?.variable_details?.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
                              POR QUE CADA VARIAVEL EXISTE
                            </div>
                            {cur.variable_details.map((vd, i) => (
                              <div key={i} style={{
                                background: '#1a0b2e', borderRadius: 6, border: '1px solid #7c3aed',
                                padding: '8px 10px', marginBottom: 6,
                              }}>
                                <b style={{ color: '#c4b5fd', fontSize: 12 }}>
                                  {vd.name} <span style={{ color: '#7c3aed', fontWeight: 600 }}>({vd.type || 'variavel'})</span>
                                </b>
                                {vd.purpose && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#e9d5ff', lineHeight: 1.55 }}><b style={{ color: '#a78bfa' }}>Serve para: </b>{vd.purpose}</p>}
                                {vd.why && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#e9d5ff', lineHeight: 1.55 }}><b style={{ color: '#a78bfa' }}>Por que: </b>{vd.why}</p>}
                                {vd.used_in && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#e9d5ff', lineHeight: 1.55 }}><b style={{ color: '#a78bfa' }}>Usada em: </b>{vd.used_in}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', margin: '10px 0 4px' }}>SAIDA ACUMULADA</div>
                        <pre style={{
                          margin: 0, background: '#0d1117', borderRadius: 6, padding: 8, fontSize: 11.5,
                          color: '#7ee787', border: '1px solid #30363d', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto',
                        }}>{cur?.output || '(ainda sem saida)'}</pre>
                      </div>
                    </div>

                    <div style={{
                      padding: '10px 14px', borderTop: '1px solid #333', display: 'flex', alignItems: 'center',
                      gap: 8, justifyContent: 'center',
                    }}>
                      <button
                        onClick={() => { setWalkIdx(Math.max(0, walkIdx - 1)); setWalkPlay(false); }}
                        disabled={walkIdx === 0}
                        style={{ ...wtCtrl, background: '#1a1a1a', ...(walkIdx === 0 ? wtCtrlDisabled : {}) }}
                      ><StepBack size={15} /></button>
                      <button
                        onClick={() => setWalkPlay(!walkPlay)}
                        style={{ ...wtCtrl, background: '#7c3aed', width: 38, height: 34 }}
                      >{walkPlay ? <Pause size={15} /> : <Play size={15} />}</button>
                      <button
                        onClick={() => { setWalkIdx(Math.min(walk.steps.length - 1, walkIdx + 1)); setWalkPlay(false); }}
                        disabled={walkIdx === walk.steps.length - 1}
                        style={{ ...wtCtrl, background: '#1a1a1a', ...(walkIdx === walk.steps.length - 1 ? wtCtrlDisabled : {}) }}
                      ><StepForward size={15} /></button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

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
                border: '2px solid #333',
              }}>
                {/* Header */}
                <div style={{
                  background: '#111',
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid #333',
                }}>
                  <Brain size={20} color="#f59e0b" />
                  <b style={{ fontSize: 16, color: '#f59e0b' }}>Analise do Erro - Passo a Passo</b>
                </div>

                {/* Content */}
                <div style={{ background: '#111', padding: 16 }}>

                  {/* Error Type */}
                  <div style={{
                    background: '#111', borderRadius: 8, padding: 12, marginBottom: 12,
                    borderLeft: '4px solid #f59e0b', border: '1px solid #333',
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
                      background: '#111', borderRadius: 8, padding: 12, marginTop: 8,
                      borderLeft: '4px solid #22c55e', border: '1px solid #333',
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

                   {/* YouTube Videos por Passo */}
                  {explanation.step_by_step?.some(step => step.youtube_search) && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{
                        background: '#111',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px solid #333',
                      }}>
                        <Youtube size={18} color="#dc2626" />
                        <b style={{ color: '#fff', fontSize: 14 }}>Videoaulas por Conceito</b>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {explanation.step_by_step.filter(step => step.youtube_search).map((step, i) => (
                          <a
                            key={i}
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(step.youtube_search)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                              background: '#1a1a1a', borderRadius: 8, textDecoration: 'none',
                              color: '#fff', border: '1px solid #333',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#dc2626'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; }}
                          >
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#dc2626', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 'bold', flexShrink: 0,
                            }}>{step.step}</div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#e5e5e5' }}>{step.title}</span>
                              <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 2 }}>{step.youtube_search}</div>
                            </div>
                            <Youtube size={14} color="#dc2626" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YouTube Videos Gerais */}
                  {explanation.youtube_videos?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{
                        background: '#111',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px solid #333',
                      }}>
                        <Youtube size={18} color="#dc2626" />
                        <b style={{ color: '#fff', fontSize: 14 }}>Mais Videoaulas</b>
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
                  background: '#111',
                  color: '#f59e0b', border: '1px solid #333', borderRadius: 8, cursor: 'pointer',
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

        {result && result.summary && !result.summary.accepted && (
          <div style={{ marginTop: 14 }}>
            {(() => {
              const report = buildErrorReport(activeExercise, result);
              const successRate = report.successRate;
              const has90 = successRate >= 90;

              const recordAttempt = () => {
                const topicKey = activeExercise.topic || 'default';
                const attemptsStr = localStorage.getItem('judgeAttempts') || '{}';
                let attempts;
                try { attempts = JSON.parse(attemptsStr); } catch { attempts = {}; }
                attempts[topicKey] = attempts[topicKey] || { successes: 0, total: 0 };
                attempts[topicKey].total += 1;
                if (result.summary.accepted) attempts[topicKey].successes += 1;
                else {
                  const wrongTopics = detectWrongTopics(activeExercise, result);
                  attempts[topicKey].lastWrongTopics = [...new Set([...(attempts[topicKey].lastWrongTopics || []), ...wrongTopics])];
                }
                localStorage.setItem('judgeAttempts', JSON.stringify(attempts));
              };

              if (!generatedReport) {
                recordAttempt();
                setGeneratedReport(report);
              }

              return (
                <>
                  <div style={{
                    background: '#1a0b2e', borderRadius: 12, padding: 16,
                    border: '1px solid #f59e0b',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <AlertTriangle size={18} color="#f59e0b" />
                      <b style={{ fontSize: 16, color: '#f59e0b' }}>Relatorio de Erros</b>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 12, color: '#fbbf24' }}>
                        {successRate}% de acerto
                      </span>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <b style={{ fontSize: 12, color: '#93c5fd', textTransform: 'uppercase' }}>
                        Topicos com erro:
                      </b>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {report.wrongTopics.length > 0 ? (
                          report.wrongTopics.map((t, i) => (
                            <span key={i} style={{
                              fontSize: 11, color: '#fca5a5',
                              background: 'rgba(248,113,113,0.15)',
                              padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)',
                            }}>{t}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: '#64748b' }}>Nenhum topico especifico detectado</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <b style={{ fontSize: 12, color: '#93c5fd', textTransform: 'uppercase' }}>
                        Resumo do que estudar:
                      </b>
                      <p style={{
                        margin: '4px 0 0', fontSize: 12.5, color: '#d4d4d4', lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>{report.studySummary}</p>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <TrendingUp size={14} color={has90 ? '#34d399' : '#f59e0b'} />
                      <span style={{ fontSize: 12, color: has90 ? '#34d399' : '#f59e0b' }}>
                        {has90
                          ? 'Parabens! Voce atingiu 90% de acerto. Pode avancar!'
                          : `Ainda precisa de 90% de acerto para avancar. Ate agora: ${successRate}%. Faca mais exercicios e revise.`}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    marginTop: 12,
                    display: 'flex', gap: 8, alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <button
                      onClick={() => setShowQuestionTab(true)}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #333',
                        background: '#1a1a1a', color: '#67e8f9', cursor: 'pointer',
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <HelpCircle size={13} /> Tire duvidas sobre este erro
                    </button>
                    <button
                      onClick={generateReviewCalendar}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #7c3aed',
                        background: 'rgba(124,58,237,0.15)', color: '#a78bfa', cursor: 'pointer',
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <CalendarIcon size={13} /> Gerar calendario de 6 revisoes
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {showReviewCalendar && reviewSessions.length > 0 && (
          <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981', background: '#111' }}>
            <div style={{
              background: '#0f172a', padding: '12px 16px',
              borderBottom: '1px solid #333',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <CalendarIcon size={18} color="#34d399" />
              <b style={{ fontSize: 15, color: '#34d399' }}>Calendario de Revisoes (6 sessoes)</b>
              <span style={{ flex: 1 }} />
              <button
                onClick={() => setShowReviewCalendar(false)}
                style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviewSessions.map((rev, i) => (
                <div key={rev.id} style={{
                  padding: 12, borderRadius: 10,
                  background: rev.completed ? 'rgba(16,185,129,0.1)' : 'rgba(55,63,73,0.5)',
                  border: '1px solid ' + (rev.completed ? 'rgba(16,185,129,0.3)' : '#333'),
                  display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: rev.completed ? '#10b981' : '#7c3aed',
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 13, color: rev.completed ? '#34d399' : '#fff' }}>{rev.title}</b>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>{rev.date} (daqui a {rev.day_offset} dias)</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (rev.completed) return;
                      const res = await axios.post(`${API}/review-complete`, { id: rev.id });
                      if (res.data?.success) {
                        setReviewSessions((prev) => prev.map(r => r.id === rev.id ? { ...r, completed: true } : r));
                        toast.success('Revisao marcada como concluida!');
                      }
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #333',
                      background: rev.completed ? 'rgba(16,185,129,0.1)' : '#1a1a1a',
                      color: rev.completed ? '#34d399' : '#64748b', cursor: rev.completed ? 'default' : 'pointer',
                      fontSize: 11,
                    }}
                    disabled={rev.completed}
                  >
                    {rev.completed ? 'Feito' : 'Marcar'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              padding: '8px 16px', borderTop: '1px solid #333',
              fontSize: 11, color: '#64748b',
            }}>
              Revisoes espacadas: 1, 3, 7, 14, 30, 60 dias
            </div>
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
              {hasNotes(p.id) && <span className="materials-judge-card-notes" title="Tem anotacoes"><NotebookPen size={13} /></span>}
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

      <div style={{
        background: '#111', borderRadius: 16, padding: 16, marginTop: 12,
        border: '1px solid #333', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <RefreshCw size={18} color="#a78bfa" />
        <span style={{ flex: 1, fontSize: 13, color: '#a3a3a3' }}>
          Resolveu um exercicio e quer praticar mais? Crie um parecido!
        </span>
        <button
          onClick={generateSimilar}
          disabled={generatingSimilar}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: '#7c3aed', color: '#fff', fontWeight: 700,
            cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {generatingSimilar ? <Loader2 size={12} className="materials-spin" /> : <RefreshCw size={12} />}
          Gerar Parecido
        </button>
      </div>
    </div>
  );
};

export default JudgePanel;
