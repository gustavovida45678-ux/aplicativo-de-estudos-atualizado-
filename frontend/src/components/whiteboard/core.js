export const TOOLS = {
  PEN: "pen",
  ERASER: "eraser",
  SHAPE: "shape",
  TEXT: "text",
  SELECT: "select",
  PAN: "pan",
  ARROW: "arrow",
  CONNECTOR: "connector",
  MINDMAP: "mindmap",
  POLYGON: "polygon",
};

export const SHAPES = {
  RECTANGLE: "rectangle",
  SQUARE: "square",
  CIRCLE: "circle",
  ELLIPSE: "ellipse",
  TRIANGLE: "triangle",
  DIAMOND: "diamond",
  LINE: "line",
  ARROW: "arrow",
  POLYGON: "polygon",
};

export const ERASER_MODES = {
  STROKE: "stroke",
  PARTIAL: "partial",
  SELECT: "select",
};

export const GRID_MODES = {
  NONE: "none",
  DOTS: "dots",
  LINES: "lines",
  RULED: "ruled",
};

export const MINDMAP_DIRECTIONS = {
  RADIAL: "radial",
  LEFT_RIGHT: "lr",
  RIGHT_LEFT: "rl",
  TOP_BOTTOM: "tb",
};

export const STORAGE_KEY = "virtual_whiteboard_state_v2";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export const STROKE_PRESETS = [
  { value: 0.5, label: "0.5" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 6, label: "6" },
  { value: 8, label: "8" },
];

export const TOOL_PROFILES = {
  pen: { width: 3, smoothing: 0.5, stabilizer: "medium", pressure: true, autoZoom: false },
  writing: { width: 1, smoothing: 0.6, stabilizer: "high", pressure: true, autoZoom: true },
  marker: { width: 6, smoothing: 0.3, stabilizer: "low", pressure: true, autoZoom: false },
  highlighter: { width: 8, smoothing: 0.2, stabilizer: "low", pressure: false, autoZoom: false },
};

export const TOOL_PROFILE_LABELS = {
  pen: "Caneta",
  writing: "Escrita à mão",
  marker: "Marcador",
  highlighter: "Marca-texto",
};

export const STABILIZER_LEVELS = {
  off: { smoothing: 0, iterations: 0, name: "Desligado" },
  low: { smoothing: 0.3, iterations: 1, name: "Baixa" },
  medium: { smoothing: 0.6, iterations: 2, name: "Média" },
  high: { smoothing: 0.85, iterations: 3, name: "Alta" },
};

export const MINDMAP_TEXT_SIZES = {
  small: 12,
  medium: 15,
  large: 18,
};

export const COLORS = [
  "#ffffff",
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#a8e6cf",
  "#ff8b94",
  "#c7ceea",
  "#f8b500",
  "#00d9ff",
  "#ff6ec7",
  "#8a2be2",
  "#00ff87",
];

