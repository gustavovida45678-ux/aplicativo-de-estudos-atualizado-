import { useState } from 'react';
import axios from 'axios';
import {
  Code2, Terminal, Star, CheckCircle2, XCircle, Loader2, ArrowLeft,
  FileCode2, Play, Send, Trophy, ListOrdered, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { JUDGE_PROBLEMS } from '../data/judgeProblems';
import '../styles/studyMaterials.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/judge`;

const STARTERS = {
  c: `#include <stdio.h>\n\nint main() {\n    // seu código aqui\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // seu código aqui\n    return 0;\n}\n`,
  python: `# seu código aqui\n`,
};

const LANG_NAMES = { c: 'C', cpp: 'C++', python: 'Python 3' };

const loadProgress = () => {
  try {
    return JSON.parse(localStorage.getItem('judgeProgress') || '{}');
  } catch {
    return {};
  }
};

const JudgePanel = () => {
  const [problems] = useState(JUDGE_PROBLEMS);
  const [selected, setSelected] = useState(null);
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState('');
  const [progress, setProgress] = useState(loadProgress);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const saveCode = (id, lang, c) => {
    localStorage.setItem(`judge_code_${id}_${lang}`, c);
  };

  const openProblem = (p) => {
    const saved = localStorage.getItem(`judge_code_${p.id}_${language}`);
    setSelected(p);
    setCode(saved || STARTERS[language]);
    setResult(null);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (selected) {
      const saved = localStorage.getItem(`judge_code_${selected.id}_${lang}`);
      setCode(saved || STARTERS[lang]);
    }
  };

  const submit = async (runOnly) => {
    if (!selected) return;
    if (!code.trim()) {
      toast.warning('Escreva seu código antes de enviar.');
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/submit`, {
        language,
        code,
        test_cases: runOnly ? selected.test_cases.slice(0, 1) : selected.test_cases,
      });
      saveCode(selected.id, language, code);
      setResult(res.data);
      const s = res.data.summary;
      if (s?.accepted) {
        const next = { ...progress, [selected.id]: { solved: true, attempts: (progress[selected.id]?.attempts || 0) + 1 } };
        setProgress(next);
        localStorage.setItem('judgeProgress', JSON.stringify(next));
        toast.success(`Accepted! ${s.passed}/${s.total} casos passaram.`);
      } else if (!runOnly && s) {
        toast.info(`${s.passed}/${s.total} casos passaram. Continue tentando!`);
      }
    } catch (e) {
      console.error('Judge error:', e);
      toast.error(
        typeof e.response?.data?.detail === 'string'
          ? e.response.data.detail
          : 'Erro ao submeter. Tente novamente.'
      );
    } finally {
      setRunning(false);
    }
  };

  const solvedCount = Object.values(progress).filter((p) => p?.solved).length;

  if (selected) {
    return (
      <div className="materials-judge">
        <button className="materials-judge-back" onClick={() => { setSelected(null); setResult(null); }}>
          <ArrowLeft size={16} />
          Voltar para a lista
        </button>

        <div className="materials-judge-problem-head">
          <div>
            <span className="materials-judge-problem-id">{selected.id.toUpperCase()}</span>
            <h3>{selected.title}</h3>
            <p>{selected.topic}  - Dificuldade:
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={13} className={i <= selected.difficulty ? 'filled' : ''} />
              ))}
            </p>
          </div>
          {progress[selected.id]?.solved && (
            <span className="materials-judge-solved-badge"><CheckCircle2 size={15} /> Resolvido</span>
          )}
        </div>

        <div className="materials-judge-statement">
          <p>{selected.statement}</p>
          <div className="materials-judge-box">
            <b>Entrada</b>
            <p>{selected.inputFormat}</p>
          </div>
          <div className="materials-judge-box">
            <b>Saída</b>
            <p>{selected.outputFormat}</p>
          </div>
          <div className="materials-judge-examples">
            {selected.examples.map((ex, i) => (
              <div className="materials-judge-example" key={i}>
                <div><b>Entrada</b><pre>{ex.input}</pre></div>
                <div><b>Saída</b><pre>{ex.output}</pre></div>
              </div>
            ))}
          </div>
        </div>

        <div className="materials-judge-editor">
          <div className="materials-judge-editor-top">
            <div className="materials-judge-langs">
              {Object.entries(LANG_NAMES).map(([key, label]) => (
                <button
                  key={key}
                  className={language === key ? 'active' : ''}
                  onClick={() => changeLanguage(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="materials-judge-cases"><ListOrdered size={13} /> {selected.test_cases.length} casos de teste</span>
          </div>
          <textarea
            className="materials-judge-code"
            spellCheck="false"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              saveCode(selected.id, language, e.target.value);
            }}
          />
          <div className="materials-judge-actions">
            <button className="materials-judge-run" onClick={() => submit(true)} disabled={running}>
              {running ? <Loader2 size={15} className="materials-spin" /> : <Play size={15} />}
              Executar (1º caso)
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
              <b>
                {result.summary?.accepted
                  ? 'Accepted! Todos os casos passaram.'
                  : `Veredito: ${result.summary?.passed}/${result.summary?.total} casos passaram`}
              </b>
            </div>
            {result.compile?.stderr && !result.compile?.ok && (
              <div className="materials-judge-compile-error">
                <b>Erro de compilação:</b>
                <pre>{result.compile.stderr}</pre>
              </div>
            )}
            {result.tests.length > 0 && (
              <div className="materials-judge-tests">
                {result.tests.map((t) => (
                  <div className={`materials-judge-test ${t.passed ? 'pass' : 'fail'}`} key={t.index}>
                    <span className="materials-judge-test-icon">
                      {t.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    </span>
                    <div className="materials-judge-test-info">
                      <b>Caso {t.index}</b>
                      {!t.passed && (
                        <>
                          <small>Esperado: <pre>{t.expected}</pre></small>
                          <small>Recebido: <pre>{t.actual || '(sem saída)'}</pre></small>
                        </>
                      )}
                      {t.stderr && <small className="err">stderr: {t.stderr}</small>}
                    </div>
                  </div>
                ))}
              </div>
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
          <h2>Juiz Online de Estrutura de Dados</h2>
          <p>Resolva problemas de programação estilo Beecrowd: escreva o código e envie para o juiz executar contra os casos de teste.</p>
        </div>
        <div className="materials-judge-hero-stats">
          <Trophy size={14} />
          <b>{solvedCount}</b>/{problems.length} resolvidos
        </div>
      </div>

      <div className="materials-judge-list">
        {problems.map((p) => {
          const st = progress[p.id];
          const solved = st?.solved;
          return (
            <button className={`materials-judge-card ${solved ? 'solved' : ''}`} key={p.id} onClick={() => openProblem(p)}>
              <span className="materials-judge-card-icon">
                {solved ? <CheckCircle2 size={17} /> : <FileCode2 size={17} />}
              </span>
              <div className="materials-judge-card-body">
                <b>{p.title}</b>
                <small>{p.topic}</small>
              </div>
              <div className="materials-judge-card-diff">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={12} className={i <= p.difficulty ? 'filled' : ''} />
                ))}
              </div>
              <span className={`materials-judge-card-status ${solved ? 'solved' : st ? 'tried' : ''}`}>
                {solved ? 'Resolvido' : st ? 'Tentado' : 'Novo'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="materials-judge-hint">
        <Sparkles size={15} />
        <span>Dica: use <b>Executar</b> para testar o primeiro caso antes de enviar. O juiz compara a saída exata (sem espaços extras no fim).</span>
      </div>
    </div>
  );
};

export default JudgePanel;
