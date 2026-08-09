import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Lightbulb, Brain, Code2, BookOpen, X, Wand2, ChevronDown, ChevronUp, Zap, MessageSquare, HelpCircle, Check, Copy } from 'lucide-react';
import { BACKEND_URL } from '../../lib/backendUrl';

const API = `${BACKEND_URL}/api/judge`;

export function ErrorExplanation({ 
  code, 
  language, 
  problem, 
  result, 
  onClose,
  isOpen 
}) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [showCorrection, setShowCorrection] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [hint, setHint] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const generateExplanation = useCallback(async () => {
    if (!code.trim() || !result) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/explain-error`, {
        language,
        code,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
        error: result.compile?.stderr || result.explanation?.analysis || '',
        tests: result.tests,
        summary: result.summary,
      });
      setExplanation(res.data);
    } catch (e) {
      console.error('Erro ao gerar explicação de erro:', e);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem, result]);

  const generateHint = useCallback(async (level) => {
    if (!code.trim() || !explanation) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/error-hint`, {
        language,
        code,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
        errorType: explanation.error_type,
        analysis: explanation.analysis,
        level,
      });
      setHint(res.data.hint);
      setHintLevel(level);
      setShowHint(true);
    } catch (e) {
      console.error('Erro ao gerar dica:', e);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem, explanation]);

  const toggleStep = useCallback((stepIndex) => {
    setExpandedSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      generateExplanation();
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown, generateExplanation]);

  if (!isOpen || !result) return null;

  const compileError = result.compile?.stderr;
  const hasCompileError = compileError && !result.compile?.ok;
  const failedTests = result.tests?.filter(t => !t.passed) || [];

  return (
    <div className="error-explanation-overlay" onClick={onClose}>
      <div className="error-explanation-panel" onClick={(e) => e.stopPropagation()}>
        <div className="error-explanation-header">
          <div className="error-title">
            <AlertTriangle size={20} color="#ef4444" />
            <span>Análise Educacional do Erro</span>
          </div>
          <div className="error-badges">
            {hasCompileError && <span className="badge error">Erro de Compilação</span>}
            {failedTests.length > 0 && <span className="badge logic">Erro de Lógica ({failedTests.length} testes)</span>}
          </div>
          <button className="error-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="error-loading">
            <Zap size={32} className="spin" color="#f59e0b" />
            <p>Analisando o erro e preparando explicação educacional...</p>
          </div>
        ) : explanation ? (
          <div className="error-content">
            <div className="error-type-card">
              <div className="error-type-header">
                <AlertTriangle size={16} color="#f59e0b" />
                <strong>Tipo do erro:</strong> {explanation.error_type || 'Erro desconhecido'}
              </div>
              <p className="error-analysis">{explanation.analysis || 'Análise não disponível'}</p>
            </div>

            {explanation.step_by_step && explanation.step_by_step.length > 0 && (
              <div className="error-steps">
                <h4><Brain size={16} /> Passo a passo do diagnóstico</h4>
                {explanation.step_by_step.map((step, idx) => {
                  const isExpanded = expandedSteps[idx];
                  return (
                    <div key={idx} className={`error-step ${isExpanded ? 'expanded' : ''}`}>
                      <button onClick={() => toggleStep(idx)} className="step-header">
                        <span className="step-number">{step.step || idx + 1}</span>
                        <span className="step-title">{step.title}</span>
                        {step.concept && <span className="step-concept"><BookOpen size={12} /> {step.concept}</span>}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {isExpanded && (
                        <div className="step-detail">
                          <p>{step.detail}</p>
                          {step.code_hint && (
                            <pre className="step-hint">{step.code_hint}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {explanation.suggestion && (
              <div className="error-suggestion">
                <Lightbulb size={16} color="#f59e0b" />
                <div>
                  <strong>Dica para correção:</strong>
                  <p>{explanation.suggestion}</p>
                </div>
              </div>
            )}

            <div className="hint-levels">
              <span className="hint-label">Nível de ajuda:</span>
              <button 
                onClick={() => generateHint(1)} 
                disabled={loading}
                className={hintLevel >= 1 ? 'active' : ''}
              >
                <Lightbulb size={14} /> 1. Explicação
              </button>
              <button 
                onClick={() => generateHint(2)} 
                disabled={loading || hintLevel < 1}
                className={hintLevel >= 2 ? 'active' : ''}
              >
                <Wand2 size={14} /> 2. Dica
              </button>
              <button 
                onClick={() => generateHint(3)} 
                disabled={loading || hintLevel < 2}
                className={hintLevel >= 3 ? 'active' : ''}
              >
                <Code2 size={14} /> 3. Código do passo
              </button>
            </div>

            {showHint && hint && (
              <div className="hint-display" style={{ borderLeftColor: ['#60a5fa', '#a78bfa', '#34d399'][hintLevel - 1] }}>
                <div className="hint-header">
                  {['Lightbulb', 'Wand2', 'Code2'][hintLevel - 1] && null}
                  <span>Nível {hintLevel} - {['Explicação', 'Dica', 'Código do passo'][hintLevel - 1]}</span>
                </div>
                <pre>{hint}</pre>
                <div className="hint-actions">
                  {hintLevel < 3 && (
                    <button onClick={() => generateHint(hintLevel + 1)} disabled={loading} className="primary">
                      Próximo nível
                    </button>
                  )}
                  {hintLevel === 3 && (
                    <button onClick={() => setShowCorrection(true)} className="apply">
                      Ver correção completa
                    </button>
                  )}
                </div>
              </div>
            )}

            {showCorrection && explanation.corrected_code && (
              <div className="correction-display">
                <div className="correction-header">
                  <Code2 size={16} color="#34d399" />
                  <strong>Código Corrigido:</strong>
                  <button onClick={() => setShowCorrection(false)}><X size={14} /></button>
                </div>
                <pre>{explanation.corrected_code}</pre>
                <div className="correction-actions">
                  <button onClick={() => navigator.clipboard.writeText(explanation.corrected_code)} className="secondary">
                    <Copy size={14} /> Copiar
                  </button>
                </div>
              </div>
            )}

            {explanation.youtube_videos && explanation.youtube_videos.length > 0 && (
              <div className="error-videos">
                <h4><MessageSquare size={16} /> Videoaulas relacionadas</h4>
                {explanation.youtube_videos.map((vid, i) => (
                  <a key={i} href={vid.url} target="_blank" rel="noopener noreferrer" className="video-link">
                    <span>{vid.title}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="error-footer-actions">
              <button onClick={onClose} className="primary">
                <Check size={14} /> Entendi, vou corrigir
              </button>
            </div>
          </div>
        ) : (
          <div className="error-loading">
            <p>Não foi possível analisar o erro.</p>
            <button onClick={generateExplanation}>Tentar novamente</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorExplanation;