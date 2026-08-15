import { convexHull, boundingBox, dist2d, distanceToLine, polylineLength } from "./geometry";

const deg = (rad) => (rad * 180) / Math.PI;

function normalizeAngle(degv) {
  let a = ((degv % 180) + 180) % 180;
  return a;
}

function angleOf(v) {
  return deg(Math.atan2(v.y, v.x));
}

function near(a, b, tolerance) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d <= tolerance;
}

function residualToLine(points, a, b) {
  let max = 0;
  for (const p of points) {
    const d = distanceToLine(p, a, b);
    if (d > max) max = d;
  }
  return max;
}

/**
 * Reconhece a forma desenhada a mao livre e retorna um objeto de forma
 * precisa, ou null para manter como traco.
 */
export function detectShapeFromStroke(stroke) {
  const pts = stroke.points;
  if (!pts || pts.length < 6) return null;

  const box = boundingBox(pts);
  const diag = Math.sqrt(box.width * box.width + box.height * box.height);
  if (diag < 24) return null;

  const first = pts[0];
  const last = pts[pts.length - 1];
  const closed = dist2d(first, last) < Math.max(24, diag * 0.12);

  const totalLen = polylineLength(pts);

  if (!closed) {
    // Linha reta
    const a = pts[0];
    const b = pts[pts.length - 1];
    const resid = residualToLine(pts, a, b);
    if (resid < Math.max(3, diag * 0.05)) {
      // Seta: verifica se ha um "bico" no final
      if (pts.length >= 4) {
        const p2 = pts[pts.length - 3];
        const p1 = pts[pts.length - 2];
        const p0 = pts[pts.length - 1];
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p0.x - p1.x, y: p0.y - p1.y };
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const ang = (Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2 || 1)))) * 180) / Math.PI;
        const lastSegLen = dist2d(p0, p1);
        if (ang > 25 && ang < 90 && lastSegLen < diag * 0.35) {
          return { type: "arrow", x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y };
        }
      }
      return { type: "line", x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y };
    }
    return null;
  }

  // Forma fechada
  const hull = convexHull(pts);
  const hbox = boundingBox(hull);
  const hdiag = Math.sqrt(hbox.width * hbox.width + hbox.height * hbox.height);
  const n = hull.length;

  if (n >= 3 && n <= 6) {
    const edges = [];
    for (let i = 0; i < n; i++) {
      const p = hull[i];
      const q = hull[(i + 1) % n];
      edges.push(normalizeAngle(angleOf({ x: q.x - p.x, y: q.y - p.y })));
    }
    const cardinal = edges.filter((a) => near(a, 0, 24) || near(a, 90, 24));
    const aspect = hbox.width / Math.max(1, hbox.height);

    if (n === 3) {
      return { type: "triangle", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
    }

    if (n === 4) {
      if (cardinal.length >= 3) {
        if (Math.abs(aspect - 1) < 0.12) {
          return { type: "square", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
        }
        return { type: "rectangle", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
      }
      if (Math.abs(aspect - 1) < 0.35) {
        return { type: "diamond", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
      }
    }

    if (cardinal.length >= 3 && totalLen > 0.6 * polylineLength(hull)) {
      if (Math.abs(aspect - 1) < 0.12) {
        return { type: "square", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
      }
      return { type: "rectangle", x: hbox.x, y: hbox.y, width: hbox.width, height: hbox.height };
    }
  }

  // Fechado sem cantos claros -> circulo/elipse
  const compactness = (4 * Math.PI * box.width * box.height) / Math.max(1, totalLen * totalLen);
  if (compactness > 0.55 && Math.abs(box.width / Math.max(1, box.height) - 1) < 0.15) {
    const r = Math.min(box.width, box.height) / 2;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    return { type: "circle", x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }
  return {
    type: "ellipse",
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
}

/**
 * Desenha a forma detectada como um elemento de shape completo.
 */
export function shapeFromDetection(detection, strokeColor, fillColor, strokeWidth) {
  const base = {
    ...detection,
    strokeColor,
    fillColor,
    strokeWidth,
  };
  return base;
}

export function nearestDirection(layout) {
  return layout;
}
