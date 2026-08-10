import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Lightbulb, Brain, Wand2, BookOpen, ChevronDown, ChevronUp, X, MessageSquare,
  Code2, HelpCircle, Sparkles, Play, Pause, SkipForward, SkipBack,
  ArrowRight, Target, Zap, GraduationCap
} from 'lucide-react';
import { BACKEND_URL } from '../../lib/backendUrl';

const API = `${BACKEND_URL}/api/judge`;

const HINT_LEVELS = {
  1: { label: 'Explicação', desc: 'O que deve ser feito sem mostrar código', icon: Lightbulb, color: '#60a5fa' },
  2: { label: 'Dica', desc: 'Orientação mais específica', icon: Wand2, color: '#a78bfa' },
  3: { label: 'Código do Passo', desc: 'Somente o trecho necessário', icon: Code2, color: '#34d399' },
};

export function LearningMode({ 
  code, 
  language, 
  problem, 
  onApplyHint, 
  onClose,
  isOpen 
}) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const [reasoning, setReasoning] = useState(null);
  const [reasoningStep, setReasoningStep] = useState(0);
  const editorRef = useRef(null);
  const lastCodeRef = useRef(code);

  useEffect(() => {
    lastCodeRef.current = code;
  }, [code]);

  const generateNextStep = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/next-step`, {
        language,
        code,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
        currentStep,
        steps: steps.map(s => s.summary),
      });
      if (res.data.step) {
        const newStep = {
          ...res.data.step,
          level: 1,
        };
        setSteps(prev => [...prev, newStep]);
        setCurrentStep(steps.length);
        setHint(null);
        setShowHint(false);
        setHintLevel(1);
      }
    } catch (e) {
      console.error('Erro ao gerar próximo passo:', e);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem, currentStep, steps]);

  const generateHint = useCallback(async (level) => {
    if (!code.trim() || steps.length === 0) return;
    const step = steps[currentStep];
    if (!step) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API}/hint`, {
        language,
        code,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
        step: step.summary,
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
  }, [code, language, problem, steps, currentStep]);

  const generateReasoning = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/reasoning`, {
        language,
        code,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
      });
      setReasoning(res.data);
      setReasoningStep(0);
      setTeacherMode(true);
    } catch (e) {
      console.error('Erro ao gerar raciocínio:', e);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    if (e.key === 't' || e.key === 'T') {
      if (e.shiftKey) {
        e.preventDefault();
        generateHint(2);
      } else if (e.altKey) {
        e.preventDefault();
        generateHint(3);
      } else {
        e.preventDefault();
        if (steps.length === 0 || currentStep >= steps.length - 1) {
          generateNextStep();
        }
      }
    }
    
    if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, steps, currentStep, generateNextStep, generateHint, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const HintIcon = HINT_LEVELS[hintLevel]?.icon;
  const currentStepData = steps[currentStep];

  return (
    <div className="learning-mode-overlay" onClick={onClose}>
      <div className="learning-mode-panel" onClick={(e) => e.stopPropagation()}>
        <div className="learning-mode-header">
          <div className="learning-mode-title">
            <GraduationCap size={20} color="#60a5fa" />
            <span>Modo Aprender Código</span>
          </div>
          <div className="learning-mode-badges">
            <span className="badge">T = Próximo passo</span>
            <span className="badge">Shift+T = Dica</span>
            <span className="badge">Alt+T = Código</span>
          </div>
          <button className="learning-mode-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {teacherMode && reasoning && (
          <div className="teacher-mode-panel">
            <div className="teacher-mode-header">
              <Brain size={18} color="#fbbf24" />
              <span>Modo Professor - Raciocínio da Solução</span>
              <button onClick={() => setTeacherMode(false)} className="teacher-close">
                <X size={16} /> Sair do Modo Professor
              </button>
            </div>
            <div className="reasoning-steps">
              {reasoning.steps?.map((step, idx) => (
                <div key={idx} className={`reasoning-step ${idx === reasoningStep ? 'active' : ''} ${idx < reasoningStep ? 'completed' : ''}`}>
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.description}</div>
                    {step.concept && <div className="step-concept"><BookOpen size={12} /> {step.concept}</div>}
                  </div>
                  {idx === reasoningStep && <ArrowRight size={20} color="#60a5fa" />}
                </div>
              ))}
            </div>
            <div className="reasoning-controls">
              <button onClick={() => setReasoningStep(Math.max(0, reasoningStep - 1))} disabled={reasoningStep === 0}>
                <SkipBack size={16} /> Anterior
              </button>
              <span>Passo {reasoningStep + 1} de {reasoning.steps?.length || 0}</span>
              <button onClick={() => setReasoningStep(Math.min((reasoning.steps?.length || 1) - 1, reasoningStep + 1))} disabled={reasoningStep >= (reasoning.steps?.length || 1) - 1}>
                Próximo <SkipForward size={16} />
              </button>
            </div>
          </div>
        )}

        {!teacherMode && (
          <div className="learning-content">
            {steps.length === 0 ? (
              <div className="learning-empty">
                <Target size={48} color="#60a5fa" />
                <h3>Pronto para começar?</h3>
                <p>Pressione <kbd>T</kbd> para ver o primeiro passo da resolução.</p>
                <div className="learning-hints">
                  <span>O sistema analisa seu código e o enunciado</span>
                  <span>Mostra o próximo passo lógico</span>
                  <span>Não entrega a solução completa</span>
                </div>
                <button onClick={generateNextStep} disabled={loading} className="learning-start-btn">
                  {loading ? <Play size={16} className="spin" /> : <Zap size={16} />}
                  {loading ? 'Analisando...' : 'Ver Primeiro Passo (T)'}
                </button>
              </div>
            ) : (
              <>
                <div className="steps-progress">
                  {steps.map((step, idx) => (
                    <div key={idx} className={`step-indicator ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}>
                      <span className="step-num">{idx + 1}</span>
                      <span className="step-label" title={step.summary}>{step.summary}</span>
                    </div>
                  ))}
                </div>

                <div className="current-step-card">
                  <div className="step-header">
                    <span className="step-badge">Passo {currentStep + 1}</span>
                    <span className="step-title">{currentStepData?.summary || 'Analisando...'}</span>
                  </div>
                  
                  <div className="step-explanation">
                    {currentStepData?.explanation && (
                      <div className="explanation-text">
                        {currentStepData.explanation}
                      </div>
                    )}
                    {currentStepData?.why && (
                      <div className="why-section">
                        <div className="why-label"><HelpCircle size={14} /> Por que isso?</div>
                        <p>{currentStepData.why}</p>
                      </div>
                    )}
                    {currentStepData?.concept && (
                      <div className="concept-tag">
                        <BookOpen size={14} /> Conceito: {currentStepData.concept}
                      </div>
                    )}
                  </div>

                  <div className="hint-levels">
                    {Object.entries(HINT_LEVELS).map(([level, config]) => (
                      <button
                        key={level}
                        onClick={() => generateHint(Number(level))}
                        disabled={loading}
                        className={`hint-btn ${hintLevel >= Number(level) ? 'active' : ''} ${hintLevel === Number(level) ? 'current' : ''}`}
                      >
                        <config.icon size={16} color={config.color} />
                        <span>
                          <strong>{config.label}</strong>
                          <br />
                          <small>{config.desc}</small>
                        </span>
                      </button>
                    ))}
                  </div>

                  {showHint && hint && (
                    <div className="hint-display" style={{ borderLeftColor: HINT_LEVELS[hintLevel]?.color }}>
                      <div className="hint-header">
                        <HintIcon size={16} color={HINT_LEVELS[hintLevel]?.color} />
                        <span>Nível {hintLevel} - {HINT_LEVELS[hintLevel]?.label}</span>
                      </div>
                      <pre className="hint-code">{hint}</pre>
                      <div className="hint-actions">
                        <button onClick={() => generateHint(hintLevel + 1)} disabled={hintLevel >= 3 || loading}>
                          Dar outra dica
                        </button>
                        {hintLevel < 3 && (
                          <button onClick={() => generateHint(hintLevel + 1)} className="primary">
                            Próximo nível
                          </button>
                        )}
                        {hintLevel === 3 && onApplyHint && (
                          <button onClick={() => onApplyHint(hint)} className="apply">
                            Aplicar ao editor
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="step-navigation">
                    <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || loading}>
                      <SkipBack size={16} /> Passo anterior
                    </button>
                    <button onClick={generateNextStep} disabled={loading} className="primary">
                      {loading ? <Play size={16} className="spin" /> : <>Próximo passo <SkipForward size={16} /></>}
                    </button>
                    <button onClick={generateReasoning} className="teacher-btn">
                      <GraduationCap size={16} /> Modo Professor
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="learning-footer">
          <kbd>Esc</kbd> para fechar | 
          <kbd>T</kbd> Próximo passo | 
          <kbd>Shift+T</kbd> Dica | 
          <kbd>Alt+T</kbd> Código do passo
        </div>
      </div>
    </div>
  );
}

export default LearningMode;