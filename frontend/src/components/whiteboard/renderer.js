import { clamp } from "./core";
import { estimateTextWidth } from "./core";
import { SHAPES } from "./core";

export function drawGrid(ctx, w, h, pan, scale, mode) {
  if (!mode || mode === "none") return;
  let spacing = 32 * scale;
  while (spacing < 14) spacing *= 2;
  while (spacing > 96) spacing /= 2;

  const x0 = (pan.x % spacing) - spacing;
  const y0 = (pan.y % spacing) - spacing;

  if (mode === "lines") {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0; x <= w + spacing; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = y0; y <= h + spacing; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  } else if (mode === "dots") {
    ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
    const s = Math.max(1.5, spacing * 0.06);
    ctx.beginPath();
    for (let x = x0; x <= w + spacing; x += spacing) {
      for (let y = y0; y <= h + spacing; y += spacing) {
        ctx.moveTo(x + s / 2, y);
        ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  } else if (mode === "ruled") {
    const lineSpacing = 28 * scale;
    while (lineSpacing < 16) lineSpacing *= 2;
    while (lineSpacing > 60) lineSpacing /= 2;
    const y0ruled = (pan.y % lineSpacing) - lineSpacing;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let y = y0ruled; y <= h + lineSpacing; y += lineSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = y0ruled; y <= h + lineSpacing; y += lineSpacing * 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    const marginX = (pan.x % (w * 0.15)) - w * 0.15;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-marginX, 0);
    ctx.lineTo(-marginX, h);
    ctx.stroke();
  }
}

export function wrapText(ctx, text, maxWidth) {
  const lines = String(text || "").split("\n");
  if (maxWidth <= 0) return lines;
  const out = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      out.push(line);
      continue;
    }
    let current = "";
    for (const word of line.split(" ")) {
      const test = current ? current + " " + word : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function drawArrowHead(ctx, tip, angle, size) {
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - size * Math.cos(angle - Math.PI / 6), tip.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tip.x - size * Math.cos(angle + Math.PI / 6), tip.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function strokeWidthAt(stroke, i, scale = 1, zoomIndependent = false) {
  const p = stroke.points[i];
  const pv = p && p.p != null ? p.p : 0.5;
  const baseWidth = stroke.width || 3;
  const pressureFactor = clamp(pv, 0.35, 1);
  if (zoomIndependent) {
    return baseWidth * pressureFactor;
  }
  return baseWidth * clamp(pv, 0.35, 1) * scale;
}

export function renderStrokeElement(ctx, s, scale = 1, zoomIndependent = false) {
  const pts = s.points;
  const n = pts.length;
  if (!pts || n < 2) return;
  ctx.strokeStyle = s.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const taperStart = n < 6 ? 0.7 : 0.35;
  const taperEnd = n < 6 ? 0.7 : 0.2;
  for (let i = 0; i < n - 1; i++) {
    const w1 = strokeWidthAt(s, i, scale, zoomIndependent) * (i === 0 ? taperStart : 1);
    const w2 = strokeWidthAt(s, i + 1, scale, zoomIndependent) * (i + 1 === n - 1 ? taperEnd : 1);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.lineWidth = (w1 + w2) / 2;
    ctx.stroke();
  }
}

function shapePath(ctx, el) {
  const { x, y, width, height } = el;
  const w = Math.abs(width);
  const h = Math.abs(height);
  const cx = x + width / 2;
  const cy = y + height / 2;
  switch (el.shapeType) {
    case SHAPES.RECTANGLE:
    case SHAPES.SQUARE:
      ctx.rect(x, y, w, h);
      break;
    case SHAPES.CIRCLE: {
      const r = Math.min(w, h) / 2;
      ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
      break;
    }
    case SHAPES.ELLIPSE:
      ctx.ellipse(cx, cy, Math.max(0.1, w / 2), Math.max(0.1, h / 2), 0, 0, Math.PI * 2);
      break;
    case SHAPES.TRIANGLE:
      ctx.moveTo(cx, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    case SHAPES.DIAMOND:
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      break;
    case SHAPES.LINE:
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
      break;
    case SHAPES.ARROW: {
      const angle = Math.atan2(height, width);
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();
      const headLen = Math.max(10, (el.strokeWidth || 3) * 4);
      drawArrowHead(ctx, { x: x + width, y: y + height }, angle, headLen);
      return;
    }
    case SHAPES.POLYGON: {
      const pts = el.points || [];
      if (!pts.length) return;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(x, y, w, h);
  }
}

export function renderShapeElement(ctx, el) {
  ctx.beginPath();
  shapePath(ctx, el);
  if (el.fillColor && el.fillColor !== "transparent") {
    ctx.fillStyle = el.fillColor;
    ctx.fill();
  }
  if (el.shapeType !== SHAPES.ARROW) {
    ctx.strokeStyle = el.strokeColor || "#ffffff";
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.stroke();
  }
}

export function renderTextElement(ctx, el, maxWidthOverride) {
  const fontSize = el.fontSize || 20;
  const fontFamily = el.fontFamily || "Inter";
  ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${fontSize}px "${fontFamily}", Inter, sans-serif`;
  ctx.fillStyle = el.color || "#ffffff";
  ctx.textBaseline = "top";
  ctx.textAlign = el.align || "left";
  const maxWidth = maxWidthOverride || el.width || estimateTextWidth(el.content, fontSize, fontFamily);
  const lines = wrapText(ctx, el.content, maxWidth);
  const lineHeight = fontSize * 1.35;
  let x = el.x;
  if (ctx.textAlign === "center") x = el.x + maxWidth / 2;
  else if (ctx.textAlign === "right") x = el.x + maxWidth;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, el.y + i * lineHeight, maxWidth);
  });
  return { lines, lineHeight };
}

export function renderNodeElement(ctx, el, selected) {
  const { x, y, width, height } = el;
  const r = el.shape === "round" ? Math.min(12, height / 2.4) : el.shape === "square" ? 2 : height / 2;
  const bg = el.bg || "#1f2937";
  ctx.beginPath();
  if (r === height / 2) {
    ctx.roundRect ? ctx.roundRect(x, y, width, height, r) : ctx.rect(x, y, width, height);
  } else {
    ctx.roundRect ? ctx.roundRect(x, y, width, height, r) : ctx.rect(x, y, width, height);
  }
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = selected ? "#22d3ee" : el.borderColor || "#60a5fa";
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();

  ctx.fillStyle = el.color || "#ffffff";
  ctx.font = `${el.bold ? "bold " : ""}${el.fontSize || 15}px "${el.fontFamily || "Inter"}", Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = String(el.text || "").split("\n");
  const lineHeight = (el.fontSize || 15) * 1.3;
  const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x + width / 2, startY + i * lineHeight, width - 8);
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function renderConnectorElement(ctx, c, from, to) {
  if (!from || !to) return;
  const A = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const B = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = B.x - A.x;
  const dy = B.y - A.y;

  ctx.beginPath();
  ctx.strokeStyle = c.color || "#60a5fa";
  ctx.lineWidth = c.width || 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let endDir = { x: 1, y: 0 };
  if (c.style === "elbow") {
    const midX = (A.x + B.x) / 2;
    const midY = (A.y + B.y) / 2;
    if (Math.abs(dx) > Math.abs(dy)) {
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(midX, A.y);
      ctx.lineTo(midX, B.y);
      ctx.lineTo(B.x, B.y);
      endDir = { x: Math.sign(dx), y: 0 };
    } else {
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(A.x, midY);
      ctx.lineTo(B.x, midY);
      ctx.lineTo(B.x, B.y);
      endDir = { x: 0, y: Math.sign(dy) };
    }
  } else {
    const c1 = Math.abs(dx) > Math.abs(dy)
      ? { x: A.x + dx * 0.5, y: A.y }
      : { x: A.x, y: A.y + dy * 0.5 };
    const c2 = Math.abs(dx) > Math.abs(dy)
      ? { x: B.x - dx * 0.5, y: B.y }
      : { x: B.x, y: B.y - dy * 0.5 };
    ctx.moveTo(A.x, A.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, B.x, B.y);
    endDir = { x: B.x - c2.x, y: B.y - c2.y };
  }

  ctx.stroke();

  const el = Math.hypot(endDir.x, endDir.y) || 1;
  const nx = endDir.x / el;
  const ny = endDir.y / el;
  const size = Math.max(7, (c.width || 2) * 4);
  const base = { x: B.x - nx * size * 0.6, y: B.y - ny * size * 0.6 };
  drawArrowHead(ctx, base, Math.atan2(ny, nx), size);

  if (c.label) {
    ctx.fillStyle = c.color || "#60a5fa";
    ctx.font = `500 11px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(c.label, (A.x + B.x) / 2, (A.y + B.y) / 2 - 6);
    ctx.textAlign = "left";
  }
}

export function renderFormulaElement(ctx, el) {
  const { x, y, width, height, latex, fontSize = 20, color = "#ffffff" } = el;
  const displayLatex = latex || "";
  if (!displayLatex.trim()) return;

  ctx.save();
  ctx.font = `${fontSize}px "Inter", sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  try {
    const lines = displayLatex.split("\n");
    const lineHeight = fontSize * 1.35;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight, width);
    }
  } catch (e) {
    ctx.fillStyle = "#ef4444";
    ctx.fillText("Error: " + displayLatex, x, y, width);
  }
  ctx.restore();
}

export function renderTableElement(ctx, el) {
  const { x, y, width, height, rows, cols, cells, fontSize = 16, color = "#ffffff", cellWidth = 80, cellHeight = 32 } = el;
  if (!cells || rows <= 0 || cols <= 0) return;

  ctx.save();
  ctx.font = `${fontSize}px "Inter", sans-serif`;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellX = x + c * cellWidth;
      const cellY = y + r * cellHeight;
      const cellW = cellWidth;
      const cellH = cellHeight;

      ctx.strokeRect(cellX, cellY, cellW, cellH);

      const cellContent = cells[r]?.[c] || "";
      const lines = String(cellContent).split("\n");
      const lineHeight = fontSize * 1.3;
      const startY = cellY + cellH / 2 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        ctx.fillText(line, cellX + cellW / 2, startY + i * lineHeight, cellW - 8);
      });
    }
  }
  ctx.restore();
}