let _idCounter = 0;
export const uid = () =>
  `${Date.now().toString(36)}-${(_idCounter++).toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

export const deepClone = (value) =>
  value == null
    ? value
    : typeof structuredClone === "function"
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const estimateTextWidth = (content, fontSize, fontFamily) => {
  const f = (fontFamily || "Inter").toLowerCase();
  const factor = f.includes("mono") || f.includes("jetbrains") ? 0.6 : 0.55;
  const lines = String(content || "").split("\n");
  let max = 0;
  for (const line of lines) max = Math.max(max, line.length);
  return Math.max(40, max * fontSize * factor);
};

export function elementBBox(el, allElements) {
  if (el.type === "stroke") {
    const pts = el.points;
    if (!pts || pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = (el.width || 2) * 0.6;
    return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
  }
  if (el.type === "shape") {
    const x = Math.min(el.x, el.x + el.width);
    const y = Math.min(el.y, el.y + el.height);
    const w = Math.abs(el.width);
    const h = Math.abs(el.height);
    if (el.shapeType === "polygon" && Array.isArray(el.points)) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = (el.strokeWidth || 2) / 2;
      return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
    }
    const pad = (el.strokeWidth || 2) / 2;
    return { x: x - pad, y: y - pad, width: w + pad * 2, height: h + pad * 2 };
  }
  if (el.type === "text") {
    const w = el.width || estimateTextWidth(el.content, el.fontSize, el.fontFamily);
    const h = el.height || (el.fontSize || 20) * 1.35 * String(el.content || "").split("\n").length;
    return { x: el.x, y: el.y, width: w, height: h };
  }
  if (el.type === "node") {
    return { x: el.x, y: el.y, width: el.width, height: el.height };
  }
  if (el.type === "group") {
    const ids = new Set(el.children || []);
    let box = null;
    for (const child of allElements || []) {
      if (ids.has(child.id)) {
        const b = elementBBox(child, allElements);
        if (!box) box = b;
        else box = unionBox(box, b);
      }
    }
    return box || { x: 0, y: 0, width: 0, height: 0 };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export const unionBox = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.width, b.x + b.width);
  const y2 = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: x2 - x, height: y2 - y };
};

export const boxFromPoints = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
};

export function makeStroke(points, color, width) {
  return {
    id: uid(),
    type: "stroke",
    points: points.map((p) => ({ x: p.x, y: p.y, p: p.p ?? 0.5 })),
    color,
    width,
  };
}

export function makeShape(shapeType, x, y, width, height, strokeColor, fillColor, strokeWidth, extra) {
  return {
    id: uid(),
    type: "shape",
    shapeType,
    x,
    y,
    width,
    height,
    strokeColor,
    fillColor,
    strokeWidth,
    ...(extra || {}),
  };
}

export function makeText(content, x, y, opts = {}) {
  const fontSize = opts.fontSize || 20;
  const fontFamily = opts.fontFamily || "Inter";
  return {
    id: uid(),
    type: "text",
    x,
    y,
    content,
    color: opts.color || "#ffffff",
    fontSize,
    fontFamily,
    bold: !!opts.bold,
    italic: !!opts.italic,
    align: opts.align || "left",
    width: opts.width || estimateTextWidth(content, fontSize, fontFamily),
  };
}

export function makeNode(text, x, y, opts = {}) {
  const fontSize = opts.fontSize || 15;
  const fontFamily = opts.fontFamily || "Inter";
  const padX = opts.padX || 14;
  const padY = opts.padY || 10;
  const lines = String(text || "").split("\n").length;
  const w = Math.max(80, estimateTextWidth(text, fontSize, fontFamily) + padX * 2);
  const h = Math.max(36, lines * fontSize * 1.35 + padY * 2);
  return {
    id: uid(),
    type: "node",
    x,
    y,
    width: w,
    height: h,
    text,
    fontSize,
    fontFamily,
    color: opts.color || "#ffffff",
    bg: opts.bg || "#1f2937",
    borderColor: opts.borderColor || "#60a5fa",
    shape: opts.shape || "rounded",
    bold: opts.bold !== undefined ? opts.bold : true,
    parentId: opts.parentId || null,
    collapsed: !!opts.collapsed,
  };
}

export function makeConnector(fromId, toId, color, width, style) {
  return {
    id: uid(),
    type: "connector",
    fromId,
    toId,
    color: color || "#60a5fa",
    width: width || 2,
    style: style || "curve",
  };
}

export function makeGroup(childIds, allElements) {
  const box = unionBoxes(childIds, allElements);
  return {
    id: uid(),
    type: "group",
    children: childIds,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
}

const unionBoxes = (ids, allElements) => {
  const set = new Set(ids);
  let box = null;
  for (const el of allElements || []) {
    if (set.has(el.id)) {
      const b = elementBBox(el, allElements);
      box = box ? unionBox(box, b) : b;
    }
  }
  return box || { x: 0, y: 0, width: 0, height: 0 };
};

export function textColorForBackground(bg) {
  let hex = String(bg || "#1f2937").replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#111827" : "#ffffff";
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const legacy = localStorage.getItem("virtual_whiteboard_state");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return {
          elements: parsed.elements || [],
          pan: { x: 0, y: 0 },
          scale: 1,
          migrated: true,
        };
      }
      return null;
    }
    const parsed = JSON.parse(saved);
    return {
      elements: parsed.elements || [],
      pan: parsed.pan || { x: 0, y: 0 },
      scale: parsed.scale || 1,
    };
  } catch (e) {
    console.error("Erro ao carregar estado da lousa:", e);
    return null;
  }
}

export function saveState(elements, pan, scale) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, pan, scale }));
  } catch (e) {
    console.error("Erro ao salvar estado da lousa:", e);
  }
}
