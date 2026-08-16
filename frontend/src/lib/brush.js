// BrushEngine: renderiza traços como pincel/caneta real.
// - Espessura varia com a velocidade do movimento (lento = grosso,
//   rápido = fino), como um pincel de verdade.
// - Bordas naturais com lineCap round e segmentos sobrepostos.
// - Tipos: caneta (sólida), marcador (translúcido e grosso), giz (quase sólido).

export const BRUSH_TYPES = {
  caneta: { label: "Caneta", alpha: 1, widthMult: 1.0 },
  marcador: { label: "Marcador", alpha: 0.62, widthMult: 1.5 },
  giz: { label: "Giz", alpha: 0.88, widthMult: 1.15 },
};

// Fator de espessura a partir da velocidade (px por ponto).
// Lento -> ~1.3x (traço grosso), rápido -> ~0.7x (traço fino).
export function speedWidthFactor(speedPx) {
  const s = Math.min(Math.abs(speedPx) / 14, 1);
  return 1.3 - 0.6 * s;
}

// Largura final do traço para o tipo de pincel escolhido.
export function brushWidth(baseSize, brushType, speedPx) {
  const cfg = BRUSH_TYPES[brushType] || BRUSH_TYPES.caneta;
  return Math.max(2, baseSize * cfg.widthMult * speedWidthFactor(speedPx));
}

// Desenha um traço inteiro no contexto, com espessura variável por ponto
// (os pontos podem carregar `w` = largura naquele instante).
export function renderStroke(ctx, stroke, brushType) {
  const pts = stroke.points;
  if (!pts || pts.length < 2) return;

  const cfg = BRUSH_TYPES[stroke.brush || brushType] || BRUSH_TYPES.caneta;
  const alpha = stroke.alpha !== undefined ? stroke.alpha : cfg.alpha;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = stroke.color;

  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const w0 = p0.w || stroke.size;
    const w1 = p1.w || stroke.size;
    const width = (w0 + w1) / 2;

    // Segmento com largura variável: linha com pontas redondas + bolinha
    // na junção para eliminar "cravos" entre os pontos.
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p1.x, p1.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ponta inicial arredondada
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, (pts[0].w || stroke.size) / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}