function drawBarChart(ctx, el, x, y, w, h) {
  const { labels = [], values = [], color = "#22d3ee" } = el;
  const data = values.map((v) => Number(v) || 0);
  const maxV = Math.max(...data, 1);
  const barCount = data.length;
  const barWidth = (w - 40) / Math.max(barCount, 1);
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;
  const chartBottom = y + h - 30;
  const chartTop = y + 20;
  const chartHeight = chartBottom - chartTop;

  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "#8b949e";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  data.forEach((val, i) => {
    const bx = x + 20 + i * barWidth + barGap / 2;
    const barH = (val / maxV) * chartHeight;
    const by = chartBottom - barH;

    const grad = ctx.createLinearGradient(bx, by, bx, chartBottom);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "80");
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, actualBarWidth, barH);

    ctx.fillStyle = color;
    ctx.fillRect(bx, by, actualBarWidth, barH);

    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(val.toString(), bx + actualBarWidth / 2, by - 18, actualBarWidth);

    ctx.fillStyle = "#8b949e";
    ctx.fillText((labels[i] || String(i + 1)).toString(), bx + actualBarWidth / 2, chartBottom + 4, actualBarWidth);
  });

  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 20, chartTop);
  ctx.lineTo(x + 20, chartBottom);
  ctx.lineTo(x + 20 + w - 40, chartBottom);
  ctx.stroke();
}

function drawLineChart(ctx, el, x, y, w, h) {
  const { labels = [], values = [], color = "#22d3ee" } = el;
  const data = values.map((v) => Number(v) || 0);
  const maxV = Math.max(...data, 1);
  const minV = Math.min(...data, 0);
  const range = maxV - minV || 1;
  const barCount = data.length;
  const chartLeft = x + 50;
  const chartRight = x + w - 20;
  const chartTop = y + 20;
  const chartBottom = y + h - 40;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartBottom);
  ctx.lineTo(chartRight, chartBottom);
  ctx.stroke();

  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "#8b949e";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const val = minV + (range * i) / 4;
    const py = chartBottom - (i / 4) * chartHeight;
    ctx.fillText(val.toFixed(1), chartLeft - 8, py);
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  data.forEach((val, i) => {
    const px = chartLeft + (i / Math.max(barCount - 1, 1)) * chartWidth;
    const py = chartBottom - ((val - minV) / range) * chartHeight;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = color;
  data.forEach((val, i) => {
    const px = chartLeft + (i / Math.max(barCount - 1, 1)) * chartWidth;
    const py = chartBottom - ((val - minV) / range) * chartHeight;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(val.toString(), px, py - 8);
    ctx.fillStyle = color;
  });

  ctx.fillStyle = "#8b949e";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  data.forEach((_, i) => {
    const px = chartLeft + (i / Math.max(barCount - 1, 1)) * chartWidth;
    ctx.fillText((labels[i] || String(i + 1)).toString(), px, chartBottom + 4);
  });
}

function drawPieChart(ctx, el, x, y, w, h) {
  const { labels = [], values = [], color = "#22d3ee" } = el;
  const data = values.map((v) => Number(v) || 0);
  const total = data.reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2 - 30;
  let acc = 0;

  const colors = [
    "#22d3ee", "#f472b6", "#86efac", "#fcd34d", "#a78bfa",
    "#fb923c", "#60a5fa", "#34d399", "#f87171", "#c084fc"
  ];

  data.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    const start = acc - Math.PI / 2;
    const end = acc + sliceAngle - Math.PI / 2;
    acc += sliceAngle;

    const sliceColor = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = sliceColor;
    ctx.fill();
    ctx.strokeStyle = "#0d1117";
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = (start + end) / 2;
    const labelR = r * 0.65;
    const lx = cx + Math.cos(mid) * labelR;
    const ly = cy + Math.sin(mid) * labelR;
    const pct = ((val / total) * 100).toFixed(1);

    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, lx, ly);
  });

  const legendX = x + w - 120;
  let legendY = y + 20;
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  data.forEach((val, i) => {
    const sliceColor = colors[i % colors.length];
    ctx.fillStyle = sliceColor;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`${labels[i] || "Item " + (i + 1)}: ${val}`, legendX + 18, legendY);
    legendY += 18;
  });
}

