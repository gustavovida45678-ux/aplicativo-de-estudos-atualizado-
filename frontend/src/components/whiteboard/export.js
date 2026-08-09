import { elementBBox, unionBox, textColorForBackground } from "./core";
import {
  renderElements,
  renderShapeElement,
  renderStrokeElement,
  renderTextElement,
  renderNodeElement,
  renderConnectorElement,
  renderFormulaElement,
  renderTableElement,
  renderChartElement,
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

function formulaToSvg(el) {
  const style = `font-family:${esc(el.fontFamily || "Inter")}, sans-serif;font-size:${el.fontSize || 20}px;fill:${esc(el.color || "#fff")};`;
  const anchor = "start";
  let x = el.x;
  const lines = String(el.latex || "").split("\n");
  const lh = (el.fontSize || 20) * 1.35;
  return lines
    .map((line, i) => {
      const y = el.y + i * lh;
      return `<text x="${x}" y="${y}" font-size="${el.fontSize || 20}" fill="${esc(el.color || "#fff")}" text-anchor="${anchor}" style="${style}">${esc(line)}</text>`;
    })
    .join("");
}

function tableToSvg(el) {
  const { x, y, rows, cols, cells, fontSize = 16, color = "#ffffff", cellWidth = 80, cellHeight = 32 } = el;
  if (!cells || rows <= 0 || cols <= 0) return "";

  const parts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellX = x + c * cellWidth;
      const cellY = y + r * cellHeight;
      const cellW = cellWidth;
      const cellH = cellHeight;

      parts.push(`<rect x="${cellX}" y="${cellY}" width="${cellW}" height="${cellH}" fill="none" stroke="${esc(color)}" stroke-width="1"/>`);

      const cellContent = cells[r]?.[c] || "";
      const lines = String(cellContent).split("\n");
      const lineHeight = fontSize * 1.3;
      const startY = cellY + cellH / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize / 3;

      lines.forEach((line, i) => {
        parts.push(`<text x="${cellX + cellW / 2}" y="${(startY + i * lineHeight).toFixed(2)}" font-size="${fontSize}" fill="${esc(color)}" text-anchor="middle" font-family="Inter, sans-serif">${esc(line)}</text>`);
      });
    }
  }
  return parts.join("\n    ");
}

function chartToSvg(el) {
  const { x, y, width = 240, height = 160, chartType = "bar", labels = [], values = [], color = "#22d3ee" } = el;
  const data = values.map((v) => Number(v) || 0);
  const maxV = Math.max(...data, 1);
  const parts = [];

  if (chartType === "pie") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2 - 30;
    let acc = 0;
    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) return "";

    const colors = ["#22d3ee", "#f472b6", "#86efac", "#fcd34d", "#a78bfa", "#fb923c", "#60a5fa", "#34d399", "#f87171", "#c084fc"];

    data.forEach((val, i) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      const start = acc - Math.PI / 2;
      const end = acc + sliceAngle - Math.PI / 2;
      acc += sliceAngle;

      const sliceColor = colors[i % colors.length];
      const large = sliceAngle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      parts.push(`<path d="${d}" fill="${sliceColor}" stroke="#0d1117" stroke-width="2"/>`);

      const mid = (start + end) / 2;
      const labelR = r * 0.65;
      const lx = cx + Math.cos(mid) * labelR;
      const ly = cy + Math.sin(mid) * labelR;
      const pct = ((val / total) * 100).toFixed(1);
      parts.push(`<text x="${lx}" y="${ly}" font-size="12" fill="#ffffff" text-anchor="middle" font-weight="bold">${pct}%</text>`);
    });

    const legendX = x + width - 120;
    let legendY = y + 20;
    data.forEach((val, i) => {
      const sliceColor = colors[i % colors.length];
      parts.push(`<rect x="${legendX}" y="${legendY - 6}" width="12" height="12" fill="${sliceColor}"/>`);
      parts.push(`<text x="${legendX + 18}" y="${legendY}" font-size="11" fill="#e2e8f0" text-anchor="start">${esc(labels[i] || "Item " + (i + 1))}: ${val}</text>`);
      legendY += 18;
    });
    return parts.join("\n    ");
  }

  const chartLeft = x + 50;
  const chartRight = x + width - 20;
  const chartTop = y + 20;
  const chartBottom = y + height - 40;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  parts.push(`<line x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${chartBottom}" stroke="#30363d" stroke-width="1"/>`);
  parts.push(`<line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="#30363d" stroke-width="1"/>`);

  for (let i = 0; i <= 4; i++) {
    const val = (maxV * i) / 4;
    const py = chartBottom - (i / 4) * chartHeight;
    parts.push(`<text x="${chartLeft - 8}" y="${py}" font-size="11" fill="#8b949e" text-anchor="end" dominant-baseline="middle">${val.toFixed(1)}</text>`);
    if (chartType === "line") {
      parts.push(`<line x1="${chartLeft}" y1="${py}" x2="${chartRight}" y2="${py}" stroke="#1e2937" stroke-width="0.5" stroke-dasharray="2,2"/>`);
    }
  }

  if (chartType === "bar") {
    const barCount = data.length;
    const barWidth = chartWidth / Math.max(barCount, 1);
    const barGap = barWidth * 0.2;
    const actualBarWidth = barWidth - barGap;

    data.forEach((val, i) => {
      const bx = chartLeft + i * barWidth + barGap / 2;
      const barH = (val / maxV) * chartHeight;
      const by = chartBottom - barH;
      parts.push(`<rect x="${bx}" y="${by}" width="${actualBarWidth}" height="${barH}" fill="${color}"/>`);
      parts.push(`<text x="${bx + actualBarWidth / 2}" y="${by - 4}" font-size="11" fill="#e2e8f0" text-anchor="middle">${val}</text>`);
      parts.push(`<text x="${bx + actualBarWidth / 2}" y="${chartBottom + 12}" font-size="11" fill="#8b949e" text-anchor="middle">${esc(labels[i] || String(i + 1))}</text>`);
    });
  } else if (chartType === "line") {
    const minV = Math.min(...data, 0);
    const range = maxV - minV || 1;
    const points = data.map((val, i) => {
      const px = chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const py = chartBottom - ((val - minV) / range) * chartHeight;
      return { px, py, val };
    });

    const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.px} ${p.py}`).join(" ");
    parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);

    points.forEach((p) => {
      parts.push(`<circle cx="${p.px}" cy="${p.py}" r="4" fill="${color}"/>`);
      parts.push(`<text x="${p.px}" y="${p.py - 8}" font-size="11" fill="#e2e8f0" text-anchor="middle">${p.val}</text>`);
      parts.push(`<text x="${p.px}" y="${chartBottom + 12}" font-size="11" fill="#8b949e" text-anchor="middle">${esc(labels[points.indexOf(p)] || String(points.indexOf(p) + 1))}</text>`);
    });
  }

  return parts.join("\n    ");
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
    else if (el.type === "formula") parts.push(formulaToSvg(el));
    else if (el.type === "table") parts.push(tableToSvg(el));
    else if (el.type === "chart") parts.push(chartToSvg(el));
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
