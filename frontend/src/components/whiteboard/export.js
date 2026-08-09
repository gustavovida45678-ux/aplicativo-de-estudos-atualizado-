import { elementBBox, unionBox, textColorForBackground } from "./core";
import {
  renderElements,
  renderShapeElement,
  renderStrokeElement,
  renderTextElement,
  renderNodeElement,
  renderConnectorElement,
} from "./renderer";
import { SHAPES } from "./core";

export function sceneBBox(elements) {
  let box = null;
  for (const el of elements) {
    if (el.type === "group") continue;
    const b = elementBBox(el, elements);
    if (!box) box = b;
    else box = unionBox(box, b);
  }
  if (!box) box = { x: 0, y: 0, width: 800, height: 600 };
  const pad = 60;
  return { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
}

export function renderSceneToCanvas(elements, bbox, scale = 2) {
  const w = Math.max(50, Math.round(bbox.width * scale));
  const h = Math.max(50, Math.round(bbox.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, w, h);
  ctx.setTransform(scale, 0, 0, scale, -bbox.x * scale, -bbox.y * scale);
  renderElements(ctx, elements, Object.fromEntries(elements.map((e) => [e.id, e])));
  return canvas;
}

export function exportPNG(elements) {
  const bbox = sceneBBox(elements);
  const canvas = renderSceneToCanvas(elements, bbox, 2);
  const link = document.createElement("a");
  link.download = `lousa-virtual-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  return true;
}

export function exportPDF(elements) {
  const bbox = sceneBBox(elements);
  const canvas = renderSceneToCanvas(elements, bbox, 2);
  return import("jspdf").then(({ jsPDF }) => {
    const ratio = bbox.width / bbox.height;
    const pageW = 842;
    const pageH = pageW / ratio;
    const doc = new jsPDF({ orientation: ratio >= 1 ? "landscape" : "portrait", unit: "px", format: [pageW, pageH] });
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
    doc.save(`lousa-virtual-${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  });
}

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function strokeToSvg(s) {
  const pts = s.points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const avgW = (s.width || 3) * 0.8;
  return `<polyline points="${pts}" fill="none" stroke="${esc(s.color)}" stroke-width="${avgW.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function shapeToSvg(el) {
  const { x, y, width, height } = el;
  const w = Math.abs(width);
  const h = Math.abs(height);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const stroke = `stroke="${esc(el.strokeColor || "#ffffff")}" stroke-width="${(el.strokeWidth || 2).toFixed(2)}"`;
  const fill = el.fillColor && el.fillColor !== "transparent" ? `fill="${esc(el.fillColor)}"` : `fill="none"`;
  switch (el.shapeType) {
    case SHAPES.RECTANGLE:
    case SHAPES.SQUARE:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${stroke} ${fill}/>`;
    case SHAPES.CIRCLE: {
      const r = Math.min(w, h) / 2;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${stroke} ${fill}/>`;
    }
    case SHAPES.ELLIPSE:
      return `<ellipse cx="${cx}" cy="${cy}" rx="${(w / 2).toFixed(2)}" ry="${(h / 2).toFixed(2)}" ${stroke} ${fill}/>`;
    case SHAPES.TRIANGLE:
      return `<polygon points="${cx},${y} ${x},${y + h} ${x + w},${y + h}" ${stroke} ${fill}/>`;
    case SHAPES.DIAMOND:
      return `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" ${stroke} ${fill}/>`;
    case SHAPES.LINE:
      return `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" ${stroke}/>`;
    case SHAPES.POLYGON:
      return `<polygon points="${(el.points || []).map((p) => `${p.x},${p.y}`).join(" ")}" ${stroke} ${fill}/>`;
    default:
      return "";
  }
}

function textToSvg(el) {
  const style = `${el.italic ? "font-style:italic;" : ""}${el.bold ? "font-weight:bold;" : ""}font-family:${esc(el.fontFamily || "Inter")}, sans-serif;`;
  const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
  let x = el.x;
  if (anchor === "middle") x = el.x + el.width / 2;
  else if (anchor === "end") x = el.x + el.width;
  const lines = String(el.content || "").split("\n");
  const lh = (el.fontSize || 20) * 1.35;
  return lines
    .map((line, i) => {
      const y = el.y + i * lh;
      return `<text x="${x}" y="${y}" font-size="${el.fontSize || 20}" fill="${esc(el.color || "#fff")}" text-anchor="${anchor}" style="${style}">${esc(line)}</text>`;
    })
    .join("");
}

function nodeToSvg(el) {
  const color = textColorForBackground(el.bg || "#1f2937");
  const r = el.shape === "round" ? Math.min(12, (el.height || 36) / 2.4) : 2;
  const lines = String(el.text || "").split("\n");
  const lh = (el.fontSize || 15) * 1.3;
  const startY = el.y + el.height / 2 - ((lines.length - 1) * lh) / 2 + (el.fontSize || 15) / 3.5;
  const text = lines
    .map((line, i) => `<text x="${el.x + el.width / 2}" y="${(startY + i * lh).toFixed(2)}" font-size="${el.fontSize || 15}" fill="${color}" text-anchor="middle" font-weight="${el.bold ? "bold" : "normal"}">${esc(line)}</text>`)
    .join("");
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${r}" fill="${esc(el.bg || "#1f2937")}" stroke="${esc(el.borderColor || "#60a5fa")}" stroke-width="${el.selected ? 2.5 : 1.5}"/>${text}`;
}

function connectorToSvg(c, from, to) {
  if (!from || !to) return "";
  const A = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const B = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  let d;
  if (c.style === "elbow") {
    const midX = (A.x + B.x) / 2;
    const midY = (A.y + B.y) / 2;
    if (Math.abs(dx) > Math.abs(dy)) d = `M ${A.x} ${A.y} L ${midX} ${A.y} L ${midX} ${B.y} L ${B.x} ${B.y}`;
    else d = `M ${A.x} ${A.y} L ${A.x} ${midY} L ${B.x} ${midY} L ${B.x} ${B.y}`;
  } else {
    const c1 = Math.abs(dx) > Math.abs(dy) ? { x: A.x + dx * 0.5, y: A.y } : { x: A.x, y: A.y + dy * 0.5 };
    const c2 = Math.abs(dx) > Math.abs(dy) ? { x: B.x - dx * 0.5, y: B.y } : { x: B.x, y: B.y - dy * 0.5 };
    d = `M ${A.x} ${A.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${B.x} ${B.y}`;
  }
  return `<path d="${d}" fill="none" stroke="${esc(c.color || "#60a5fa")}" stroke-width="${c.width || 2}" marker-end="url(#arrow)"/>`;
}

export function exportSVG(elements) {
  const bbox = sceneBBox(elements);
  const mapById = Object.fromEntries(elements.map((e) => [e.id, e]));
  const parts = [];
  for (const el of elements) {
    if (el.type === "connector") {
      const from = mapById[el.fromId];
      const to = mapById[el.toId];
      parts.push(connectorToSvg(el, from, to));
    } else if (el.type === "shape") parts.push(shapeToSvg(el));
    else if (el.type === "stroke") parts.push(strokeToSvg(el));
    else if (el.type === "text") parts.push(textToSvg(el));
    else if (el.type === "node") parts.push(nodeToSvg(el));
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}" viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa"/>
    </marker>
  </defs>
  <rect x="${bbox.x}" y="${bbox.y}" width="${bbox.width}" height="${bbox.height}" fill="#0d1117"/>
  <g transform="translate(${-bbox.x} ${-bbox.y})">
    ${parts.join("\n    ")}
  </g>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `lousa-virtual-${new Date().toISOString().slice(0, 10)}.svg`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