export function renderChartElement(ctx, el) {
  const { x, y, width = 240, height = 160, chartType = "bar" } = el;
  switch (chartType) {
    case "bar":
      drawBarChart(ctx, el, x, y, width, height);
      break;
    case "line":
      drawLineChart(ctx, el, x, y, width, height);
      break;
    case "pie":
      drawPieChart(ctx, el, x, y, width, height);
      break;
    default:
      drawBarChart(ctx, el, x, y, width, height);
  }
}

export function renderElements(ctx, elements, mapById, scale = 1, zoomIndependent = false) {
  // Camada 1: conectores
  for (const el of elements) {
    if (el.type === "connector") {
      const from = mapById[el.fromId];
      const to = mapById[el.toId];
      if (from && to) renderConnectorElement(ctx, el, from, to);
    }
  }
  // Camada 2: formas
  for (const el of elements) {
    if (el.type === "shape") renderShapeElement(ctx, el);
  }
  // Camada 3: tracos
  for (const el of elements) {
    if (el.type === "stroke") renderStrokeElement(ctx, el, scale, zoomIndependent);
  }
  // Camada 4: textos
  for (const el of elements) {
    if (el.type === "text") renderTextElement(ctx, el);
  }
  // Camada 5: fórmulas
  for (const el of elements) {
    if (el.type === "formula") renderFormulaElement(ctx, el);
  }
  // Camada 6: tabelas
  for (const el of elements) {
    if (el.type === "table") renderTableElement(ctx, el);
  }
  // Camada 7: gráficos
  for (const el of elements) {
    if (el.type === "chart") renderChartElement(ctx, el);
  }
  // Camada 8: nos
  for (const el of elements) {
    if (el.type === "node") renderNodeElement(ctx, el, false);
  }
}
