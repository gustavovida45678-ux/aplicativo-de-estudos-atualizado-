import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BookOpen, Code2, HelpCircle, X, Sparkles, Brain, Zap, AlertTriangle, Wand2 } from 'lucide-react';
import { BACKEND_URL } from '../../lib/backendUrl';

const API = `${BACKEND_URL}/api/judge`;

export function LineByLineExplanation({ 
  code, 
  language, 
  problem, 
  onClose,
  onApplyCorrected,
  isOpen 
}) {
  const [explanations, setExplanations] = useState({});
  const [hoveredLine, setHoveredLine] = useState(null);
  const [loadingLines, setLoadingLines] = useState(new Set());
  const [enabled, setEnabled] = useState(true);
  const [tooltipsVisible, setTooltipsVisible] = useState({});
  const [compileInfo, setCompileInfo] = useState({ error: null, corrected: null });
  const [checkingCompile, setCheckingCompile] = useState(false);
  const editorRef = useRef(null);
  const linesRef = useRef(code.split('\n'));
  const tooltipTimeoutRef = useRef(null);

  useEffect(() => {
    linesRef.current = code.split('\n');
  }, [code]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    if (!code.trim()) return;
    setCheckingCompile(true);
    axios.post(`${API}/check-compile`, {
      language,
      code,
      lineNumber: 1,
      totalLines: linesRef.current.length,
      statement: problem?.statement || '',
      topic: problem?.topic || '',
    }).then((res) => {
      if (!cancelled) {
        setCompileInfo({
          error: res.data.compile_error || null,
          corrected: res.data.corrected_code || null,
        });
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setCheckingCompile(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, code, language, problem]);

  const generateLineExplanation = useCallback(async (lineNumber) => {
    if (!code.trim() || explanations[lineNumber] || loadingLines.has(lineNumber)) return;
    
    const newLoading = new Set(loadingLines);
    newLoading.add(lineNumber);
    setLoadingLines(newLoading);

    try {
      const res = await axios.post(`${API}/explain-line`, {
        language,
        code,
        lineNumber,
        totalLines: linesRef.current.length,
        statement: problem?.statement || '',
        topic: problem?.topic || '',
      });
      
      setExplanations(prev => ({
        ...prev,
        [lineNumber]: res.data.explanation
      }));
      
      if (res.data.compile_error) {
        setCompileInfo(prev => ({
          error: res.data.compile_error,
          corrected: res.data.corrected_code || prev.corrected,
        }));
      }
      
      setTooltipsVisible(prev => ({ ...prev, [lineNumber]: true }));
    } catch (e) {
      console.error('Erro ao gerar explicação da linha:', e);
    } finally {
      const newLoading = new Set(loadingLines);
      newLoading.delete(lineNumber);
      setLoadingLines(newLoading);
    }
  }, [code, language, problem, explanations, loadingLines]);

  const handleLineHover = useCallback((lineNumber) => {
    if (!enabled) return;
    setHoveredLine(lineNumber);
    
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!explanations[lineNumber] && !loadingLines.has(lineNumber)) {
        generateLineExplanation(lineNumber);
      } else {
        setTooltipsVisible(prev => ({ ...prev, [lineNumber]: true }));
      }
    }, 300);
  }, [enabled, explanations, loadingLines, generateLineExplanation]);

  const handleLineLeave = useCallback((lineNumber) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipsVisible(prev => ({ ...prev, [lineNumber]: false }));
      setHoveredLine(null);
    }, 500);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'h' || e.key === 'H') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setEnabled(!enabled);
      }
    }
  }, [isOpen, onClose, enabled]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const lines = linesRef.current;

  return (
    <div className="line-explanation-overlay" onClick={onClose}>
      <div className="line-explanation-panel" onClick={(e) => e.stopPropagation()}>
        <div className="line-explanation-header">
          <div className="line-explanation-title">
            <Sparkles size={20} color="#60a5fa" />
            <span>Explicação por Linha</span>
          </div>
          <label className="line-explanation-toggle">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
            />
            <span>Ativar hover (Ctrl+H para alternar)</span>
          </label>
          <button className="line-explanation-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="line-explanation-toolbar">
          <button 
            onClick={() => {
              lines.forEach((_, i) => {
                if (!explanations[i] && !loadingLines.has(i)) {
                  generateLineExplanation(i);
                }
              });
            }}
            disabled={loadingLines.size > 0}
            className="toolbar-btn"
          >
            {loadingLines.size > 0 ? (
              <>
                <Zap size={14} className="spin" /> Gerando todas...
              </>
            ) : (
              <>
                <Brain size={14} /> Explicar todas as linhas
              </>
            )}
          </button>
          <span className="toolbar-info">
            {Object.keys(explanations).length} de {lines.length} linhas explicadas
          </span>
        </div>

        {checkingCompile && (
          <div className="line-explanation-checking">
            <Zap size={13} className="spin" color="#f59e0b" /> Verificando se o código compila...
          </div>
        )}
        {compileInfo.error && (
          <div className="line-explanation-error-banner">
            <AlertTriangle size={16} color="#fbbf24" />
            <div className="banner-text">
              <strong>Seu código não compilou:</strong>{' '}
              <span className="err-msg">{compileInfo.error.slice(0, 300)}</span>
            </div>
            {compileInfo.corrected && onApplyCorrected && (
              <button className="apply-fix-btn" onClick={() => onApplyCorrected(compileInfo.corrected)}>
                <Wand2 size={13} /> Usar código corrigido
              </button>
            )}
          </div>
        )}

        <div className="code-with-explanations">
          {lines.map((line, idx) => {
            const hasExplanation = explanations[idx];
            const isLoading = loadingLines.has(idx);
            const showTooltip = tooltipsVisible[idx] && hasExplanation;
            const lineNum = idx + 1;
            
            return (
              <div 
                key={idx} 
                className={`code-line ${hasExplanation ? 'explained' : ''} ${isLoading ? 'loading' : ''}`}
                onMouseEnter={() => handleLineHover(idx)}
                onMouseLeave={() => handleLineLeave(idx)}
              >
                <span className="line-number" title={hasExplanation ? 'Passe o mouse para ver explicação' : 'Passe o mouse para gerar explicação'}>
                  {lineNum}
                </span>
                <span className="line-content">
                  <code>{line || '\u00A0'}</code>
                </span>
                {hasExplanation && (
                  <span className="explanation-indicator">
                    <BookOpen size={12} color="#34d399" />
                  </span>
                )}
                {isLoading && (
                  <span className="line-loading">
                    <Zap size={12} className="spin" color="#f59e0b" />
                  </span>
                )}
                
                {showTooltip && hasExplanation && (
                  <div className="line-tooltip" style={{ top: idx * 22 }}>
                    <div className="tooltip-header">
                      <BookOpen size={14} color="#60a5fa" />
                      <span>Linha {lineNum}</span>
                      <button onClick={(e) => { e.stopPropagation(); setTooltipsVisible(prev => ({ ...prev, [idx]: false })); }}>
                        <X size={12} />
                      </button>
                    </div>
                    <div className="tooltip-content">
                      {hasExplanation.what && (
                        <div className="tooltip-section">
                          <strong>O que faz:</strong> {hasExplanation.what}
                        </div>
                      )}
                      {hasExplanation.syntax && (
                        <div className="tooltip-section">
                          <strong>Sintaxe:</strong> {hasExplanation.syntax}
                        </div>
                      )}
                      {hasExplanation.purpose && (
                        <div className="tooltip-section">
                          <strong>Por que aqui:</strong> {hasExplanation.purpose}
                        </div>
                      )}
                      {hasExplanation.commonError && (
                        <div className="tooltip-section warning">
                          <strong>⚠ Erro comum:</strong> {hasExplanation.commonError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="line-explanation-footer">
          <kbd>Esc</kbd> Fechar | <kbd>Ctrl+H</kbd> Alternar hover | Passe o mouse sobre uma linha
        </div>
      </div>
    </div>
  );
}

export default LineByLineExplanation;