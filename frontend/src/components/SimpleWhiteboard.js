import { useRef, useEffect, useState } from "react";
import { PenTool, Eraser, Trash2, Download, RotateCcw, X, Minus, Plus, Type, Save, Loader2, BookMarked } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUBJECT_KEY_PREFIX = "lousa_subject_v1_";
const subjectKey = (name) => `${SUBJECT_KEY_PREFIX}${name}`;

const listSavedSubjects = () => {
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SUBJECT_KEY_PREFIX)) {
        out.push(key.replace(SUBJECT_KEY_PREFIX, ""));
      }
    }
    if (!out.includes("default")) out.push("default");
    return out.sort((a, b) => a.localeCompare(b));
  } catch {
    return ["default"];
  }
};

function SimpleWhiteboard({ onExit }) {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [textBold, setTextBold] = useState(false);
  const [textAlign, setTextAlign] = useState("left");

  // Materia (salvamento por disciplina)
  const [currentSubject, setCurrentSubject] = useState("default");
  const [subjectList, setSubjectList] = useState(listSavedSubjects);
  const [newSubjectName, setNewSubjectName] = useState("");
  
  // Text editing state
  const [editingText, setEditingText] = useState(null);
  const textInputRef = useRef(null);
  const lastPointRef = useRef(null);

  const COLORS = ["#ffffff", "#58a6ff", "#f78166", "#3fb950", "#d2a8ff", "#ffa657", "#ff7b72", "#79c0ff"];
  const FONTS = ["Inter", "Arial", "Georgia", "Courier New", "Comic Sans MS", "Times New Roman"];

  // Store drawn strokes for redraw
  const strokesRef = useRef([]);
  const textsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      const rect = wrapperRef.current.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = wrapperRef.current.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();

    // Redraw all strokes
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);
    
    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Redraw all texts
    textsRef.current.forEach(text => {
      const fontStyle = (text.bold ? "bold " : "") + (text.italic ? "italic " : "") + `${text.size}px ${text.font}`;
      ctx.font = fontStyle;
      ctx.fillStyle = text.color;
      ctx.textAlign = text.align;
      ctx.textBaseline = "top";
      
      const lines = text.content.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, text.x, text.y + i * text.size * 1.3);
      });
    });
    
    ctx.restore();
  };

  const startDrawing = (e) => {
    if (tool === "text") {
      const pt = getPoint(e);
      startTextEdit(pt.x, pt.y);
      return;
    }
    e.preventDefault();
    const pt = getPoint(e);
    lastPointRef.current = pt;
    setIsDrawing(true);
    
    // Start new stroke
    const newStroke = {
      points: [pt],
      color: tool === "eraser" ? "#0d1117" : color,
      size: tool === "eraser" ? size * 3 : size
    };
    strokesRef.current.push(newStroke);
  };

  const draw = (e) => {
    if (!isDrawing || tool === "text") return;
    e.preventDefault();
    const pt = getPoint(e);
    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push(pt);
      redraw();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const startTextEdit = (x, y) => {
    const newText = {
      x, y,
      content: "",
      color,
      size: fontSize,
      font: fontFamily,
      bold: textBold,
      italic: false,
      align: textAlign
    };
    textsRef.current.push(newText);
    setEditingText(newText);
    
    // Focus the textarea after render
    setTimeout(() => textInputRef.current?.focus(), 0);
  };

  const handleTextChange = (e) => {
    if (!editingText) return;
    editingText.content = e.target.value;
    redraw();
  };

  const handleTextKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      finishTextEdit();
    }
    if (e.key === "Escape") {
      cancelTextEdit();
    }
  };

  const finishTextEdit = () => {
    if (!editingText) return;
    if (!editingText.content.trim()) {
      // Remove empty text
      textsRef.current = textsRef.current.filter(t => t !== editingText);
    }
    setEditingText(null);
    redraw();
  };

  const cancelTextEdit = () => {
    if (!editingText) return;
    textsRef.current = textsRef.current.filter(t => t !== editingText);
    setEditingText(null);
    redraw();
  };

  const handleWheel = (e) => {
    if (editingText) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * factor, 0.25), 4));
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      redraw();
    }
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    textsRef.current = [];
    redraw();
    toast({ title: "Lousa limpa" });
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "lousa-digital.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Imagem salva" });
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    redraw();
  };

  // ── Salvamento por materia ──────────────────────────────────
  const persistBoard = () => {
    try {
      localStorage.setItem(
        subjectKey(currentSubject),
        JSON.stringify({
          strokes: strokesRef.current,
          texts: textsRef.current,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error("Erro ao salvar lousa:", e);
    }
  };

  const saveBoardToSubject = (subject = currentSubject) => {
    const target = subject || "default";
    try {
      localStorage.setItem(
        subjectKey(target),
        JSON.stringify({
          strokes: strokesRef.current,
          texts: textsRef.current,
          savedAt: new Date().toISOString(),
        })
      );
      setSubjectList(listSavedSubjects());
      toast({ title: "Quadro salvo", description: `Salvo na matéria "${target}"` });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o quadro" });
      console.error(e);
    }
  };

  const loadSubjectBoard = (subject) => {
    const target = subject || "default";
    try {
      const raw = localStorage.getItem(subjectKey(target));
      if (!raw) return false;
      const data = JSON.parse(raw);
      strokesRef.current = Array.isArray(data.strokes) ? data.strokes : [];
      textsRef.current = Array.isArray(data.texts) ? data.texts : [];
      redraw();
      return true;
    } catch (e) {
      console.error("Erro ao carregar lousa:", e);
      return false;
    }
  };

  const switchSubject = (next) => {
    if (next === currentSubject) return;
    persistBoard();
    setCurrentSubject(next);
    const loaded = loadSubjectBoard(next);
    if (!loaded) {
      strokesRef.current = [];
      textsRef.current = [];
      redraw();
    }
    toast({ title: next, description: loaded ? "Quadro carregado" : "Matéria vazia" });
  };

  const createSubject = () => {
    const name = newSubjectName.trim();
    if (!name) {
      toast({ title: "Digite um nome", description: "Informe o nome da matéria" });
      return;
    }
    persistBoard();
    setCurrentSubject(name);
    strokesRef.current = [];
    textsRef.current = [];
    redraw();
    saveBoardToSubject(name);
    setNewSubjectName("");
    toast({ title: "Matéria criada", description: `"${name}" criada e selecionada` });
  };

  const deleteSubject = (subject) => {
    if (subject === "default") {
      toast({ title: "Não é possível excluir", description: "A matéria padrão não pode ser excluída" });
      return;
    }
    localStorage.removeItem(subjectKey(subject));
    setSubjectList(listSavedSubjects());
    if (currentSubject === subject) {
      setCurrentSubject("default");
      strokesRef.current = [];
      textsRef.current = [];
      redraw();
    }
    toast({ title: "Matéria excluída", description: `"${subject}" foi excluída` });
  };

  // Handle click outside text input to finish editing
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingText && !e.target.closest(".text-input-overlay")) {
        finishTextEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingText]);

  return (
    <div className="simple-whiteboard" ref={wrapperRef} onWheel={handleWheel}>
      {onExit && (
        <div className="whiteboard-header">
          <button className="exit-btn" onClick={onExit} title="Sair">
            <X size={20} />
          </button>
          <div className="whiteboard-title">Lousa Digital</div>
        </div>
      )}

      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button className={`tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")} title="Caneta (P)">
            <PenTool size={20} />
          </button>
          <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => setTool("eraser")} title="Borracha (E)">
            <Eraser size={20} />
          </button>
          <button className={`tool-btn ${tool === "text" ? "active" : ""}`} onClick={() => setTool("text")} title="Texto (T)">
            <Type size={20} />
          </button>
        </div>

        <div className="tool-divider" />

        <div className="tool-group">
          <span className="tool-label">Cor</span>
          <div className="color-palette">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch ${color === c ? "active" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="color-picker" />
          </div>
        </div>

        <div className="tool-group">
          <span className="tool-label">Espessura</span>
          <input type="range" min="1" max="20" value={size} onChange={e => setSize(Number(e.target.value))} />
          <span className="size-value">{size}px</span>
        </div>

        {tool === "text" && (
          <>
            <div className="tool-divider" />
            <div className="tool-group">
              <span className="tool-label">Fonte</span>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="font-select">
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input type="number" min="8" max="120" value={fontSize} onChange={e => setFontSize(Math.max(8, Math.min(120, Number(e.target.value) || 20)))} className="font-size-input" />
              <button className={`mini-btn ${textBold ? "active" : ""}`} onClick={() => setTextBold(!textBold)} title="Negrito"><strong>B</strong></button>
              <button className={`mini-btn ${textAlign === "left" ? "active" : ""}`} onClick={() => setTextAlign("left")} title="Esquerda">Esq</button>
              <button className={`mini-btn ${textAlign === "center" ? "active" : ""}`} onClick={() => setTextAlign("center")} title="Centro">Cen</button>
              <button className={`mini-btn ${textAlign === "right" ? "active" : ""}`} onClick={() => setTextAlign("right")} title="Direita">Dir</button>
            </div>
          </>
        )}

        <div className="tool-divider" />

        <div className="tool-group actions">
          <button onClick={clearCanvas} title="Limpar tudo"><Trash2 size={20} /></button>
          <button onClick={saveImage} title="Baixar PNG"><Download size={20} /></button>
          <button onClick={resetView} title="Resetar zoom (0)"><RotateCcw size={20} /></button>
          <div className="zoom-display">
            <Minus size={16} onClick={() => setScale(s => Math.max(s * 0.8, 0.25))} />
            <span>{Math.round(scale * 100)}%</span>
            <Plus size={16} onClick={() => setScale(s => Math.min(s * 1.25, 4))} />
          </div>
        </div>

        <div className="tool-divider" />

        <div className="tool-group subjects-group">
          <BookMarked size={18} className="subjects-icon" />
          <select
            className="subject-select"
            value={currentSubject}
            onChange={(e) => switchSubject(e.target.value)}
            title="Matéria do quadro (cada matéria tem seu quadro salvo)"
          >
            {subjectList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="subject-input"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createSubject()}
            placeholder="Nova matéria..."
            title="Nome da nova matéria"
          />
          <button className="tool-btn" onClick={createSubject} title="Criar matéria">
            <Plus size={18} />
          </button>
          <button className="tool-btn subject-save-btn" onClick={() => saveBoardToSubject(currentSubject)} title="Salvar quadro nesta matéria">
            <Save size={18} />
          </button>
          <button className="tool-btn danger" onClick={() => deleteSubject(currentSubject)} title="Excluir matéria atual">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="whiteboard-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: "none", cursor: tool === "text" ? "text" : "crosshair" }}
        />
        
        {/* Text input overlay */}
        {editingText && (
          <div
            className="text-input-overlay"
            style={{
              left: editingText.x * scale + pan.x,
              top: editingText.y * scale + pan.y,
              minWidth: "120px",
              maxWidth: "400px"
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <textarea
              ref={textInputRef}
              autoFocus
              value={editingText.content}
              onChange={handleTextChange}
              onKeyDown={handleTextKeyDown}
              onBlur={finishTextEdit}
              className="text-input-field"
              style={{
                fontSize: editingText.size,
                color: editingText.color,
                fontFamily: editingText.font,
                fontWeight: editingText.bold ? "bold" : "normal",
                fontStyle: editingText.italic ? "italic" : "normal",
                textAlign: editingText.align,
                width: "100%"
              }}
              placeholder="Digite seu texto... (Ctrl+Enter para finalizar, Esc para cancelar)"
              rows={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleWhiteboard;