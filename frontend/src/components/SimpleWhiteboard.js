import { useRef, useEffect, useState } from "react";
import { PenTool, Eraser, Trash2, Download, RotateCcw, X, Minus, Plus, Type, Save, Loader2, BookMarked, Network, Expand, Shrink, GitFork, Pencil, Minimize2, Camera, CameraOff, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CameraHandTracking } from "./CameraHandTracking";

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

function SimpleWhiteboard({ onExit, onMinimize, minimized }) {
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
  const currentSubjectRef = useRef("default");
  const [subjectList, setSubjectList] = useState(listSavedSubjects);
  const [newSubjectName, setNewSubjectName] = useState("");
  
  // Text editing state
  const [editingText, setEditingText] = useState(null);
  const textInputRef = useRef(null);
  const lastPointRef = useRef(null);
  const textJustCreatedRef = useRef(false);
  // Copia do conteudo original ao editar texto/novo topico existente:
  // Esc REVERTE em vez de apagar.
  const textOriginalRef = useRef(null);

  // Câmera / rastreamento de mão
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("inactive");
  const [currentGesture, setCurrentGesture] = useState("none");
  const [handPosition, setHandPosition] = useState(null);
  const videoRef = useRef(null);
  const cameraDrawingRef = useRef(false);
  const lastHandPointRef = useRef(null);
  const handLostAtRef = useRef(null);
  const smoothPointRef = useRef(null);

  // Mapa mental
  const nodesRef = useRef([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedNodeIdRef = useRef(null);
  const setSelectedNode = (id) => {
    selectedNodeIdRef.current = id;
    setSelectedNodeId(id);
  };
  const dragNodeRef = useRef(null);
  const dragOffsetRef = useRef(null);

  // Tamanho do quadro (crescer)
  const [boardExtra, setBoardExtra] = useState(0);
  const boardExtraRef = useRef(0);

  const COLORS = ["#ffffff", "#58a6ff", "#f78166", "#3fb950", "#d2a8ff", "#ffa657", "#ff7b72", "#79c0ff"];
  const FONTS = ["Inter", "Arial", "Georgia", "Courier New", "Comic Sans MS", "Times New Roman"];

  // Store drawn strokes for redraw
  const strokesRef = useRef([]);
  const textsRef = useRef([]);

  const applyCanvasSize = () => {
    const canvas = canvasRef.current;
    const rect = wrapperRef.current.getBoundingClientRect();
    const w = rect.width + boardExtraRef.current;
    const h = rect.height + boardExtraRef.current;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  };

  useEffect(() => {
    applyCanvasSize();
    redraw();
    const resize = () => {
      applyCanvasSize();
      redraw();
    };
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
    const W = rect.width + boardExtraRef.current;
    const H = rect.height + boardExtraRef.current;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);
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

    // Redraw mind map nodes
    nodesRef.current.forEach(node => {
      if (!node.parentId) return;
      const parent = nodesRef.current.find(n => n.id === node.parentId);
      if (!parent) return;
      const s = getNodeSize(ctx, node);
      const ps = getNodeSize(ctx, parent);
      const px = parent.x + ps.w / 2;
      const py = parent.y + ps.h;
      const cx = node.x + s.w / 2;
      const cy = node.y;
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px, py + (cy - py) * 0.4, cx, cy - (cy - py) * 0.4, cx, cy);
      ctx.stroke();
    });
    nodesRef.current.forEach(node => {
      const s = getNodeSize(ctx, node);
      const isSel = node.id === selectedNodeIdRef.current;
      const color = node.color || "#58a6ff";
      const x = node.x;
      const y = node.y;
      const r = 8;
      ctx.save();
      if (isSel) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + s.w, y, x + s.w, y + s.h, r);
      ctx.arcTo(x + s.w, y + s.h, x, y + s.h, r);
      ctx.arcTo(x, y + s.h, x, y, r);
      ctx.arcTo(x, y, x + s.w, y, r);
      ctx.closePath();
      ctx.fillStyle = "#161b22";
      ctx.fill();
      ctx.strokeStyle = isSel ? color : "#30363d";
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();
      const lines = node.content.split("\n");
      ctx.save();
      ctx.font = `${node.bold ? "bold " : ""}${node.size}px Inter`;
      ctx.fillStyle = node.content ? "#e6edf3" : "#57606a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        ctx.fillText(line, x + s.w / 2, y + s.h / 2 + (i - (lines.length - 1) / 2) * 22);
      });
      ctx.restore();
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

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  const getNodeSize = (ctx, node) => {
    const pad = 14;
    ctx.font = `${node.bold ? "bold " : ""}${node.size}px Inter`;
    const lines = (node.content || "").split("\n");
    let w = 0;
    lines.forEach(l => w = Math.max(w, ctx.measureText(l).width));
    return { w: Math.max(w, 40) + pad * 2, h: Math.max(lines.length * 22, 30) + pad };
  };

  const hitTestNode = (pt) => {
    const ctx = canvasRef.current.getContext("2d");
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const s = getNodeSize(ctx, n);
      if (pt.x >= n.x && pt.x <= n.x + s.w && pt.y >= n.y && pt.y <= n.y + s.h) return n;
    }
    return null;
  };

  const hitTestText = (pt) => {
    const ctx = canvasRef.current.getContext("2d");
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i];
      ctx.font = (t.bold ? "bold " : "") + (t.italic ? "italic " : "") + `${t.size}px ${t.font}`;
      const lines = t.content.split("\n");
      let w = 0;
      lines.forEach(l => w = Math.max(w, ctx.measureText(l).width));
      const h = lines.length * t.size * 1.3;
      const x0 = t.align === "center" ? t.x - w / 2 : t.align === "right" ? t.x - w : t.x;
      if (pt.x >= x0 - 6 && pt.x <= x0 + w + 6 && pt.y >= t.y - 6 && pt.y <= t.y + h + 6) return t;
    }
    return null;
  };

  const removeNodeSubtree = (id) => {
    const dead = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      nodesRef.current.forEach(n => {
        if (!dead.has(n.id) && n.parentId && dead.has(n.parentId)) {
          dead.add(n.id);
          changed = true;
        }
      });
    }
    nodesRef.current = nodesRef.current.filter(n => !dead.has(n.id));
    if (dead.has(selectedNodeIdRef.current)) setSelectedNode(null);
  };

  const pointInNode = (pt, node) => {
    const ctx = canvasRef.current.getContext("2d");
    const s = getNodeSize(ctx, node);
    return pt.x >= node.x && pt.x <= node.x + s.w && pt.y >= node.y && pt.y <= node.y + s.h;
  };

  const pointInText = (pt, t) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.font = (t.bold ? "bold " : "") + (t.italic ? "italic " : "") + `${t.size}px ${t.font}`;
    const lines = t.content.split("\n");
    let w = 0;
    lines.forEach(l => w = Math.max(w, ctx.measureText(l).width));
    const h = lines.length * t.size * 1.3;
    const x0 = t.align === "center" ? t.x - w / 2 : t.align === "right" ? t.x - w : t.x;
    return pt.x >= x0 - 6 && pt.x <= x0 + w + 6 && pt.y >= t.y - 6 && pt.y <= t.y + h + 6;
  };

  const removeOrphans = () => {
    const alive = new Set(nodesRef.current.map(n => n.id));
    let removed = true;
    while (removed) {
      removed = false;
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        if (n.parentId && !alive.has(n.parentId)) {
          nodesRef.current.splice(i, 1);
          alive.delete(n.id);
          removed = true;
        }
      }
    }
  };

  const eraseAt = (pt) => {
    // Borracha apaga textos e tópicos por onde passar
    textsRef.current = textsRef.current.filter(t => !pointInText(pt, t));
    const before = nodesRef.current.length;
    nodesRef.current = nodesRef.current.filter(n => !pointInNode(pt, n));
    if (nodesRef.current.length !== before) {
      removeOrphans();
      if (selectedNodeIdRef.current && !nodesRef.current.some(n => n.id === selectedNodeIdRef.current)) {
        setSelectedNode(null);
      }
    }
  };

  const openNodeEditor = (node) => {
    textJustCreatedRef.current = false;
    textOriginalRef.current = { ...node };
    setEditingText(node);
    setTimeout(() => {
      const el = textInputRef.current;
      if (el) {
        el.focus();
        const len = (node.content || "").length;
        el.setSelectionRange(len, len);
      }
    }, 0);
  };

  const openTextEditor = (t) => {
    textJustCreatedRef.current = false;
    textOriginalRef.current = { ...t };
    setEditingText(t);
    setTimeout(() => {
      const el = textInputRef.current;
      if (el) {
        el.focus();
        const len = (t.content || "").length;
        el.setSelectionRange(len, len);
      }
    }, 0);
  };

  const createNodeAt = (x, y) => {
    const node = {
      id: uid(),
      parentId: null,
      x, y,
      content: "",
      color,
      size: 16,
      bold: false,
      kind: "node"
    };
    nodesRef.current.push(node);
    setSelectedNode(node.id);
    openNodeEditor(node);
    redraw();
  };

  const addChildToSelected = () => {
    const p = nodesRef.current.find(n => n.id === selectedNodeIdRef.current);
    if (!p) return;
    const ctx = canvasRef.current.getContext("2d");
    const ps = getNodeSize(ctx, p);
    const sibs = nodesRef.current.filter(n => n.parentId === p.id);
    const node = {
      id: uid(),
      parentId: p.id,
      x: p.x + ps.w + 50,
      y: p.y + sibs.length * 72,
      content: "",
      color,
      size: 16,
      bold: false,
      kind: "node"
    };
    nodesRef.current.push(node);
    setSelectedNode(node.id);
    openNodeEditor(node);
    redraw();
  };

  const addSiblingToSelected = () => {
    const cur = nodesRef.current.find(n => n.id === selectedNodeIdRef.current);
    if (!cur) return;
    const ctx = canvasRef.current.getContext("2d");
    let node;
    if (cur.parentId) {
      const p = nodesRef.current.find(n => n.id === cur.parentId);
      const ps = getNodeSize(ctx, p);
      const sibs = nodesRef.current.filter(n => n.parentId === p.id);
      node = {
        id: uid(),
        parentId: p.id,
        x: p.x + ps.w + 50,
        y: p.y + sibs.length * 72,
        content: "",
        color,
        size: 16,
        bold: false,
        kind: "node"
      };
    } else {
      node = {
        id: uid(),
        parentId: null,
        x: cur.x + 40,
        y: cur.y + 80,
        content: "",
        color,
        size: 16,
        bold: false,
        kind: "node"
      };
    }
    nodesRef.current.push(node);
    setSelectedNode(node.id);
    openNodeEditor(node);
    redraw();
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeIdRef.current) return;
    removeNodeSubtree(selectedNodeIdRef.current);
    redraw();
    toast({ title: "Tópico excluído" });
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    const pt = getPoint(e);
    const node = hitTestNode(pt);
    if (node) {
      openNodeEditor(node);
      redraw();
      return;
    }
    const t = hitTestText(pt);
    if (t) {
      textsRef.current = textsRef.current.filter(x => x.content.trim());
      const real = hitTestText(pt);
      if (real) {
        openTextEditor(real);
        redraw();
      }
    }
  };

  const startDrawing = (e) => {
    if (tool === "mindmap") {
      e.preventDefault();
      const pt = getPoint(e);
      const hit = hitTestNode(pt);
      if (hit) {
        if (hit.id === selectedNodeIdRef.current) {
          dragNodeRef.current = hit;
          dragOffsetRef.current = { x: pt.x - hit.x, y: pt.y - hit.y };
        } else {
          setSelectedNode(hit.id);
        }
        return;
      }
      createNodeAt(pt.x, pt.y);
      return;
    }
    if (tool === "text") {
      // Impede o default do mousedown (mover foco p/ body), senao
      // o textarea recém-focado perde o foco na mesma hora e o overlay fecha
      e.preventDefault();
      const pt = getPoint(e);
      // Clique sobre texto/topico EXISTENTE edita em vez de criar novo
      const hitNode = hitTestNode(pt);
      if (hitNode) {
        openNodeEditor(hitNode);
        redraw();
        return;
      }
      const hitText = hitTestText(pt);
      if (hitText) {
        openTextEditor(hitText);
        redraw();
        return;
      }
      startTextEdit(pt.x, pt.y);
      return;
    }
    e.preventDefault();
    const pt = getPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
    }
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
    if (dragNodeRef.current) {
      e.preventDefault();
      const pt = getPoint(e);
      const n = dragNodeRef.current;
      n.x = pt.x - dragOffsetRef.current.x;
      n.y = pt.y - dragOffsetRef.current.y;
      redraw();
      return;
    }
    if (!isDrawing || tool === "text") return;
    e.preventDefault();
    const pt = getPoint(e);
    if (tool === "eraser") {
      eraseAt(pt);
    }
    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push(pt);
      redraw();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
    dragNodeRef.current = null;
    dragOffsetRef.current = null;
  };

  const startTextEdit = (x, y) => {
    const newText = {
      kind: "text",
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
    textJustCreatedRef.current = true;
    textOriginalRef.current = null;
    
    // Focus the textarea after render
    setTimeout(() => textInputRef.current?.focus(), 0);
  };

  const handleTextChange = (e) => {
    if (!editingText) return;
    // React 19 restaura inputs controlados ao valor do ultimo render;
    // mutar o objeto nao dispara re-render -> o texto digitado sumia.
    // Aqui atualizamos via setState e mantemos textsRef sincronizado.
    const updated = { ...editingText, content: e.target.value };
    const list = editingText.kind === "node" ? nodesRef.current : textsRef.current;
    const idx = list.indexOf(editingText);
    if (idx !== -1) list[idx] = updated;
    setEditingText(updated);
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
      if (editingText.kind === "node") {
        removeNodeSubtree(editingText.id);
      } else {
        // Remove empty text
        textsRef.current = textsRef.current.filter(t => t !== editingText);
      }
    }
    setEditingText(null);
    redraw();
  };

  const cancelTextEdit = () => {
    if (!editingText) return;
    if (textOriginalRef.current) {
      // Texto/topico EXISTENTE: Esc reverte para o conteudo original (nao apaga)
      const list = editingText.kind === "node" ? nodesRef.current : textsRef.current;
      const idx = list.indexOf(editingText);
      if (idx !== -1) list[idx] = textOriginalRef.current;
    } else if (editingText.kind === "node") {
      removeNodeSubtree(editingText.id);
    } else {
      textsRef.current = textsRef.current.filter(t => t !== editingText);
    }
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

  // ---------------- Câmera / rastreamento de mão ----------------
  const handleCameraGesture = (gesture, landmarks) => {
    setCurrentGesture(gesture);

    if (!landmarks || gesture === "none") {
      // Mão saiu do quadro: registra o instante (traço continua se voltar rápido)
      handLostAtRef.current = Date.now();
      return;
    }

    const indexTip = landmarks[8];
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Vídeo é espelhado (scaleX(-1)): inverte X para o cursor acompanhar a mão
    const rawX = (1 - indexTip.x) * canvasRect.width;
    const rawY = indexTip.y * canvasRect.height;

    // Suavização (média móvel) para reduzir o tremor e desenhar letras limpas
    if (smoothPointRef.current) {
      smoothPointRef.current.x = smoothPointRef.current.x * 0.4 + rawX * 0.6;
      smoothPointRef.current.y = smoothPointRef.current.y * 0.4 + rawY * 0.6;
    } else {
      smoothPointRef.current = { x: rawX, y: rawY };
    }

    const x = (smoothPointRef.current.x - pan.x) / scale;
    const y = (smoothPointRef.current.y - pan.y) / scale;
    setHandPosition({ x, y });

    // Se a mão ficou fora do quadro por muito tempo, começa um traço novo
    const lostMs = handLostAtRef.current ? Date.now() - handLostAtRef.current : 0;
    handLostAtRef.current = null;
    if (lostMs > 600) {
      cameraDrawingRef.current = false;
      lastHandPointRef.current = null;
    }

    // "open" encerra o traço
    if (gesture === "open") {
      cameraDrawingRef.current = false;
      lastHandPointRef.current = null;
      smoothPointRef.current = null;
      return;
    }

    const isEraser = gesture === "fist";
    if (!cameraDrawingRef.current) {
      cameraDrawingRef.current = true;
      lastHandPointRef.current = { x, y };
      return;
    }

    const last = lastHandPointRef.current;
    if (!last) {
      lastHandPointRef.current = { x, y };
      return;
    }

    strokesRef.current.push({
      points: [last, { x, y }],
      color: isEraser ? "#0d1117" : color,
      size: isEraser ? size * 3 : size
    });
    lastHandPointRef.current = { x, y };
    redraw();
  };

  const handleCameraStatusChange = (status) => {
    setCameraStatus(status);
  };

  const toggleCamera = () => {
    setCameraActive(prev => {
      if (!prev) setHandPosition(null);
      return !prev;
    });
  };

  // Desliga a câmera ao minimizar a lousa
  useEffect(() => {
    if (minimized) setCameraActive(false);
  }, [minimized]);

  const clearCanvas = () => {
    strokesRef.current = [];
    textsRef.current = [];
    nodesRef.current = [];
    setSelectedNode(null);
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

  const growBoard = (delta) => {
    boardExtraRef.current = Math.max(0, Math.min(6000, boardExtraRef.current + delta));
    setBoardExtra(boardExtraRef.current);
    applyCanvasSize();
    redraw();
  };

  // ── Salvamento por materia ──────────────────────────────────
  const persistBoard = () => {
    try {
      localStorage.setItem(
        subjectKey(currentSubjectRef.current),
        JSON.stringify({
          strokes: strokesRef.current,
          texts: textsRef.current,
          nodes: nodesRef.current,
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
          nodes: nodesRef.current,
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
      nodesRef.current = Array.isArray(data.nodes) ? data.nodes : [];
      setSelectedNode(null);
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
      nodesRef.current = [];
      setSelectedNode(null);
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
    nodesRef.current = [];
    setSelectedNode(null);
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
      nodesRef.current = [];
      setSelectedNode(null);
      redraw();
    }
    toast({ title: "Matéria excluída", description: `"${subject}" foi excluída` });
  };

  // Handle click outside text input to finish editing
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (minimized) return;
      // Ignora o proprio mousedown que criou o input de texto,
      // senao o overlay fecha no mesmo clique em que abre
      if (textJustCreatedRef.current) {
        textJustCreatedRef.current = false;
        return;
      }
      if (editingText && !e.target.closest(".text-input-overlay")) {
        finishTextEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingText, minimized]);

  // Apagar tópico selecionado com Delete/Backspace
  useEffect(() => {
    const onKey = (e) => {
      if (minimized) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = document.activeElement?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (selectedNodeIdRef.current && !editingText) {
        e.preventDefault();
        removeNodeSubtree(selectedNodeIdRef.current);
        redraw();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingText, minimized]);

  // Sincroniza tamanho quando a lousa volta a ficar visível; salva ao minimizar
  useEffect(() => {
    if (minimized) {
      persistBoard();
    } else {
      applyCanvasSize();
      redraw();
    }
  }, [minimized]);

  // Autosave: salva a lousa periodicamente e ao sair/fechar
  useEffect(() => {
    const autosave = () => {
      if (strokesRef.current.length || textsRef.current.length || nodesRef.current.length) {
        persistBoard();
      }
    };
    const id = setInterval(autosave, 4000);
    window.addEventListener("pagehide", autosave);
    window.addEventListener("beforeunload", autosave);
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", autosave);
      window.removeEventListener("beforeunload", autosave);
      autosave();
    };
  }, []);

  const selectedNode = nodesRef.current.find(n => n.id === selectedNodeId) || null;

  // Mantém o ref da matéria em sincronia com o estado (o autosave lê o ref)
  currentSubjectRef.current = currentSubject;

  return (
    <div className="simple-whiteboard" ref={wrapperRef} onWheel={handleWheel}>
      {onExit && (
        <div className="whiteboard-header">
          <button className="exit-btn" onClick={onExit} title="Sair">
            <X size={20} />
          </button>
          {onMinimize && (
            <button className="exit-btn" onClick={onMinimize} title="Minimizar lousa (usar o app)">
              <Minimize2 size={20} />
            </button>
          )}
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
          <button className={`tool-btn ${tool === "mindmap" ? "active" : ""}`} onClick={() => setTool("mindmap")} title="Mapa Mental (M) - clique para criar tópico, arraste para mover, duplo clique para editar">
            <Network size={20} />
          </button>
        </div>

        <div className="tool-divider" />

        <div className="tool-group">
          <button
            className={`tool-btn ${cameraActive ? "active" : ""} ${cameraActive && cameraStatus === "error" ? "danger" : ""}`}
            onClick={toggleCamera}
            title={cameraActive ? "Desligar câmera (desenhar com o dedo)" : "Ligar câmera (desenhar com o dedo)"}
          >
            {cameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>
          {cameraActive && (
            <span className="camera-status-chip" title="Estado da câmera">
              {cameraStatus === "error" ? <AlertCircle size={14} /> : <Zap size={14} />}
              {cameraStatus === "error" ? "Erro" : cameraStatus === "active" || cameraStatus === "detected" || cameraStatus === "gesture" ? (cameraStatus === "gesture" ? `Gesto: ${currentGesture}` : "Mão ok") : cameraStatus === "none" ? "Mão fora do quadro" : "Aguardando..."}
            </span>
          )}
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

        {selectedNode && tool === "mindmap" && (
          <>
            <div className="tool-divider" />
            <div className="tool-group node-actions">
              <button className="tool-btn" onClick={addChildToSelected} title="Adicionar filho ao tópico selecionado">
                <Plus size={18} />
              </button>
              <button className="tool-btn" onClick={addSiblingToSelected} title="Adicionar irmão">
                <GitFork size={18} />
              </button>
              <button className="tool-btn" onClick={() => { const n = nodesRef.current.find(x => x.id === selectedNodeId); if (n) { openNodeEditor(n); redraw(); } }} title="Editar texto do tópico">
                <Pencil size={18} />
              </button>
              <button className="tool-btn danger" onClick={deleteSelectedNode} title="Excluir tópico (Del)">
                <Trash2 size={18} />
              </button>
            </div>
          </>
        )}

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
          <button onClick={() => growBoard(400)} title={`Crescer o quadro (atual: +${boardExtra}px)`}><Expand size={20} /></button>
          <button onClick={() => growBoard(-400)} title="Diminuir o quadro (-400px)"><Shrink size={20} /></button>
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
        {cameraActive && (
          <CameraHandTracking
            isActive={cameraActive}
            onGesture={handleCameraGesture}
            onStatusChange={handleCameraStatusChange}
            videoRef={videoRef}
          />
        )}

        {cameraActive && (
          <div className="video-preview-container" style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 50,
            width: "160px",
            borderRadius: "10px",
            overflow: "hidden",
            border: "2px solid #30363d",
            background: "#0d1117",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="video-preview"
              style={{ transform: "scaleX(-1)", width: "100%", height: "auto", display: "block" }}
            />
            <div className="video-overlay" style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              right: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 12px",
              background: "rgba(13, 17, 23, 0.9)",
              border: "1px solid #30363d",
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              fontSize: "11px",
              color: "#e2e8f0",
              pointerEvents: "none"
            }}>
              <Zap size={12} style={{ color: "#58a6ff", marginRight: "6px" }} />
              <span>{currentGesture === "none" ? "Aguardando gesto..." : `Gesto: ${currentGesture}`}</span>
            </div>
          </div>
        )}

        {cameraActive && handPosition && (
          <div
            className={`hand-cursor-overlay ${currentGesture === "fist" ? "eraser" : ""}`}
            style={{
              left: handPosition.x * scale + pan.x,
              top: handPosition.y * scale + pan.y,
            }}
          />
        )}

        {cameraActive && (
          <div className="gesture-guide" style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            zIndex: 50,
            background: "rgba(13, 17, 23, 0.92)",
            border: "1px solid #30363d",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "#e2e8f0",
            pointerEvents: "none"
          }}>
            <strong style={{ display: "block", marginBottom: "4px", color: "#58a6ff" }}>Gestos</strong>
            <div>☝️ Apontar / 🤏 Pinça = escrever</div>
            <div>✊ Punho = borracha</div>
            <div>✋ Mão aberta = parar</div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onDoubleClick={handleDoubleClick}
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
              placeholder={editingText.kind === "node" ? "Título do tópico... (Ctrl+Enter finaliza, Esc cancela)" : "Digite seu texto... (Ctrl+Enter para finalizar, Esc para cancelar)"}
              rows={Math.max(1, (editingText.content || "").split("\n").length)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleWhiteboard;