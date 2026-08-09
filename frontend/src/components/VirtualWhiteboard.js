import { useState, useRef, useEffect, useCallback } from "react";
import {
  PenTool,
  Eraser,
  Shapes,
  Type,
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
  ZoomIn,
  ZoomOut,
  Save,
  Loader2,
  RotateCcw,
  Hand,
  Check,
  Copy,
  ClipboardPaste,
  Group,
  Ungroup,
  LayoutGrid,
  Sparkles,
  Brain,
  Maximize,
  X,
  MousePointer2,
  MousePointerClick,
  GitBranch,
  Layers,
  FolderInput,
  FileDown,
  CornerDownRight,
  ListTree,
  Palette,
  Crosshair,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "../styles/virtualWhiteboard.css";

import {
  TOOLS,
  SHAPES,
  ERASER_MODES,
  GRID_MODES,
  MINDMAP_DIRECTIONS,
  STORAGE_KEY,
  MIN_ZOOM,
  MAX_ZOOM,
  COLORS,
  uid,
  deepClone,
  clamp,
  elementBBox,
  unionBox,
  boxFromPoints,
  makeStroke,
  makeShape,
  makeText,
  makeNode,
  makeConnector,
  makeGroup,
  loadState,
  saveState,
  STROKE_PRESETS,
  TOOL_PROFILES,
  TOOL_PROFILE_LABELS,
  STABILIZER_LEVELS,
  MINDMAP_TEXT_SIZES,
} from "./whiteboard/core";
import {
  dist2d,
  strokeHitTest,
  rectContainsPoint,
  rectsIntersect,
  splitStrokeAtCircle,
  resamplePoints,
  simplifyStroke,
  interpolateSegment,
} from "./whiteboard/geometry";
import { HistoryManager } from "./whiteboard/history";
import { detectShapeFromStroke } from "./whiteboard/shapeDetect";
import {
  drawGrid,
  renderElements,
  renderShapeElement,
  renderStrokeElement,
  renderTextElement,
  renderNodeElement,
  renderConnectorElement,
} from "./whiteboard/renderer";
import {
  autoLayout,
  addChildNode,
  addSiblingNode,
  removeNodeAndDescendants,
  subtreeIds,
  findRoot,
  buildTreeElements,
  toggleCollapse,
  countNodes,
} from "./whiteboard/mindmap";
import { exportPNG, exportPDF, exportSVG, sceneBBox } from "./whiteboard/export";
import { generateMindMapElements } from "./whiteboard/ai";

const TEXT_FONTS = ["Inter", "Arial", "Georgia", "Courier New", "Comic Sans MS", "Times New Roman"];

function VirtualWhiteboard() {
  const { toast } = useToast();

  // ---------------- Ref para o loop de render ----------------
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const miniCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const staticDirtyRef = useRef(true);
  const pointerRef = useRef(null);

  const liveStrokeRef = useRef(null);
  const tempShapeRef = useRef(null);
  const marqueeRef = useRef(null);
  const moveDragRef = useRef(null);
  const resizeDragRef = useRef(null);
  const pendingConnectorRef = useRef(null);
  const polygonRef = useRef(null);
  const historyRef = useRef(new HistoryManager(150));
  const beforeGestureRef = useRef(null);

  // ---------------- Estado ----------------
  const [elements, setElementsState] = useState([]);
  const elementsRef = useRef(elements);

  const [selectedIds, setSelectedIds] = useState([]);
  const selectedIdsRef = useRef([]);

  const [tool, setTool] = useState(TOOLS.PEN);
  const toolRef = useRef(tool);
  const [eraserMode, setEraserMode] = useState(ERASER_MODES.PARTIAL);
  const eraserModeRef = useRef(eraserMode);
  const [mindmapMode, setMindmapMode] = useState(false);
  const mindmapModeRef = useRef(false);
  const [shapeType, setShapeType] = useState(SHAPES.RECTANGLE);
  const shapeTypeRef = useRef(shapeType);

  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const strokeColorRef = useRef(strokeColor);
  const [fillColor, setFillColor] = useState("transparent");
  const fillColorRef = useRef(fillColor);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const strokeWidthRef = useRef(strokeWidth);

  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textAlign, setTextAlign] = useState("left");

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(scale);

  const [gridMode, setGridMode] = useState(GRID_MODES.NONE);
  const gridModeRef = useRef(gridMode);
  const [autoFix, setAutoFix] = useState(true);
  const autoFixRef = useRef(autoFix);
  const [showMinimap, setShowMinimap] = useState(true);
  const showMinimapRef = useRef(showMinimap);

  const [mindmapDirection, setMindmapDirection] = useState(MINDMAP_DIRECTIONS.LEFT_RIGHT);
  const [mindmapPalette, setMindmapPalette] = useState(true);

  const [toolProfile, setToolProfile] = useState("pen");
  const toolProfileRef = useRef(toolProfile);
  const [stabilizerLevel, setStabilizerLevel] = useState("medium");
  const stabilizerLevelRef = useRef(stabilizerLevel);
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const pressureEnabledRef = useRef(pressureEnabled);
  const [pressureMin, setPressureMin] = useState(0.35);
  const pressureMinRef = useRef(pressureMin);
  const [pressureMax, setPressureMax] = useState(1);
  const pressureMaxRef = useRef(pressureMax);
  const [autoZoomWriting, setAutoZoomWriting] = useState(false);
  const autoZoomWritingRef = useRef(autoZoomWriting);
  const [mindmapTextSize, setMindmapTextSize] = useState("medium");
  const mindmapTextSizeRef = useRef(mindmapTextSize);
  const [showPenCursor, setShowPenCursor] = useState(true);
  const showPenCursorRef = useRef(showPenCursor);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const spaceDownRef = useRef(false);

  const [textEdit, setTextEdit] = useState(null);
  const [aiModal, setAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [convertText, setConvertText] = useState("");

  const clipboardRef = useRef([]);

  // ---------------- Helpers de atualizacao ----------------
  const markStaticDirty = useCallback(() => {
    staticDirtyRef.current = true;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(renderNow);
    }
  }, []);

  const requestFrame = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(renderNow);
    }
  }, []);

  const commitElements = useCallback(
    (next) => {
      elementsRef.current = next;
      setElementsState(next);
      markStaticDirty();
    },
    [markStaticDirty]
  );

  const updateUndoRedo = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  const snapshot = useCallback(() => deepClone(elementsRef.current), []);

  const beginGesture = useCallback(() => {
    beforeGestureRef.current = snapshot();
  }, [snapshot]);

  const endGesture = useCallback(
    (changed) => {
      if (changed && beforeGestureRef.current !== null) {
        historyRef.current.push(beforeGestureRef.current);
        updateUndoRedo();
      }
      beforeGestureRef.current = null;
      markStaticDirty();
    },
    [markStaticDirty, snapshot, updateUndoRedo]
  );

  // ---------------- Espelhar refs de estado ----------------
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    eraserModeRef.current = eraserMode;
  }, [eraserMode]);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);
  useEffect(() => {
    strokeColorRef.current = strokeColor;
  }, [strokeColor]);
  useEffect(() => {
    fillColorRef.current = fillColor;
  }, [fillColor]);
  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);
  useEffect(() => {
    gridModeRef.current = gridMode;
  }, [gridMode]);
  useEffect(() => {
    autoFixRef.current = autoFix;
  }, [autoFix]);
  useEffect(() => {
    showMinimapRef.current = showMinimap;
  }, [showMinimap]);
  useEffect(() => {
    panRef.current = pan;
    markStaticDirty();
  }, [pan, markStaticDirty]);
  useEffect(() => {
    scaleRef.current = scale;
    markStaticDirty();
  }, [scale, markStaticDirty]);
  useEffect(() => {
    mindmapModeRef.current = mindmapMode;
  }, [mindmapMode]);
  useEffect(() => {
    spaceDownRef.current = spaceDown;
  }, [spaceDown]);
  useEffect(() => {
    toolProfileRef.current = toolProfile;
  }, [toolProfile]);
  useEffect(() => {
    stabilizerLevelRef.current = stabilizerLevel;
  }, [stabilizerLevel]);
  useEffect(() => {
    pressureEnabledRef.current = pressureEnabled;
  }, [pressureEnabled]);
  useEffect(() => {
    pressureMinRef.current = pressureMin;
  }, [pressureMin]);
  useEffect(() => {
    pressureMaxRef.current = pressureMax;
  }, [pressureMax]);
  useEffect(() => {
    autoZoomWritingRef.current = autoZoomWriting;
  }, [autoZoomWriting]);
  useEffect(() => {
    mindmapTextSizeRef.current = mindmapTextSize;
  }, [mindmapTextSize]);
  useEffect(() => {
    showPenCursorRef.current = showPenCursor;
  }, [showPenCursor]);

  // ---------------- Render loop ----------------
  const mapById = useCallback(() => {
    const m = {};
    for (const el of elementsRef.current) m[el.id] = el;
    return m;
  }, []);

  const drawStaticScene = useCallback(() => {
    const sc = staticCanvasRef.current;
    const canvas = canvasRef.current;
    if (!sc || !canvas) return;
    const sctx = sc.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const p = panRef.current;
    const s = scaleRef.current;
    const w = sc.width;
    const h = sc.height;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.fillStyle = "#0d1117";
    sctx.fillRect(0, 0, w, h);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(sctx, w / dpr, h / dpr, p, s, gridModeRef.current);
    sctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * p.x, dpr * p.y);
    renderElements(sctx, elementsRef.current, mapById(), s, true);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    drawMinimap();
  }, [mapById]);

  const drawMinimap = useCallback(() => {
    const mini = miniCanvasRef.current;
    if (!mini || !showMinimapRef.current) return;
    const mctx = mini.getContext("2d");
    const mw = mini.width;
    const mh = mini.height;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = "rgba(13,17,23,0.92)";
    mctx.fillRect(0, 0, mw, mh);
    const els = elementsRef.current;
    if (!els.length) return;
    const bbox = sceneBBox(els);
    const ms = Math.min((mw - 8) / bbox.width, (mh - 8) / bbox.height, 0.15);
    const ox = (mw - bbox.width * ms) / 2 - bbox.x * ms;
    const oy = (mh - bbox.height * ms) / 2 - bbox.y * ms;
    mctx.setTransform(ms, 0, 0, ms, ox, oy);
    renderElements(mctx, els, mapById());
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    const vx = panRef.current.x * ms + ox;
    const vy = panRef.current.y * ms + oy;
    const vw = (canvasRef.current ? canvasRef.current.clientWidth : 0) * ms;
    const vh = (canvasRef.current ? canvasRef.current.clientHeight : 0) * ms;
    mctx.strokeStyle = "rgba(34,211,238,0.85)";
    mctx.lineWidth = 1.5;
    mctx.strokeRect(vx, vy, vw, vh);
    mctx.strokeStyle = "rgba(148,163,184,0.35)";
    mctx.strokeRect(0.5, 0.5, mw - 1, mh - 1);
  }, [mapById]);

  const renderNow = useCallback(() => {
    rafRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (staticDirtyRef.current) {
      drawStaticScene();
      staticDirtyRef.current = false;
    }
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (staticCanvasRef.current) {
      ctx.drawImage(staticCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }

    const p = panRef.current;
    const s = scaleRef.current;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * p.x, dpr * p.y);

    if (liveStrokeRef.current) {
      renderStrokeElement(ctx, liveStrokeRef.current, s, true);
    }
    if (tempShapeRef.current) {
      renderShapeElement(ctx, tempShapeRef.current);
    }
    if (polygonRef.current && polygonRef.current.preview) {
      renderShapeElement(ctx, polygonRef.current.preview);
    }
    if (marqueeRef.current) {
      const m = marqueeRef.current;
      ctx.strokeStyle = "rgba(34,211,238,0.9)";
      ctx.lineWidth = 1.5 / s;
      ctx.setLineDash([6 / s, 4 / s]);
      ctx.strokeRect(m.x, m.y, m.width, m.height);
      ctx.setLineDash([]);
    }
    if (moveDragRef.current) {
      drawMoveDragOverlay(ctx);
    }
    if (pendingConnectorRef.current) {
      const pn = pendingConnectorRef.current;
      const from = mapById()[pn.fromId];
      if (from) {
        const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
        renderConnectorElement(ctx, { ...pn, toId: "cursor" }, from, {
          x: pn.cursor.x - 1,
          y: pn.cursor.y - 1,
          width: 2,
          height: 2,
        });
        void fromCenter;
      }
    }
    drawSelectionOverlay(ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawMinimap();
    drawPenCursor(ctx);
  }, [drawStaticScene, drawMinimap, mapById]);

  const drawMoveDragOverlay = useCallback(
    (ctx) => {
      const drag = moveDragRef.current;
      if (!drag) return;
      const { dx, dy, ids } = drag;
      const map = mapById();
      const moved = new Map();
      for (const id of ids) {
        const el = map[id];
        if (!el) continue;
        moved.set(id, { ...el, x: el.x + dx, y: el.y + dy });
      }
      for (const id of ids) {
        const el = moved.get(id);
        if (!el) continue;
        if (el.type === "node") renderNodeElement(ctx, el, selectedIdsRef.current.includes(id));
        else if (el.type === "text") renderTextElement(ctx, el);
        else if (el.type === "shape") renderShapeElement(ctx, el);
        else if (el.type === "stroke") renderStrokeElement(ctx, el);
      }
      const drawConn = (c) => {
        const from = map[c.fromId] ? moved.get(c.fromId) || map[c.fromId] : null;
        const to = map[c.toId] ? moved.get(c.toId) || map[c.toId] : null;
        if (from && to) renderConnectorElement(ctx, c, from, to);
      };
      for (const el of elementsRef.current) {
        if (el.type === "connector" && (moved.has(el.fromId) || moved.has(el.toId))) drawConn(el);
      }
    },
    [mapById]
  );

  const drawSelectionOverlay = useCallback(
    (ctx) => {
      const selected = selectedIdsRef.current;
      if (!selected.length) return;
      const map = mapById();
      const s = scaleRef.current;
      ctx.strokeStyle = "rgba(34,211,238,0.9)";
      ctx.lineWidth = 1.5 / s;
      ctx.setLineDash([6 / s, 4 / s]);
      for (const id of selected) {
        const el = map[id];
        if (!el || el.type === "group") continue;
        const b = elementBBox(el, elementsRef.current);
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      }
      ctx.setLineDash([]);

      if (selected.length === 1 && !moveDragRef.current) {
        const el = map[selected[0]];
        if (el && el.type !== "connector") {
          const b = elementBBox(el, elementsRef.current);
          const hs = 6 / s;
          const handles = [
            { key: "nw", x: b.x, y: b.y },
            { key: "n", x: b.x + b.width / 2, y: b.y },
            { key: "ne", x: b.x + b.width, y: b.y },
            { key: "e", x: b.x + b.width, y: b.y + b.height / 2 },
            { key: "se", x: b.x + b.width, y: b.y + b.height },
            { key: "s", x: b.x + b.width / 2, y: b.y + b.height },
            { key: "sw", x: b.x, y: b.y + b.height },
            { key: "w", x: b.x, y: b.y + b.height / 2 },
          ];
          ctx.fillStyle = "#0d1117";
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 1.5 / s;
          for (const h of handles) {
            ctx.beginPath();
            ctx.rect(h.x - hs / 2, h.y - hs / 2, hs, hs);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    },
    [mapById]
  );

  const drawPenCursor = useCallback((ctx) => {
    if (!showPenCursorRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ptr = pointerRef.current;
    if (!ptr || !ptr.active || ptr.type !== "pen") return;
    const t = toolRef.current;
    if (t !== TOOLS.PEN) return;

    const s = scaleRef.current;
    const dpr = window.devicePixelRatio || 1;
    const profile = TOOL_PROFILES[toolProfileRef.current] || TOOL_PROFILES.pen;
    const baseWidth = profile.width;
    const cursorRadius = (baseWidth / 2) * s * dpr;

    const mouseX = (ptr.last?.sx ?? rect.width / 2) * dpr;
    const mouseY = (ptr.last?.sy ?? rect.height / 2) * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, Math.max(2, cursorRadius), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(88, 166, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, Math.max(1, cursorRadius - 1), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(13, 17, 23, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  // ---------------- Dimensionamento / DPR ----------------
  const resizeCanvas = useCallback(() => {
    const wrapper = canvasRef.current;
    const parent = wrapper ? wrapper.parentElement : null;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    wrapper.width = Math.max(1, Math.round(w * dpr));
    wrapper.height = Math.max(1, Math.round(h * dpr));
    const sc = staticCanvasRef.current;
    if (sc) {
      sc.width = wrapper.width;
      sc.height = wrapper.height;
    }
    markStaticDirty();
  }, [markStaticDirty]);

  useEffect(() => {
    const mini = miniCanvasRef.current;
    if (mini) {
      mini.width = 190;
      mini.height = 120;
    }
    const sc = document.createElement("canvas");
    sc.width = 1;
    sc.height = 1;
    staticCanvasRef.current = sc;
    resizeCanvas();
    const ro = new ResizeObserver(() => resizeCanvas());
    const parent = canvasRef.current ? canvasRef.current.parentElement : null;
    if (parent) ro.observe(parent);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      staticCanvasRef.current = null;
    };
  }, [resizeCanvas]);

  // ---------------- Carregar estado salvo ----------------
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.elements) {
      elementsRef.current = saved.elements;
      setElementsState(saved.elements);
      panRef.current = saved.pan || { x: 0, y: 0 };
      scaleRef.current = clamp(saved.scale || 1, MIN_ZOOM, MAX_ZOOM);
      setPan(panRef.current);
      setScale(scaleRef.current);
      historyRef.current.clear();
      updateUndoRedo();
    }
    markStaticDirty();
  }, [markStaticDirty, updateUndoRedo]);

  // ---------------- Salvamento automatico ----------------
  const persist = useCallback(() => {
    saveState(elementsRef.current, panRef.current, scaleRef.current);
    setLastSaved(new Date());
  }, []);

  const manualSave = useCallback(() => {
    persist();
    toast({ title: "Salvo!", description: "Estado da lousa salvo no navegador" });
  }, [persist, toast]);

  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persist, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [elements, pan, scale, persist]);

  // ---------------- Coordenadas ----------------
  const getPointerPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const p = panRef.current;
    const s = scaleRef.current;
    return {
      x: (sx - p.x) / s,
      y: (sy - p.y) / s,
      sx,
      sy,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  }, []);

  // ---------------- Hit test ----------------
  const hitTest = useCallback(
    (point) => {
      const els = elementsRef.current;
      const map = mapById();
      const pad = 6 / scaleRef.current;
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        if (el.type === "group") {
          const b = elementBBox(el, els);
          if (rectContainsPoint(b, point, pad)) return el;
          continue;
        }
        if (el.type === "node") {
          if (rectContainsPoint(el, point, pad)) return el;
          continue;
        }
        if (el.type === "text") {
          const b = elementBBox(el, els);
          if (rectContainsPoint(b, point, pad)) return el;
          continue;
        }
        if (el.type === "shape") {
          const b = elementBBox(el, els);
          if (rectContainsPoint(b, point, pad)) return el;
          continue;
        }
        if (el.type === "stroke") {
          if (strokeHitTest(el, point, Math.max(4 / scaleRef.current, el.width * 0.6))) return el;
          continue;
        }
        if (el.type === "connector") {
          const from = map[el.fromId];
          const to = map[el.toId];
          if (from && to) {
            const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
            const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
            if (dist2d(point, a) + dist2d(point, b) - dist2d(a, b) < 8 / scaleRef.current) return el;
          }
          continue;
        }
      }
      return null;
    },
    [mapById]
  );

  const resolveSelection = useCallback((ids, els) => {
    const out = new Set();
    const map = {};
    for (const el of els) map[el.id] = el;
    const add = (id, visited) => {
      if (visited.has(id)) return;
      visited.add(id);
      const el = map[id];
      if (!el) return;
      if (el.type === "group") {
        for (const c of el.children || []) add(c, visited);
      } else {
        out.add(id);
      }
    };
    for (const id of ids) add(id, new Set());
    return out;
  }, []);

  const selectElements = useCallback(
    (ids) => {
      setSelectedIds(ids);
    },
    []
  );

  // ---------------- Acoes de edicao ----------------
  const deleteSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    beginGesture();
    const set = resolveSelection(ids, elementsRef.current);
    let next = elementsRef.current.filter((el) => !set.has(el.id));
    next = next.filter(
      (el) => !(el.type === "connector" && (set.has(el.fromId) || set.has(el.toId)))
    );
    commitElements(next);
    selectElements([]);
    endGesture(true);
    toast({ title: "Excluído", description: "Elementos removidos" });
  }, [beginGesture, commitElements, endGesture, resolveSelection, selectElements, toast]);

  const duplicateSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    beginGesture();
    const set = resolveSelection(ids, elementsRef.current);
    const clones = [];
    const idMap = new Map();
    for (const el of elementsRef.current) {
      if (!set.has(el.id) || el.type === "group") continue;
      const clone = deepClone(el);
      const newId = uid();
      idMap.set(el.id, newId);
      clone.id = newId;
      clone.x = (clone.x || 0) + 24;
      clone.y = (clone.y || 0) + 24;
      clones.push(clone);
    }
    for (const c of clones) {
      if (c.type === "connector") {
        c.fromId = idMap.get(c.fromId) || c.fromId;
        c.toId = idMap.get(c.toId) || c.toId;
      }
      if (c.type === "node" && c.parentId) {
        c.parentId = idMap.get(c.parentId) || c.parentId;
      }
    }
    const next = [...elementsRef.current, ...clones];
    commitElements(next);
    selectElements(clones.map((c) => c.id));
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, resolveSelection, selectElements]);

  const copySelection = useCallback(() => {
    const set = resolveSelection(selectedIdsRef.current, elementsRef.current);
    clipboardRef.current = elementsRef.current
      .filter((el) => set.has(el.id) && el.type !== "group")
      .map((el) => deepClone(el));
    if (clipboardRef.current.length) {
      toast({ title: "Copiado", description: `${clipboardRef.current.length} elementos copiados` });
    }
  }, [resolveSelection, toast]);

  const pasteClipboard = useCallback(() => {
    if (!clipboardRef.current.length) return;
    beginGesture();
    const clones = clipboardRef.current.map((el) => {
      const c = deepClone(el);
      c.id = uid();
      c.x = (c.x || 0) + 30;
      c.y = (c.y || 0) + 30;
      return c;
    });
    const idMap = new Map();
    clipboardRef.current.forEach((el, i) => idMap.set(el.id, clones[i].id));
    for (const c of clones) {
      if (c.type === "connector") {
        c.fromId = idMap.get(c.fromId) || c.fromId;
        c.toId = idMap.get(c.toId) || c.toId;
      }
      if (c.type === "node" && c.parentId) {
        c.parentId = idMap.get(c.parentId) || c.parentId;
      }
    }
    commitElements([...elementsRef.current, ...clones]);
    selectElements(clones.map((c) => c.id));
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, selectElements]);

  const groupSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) {
      toast({ title: "Selecione 2+ elementos", description: "Para agrupar, selecione mais de um elemento" });
      return;
    }
    beginGesture();
    const set = resolveSelection(ids, elementsRef.current);
    const g = makeGroup([...set], elementsRef.current);
    commitElements([...elementsRef.current, g]);
    selectElements([g.id]);
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, resolveSelection, selectElements, toast]);

  const ungroupSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    beginGesture();
    const next = elementsRef.current.filter((el) => !(el.type === "group" && ids.includes(el.id)));
    commitElements(next);
    endGesture(true);
  }, [beginGesture, commitElements, endGesture]);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo(snapshot());
    if (prev) {
      commitElements(prev);
      selectElements([]);
    }
    updateUndoRedo();
  }, [commitElements, selectElements, snapshot, updateUndoRedo]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo(snapshot());
    if (next) {
      commitElements(next);
      selectElements([]);
    }
    updateUndoRedo();
  }, [commitElements, selectElements, snapshot, updateUndoRedo]);

  const clearCanvas = useCallback(() => {
    beginGesture();
    const hadContent =
      elementsRef.current.length > 0 || (beforeGestureRef.current && beforeGestureRef.current.length > 0);
    commitElements([]);
    selectElements([]);
    endGesture(hadContent);
    toast({ title: "Lousa limpa", description: "Todo o conteúdo foi removido" });
  }, [beginGesture, commitElements, endGesture, selectElements, toast]);

  // ---------------- Zoom / pan ----------------
  const zoomAt = useCallback(
    (factor, clientX, clientY) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = clientX != null ? clientX - rect.left : rect.width / 2;
      const my = clientY != null ? clientY - rect.top : rect.height / 2;
      const newScale = clamp(scaleRef.current * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = newScale / scaleRef.current;
      setPan((prev) => ({
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      }));
      setScale(newScale);
    },
    []
  );

  const zoomIn = useCallback(() => zoomAt(1.2), [zoomAt]);
  const zoomOut = useCallback(() => zoomAt(1 / 1.2), [zoomAt]);

  const setZoomTo = useCallback(
    (s) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = rect.width / 2;
      const my = rect.height / 2;
      const newScale = clamp(s, MIN_ZOOM, MAX_ZOOM);
      const ratio = newScale / scaleRef.current;
      setPan((prev) => ({
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      }));
      setScale(newScale);
    },
    []
  );

  const fitToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    const els = elementsRef.current;
    if (!canvas) return;
    const vw = canvas.clientWidth;
    const vh = canvas.clientHeight;
    if (!els.length) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const bbox = sceneBBox(els);
    const s = clamp(Math.min((vw - 120) / bbox.width, (vh - 120) / bbox.height, 1.5), MIN_ZOOM, MAX_ZOOM);
    setPan({
      x: (vw - bbox.width * s) / 2 - bbox.x * s,
      y: (vh - bbox.height * s) / 2 - bbox.y * s,
    });
    setScale(s);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ---------------- Manipuladores de ponteiro ----------------
  const startPan = useCallback(
    (e) => {
      pointerRef.current = {
        active: true,
        type: "pan",
        pointerId: e.pointerId,
        last: { x: e.clientX, y: e.clientY },
        moved: false,
      };
      try {
        canvasRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
    },
    []
  );

  const eraseAt = useCallback(
    (point, mode) => {
      const els = elementsRef.current;
      const s = scaleRef.current;
      const radius = Math.max(10 / s, (strokeWidthRef.current || 3) * 2.2 / s);
      let changed = false;
      let next = els;

      if (mode === ERASER_MODES.STROKE) {
        const hits = els.filter((el) => el.type === "stroke" && strokeHitTest(el, point, radius));
        if (hits.length) {
          const hitIds = new Set(hits.map((h) => h.id));
          next = els.filter((el) => !hitIds.has(el.id));
          changed = true;
        }
      } else if (mode === ERASER_MODES.PARTIAL) {
        const out = [];
        for (const el of els) {
          if (el.type === "stroke" && strokeHitTest(el, point, radius)) {
            const pieces = splitStrokeAtCircle(el, point.x, point.y, radius);
            out.push(...pieces.filter((p) => p.points.length >= 2));
            changed = true;
          } else {
            out.push(el);
          }
        }
        next = out;
      } else if (mode === ERASER_MODES.SELECT) {
        const hit = hitTest(point);
        selectElements(hit ? [hit.id] : []);
        return;
      }

      if (changed) {
        elementsRef.current = next;
        markStaticDirty();
      }
    },
    [markStaticDirty]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button === 1) {
        startPan(e);
        e.preventDefault();
        return;
      }
      const point = getPointerPos(e);
      const els = elementsRef.current;
      const t = toolRef.current;

      if (spaceDownRef.current || t === TOOLS.PAN) {
        startPan(e);
        e.preventDefault();
        return;
      }

      try {
        canvasRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }

      pointerRef.current = {
        active: true,
        pointerId: e.pointerId,
        start: { x: point.x, y: point.y },
        last: point,
        moved: false,
      };

      if (t === TOOLS.PEN) {
        beginGesture();
        const profile = TOOL_PROFILES[toolProfileRef.current] || TOOL_PROFILES.pen;
        const strokeW = profile.width;
        liveStrokeRef.current = {
          ...makeStroke([point], strokeColorRef.current, strokeW),
        };
        pointerRef.current = {
          ...pointerRef.current,
          type: "pen",
          last: point,
          points: [point],
          stabilizerBuffer: [],
        };
        if (autoZoomWritingRef.current && profile.autoZoom) {
          checkAutoZoom(point);
        }
        requestFrame();
        return;
      }

      if (t === TOOLS.ERASER) {
        const mode = eraserModeRef.current;
        if (mode === ERASER_MODES.SELECT) {
          const hit = hitTest(point);
          selectElements(hit ? [hit.id] : []);
          return;
        }
        beginGesture();
        pointerRef.current.type = "erase";
        eraseAt(point, mode);
        return;
      }

      if (t === TOOLS.SELECT) {
        const hit = hitTest(point);
        if (hit) {
          if (e.shiftKey) {
            const has = selectedIdsRef.current.includes(hit.id);
            selectElements(
              has ? selectedIdsRef.current.filter((id) => id !== hit.id) : [...selectedIdsRef.current, hit.id]
            );
            return;
          }
          const ids = selectedIdsRef.current;
          const isSelected = ids.includes(hit.id);
          if (!isSelected) {
            if (hit.type === "group") selectElements([hit.id]);
            else selectElements([hit.id]);
          }
          const finalIds = isSelected ? ids : [hit.id];
          if (hit.type === "connector") return;
          beginGesture();
          moveDragRef.current = {
            ids: [...resolveSelection(finalIds, els)],
            start: { x: point.x, y: point.y },
            dx: 0,
            dy: 0,
          };
          return;
        }
        selectElements([]);
        beginGesture();
        marqueeRef.current = { start: { x: point.x, y: point.y }, ...boxFromPoints(point, point) };
        requestFrame();
        return;
      }

      if (t === TOOLS.TEXT) {
        const el = makeText("", point.x, point.y, {
          color: strokeColorRef.current,
          fontSize,
          fontFamily,
          bold: textBold,
          italic: textItalic,
          align: textAlign,
        });
        setTextEdit({ id: el.id, kind: "text", el });
        return;
      }

      if (t === TOOLS.SHAPE || t === TOOLS.ARROW) {
        beginGesture();
        const st = t === TOOLS.ARROW ? SHAPES.ARROW : shapeTypeRef.current;
        tempShapeRef.current = makeShape(
          st,
          point.x,
          point.y,
          0,
          0,
          strokeColorRef.current,
          fillColorRef.current,
          strokeWidthRef.current
        );
        requestFrame();
        return;
      }

      if (t === TOOLS.POLYGON) {
        if (!polygonRef.current) {
          beginGesture();
          polygonRef.current = { points: [point], preview: null };
        } else {
          polygonRef.current.points.push(point);
        }
        const pts = polygonRef.current.points;
        const minX = Math.min(...pts.map((q) => q.x));
        const minY = Math.min(...pts.map((q) => q.y));
        const maxX = Math.max(...pts.map((q) => q.x));
        const maxY = Math.max(...pts.map((q) => q.y));
        polygonRef.current.preview = makeShape(
          SHAPES.POLYGON,
          minX,
          minY,
          maxX - minX,
          maxY - minY,
          strokeColorRef.current,
          fillColorRef.current,
          strokeWidthRef.current,
          { points: pts.map((q) => ({ ...q })) }
        );
        requestFrame();
        return;
      }

      if (t === TOOLS.CONNECTOR) {
        const hit = hitTest(point);
        if (hit && hit.type === "node") {
          if (pendingConnectorRef.current && pendingConnectorRef.current.fromId !== hit.id) {
            beginGesture();
            const conn = makeConnector(
              pendingConnectorRef.current.fromId,
              hit.id,
              strokeColorRef.current,
              2,
              "curve"
            );
            commitElements([...els, conn]);
            endGesture(true);
            pendingConnectorRef.current = null;
            selectElements([conn.id]);
            return;
          }
          pendingConnectorRef.current = { fromId: hit.id, cursor: point };
          requestFrame();
        }
        return;
      }

      if (t === TOOLS.MINDMAP || mindmapModeRef.current) {
        const hit = hitTest(point);
        if (hit && hit.type === "node") {
          selectElements([hit.id]);
          beginGesture();
          moveDragRef.current = {
            ids: [hit.id],
            start: { x: point.x, y: point.y },
            dx: 0,
            dy: 0,
            isNode: true,
          };
          return;
        }
        selectElements([]);
        beginGesture();
        const node = makeNode("Novo nó", point.x, point.y, {
          color: "#ffffff",
          bg: "#1f2937",
          borderColor: "#60a5fa",
          fontSize: 15,
        });
        commitElements([...els, node]);
        endGesture(true);
        selectElements([node.id]);
        return;
      }
    },
    [getPointerPos, startPan, beginGesture, commitElements, endGesture, fontSize, fontFamily, textBold, textItalic, textAlign, hitTest, resolveSelection, selectElements, requestFrame, strokeColorRef, fillColorRef, strokeWidthRef, eraseAt]
  );

  const checkAutoZoom = useCallback((point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = scaleRef.current;
    if (s < 1.5) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = point.x * s + panRef.current.x;
    const screenY = point.y * s + panRef.current.y;
    const margin = 100;
    if (screenX < margin || screenX > rect.width - margin ||
        screenY < margin || screenY > rect.height - margin) {
      const targetScale = Math.min(2.5, s * 1.3);
      zoomAt(targetScale / s, screenX, screenY);
    }
  }, [zoomAt]);

  const applyStabilizer = useCallback((ptr, point, pv, stabilizerConfig) => {
    if (!ptr.stabilizerBuffer) ptr.stabilizerBuffer = [];
    const buffer = ptr.stabilizerBuffer;
    buffer.push({ ...point, p: pv });
    
    if (buffer.length < stabilizerConfig.iterations + 1) {
      return [{ ...point, p: pv }];
    }
    
    const smoothed = [];
    const windowSize = stabilizerConfig.iterations + 1;
    const weights = [];
    for (let i = 0; i < windowSize; i++) {
      weights[i] = Math.pow(stabilizerConfig.smoothing, windowSize - 1 - i);
    }
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    const lastPoints = buffer.slice(-windowSize);
    let sx = 0, sy = 0, sp = 0;
    for (let i = 0; i < lastPoints.length; i++) {
      const w = weights[i] / weightSum;
      sx += lastPoints[i].x * w;
      sy += lastPoints[i].y * w;
      sp += lastPoints[i].p * w;
    }
    
    if (buffer.length > windowSize * 2) {
      buffer.splice(0, buffer.length - windowSize);
    }
    
    return [{ x: sx, y: sy, p: sp }];
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      const ptr = pointerRef.current;
      if (!ptr || !ptr.active) return;

      const point = getPointerPos(e);
      const t = toolRef.current;

      if (ptr.type === "pan") {
        const dx = e.clientX - ptr.last.x;
        const dy = e.clientY - ptr.last.y;
        ptr.last = { x: e.clientX, y: e.clientY };
        ptr.moved = true;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        return;
      }

      const dist = dist2d(point, ptr.last);
      if (dist < 0.4) return;

      if (t === TOOLS.PEN && liveStrokeRef.current) {
        const prev = ptr.last;
        const dt = Math.max(1, e.timeStamp - (ptr.time || e.timeStamp));
        const speed = dist / dt;
        const profile = TOOL_PROFILES[toolProfileRef.current] || TOOL_PROFILES.pen;
        const stabilizer = STABILIZER_LEVELS[stabilizerLevelRef.current] || STABILIZER_LEVELS.medium;
        
        let pressureFactor = 0.5;
        if (pressureEnabledRef.current) {
          pressureFactor = clamp(point.pressure, pressureMinRef.current, pressureMaxRef.current);
        }
        
        const velFactor = clamp(1 / (1 + speed * 0.055), 0.55, 1);
        const pv = clamp(pressureFactor * velFactor, 0.3, 1);
        
        const stabilizedPoints = applyStabilizer(ptr, point, pv, stabilizer);
        
        for (const sp of stabilizedPoints) {
          liveStrokeRef.current.points.push(sp);
        }
        
        ptr.last = point;
        ptr.time = e.timeStamp;
        
        if (autoZoomWritingRef.current && profile.autoZoom) {
          checkAutoZoom(point);
        }
        
        requestFrame();
        return;
      }

      if (t === TOOLS.ERASER && ptr.type === "erase") {
        eraseAt(point, eraserModeRef.current);
        ptr.last = point;
        return;
      }

      if (t === TOOLS.SELECT) {
        if (moveDragRef.current) {
          const drag = moveDragRef.current;
          drag.dx = point.x - drag.start.x;
          drag.dy = point.y - drag.start.y;
          ptr.moved = true;
          requestFrame();
          return;
        }
        if (marqueeRef.current) {
          const m = marqueeRef.current;
          const b = boxFromPoints(m.start, point);
          m.x = b.x;
          m.y = b.y;
          m.width = b.width;
          m.height = b.height;
          ptr.moved = true;
          requestFrame();
          return;
        }
        return;
      }

      if (t === TOOLS.SHAPE || t === TOOLS.ARROW) {
        if (tempShapeRef.current) {
          tempShapeRef.current.width = point.x - tempShapeRef.current.x;
          tempShapeRef.current.height = point.y - tempShapeRef.current.y;
          ptr.moved = true;
          requestFrame();
        }
        return;
      }

      if (t === TOOLS.MINDMAP || mindmapModeRef.current) {
        if (moveDragRef.current) {
          const drag = moveDragRef.current;
          drag.dx = point.x - drag.start.x;
          drag.dy = point.y - drag.start.y;
          ptr.moved = true;
          requestFrame();
          return;
        }
        return;
      }

      if (t === TOOLS.CONNECTOR && pendingConnectorRef.current) {
        pendingConnectorRef.current.cursor = point;
        requestFrame();
        return;
      }
    },
    [getPointerPos, eraseAt, requestFrame]
  );

  const applyMoveToElements = useCallback(
    (drag) => {
      const { dx, dy, ids } = drag;
      if (dx === 0 && dy === 0) return false;
      const idSet = new Set(ids);
      const next = elementsRef.current.map((el) => {
        if (!idSet.has(el.id)) return el;
        if (el.type === "stroke") {
          return {
            ...el,
            points: el.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
          };
        }
        if (el.type === "shape" && el.shapeType === SHAPES.POLYGON && el.points) {
          return {
            ...el,
            x: el.x + dx,
            y: el.y + dy,
            points: el.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
          };
        }
        return { ...el, x: el.x + dx, y: el.y + dy };
      });
      commitElements(next);
      return true;
    },
    [commitElements]
  );

  const handlePointerUp = useCallback(
    (e) => {
      const ptr = pointerRef.current;
      if (!ptr || !ptr.active) return;
      ptr.active = false;

      const t = toolRef.current;

      if (t === TOOLS.PEN && liveStrokeRef.current) {
        let points = resamplePoints(liveStrokeRef.current.points, 1.2);
        points = simplifyStroke(points, 0.8);
        if (points.length >= 2) {
          const stroke = { ...liveStrokeRef.current, points };
          let next = [...elementsRef.current, stroke];
          if (autoFixRef.current) {
            const detection = detectShapeFromStroke(stroke);
            if (detection) {
              next = elementsRef.current;
              next = [...next, makeShape(detection.type, detection.x, detection.y, detection.width, detection.height, strokeColorRef.current, fillColorRef.current, strokeWidthRef.current)];
              toast({ title: "Forma corrigida", description: "Traçado convertido em forma geométrica" });
            }
          }
          commitElements(next);
          endGesture(true);
        } else {
          endGesture(false);
        }
        liveStrokeRef.current = null;
        requestFrame();
        return;
      }

      if (t === TOOLS.ERASER && ptr.type === "erase") {
        const changed = beforeGestureRef.current && JSON.stringify(beforeGestureRef.current) !== JSON.stringify(elementsRef.current);
        setElementsState([...elementsRef.current]);
        endGesture(changed);
        requestFrame();
        return;
      }

      if (t === TOOLS.SHAPE || t === TOOLS.ARROW) {
        const sh = tempShapeRef.current;
        tempShapeRef.current = null;
        if (sh && (Math.abs(sh.width) > 2 || Math.abs(sh.height) > 2)) {
          commitElements([...elementsRef.current, sh]);
          selectElements([sh.id]);
          endGesture(true);
        } else {
          endGesture(false);
        }
        requestFrame();
        return;
      }

      if (t === TOOLS.POLYGON) {
        return;
      }

      if (t === TOOLS.SELECT) {
        if (moveDragRef.current) {
          const drag = moveDragRef.current;
          const changed = applyMoveToElements(drag);
          moveDragRef.current = null;
          endGesture(changed || ptr.moved);
          requestFrame();
          return;
        }
        if (marqueeRef.current) {
          const m = marqueeRef.current;
          const selected = [];
          for (const el of elementsRef.current) {
            if (el.type === "group") continue;
            const b = elementBBox(el, elementsRef.current);
            if (rectsIntersect(m, b)) selected.push(el.id);
          }
          marqueeRef.current = null;
          selectElements(selected);
          endGesture(false);
          requestFrame();
          return;
        }
      }

      if (t === TOOLS.MINDMAP || mindmapModeRef.current) {
        if (moveDragRef.current) {
          const drag = moveDragRef.current;
          const changed = applyMoveToElements(drag);
          moveDragRef.current = null;
          endGesture(changed || ptr.moved);
          requestFrame();
          return;
        }
        return;
      }
    },
    [beginGesture, commitElements, endGesture, selectElements, requestFrame, applyMoveToElements, toast]
  );

  // Duplo clique para editar texto/nó
  const handleDoubleClick = useCallback(
    (e) => {
      if (toolRef.current === TOOLS.POLYGON && polygonRef.current && polygonRef.current.points.length >= 2) {
        const pts = polygonRef.current.points;
        const minX = Math.min(...pts.map((q) => q.x));
        const minY = Math.min(...pts.map((q) => q.y));
        const maxX = Math.max(...pts.map((q) => q.x));
        const maxY = Math.max(...pts.map((q) => q.y));
        const el = makeShape(
          SHAPES.POLYGON,
          minX,
          minY,
          maxX - minX,
          maxY - minY,
          strokeColorRef.current,
          fillColorRef.current,
          strokeWidthRef.current,
          { points: pts.map((q) => ({ ...q })) }
        );
        beginGesture();
        commitElements([...elementsRef.current, el]);
        selectElements([el.id]);
        endGesture(true);
        polygonRef.current = null;
        toast({ title: "Polígono criado", description: "Clique para adicionar vértices e duplo clique para finalizar" });
        return;
      }
      if (toolRef.current === TOOLS.POLYGON) {
        polygonRef.current = null;
        endGesture(false);
        return;
      }
      const point = getPointerPos(e);
      const t = toolRef.current;
      if (t === TOOLS.SELECT || t === TOOLS.MINDMAP || mindmapModeRef.current) {
        const hit = hitTest(point);
        if (hit && (hit.type === "text" || hit.type === "node")) {
          e.preventDefault();
          setTextEdit({
            id: hit.id,
            kind: hit.type,
            el: deepClone(hit),
            value: hit.content != null ? hit.content : hit.text,
          });
        }
        if (hit && hit.type === "node" && t === TOOLS.SELECT) {
          // também seleciona o nó
          selectElements([hit.id]);
        }
      }
    },
    [getPointerPos, hitTest, selectElements, beginGesture, commitElements, endGesture, toast]
  );

  // ---------------- Texto / nós: commit de edicao ----------------
  const commitTextEdit = useCallback(() => {
    if (!textEdit) return;
    const { id, kind, value, el } = textEdit;
    beginGesture();
    const exists = elementsRef.current.some((x) => x.id === id);
    let next;
    if (exists) {
      next = elementsRef.current.map((el) => {
        if (el.id !== id) return el;
        if (kind === "text") {
          return { ...el, content: value, width: el.width || Math.max(40, String(value).length * (el.fontSize || 20) * 0.55) };
        }
        if (kind === "node") {
          const lines = String(value || "").split("\n").length;
          const chars = String(value || "").split("\n").reduce((m, l) => Math.max(m, l.length), 0);
          return {
            ...el,
            text: value,
            width: Math.max(80, chars * (el.fontSize || 15) * 0.55 + 28),
            height: Math.max(38, lines * (el.fontSize || 15) * 1.3 + 20),
          };
        }
        return el;
      });
    } else if (el) {
      const textEl = { ...el, content: value, width: Math.max(40, String(value).length * (el.fontSize || 20) * 0.55) };
      next = [...elementsRef.current, textEl];
    } else {
      next = elementsRef.current;
    }
    commitElements(next);
    endGesture(true);
    setTextEdit(null);
  }, [beginGesture, commitElements, endGesture, textEdit]);

  // ---------------- Mapa mental ----------------
  const createChildNode = useCallback(() => {
    const sel = selectedIdsRef.current;
    if (!sel.length) return;
    const parent = elementsRef.current.find((el) => el.id === sel[sel.length - 1] && el.type === "node");
    if (!parent) {
      toast({ title: "Selecione um nó", description: "Clique em um nó antes de adicionar filho" });
      return;
    }
    beginGesture();
    const fontSize = MINDMAP_TEXT_SIZES[mindmapTextSizeRef.current] || 15;
    const res = addChildNode(elementsRef.current, parent.id, "Novo filho", {
      color: mindmapPalette ? "#60a5fa" : parent.borderColor,
      fontSize,
    });
    commitElements(res.elements);
    selectElements(res.node ? [res.node.id] : []);
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, mindmapPalette, selectElements, toast]);

  const createSiblingNode = useCallback(() => {
    const sel = selectedIdsRef.current;
    if (!sel.length) return;
    const sibling = elementsRef.current.find((el) => el.id === sel[sel.length - 1] && el.type === "node");
    if (!sibling || !sibling.parentId) {
      toast({ title: "Nó raiz não tem irmão", description: "Selecione um nó com pai para criar um irmão" });
      return;
    }
    beginGesture();
    const fontSize = MINDMAP_TEXT_SIZES[mindmapTextSizeRef.current] || 15;
    const res = addSiblingNode(elementsRef.current, sibling.id, "Novo irmão", {
      fontSize,
    });
    commitElements(res.elements);
    selectElements(res.node ? [res.node.id] : []);
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, selectElements, toast]);

  const deleteNodeSubtree = useCallback(() => {
    const sel = selectedIdsRef.current;
    if (!sel.length) return;
    const node = elementsRef.current.find((el) => el.id === sel[sel.length - 1] && el.type === "node");
    if (!node) return;
    beginGesture();
    commitElements(removeNodeAndDescendants(elementsRef.current, node.id));
    selectElements([]);
    endGesture(true);
  }, [beginGesture, commitElements, endGesture, selectElements]);

  const organizeMap = useCallback(() => {
    const els = elementsRef.current;
    const nodes = els.filter((e) => e.type === "node");
    if (!nodes.length) return;
    const root = findRoot(els);
    beginGesture();
    commitElements(autoLayout(els, root.id, mindmapDirection));
    endGesture(true);
    setTimeout(fitToScreen, 0);
  }, [beginGesture, commitElements, endGesture, fitToScreen, mindmapDirection]);

  const generateWithAI = useCallback(async () => {
    if (!aiTopic.trim()) {
      toast({ title: "Digite um assunto", description: "Ex: Revolução Francesa, Cálculo Diferencial..." });
      return;
    }
    setAiBusy(true);
    try {
      const { elements: newEls, rootId } = await generateMindMapElements(aiTopic, { x: 120, y: 90 }, { palette: mindmapPalette });
      beginGesture();
      commitElements([...elementsRef.current, ...newEls]);
      endGesture(true);
      selectElements([rootId]);
      setAiModal(false);
      setAiTopic("");
      fitToScreen();
      toast({ title: "Mapa gerado!", description: "Todos os nós são editáveis" });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível gerar o mapa. Tente novamente.", variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  }, [aiTopic, beginGesture, commitElements, endGesture, fitToScreen, mindmapPalette, selectElements, toast]);

  const convertToMap = useCallback(async () => {
    if (!convertText.trim()) {
      toast({ title: "Digite um conteúdo", description: "Cole um texto ou assunto para transformar em mapa mental" });
      return;
    }
    setAiBusy(true);
    try {
      const { elements: newEls, rootId } = await generateMindMapElements(convertText, { x: 120, y: 90 }, { palette: mindmapPalette });
      beginGesture();
      commitElements([...elementsRef.current, ...newEls]);
      endGesture(true);
      selectElements([rootId]);
      setConvertModal(false);
      setConvertText("");
      fitToScreen();
      toast({ title: "Mapa criado!", description: "Conteúdo transformado em mapa mental" });
    } finally {
      setAiBusy(false);
    }
  }, [beginGesture, commitElements, endGesture, fitToScreen, mindmapPalette, selectElements, toast, convertText]);

  const collapseSelected = useCallback(() => {
    const sel = selectedIdsRef.current;
    if (!sel.length) return;
    const node = elementsRef.current.find((el) => el.id === sel[sel.length - 1] && el.type === "node");
    if (!node) return;
    beginGesture();
    commitElements(toggleCollapse(elementsRef.current, node.id));
    endGesture(true);
  }, [beginGesture, commitElements, endGesture]);

  // ---------------- Wheeel / gestos ----------------
  useEffect(() => {
    const wrapper = canvasRef.current ? canvasRef.current.parentElement : null;
    if (!wrapper) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        zoomAt(factor, e.clientX, e.clientY);
      } else {
        setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const wrapper = canvasRef.current ? canvasRef.current.parentElement : null;
    if (!wrapper) return;
    let initialPinchDist = null;
    let initialScale = null;
    let initialCenter = null;
    let initialPan = null;

    const getTouchDist = (touches) => {
      if (touches.length < 2) return null;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches) => {
      if (touches.length < 2) return null;
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialPinchDist = getTouchDist(e.touches);
        initialScale = scaleRef.current;
        initialCenter = getTouchCenter(e.touches);
        initialPan = { ...panRef.current };
        e.preventDefault();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDist !== null) {
        const currentDist = getTouchDist(e.touches);
        const currentCenter = getTouchCenter(e.touches);
        if (currentDist && currentCenter && initialCenter) {
          const factor = currentDist / initialPinchDist;
          const newScale = clamp(initialScale * factor, MIN_ZOOM, MAX_ZOOM);
          const ratio = newScale / initialScale;
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const mx = initialCenter.x - rect.left;
          const my = initialCenter.y - rect.top;
          setPan({
            x: mx - (mx - initialPan.x) * ratio,
            y: my - (my - initialPan.y) * ratio,
          });
          setScale(newScale);
        }
        e.preventDefault();
      } else if (e.touches.length === 1 && !spaceDownRef.current && toolRef.current !== TOOLS.PAN) {
        const touch = e.touches[0];
        const dx = touch.clientX - (pointerRef.current?.last?.sx ?? touch.clientX);
        const dy = touch.clientY - (pointerRef.current?.last?.sy ?? touch.clientY);
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        if (pointerRef.current) {
          pointerRef.current.last = { sx: touch.clientX, sy: touch.clientY };
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
        initialScale = null;
        initialCenter = null;
        initialPan = null;
      }
    };

    wrapper.addEventListener("touchstart", onTouchStart, { passive: false });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });
    wrapper.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // ---------------- Teclado ----------------
  useEffect(() => {
    const isTyping = () => {
      const a = document.activeElement;
      return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
    };

    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (isTyping()) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        manualSave();
        return;
      }
      if (mod && e.key.toLowerCase() === "c") {
        copySelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) ungroupSelection();
        else groupSelection();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
        return;
      }
      if (e.key === " ") {
        if (!spaceDownRef.current) {
          setSpaceDown(true);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Tab") {
        if (toolRef.current === TOOLS.MINDMAP || mindmapModeRef.current) {
          e.preventDefault();
          createChildNode();
        }
        return;
      }
      if (e.key === "Enter") {
        if (toolRef.current === TOOLS.MINDMAP || mindmapModeRef.current) {
          e.preventDefault();
          createSiblingNode();
        }
        return;
      }
      if (e.key === "Escape") {
        setTextEdit(null);
        pendingConnectorRef.current = null;
        polygonRef.current = null;
        setSelectedIds([]);
        return;
      }
      switch (e.key.toLowerCase()) {
        case "v":
          setTool(TOOLS.SELECT);
          break;
        case "p":
          setTool(TOOLS.PEN);
          break;
        case "e":
          setTool(TOOLS.ERASER);
          break;
        case "t":
          setTool(TOOLS.TEXT);
          break;
        case "f":
          setTool(TOOLS.SHAPE);
          break;
        case "h":
          setTool(TOOLS.PAN);
          break;
        default:
          break;
      }
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") setZoomTo(1);
    };

    const onKeyUp = (e) => {
      if (e.key === " ") setSpaceDown(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  },     [undo, redo, manualSave, copySelection, pasteClipboard, duplicateSelection, groupSelection, ungroupSelection, deleteSelection, createChildNode, createSiblingNode, zoomIn, zoomOut, setZoomTo, mindmapMode]
  );

  // ---------------- Exportacao ----------------
  const doExport = useCallback(
    async (kind) => {
      setIsSaving(true);
      try {
        if (kind === "png") exportPNG(elementsRef.current);
        else if (kind === "pdf") await exportPDF(elementsRef.current);
        else if (kind === "svg") exportSVG(elementsRef.current);
        toast({ title: "Exportado!", description: `Arquivo ${kind.toUpperCase()} gerado` });
      } catch (err) {
        console.error(err);
        toast({ title: "Erro ao exportar", description: "Não foi possível gerar o arquivo", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    },
    [toast]
  );

  // ---------------- Utilidades de UI ----------------
  const selectedNode = elements.find((el) => selectedIds.includes(el.id) && el.type === "node");
  const nodeCount = countNodes(elements);

  const shapeOptions = [
    { id: SHAPES.RECTANGLE, label: "▭ Retângulo" },
    { id: SHAPES.SQUARE, label: "▢ Quadrado" },
    { id: SHAPES.CIRCLE, label: "● Círculo" },
    { id: SHAPES.ELLIPSE, label: "⬭ Elipse" },
    { id: SHAPES.TRIANGLE, label: "▲ Triângulo" },
    { id: SHAPES.DIAMOND, label: "◆ Losango" },
    { id: SHAPES.LINE, label: "━ Linha" },
    { id: SHAPES.ARROW, label: "➤ Seta" },
    { id: SHAPES.POLYGON, label: "⬠ Polígono" },
  ];

  const gridCycle = () => {
    const order = [GRID_MODES.NONE, GRID_MODES.DOTS, GRID_MODES.LINES, GRID_MODES.RULED];
    const idx = order.indexOf(gridMode);
    setGridMode(order[(idx + 1) % order.length]);
  };

  const handleProfileChange = useCallback((profile) => {
    setToolProfile(profile);
    const p = TOOL_PROFILES[profile] || TOOL_PROFILES.pen;
    setStrokeWidth(p.width);
    setStabilizerLevel(p.stabilizer);
    setPressureEnabled(p.pressure);
    setAutoZoomWriting(p.autoZoom);
  }, []);

  const handleProfileSelect = (e) => {
    handleProfileChange(e.target.value);
  };

  return (
    <div className="virtual-whiteboard" ref={wrapperRef}>
      {/* ---------- Barra principal ---------- */}
      <div className="whiteboard-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Ferramentas</span>
          <button className={`tool-btn ${tool === TOOLS.SELECT ? "active" : ""}`} onClick={() => setTool(TOOLS.SELECT)} title="Selecionar (V)">
            <MousePointer2 size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.PAN ? "active" : ""}`} onClick={() => setTool(TOOLS.PAN)} title="Mover tela (Espaço)">
            <Hand size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.PEN ? "active" : ""}`} onClick={() => setTool(TOOLS.PEN)} title="Caneta (P)">
            <PenTool size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.ERASER ? "active" : ""}`} onClick={() => setTool(TOOLS.ERASER)} title="Borracha (E)">
            <Eraser size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.TEXT ? "active" : ""}`} onClick={() => setTool(TOOLS.TEXT)} title="Texto (T)">
            <Type size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.SHAPE ? "active" : ""}`} onClick={() => setTool(TOOLS.SHAPE)} title="Formas (F)">
            <Shapes size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.ARROW ? "active" : ""}`} onClick={() => setTool(TOOLS.ARROW)} title="Seta">
            <ArrowRight size={20} />
          </button>
          <button className={`tool-btn ${tool === TOOLS.CONNECTOR ? "active" : ""}`} onClick={() => setTool(TOOLS.CONNECTOR)} title="Conector (liga nós)">
            <GitBranch size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            className={`tool-btn mindmap-toggle ${mindmapMode ? "active" : ""}`}
            onClick={() => setMindmapMode(!mindmapMode)}
            title="Modo Mapa Mental"
          >
            <Brain size={20} />
          </button>
          {mindmapMode && <span className="mindmap-badge">🧠 MAPA MENTAL</span>}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group actions">
          <button className="action-btn" onClick={undo} title="Desfazer (Ctrl+Z)" disabled={!canUndo}>
            <Undo size={20} />
          </button>
          <button className="action-btn" onClick={redo} title="Refazer (Ctrl+Shift+Z)" disabled={!canRedo}>
            <Redo size={20} />
          </button>
          <button className="action-btn" onClick={copySelection} title="Copiar (Ctrl+C)">
            <Copy size={20} />
          </button>
          <button className="action-btn" onClick={pasteClipboard} title="Colar (Ctrl+V)">
            <ClipboardPaste size={20} />
          </button>
          <button className="action-btn" onClick={duplicateSelection} title="Duplicar (Ctrl+D)">
            <Layers size={20} />
          </button>
          <button className="action-btn" onClick={groupSelection} title="Agrupar (Ctrl+G)">
            <Group size={20} />
          </button>
          <button className="action-btn" onClick={ungroupSelection} title="Desagrupar (Ctrl+Shift+G)">
            <Ungroup size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className={`tool-btn ${gridMode !== GRID_MODES.NONE ? "active" : ""}`} onClick={gridCycle} title="Grade: pontilhada / linhas / caderno (linhas pautadas) / desligada">
            <LayoutGrid size={20} />
          </button>
          <button className={`tool-btn ${autoFix ? "active" : ""}`} onClick={() => setAutoFix(!autoFix)} title="Corrigir forma automaticamente">
            <Crosshair size={20} />
          </button>
          <button className={`tool-btn ${showMinimap ? "active" : ""}`} onClick={() => setShowMinimap(!showMinimap)} title="Minimapa">
            <Maximize size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group actions">
          <button className="action-btn" onClick={zoomOut} title="Reduzir zoom (-)">
            <ZoomOut size={20} />
          </button>
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
          <button className="action-btn" onClick={zoomIn} title="Aumentar zoom (+)">
            <ZoomIn size={20} />
          </button>
          <button className="action-btn" onClick={() => setZoomTo(1)} title="100% (0)">
            <Minus size={16} />
          </button>
          <button className="action-btn" onClick={fitToScreen} title="Ajustar à tela">
            <Maximize size={18} />
          </button>
          <button className="action-btn" onClick={resetView} title="Resetar zoom">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group actions">
          <button className="action-btn" onClick={manualSave} title="Salvar agora (Ctrl+S)" disabled={isSaving}>
            {isSaving ? <Loader2 size={20} className="spin" /> : <Save size={20} />}
          </button>
          <div className="export-menu">
            <button className="action-btn" onClick={() => doExport("png")} title="Exportar PNG">
              <Download size={20} />
            </button>
            <button className="action-btn" onClick={() => doExport("pdf")} title="Exportar PDF">
              <FileDown size={20} />
            </button>
            <button className="action-btn export-svg" onClick={() => doExport("svg")} title="Exportar SVG">
              SVG
            </button>
          </div>
          <button className="action-btn danger" onClick={clearCanvas} title="Limpar tudo">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="toolbar-info">
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
          {lastSaved && (
            <span className="last-saved">
              <Check size={12} /> Salvo: {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* ---------- Painel secundário: caneta / formas / texto ---------- */}
      <div className="whiteboard-toolbar secondary">
        <div className="toolbar-group">
          <span className="toolbar-label">Cor da linha</span>
          <div className="color-palette">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`color-swatch ${strokeColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
                title={color}
              />
            ))}
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="color-picker-input" title="Cor personalizada" />
          </div>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Preenchimento</span>
          <div className="color-palette">
            <button
              className={`color-swatch ${fillColor === "transparent" ? "active" : ""}`}
              onClick={() => setFillColor("transparent")}
              title="Sem preenchimento"
              style={{ background: "repeating-linear-gradient(45deg, #1a1f2e, #1a1f2e 10px, #0d1117 10px, #0d1117 20px)" }}
            >
              <span className="no-fill">✕</span>
            </button>
            {COLORS.map((color) => (
              <button
                key={`fill-${color}`}
                className={`color-swatch ${fillColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setFillColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Espessura</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {STROKE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={`mini-btn ${strokeWidth === preset.value ? "active" : ""}`}
                onClick={() => setStrokeWidth(preset.value)}
                style={{ padding: "4px 8px", fontSize: "11px", minWidth: "32px" }}
              >
                {preset.label}
              </button>
            ))}
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="stroke-slider"
              style={{ width: "100px", marginLeft: "8px" }}
            />
            <span className="stroke-value">{strokeWidth}px</span>
          </div>
        </div>

        {tool === TOOLS.PEN && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <span className="toolbar-label">Perfil</span>
              <select value={toolProfile} onChange={handleProfileSelect} className="shape-select" style={{ minWidth: "130px" }}>
                <option value="pen">✏️ {TOOL_PROFILE_LABELS.pen}</option>
                <option value="writing">✍️ {TOOL_PROFILE_LABELS.writing}</option>
                <option value="marker">🖍️ {TOOL_PROFILE_LABELS.marker}</option>
                <option value="highlighter">🖋️ {TOOL_PROFILE_LABELS.highlighter}</option>
              </select>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">Estabilizador</span>
              <select value={stabilizerLevel} onChange={(e) => setStabilizerLevel(e.target.value)} className="shape-select" style={{ minWidth: "110px" }}>
                <option value="off">Desligado</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="toolbar-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#7d8590", cursor: "pointer" }}>
                <input type="checkbox" checked={pressureEnabled} onChange={(e) => setPressureEnabled(e.target.checked)} />
                Pressão
              </label>
            </div>
            {pressureEnabled && (
              <>
                <div className="toolbar-group">
                  <span className="toolbar-label">Min</span>
                  <input type="range" min="0.1" max="0.8" step="0.05" value={pressureMin} onChange={(e) => setPressureMin(Number(e.target.value))} className="stroke-slider" style={{ width: "70px" }} />
                  <span className="stroke-value" style={{ minWidth: "30px" }}>{pressureMin.toFixed(2)}</span>
                </div>
                <div className="toolbar-group">
                  <span className="toolbar-label">Máx</span>
                  <input type="range" min="0.5" max="1" step="0.05" value={pressureMax} onChange={(e) => setPressureMax(Number(e.target.value))} className="stroke-slider" style={{ width: "70px" }} />
                  <span className="stroke-value" style={{ minWidth: "30px" }}>{pressureMax.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="toolbar-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#7d8590", cursor: "pointer" }}>
                <input type="checkbox" checked={autoZoomWriting} onChange={(e) => setAutoZoomWriting(e.target.checked)} />
                Auto-zoom escrita
              </label>
            </div>
            <div className="toolbar-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#7d8590", cursor: "pointer" }}>
                <input type="checkbox" checked={showPenCursor} onChange={(e) => setShowPenCursor(e.target.checked)} />
                Cursor caneta
              </label>
            </div>
          </>
        )}

        {tool === TOOLS.SHAPE && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <span className="toolbar-label">Forma</span>
              <select value={shapeType} onChange={(e) => setShapeType(e.target.value)} className="shape-select">
                {shapeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {tool === TOOLS.ERASER && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <span className="toolbar-label">Borracha</span>
              <div className="eraser-modes">
                <button className={`mini-btn ${eraserMode === ERASER_MODES.STROKE ? "active" : ""}`} onClick={() => setEraserMode(ERASER_MODES.STROKE)} title="Apaga o traço inteiro">
                  Traço
                </button>
                <button className={`mini-btn ${eraserMode === ERASER_MODES.PARTIAL ? "active" : ""}`} onClick={() => setEraserMode(ERASER_MODES.PARTIAL)} title="Apaga apenas a parte do traço">
                  Parcial
                </button>
                <button className={`mini-btn ${eraserMode === ERASER_MODES.SELECT ? "active" : ""}`} onClick={() => setEraserMode(ERASER_MODES.SELECT)} title="Seleciona para excluir">
                  Seleção
                </button>
              </div>
            </div>
          </>
        )}

        {tool === TOOLS.TEXT && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group text-style">
              <span className="toolbar-label">Texto</span>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="shape-select font-select">
                {TEXT_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input type="number" min="8" max="120" value={fontSize} onChange={(e) => setFontSize(clamp(Number(e.target.value) || 20, 8, 120))} className="font-size-input" title="Tamanho da fonte" />
              <button className={`mini-btn ${textBold ? "active" : ""}`} onClick={() => setTextBold(!textBold)} title="Negrito">
                <strong>B</strong>
              </button>
              <button className={`mini-btn italic-btn ${textItalic ? "active" : ""}`} onClick={() => setTextItalic(!textItalic)} title="Itálico">
                <em>I</em>
              </button>
              <button className={`mini-btn ${textAlign === "left" ? "active" : ""}`} onClick={() => setTextAlign("left")} title="Alinhar à esquerda">
                Esq
              </button>
              <button className={`mini-btn ${textAlign === "center" ? "active" : ""}`} onClick={() => setTextAlign("center")} title="Centralizar">
                Cen
              </button>
              <button className={`mini-btn ${textAlign === "right" ? "active" : ""}`} onClick={() => setTextAlign("right")} title="Alinhar à direita">
                Dir
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---------- Painel Mapa Mental ---------- */}
      {mindmapMode && (
        <div className="whiteboard-toolbar mindmap-panel">
          <div className="toolbar-group">
            <span className="toolbar-label">Mapa Mental</span>
            <button className="mini-btn primary" onClick={createChildNode} title="Adicionar nó filho (Tab)">
              <Plus size={14} /> Filho
            </button>
            <button className="mini-btn" onClick={createSiblingNode} title="Adicionar nó irmão (Enter)">
              <CornerDownRight size={14} /> Irmão
            </button>
            <button className="mini-btn" onClick={() => setTool(TOOLS.CONNECTOR)} title="Criar conexão manual">
              <GitBranch size={14} /> Conexão
            </button>
            <button className="mini-btn danger" onClick={deleteNodeSubtree} title="Excluir nó e descendentes (Delete)">
              <Trash2 size={14} /> Excluir
            </button>
            <button className="mini-btn" onClick={collapseSelected} title="Recolher/expandir ramificação">
              <ListTree size={14} /> Recolher
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <span className="toolbar-label">Organizar</span>
            <select value={mindmapDirection} onChange={(e) => setMindmapDirection(e.target.value)} className="shape-select">
              <option value={MINDMAP_DIRECTIONS.LEFT_RIGHT}>→ Esquerda → Direita</option>
              <option value={MINDMAP_DIRECTIONS.RIGHT_LEFT}>← Direita → Esquerda</option>
              <option value={MINDMAP_DIRECTIONS.TOP_BOTTOM}>↓ Cima → Baixo</option>
              <option value={MINDMAP_DIRECTIONS.RADIAL}>◉ Radial</option>
            </select>
            <button className="mini-btn primary" onClick={organizeMap} title="Distribuir nós automaticamente">
              <ListTree size={14} /> Organizar mapa
            </button>
            <button className={`mini-btn ${mindmapPalette ? "active" : ""}`} onClick={() => setMindmapPalette(!mindmapPalette)} title="Cores por nível">
              <Palette size={14} /> Cores
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <span className="toolbar-label">Texto nós</span>
            <select value={mindmapTextSize} onChange={(e) => setMindmapTextSize(e.target.value)} className="shape-select" style={{ minWidth: "120px" }}>
              <option value="small">Pequena (12px)</option>
              <option value="medium">Média (15px)</option>
              <option value="large">Grande (18px)</option>
            </select>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button className="mini-btn ai-btn" onClick={() => setAiModal(true)} title="Gerar mapa mental com IA">
              <Sparkles size={14} /> ✨ Gerar mapa com IA
            </button>
            <button className="mini-btn" onClick={() => setConvertModal(true)} title="Transformar conteúdo em mapa mental">
              <FolderInput size={14} /> Transformar em mapa
            </button>
            <span className="node-count">{nodeCount} nós</span>
          </div>
        </div>
      )}

      {/* ---------- Ações rápidas do nó selecionado ---------- */}
      {mindmapMode && selectedNode && (
        <div className="node-quick-actions">
          <button className="quick-btn" onClick={createChildNode} title="Filho (Tab)">
            <Plus size={15} /> Filho
          </button>
          <button className="quick-btn" onClick={createSiblingNode} title="Irmão (Enter)">
            <CornerDownRight size={15} /> Irmão
          </button>
          <button className="quick-btn" onClick={deleteNodeSubtree} title="Excluir">
            <Trash2 size={15} /> Excluir
          </button>
          <button className="quick-btn" onClick={duplicateSelection} title="Duplicar">
            <Copy size={15} /> Duplicar
          </button>
          <button className="quick-btn" onClick={() => setTextEdit({ id: selectedNode.id, kind: "node", el: deepClone(selectedNode), value: selectedNode.text })} title="Editar texto">
            <Type size={15} /> Editar
          </button>
        </div>
      )}

      {/* ---------- Canvas ---------- */}
      <div className="whiteboard-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
        <canvas ref={miniCanvasRef} className={`whiteboard-minimap ${showMinimap ? "" : "hidden"}`} />

        {textEdit && (
          <div
            className="text-input-overlay"
            style={{
              left: textEdit.el.x * scale + pan.x,
              top: textEdit.el.y * scale + pan.y,
              width: textEdit.kind === "node" ? textEdit.el.width * scale : Math.max(160, textEdit.el.width * scale),
            }}
          >
            {textEdit.kind === "node" ? (
              <input
                autoFocus
                value={textEdit.value || ""}
                onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitTextEdit();
                  }
                  e.stopPropagation();
                }}
                onBlur={commitTextEdit}
                className="text-input-field node-text-input"
                style={{ fontSize: textEdit.el.fontSize, color: textEdit.el.color, textAlign: "center" }}
                placeholder="Texto do nó..."
              />
            ) : (
              <textarea
                autoFocus
                value={textEdit.value || ""}
                onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitTextEdit();
                  }
                  e.stopPropagation();
                }}
                onBlur={commitTextEdit}
                className="text-input-field"
                style={{
                  fontSize: textEdit.el.fontSize,
                  color: textEdit.el.color,
                  fontFamily: textEdit.el.fontFamily,
                  fontWeight: textEdit.el.bold ? "bold" : "normal",
                  fontStyle: textEdit.el.italic ? "italic" : "normal",
                }}
                placeholder="Digite seu texto..."
              />
            )}
          </div>
        )}
      </div>

      {/* ---------- Modal IA ---------- */}
      {aiModal && (
        <div className="wb-modal-overlay" onClick={() => !aiBusy && setAiModal(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wb-modal-header">
              <h3>
                <Sparkles size={18} /> Gerar Mapa Mental com IA
              </h3>
              <button className="wb-modal-close" onClick={() => setAiModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="wb-modal-desc">
              Informe um assunto e a IA criará o tema central, categorias, subcategorias e conceitos. Tudo fica editável.
            </p>
            <input
              autoFocus
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
              placeholder="Ex: Revolução Francesa, Cálculo Diferencial, Fotossíntese..."
              className="wb-modal-input"
            />
            <div className="wb-modal-footer">
              <button className="mini-btn" onClick={() => setAiModal(false)} disabled={aiBusy}>
                Cancelar
              </button>
              <button className="mini-btn ai-btn" onClick={generateWithAI} disabled={aiBusy || !aiTopic.trim()}>
                {aiBusy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {aiBusy ? "Gerando..." : "Gerar"}
              </button>
            </div>
            {aiBusy && <p className="wb-modal-hint">A IA pode levar até 30s. Se nenhuma chave estiver configurada, um mapa local é criado.</p>}
          </div>
        </div>
      )}

      {/* ---------- Modal transformar conteúdo ---------- */}
      {convertModal && (
        <div className="wb-modal-overlay" onClick={() => !aiBusy && setConvertModal(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wb-modal-header">
              <h3>
                <FolderInput size={18} /> Transformar em Mapa Mental
              </h3>
              <button className="wb-modal-close" onClick={() => setConvertModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="wb-modal-desc">Cole um texto, anotações ou conteúdo de estudo para gerar um mapa mental estruturado.</p>
            <textarea
              value={convertText}
              onChange={(e) => setConvertText(e.target.value)}
              placeholder="Cole aqui seu conteúdo ou assunto..."
              className="wb-modal-textarea"
              rows={5}
            />
            <div className="wb-modal-footer">
              <button className="mini-btn" onClick={() => setConvertModal(false)} disabled={aiBusy}>
                Cancelar
              </button>
              <button className="mini-btn ai-btn" onClick={convertToMap} disabled={aiBusy || !convertText.trim()}>
                {aiBusy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {aiBusy ? "Gerando..." : "Transformar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Barra de status ---------- */}
      <div className="whiteboard-status">
        <span>
          Ferramenta:{" "}
          {tool === TOOLS.PEN
            ? "Caneta"
            : tool === TOOLS.ERASER
              ? `Borracha (${eraserMode})`
              : tool === TOOLS.SHAPE
                ? `Forma (${shapeType})`
                : tool === TOOLS.TEXT
                  ? "Texto"
                  : tool === TOOLS.SELECT
                    ? "Selecionar"
                    : tool === TOOLS.PAN
                      ? "Mover"
                      : tool === TOOLS.ARROW
                        ? "Seta"
                        : tool === TOOLS.POLYGON
                          ? "Polígono"
                          : tool === TOOLS.CONNECTOR
                            ? "Conector"
                            : "Mapa Mental"}
        </span>
        <span>Zoom: {Math.round(scale * 100)}%</span>
        <span>Elementos: {elements.length}</span>
        {mindmapMode && <span>Nós: {nodeCount}</span>}
        <span className="shortcuts">V: Selecionar | P: Caneta | E: Borracha | T: Texto | F: Forma | Espaço: Mover | Scroll: Pan | Ctrl+Scroll: Zoom | Tab: Filho | Enter: Irmão | Ctrl+Z: Desfazer</span>
      </div>
    </div>
  );
}

export default VirtualWhiteboard;
