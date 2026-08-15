import { createRoot } from "react-dom/client";
import React from "react";

export function renderChartSVGHTML(el) {
  const w = Math.max(40, el.width || 240);
  const h = Math.max(40, el.height || 160);
  const vals = (el.values || []).map((v) => Number(v) || 0);
  const labels = el.labels || [];
  const maxV = Math.max(...vals, 1);
  const pad = 24;
  const color = el.color || "#22d3ee";
  const axisColor = "#7d8590";

  if (el.chartType === "pie") {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 20;
    let acc = 0;
    let svg = '<svg width="' + w + '" height="' + h + '" style="display:block">';
    vals.forEach((v, i) => {
      const start = acc;
      const end = acc + (v / maxV) * 2 * Math.PI;
      acc = end;
      const large = end - start > Math.PI;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const d = ["M", cx, cy, "L", x1, y1, "A", r, r, 0, large ? 1 : 0, 1, x2, y2, "Z"].join(" ");
      const hue = (i * 60) % 360;
      svg += '<path d="' + d + '" fill="hsl(' + hue + ', 70%, 50%)" stroke="#0d1117" stroke-width="1"/>';
    });
    svg += "</svg>";
    return svg;
  }

  const plotW = w - pad * 2;
  const plotH = h - pad * 2;

  if (el.chartType === "line") {
    const step = vals.length > 1 ? plotW / (vals.length - 1) : 0;
    const pts = vals.map((v, i) => ({ x: pad + i * step, y: pad + plotH - (v / maxV) * plotH }));
    let svg = '<svg width="' + w + '" height="' + h + '" style="display:block">';
    svg += '<line x1="' + pad + '" y1="' + (pad + plotH) + '" x2="' + (w - pad) + '" y2="' + (pad + plotH) + '" stroke="' + axisColor + '" stroke-width="1"/>';
    svg += '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (pad + plotH) + '" stroke="' + axisColor + '" stroke-width="1"/>';
    svg += '<path d="M ' + pts.map((p) => p.x + "," + p.y).join(" L ") + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    pts.forEach((p) => {
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="' + color + '"/>';
    });
    labels.forEach((lab, i) => {
      const px = pad + (vals.length > 1 ? (i * plotW) / (vals.length - 1) : plotW / 2);
      svg += '<text x="' + px + '" y="' + (h - 4) + '" text-anchor="middle" fill="#9ca3af" font-size="10">' + String(lab) + '</text>';
    });
    svg += "</svg>";
    return svg;
  }

  const count = vals.length || 1;
  const barW = Math.min(40, plotW / count - 8);
  const gap = count > 1 ? (plotW - barW * count) / (count - 1) : 0;
  let svg = '<svg width="' + w + '" height="' + h + '" style="display:block">';
  svg += '<line x1="' + pad + '" y1="' + (pad + plotH) + '" x2="' + (w - pad) + '" y2="' + (pad + plotH) + '" stroke="' + axisColor + '" stroke-width="1"/>';
  svg += '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (pad + plotH) + '" stroke="' + axisColor + '" stroke-width="1"/>';
  vals.forEach((v, i) => {
    const bh = (v / maxV) * plotH;
    const bx = pad + i * (barW + gap);
    const by = pad + plotH - bh;
    const hue = (i * 60) % 360;
    svg += '<rect x="' + bx + '" y="' + by + '" width="' + barW + '" height="' + Math.max(1, bh) + '" fill="hsl(' + hue + ', 70%, 55%)" rx="2"/>';
  });
  labels.forEach((lab, i) => {
    const bx = pad + i * (barW + gap) + barW / 2;
    svg += '<text x="' + bx + '" y="' + (h - 4) + '" text-anchor="middle" fill="#9ca3af" font-size="10">' + String(lab) + '</text>';
  });
  svg += "</svg>";
  return svg;
}

export function renderTableHTML(el) {
  const rows = el.rows || 0;
  const cols = el.cols || 0;
  const cells = el.cells || [];
  const color = el.color || "#ffffff";
  const fontSize = el.fontSize || 16;
  let html = '<table style="border-collapse:collapse;color:' + color + ";font-size:" + fontSize + 'px;width:100%;height:100%">';
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += '<td style="border:1px solid #444;padding:4px 8px;text-align:center">' + (cells[r] && cells[r][c] ? String(cells[r][c]).replace(/</g, "&lt;").replace(/>/g, "&gt;") : "") + "</td>";
    }
    html += "</tr>";
  }
  html += "</table>";
  return html;
}

export function renderFormulaHTML(el) {
  const color = el.color || "#ffffff";
  const fontSize = el.fontSize || 20;
  const latex = (el.latex || "").trim();
  if (!latex) return "";
  return '<div style="color:' + color + ";font-size:" + fontSize + 'px\">\\(' + latex + "\\)</div>";
}
