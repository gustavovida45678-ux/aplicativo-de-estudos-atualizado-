// Reconhecimento de escrita à mão (OCR) para a Lousa Digital.
// Renderiza os traços (preto sobre branco) num canvas temporário e usa o
// Tesseract.js (português) para reconhecer as letras escritas com o mouse.
import Tesseract from "tesseract.js";

let workerPromise = null;

export function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("por");
  }
  return workerPromise;
}

// Monta o canvas otimizado para OCR a partir dos traços da lousa.
// Ignora borrachas (mesma cor do fundo) e traços com menos de 2 pontos.
export function strokesToOcrCanvas(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let count = 0;
  for (const s of strokes) {
    if (!s.points || s.points.length < 2) continue;
    if (s.color === "#0d1117" || s.color === "#000000") continue;
    for (const p of s.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      count++;
    }
  }
  if (!count) return null;

  const pad = 28;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  // Escala para que a altura do texto fique em ~220px (ideal p/ Tesseract)
  const scale = Math.max(2, Math.min(8, 220 / Math.max(h, 40)));

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#000000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, 3.2 * scale);

  for (const s of strokes) {
    if (!s.points || s.points.length < 2) continue;
    if (s.color === "#0d1117" || s.color === "#000000") continue;
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const x = (p.x - minX + pad) * scale;
      const y = (p.y - minY + pad) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  return { canvas, bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
}

// Reconhece os traços e devolve { text, confidence, bbox }.
export async function recognizeStrokes(strokes) {
  const made = strokesToOcrCanvas(strokes);
  if (!made) return null;
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(made.canvas);
  const text = (data.text || "").replace(/\s+/g, " ").trim();
  return {
    text,
    confidence: data.confidence || 0,
    bbox: made.bbox,
  };
}