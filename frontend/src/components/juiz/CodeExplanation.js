import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Code2, HelpCircle, BookOpen, Wand2, Lightbulb, X, MessageSquare,
  Copy, Check, ChevronDown, ChevronUp, Sparkles, Zap, AlertTriangle,
  Brain, Target
} from 'lucide-react';
import { BACKEND_URL } from '../../lib/backendUrl';

const API = `${BACKEND_URL}/api/judge`;

export function CodeExplanation({ 
  code, 
  language, 
  problem, 
  selection, 
  onClose,
  isOpen 
}) {
  const [explanation, setExplanation] = useState(null);
  const [mode, setMode] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState([]);
  const [showExamples, setShowExamples] = useState(false);
  const [relatedConcepts, setRelatedConcepts] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && selection) {
      generateExplanation();
    } else if (!isOpen) {
      setExplanation(null);
      setExamples([]);
      setRelatedConcepts([]);
    }
  }, [isOpen, selection, code, language, problem]);

  const generateExplanation = useCallback(async () => {
    if (!selection || !code.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/explain-selection`, {
        language,
        code,
        selection,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
        mode,
      });
      setExplanation(res.data.explanation);
      setExamples(res.data.examples || []);
      setRelatedConcepts(res.data.concepts || []);
    } catch (e) {
      console.error('Erro ao gerar explicação:', e);
      setExplanation('Não foi possível gerar a explicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [code, language, problem, selection, mode]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !selection) return null;

  const formatCode = (snippet) => {
    return snippet.replace(/</g, '<').replace(/>/g, '>');
  };

  return (
    <div className="code-explanation-overlay" onClick={onClose}>
      <div className="code-explanation-panel" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="code-explanation-header">
          <div className="selection-preview">
            <Code2 size={16} color="#60a5fa" />
            <code>{formatCode(selection.length > 60 ? selection.substring(0, 60) + '...' : selection)}</code>
          </div>
          <div className="explanation-modes">
            <button className={mode === 'simple' ? 'active' : ''} onClick={() => { setMode('simple'); generateExplanation(); }}>
              <Lightbulb size={14} /> Simples
            </button>
            <button className={mode === 'technical' ? 'active' : ''} onClick={() => { setMode('technical'); generateExplanation(); }}>
              <BookOpen size={14} /> Técnica
            </button>
            <button className={mode === 'examples' ? 'active' : ''} onClick={() => { setMode('examples'); generateExplanation(); }}>
              <Wand2 size={14} /> Exemplos
            </button>
          </div>
          <button className="explanation-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="code-explanation-content">
          {loading ? (
            <div className="explanation-loading">
              <div className="spinner" />
              <span>Gerando explicação...</span>
            </div>
          ) : explanation ? (
            <div className="explanation-body">
              <div className="explanation-section">
                <h4><HelpCircle size={16} /> O que este código faz</h4>
                <p>{explanation.what}</p>
              </div>

              {explanation.syntax && (
                <div className="explanation-section">
                  <h4><Code2 size={16} /> Sintaxe</h4>
                  <p>{explanation.syntax}</p>
                </div>
              )}

              {explanation.logic && (
                <div className="explanation-section">
                  <h4><Brain size={16} /> Lógica</h4>
                  <p>{explanation.logic}</p>
                </div>
              )}

              {explanation.purpose && (
                <div className="explanation-section">
                  <h4><Target size={16} /> Por que usar aqui</h4>
                  <p>{explanation.purpose}</p>
                </div>
              )}

              {explanation.types && (
                <div className="explanation-section">
                  <h4><BookOpen size={16} /> Tipos de variáveis</h4>
                  <ul>
                    {explanation.types.map((t, i) => (
                      <li key={i}><code>{t.name}</code>: {t.type} - {t.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.alternatives && (
                <div className="explanation-section">
                  <h4><Sparkles size={16} /> Alternativas</h4>
                  <ul>
                    {explanation.alternatives.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.commonErrors && (
                <div className="explanation-section warning">
                  <h4><AlertTriangle size={16} /> Erros comuns</h4>
                  <ul>
                    {explanation.commonErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.relationToProblem && (
                <div className="explanation-section relation">
                  <h4><MessageSquare size={16} /> Relação com o exercício</h4>
                  <p>{explanation.relationToProblem}</p>
                </div>
              )}

              {mode === 'examples' && examples.length > 0 && (
                <div className="explanation-section">
                  <h4><Wand2 size={16} /> Exemplos práticos</h4>
                  <div className="examples-grid">
                    {examples.map((ex, i) => (
                      <div key={i} className="example-card">
                        <pre><code>{formatCode(ex.code)}</code></pre>
                        {ex.explanation && <p>{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedConcepts.length > 0 && (
                <div className="explanation-section concepts">
                  <h4><BookOpen size={16} /> Conceitos relacionados</h4>
                  <div className="concepts-tags">
                    {relatedConcepts.map((c, i) => (
                      <span key={i} className="concept-tag">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="explanation-actions">
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(explanation, null, 2))} className="secondary">
                  <Copy size={14} /> Copiar explicação
                </button>
                <button onClick={onClose} className="primary">
                  <Check size={14} /> Entendi
                </button>
              </div>
            </div>
          ) : (
            <div className="explanation-error">
              <p>Não foi possível gerar a explicação.</p>
              <button onClick={generateExplanation}>Tentar novamente</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeExplanation;