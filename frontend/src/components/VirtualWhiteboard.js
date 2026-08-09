import { useState, useRef, useEffect, useCallback } from "react";
import { 
  PenTool, 
  Eraser, 
  Shapes, 
  Type, 
  ColorPicker, 
  Trash2, 
  Undo, 
  Redo, 
  Download, 
  Minus, 
  Plus, 
  Move, 
  ArrowRight,
  Circle,
  Square,
  Triangle,
  Text,
  ZoomIn,
  ZoomOut,
  Save,
  Loader2,
  RotateCcw,
  Hand
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "../styles/virtualWhiteboard.css";

const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser',
  SHAPE: 'shape',
  TEXT: 'text',
  SELECT: 'select',
  PAN: 'pan'
};

const SHAPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  LINE: 'line',
  ARROW: 'arrow'
};

const STORAGE_KEY = 'virtual_whiteboard_state';

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        elements: parsed.elements || [],
        history: parsed.history || [],
        historyIndex: parsed.historyIndex ?? -1,
        pan: parsed.pan || { x: 0, y: 0 },
        scale: parsed.scale || 1,
      };
    }
  } catch (e) {
    console.error('Error loading whiteboard state:', e);
  }
  return null;
};

const saveStateToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving whiteboard state:', e);
  }
};

export default function VirtualWhiteboard() {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState(TOOLS.PEN);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [shapeType, setShapeType] = useState(SHAPES.RECTANGLE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tempElement, setTempElement] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const ctxRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setElements(saved.elements);
      setHistory(saved.history);
      setHistoryIndex(saved.historyIndex);
      setPan(saved.pan);
      setScale(saved.scale);
    }
  }, []);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  }, [pan, scale]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      const dataUrl = canvas.toDataURL();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex]);

  const persistState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const state = {
        elements,
        history: history.length > 0 ? history : [dataUrl],
        historyIndex: history.length > 0 ? historyIndex : 0,
        pan,
        scale,
      };
      saveStateToStorage(state);
      setLastSaved(new Date());
    }
  }, [elements, history, historyIndex, pan, scale]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistState();
    }, 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [elements, pan, scale, persistState]);

  const restoreState = useCallback((index) => {
    const canvas = canvasRef.current;
    if (canvas && history[index]) {
      const img = new Image();
      img.src = history[index];
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      setHistoryIndex(index);
    }
  }, [history]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      restoreState(historyIndex - 1);
    }
  }, [historyIndex, restoreState]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      restoreState(historyIndex + 1);
    }
  }, [historyIndex, history, restoreState]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      saveState();
      setElements([]);
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
      toast({ title: "Lousa limpa", description: "Todo o conteúdo foi removido" });
    }
  }, [saveState, toast]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const point = getCanvasPoint(e);
    const ctx = ctxRef.current;

    if (tool === TOOLS.PAN) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (tool === TOOLS.SELECT) {
      const element = elements.find(el => 
        point.x >= el.x && point.x <= el.x + (el.width || 0) &&
        point.y >= el.y && point.y <= el.y + (el.height || 0)
      );
      setSelectedElement(element || null);
      return;
    }

    if (tool === TOOLS.TEXT) {
      setTextPosition(point);
      setShowTextInput(true);
      setTextInput('');
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    
    if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      ctx.strokeStyle = tool === TOOLS.ERASER ? '#0d1117' : strokeColor;
      ctx.lineWidth = tool === TOOLS.ERASER ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = tool === TOOLS.ERASER ? 'destination-out' : 'source-over';
    } else if (tool === TOOLS.SHAPE) {
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor === 'transparent' ? 'rgba(0,0,0,0)' : fillColor;
      ctx.lineWidth = strokeWidth;
      setTempElement({ type: 'shape', shapeType, startX: point.x, startY: point.y });
    }
  }, [tool, strokeColor, fillColor, strokeWidth, shapeType, pan, elements, getCanvasPoint]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const point = getCanvasPoint(e);
    const ctx = ctxRef.current;

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isDrawing) return;

    if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (tool === TOOLS.SHAPE && tempElement) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawElements();
      
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor === 'transparent' ? 'rgba(0,0,0,0)' : fillColor;
      ctx.lineWidth = strokeWidth;
      
      const { startX, startY } = tempElement;
      const width = point.x - startX;
      const height = point.y - startY;
      
      switch (shapeType) {
        case SHAPES.RECTANGLE:
          ctx.rect(startX, startY, width, height);
          break;
        case SHAPES.CIRCLE:
          const radius = Math.sqrt(width * width + height * height) / 2;
          ctx.arc(startX + width/2, startY + height/2, radius, 0, 2 * Math.PI);
          break;
        case SHAPES.TRIANGLE:
          ctx.moveTo(startX + width/2, startY);
          ctx.lineTo(startX, startY + height);
          ctx.lineTo(startX + width, startY + height);
          ctx.closePath();
          break;
        case SHAPES.LINE:
          ctx.moveTo(startX, startY);
          ctx.lineTo(point.x, point.y);
          break;
        case SHAPES.ARROW:
          drawArrow(ctx, startX, startY, point.x, point.y, strokeWidth * 2);
          ctx.stroke();
          return;
      }
      
      if (fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
    }
  }, [isDrawing, isPanning, tool, shapeType, strokeColor, fillColor, strokeWidth, tempElement, panStart, getCanvasPoint]);

  const drawArrow = (ctx, fromX, fromY, toX, toY, headSize) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headSize * Math.cos(angle - Math.PI / 6), toY - headSize * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headSize * Math.cos(angle + Math.PI / 6), toY - headSize * Math.sin(angle + Math.PI / 6));
  };

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing && tool === TOOLS.SHAPE && tempElement) {
      const canvas = canvasRef.current;
      const point = getCanvasPoint({ clientX: panStart.x + pan.x, clientY: panStart.y + pan.y });
      const { startX, startY } = tempElement;
      const width = point.x - startX;
      const height = point.y - startY;
      
      setElements(prev => [...prev, {
        id: Date.now(),
        type: 'shape',
        shapeType,
        x: startX,
        y: startY,
        width,
        height,
        strokeColor,
        fillColor,
        strokeWidth
      }]);
      setTempElement(null);
      saveState();
      persistState();
    }
    
    setIsDrawing(false);
    setTempElement(null);
  }, [isDrawing, isPanning, tool, tempElement, shapeType, strokeColor, fillColor, strokeWidth, saveState, persistState, getCanvasPoint, pan, panStart]);

  const redrawElements = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    elements.forEach(el => {
      ctx.beginPath();
      ctx.strokeStyle = el.strokeColor;
      ctx.fillStyle = el.fillColor === 'transparent' ? 'rgba(0,0,0,0)' : el.fillColor;
      ctx.lineWidth = el.strokeWidth;
      
      switch (el.shapeType) {
        case SHAPES.RECTANGLE:
          ctx.rect(el.x, el.y, el.width, el.height);
          break;
        case SHAPES.CIRCLE:
          const radius = Math.sqrt(el.width * el.width + el.height * el.height) / 2;
          ctx.arc(el.x + el.width/2, el.y + el.height/2, radius, 0, 2 * Math.PI);
          break;
        case SHAPES.TRIANGLE:
          ctx.moveTo(el.x + el.width/2, el.y);
          ctx.lineTo(el.x, el.y + el.height);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.closePath();
          break;
        case SHAPES.LINE:
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          break;
        case SHAPES.ARROW:
          drawArrow(ctx, el.x, el.y, el.x + el.width, el.y + el.height, el.strokeWidth * 2);
          ctx.stroke();
          return;
      }
      
      if (el.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
    });
  }, [elements]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim() && textPosition) {
      setElements(prev => [...prev, {
        id: Date.now(),
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        content: textInput,
        color: strokeColor,
        fontSize: strokeWidth * 4
      }]);
      saveState();
      persistState();
    }
    setShowTextInput(false);
    setTextInput('');
    setTextPosition(null);
  }, [textInput, textPosition, strokeColor, strokeWidth, saveState, persistState]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, 0.25), 4);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newScale / scale),
        y: mouseY - (mouseY - prev.y) * (newScale / scale)
      }));
      setScale(newScale);
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [scale]);

  const exportImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsSaving(true);
    try {
      const link = document.createElement('a');
      link.download = `lousa-virtual-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: "Salvo!", description: "Imagem da lousa baixada com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a imagem", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    persistState();
  }, [persistState]);

  const manualSave = useCallback(() => {
    persistState();
    toast({ title: "Salvo!", description: "Estado da lousa salvo no navegador" });
  }, [persistState, toast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      
      const resize = () => {
        const container = containerRef.current;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          
          if (history[historyIndex]) {
            const img = new Image();
            img.src = history[historyIndex];
            img.onload = () => ctx.drawImage(img, 0, 0);
          } else {
            redrawElements();
          }
        }
      };
      
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, [history, historyIndex, redrawElements]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
      if (e.key === 'Delete' && selectedElement) {
        setElements(prev => prev.filter(el => el.id !== selectedElement.id));
        saveState();
        persistState();
        setSelectedElement(null);
      }
      if (e.key === 'Escape') {
        setShowTextInput(false);
        setSelectedElement(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElement, saveState, persistState, manualSave]);

  const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#c7ceea', '#f8b500', '#00d9ff', '#ff6ec7'];

  return (
    <div className="virtual-whiteboard" ref={containerRef}>
      <div className="whiteboard-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Ferramentas</span>
          <button
            className={`tool-btn ${tool === TOOLS.SELECT ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.SELECT)}
            title="Selecionar (V)"
          >
            <Move size={20} />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.PAN ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.PAN)}
            title="Mover tela (Espaço + Arrastar)"
          >
            <Hand size={20} />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.PEN ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.PEN)}
            title="Caneta (P)"
          >
            <PenTool size={20} />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.ERASER ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.ERASER)}
            title="Borracha (E)"
          >
            <Eraser size={20} />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.SHAPE ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.SHAPE)}
            title="Formas (F)"
          >
            <Shapes size={20} />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.TEXT ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.TEXT)}
            title="Texto (T)"
          >
            <Type size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {tool === TOOLS.SHAPE && (
          <div className="toolbar-group">
            <span className="toolbar-label">Forma</span>
            <select value={shapeType} onChange={(e) => setShapeType(e.target.value)} className="shape-select">
              <option value={SHAPES.RECTANGLE}>▭ Retângulo</option>
              <option value={SHAPES.CIRCLE}>● Círculo</option>
              <option value={SHAPES.TRIANGLE}>▲ Triângulo</option>
              <option value={SHAPES.LINE}>━ Linha</option>
              <option value={SHAPES.ARROW}>➤ Seta</option>
            </select>
          </div>
        )}

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <span className="toolbar-label">Cor da linha</span>
          <div className="color-palette">
            {colors.map(color => (
              <button
                key={color}
                className={`color-swatch ${strokeColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
                title={color}
              />
            ))}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="color-picker-input"
              title="Cor personalizada"
            />
          </div>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Preenchimento</span>
          <div className="color-palette">
            <button
              className={`color-swatch ${fillColor === 'transparent' ? 'active' : ''}`}
              onClick={() => setFillColor('transparent')}
              title="Sem preenchimento"
              style={{ background: 'repeating-linear-gradient(45deg, #1a1f2e, #1a1f2e 10px, #0d1117 10px, #0d1117 20px)' }}
            >
              <span className="no-fill">✕</span>
            </button>
            {colors.map(color => (
              <button
                key={`fill-${color}`}
                className={`color-swatch ${fillColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFillColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <span className="toolbar-label">Espessura</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="stroke-slider"
          />
          <span className="stroke-value">{strokeWidth}px</span>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group actions">
          <button className="action-btn" onClick={undo} title="Desfazer (Ctrl+Z)" disabled={historyIndex <= 0}>
            <Undo size={20} />
          </button>
          <button className="action-btn" onClick={redo} title="Refazer (Ctrl+Y)" disabled={historyIndex >= history.length - 1}>
            <Redo size={20} />
          </button>
          <button className="action-btn" onClick={resetView} title="Resetar zoom">
            <RotateCcw size={20} />
          </button>
          <button className="action-btn" onClick={manualSave} title="Salvar agora (Ctrl+S)" disabled={isSaving}>
            {isSaving ? <Loader2 size={20} className="spin" /> : <Save size={20} />}
          </button>
          <button className="action-btn" onClick={exportImage} title="Baixar imagem" disabled={isSaving}>
            {isSaving ? <Loader2 size={20} className="spin" /> : <Download size={20} />}
          </button>
          <button className="action-btn danger" onClick={clearCanvas} title="Limpar tudo">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="toolbar-info">
          <span>{Math.round(scale * 100)}%</span>
          {lastSaved && (
            <span className="last-saved">
              <Save size={12} /> Salvo: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span className="shortcuts">P: Caneta | E: Borracha | F: Formas | T: Texto | V: Selecionar | Espaço: Mover | Scroll: Zoom | Ctrl+S: Salvar</span>
        </div>
      </div>

      <div className="whiteboard-canvas-wrapper" onWheel={handleWheel}>
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            cursor: tool === TOOLS.PAN ? 'grab' : tool === TOOLS.ERASER ? 'cell' : 'crosshair'
          }}
        />
        
        {showTextInput && textPosition && (
          <div 
            className="text-input-overlay"
            style={{
              left: textPosition.x * scale + pan.x,
              top: textPosition.y * scale + pan.y,
              transform: `scale(${scale})`,
              transformOrigin: '0 0'
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              onBlur={handleTextSubmit}
              autoFocus
              className="text-input-field"
              placeholder="Digite seu texto..."
              style={{ fontSize: `${strokeWidth * 4}px`, color: strokeColor }}
            />
          </div>
        )}

        {selectedElement && (
          <div className="selection-box" style={{
            left: selectedElement.x * scale + pan.x,
            top: selectedElement.y * scale + pan.y,
            width: (selectedElement.width || 0) * scale,
            height: (selectedElement.height || 0) * scale,
            transform: `scale(${1/scale})`,
            transformOrigin: '0 0'
          }}>
            <button className="delete-selection" onClick={() => {
              setElements(prev => prev.filter(el => el.id !== selectedElement.id));
              saveState();
              setSelectedElement(null);
            }}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="whiteboard-status">
        <span>Ferramenta: {tool === TOOLS.PEN ? 'Caneta' : tool === TOOLS.ERASER ? 'Borracha' : tool === TOOLS.SHAPE ? `Forma (${shapeType})` : tool === TOOLS.TEXT ? 'Texto' : tool === TOOLS.SELECT ? 'Selecionar' : 'Mover'}</span>
        <span>Zoom: {Math.round(scale * 100)}%</span>
        <span>Elementos: {elements.length}</span>
      </div>
    </div>
  );
}