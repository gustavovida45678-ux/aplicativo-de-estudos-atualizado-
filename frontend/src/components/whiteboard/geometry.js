export const dist2d = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const distToSegmentSq = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return dist2d(p, a) * dist2d(p, a);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const tt = Math.max(0, Math.min(1, t));
  const qx = a.x + tt * dx;
  const qy = a.y + tt * dy;
  const ex = p.x - qx;
  const ey = p.y - qy;
  return ex * ex + ey * ey;
};

export const distToSegment = (p, a, b) => Math.sqrt(distToSegmentSq(p, a, b));

export function strokeHitTest(stroke, p, radius) {
  const pts = stroke.points;
  if (!pts || pts.length < 2) {
    if (pts && pts.length === 1) return dist2d(p, pts[0]) <= radius;
    return false;
  }
  const r = radius + (stroke.width || 2) / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegmentSq(p, pts[i], pts[i + 1]) <= r * r) return true;
  }
  return false;
}

export function polylineLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += dist2d(points[i - 1], points[i]);
  return len;
}

export function rectContainsPoint(rect, p, pad = 0) {
  return (
    p.x >= rect.x - pad &&
    p.x <= rect.x + rect.width + pad &&
    p.y >= rect.y - pad &&
    p.y <= rect.y + rect.height + pad
  );
}

export function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function boxFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

export function circleSegments(a, b, cx, cy, r) {
  // Returns [t] values (0..1) where segment crosses the circle
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - cx;
  const fy = a.y - cy;
  const A = dx * dx + dy * dy;
  if (A === 0) return [];
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return [];
  const s = Math.sqrt(disc);
  const t1 = (-B - s) / (2 * A);
  const t2 = (-B + s) / (2 * A);
  const out = [];
  if (t1 >= 0 && t1 <= 1) out.push(t1);
  if (t2 >= 0 && t2 <= 1) out.push(t2);
  return out;
}

export function splitStrokeAtCircle(stroke, cx, cy, r) {
  const pts = stroke.points;
  if (!pts || pts.length < 2) return [];
  const pieces = [];
  let current = [];
  let inside = dist2d(pts[0], { x: cx, y: cy }) <= r;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const aIn = dist2d(a, { x: cx, y: cy }) <= r;
    const bIn = dist2d(b, { x: cx, y: cy }) <= r;

    if (aIn && bIn) continue;

    if (!aIn && !bIn) {
      current.push({ ...a, p: a.p ?? 0.5 });
      continue;
    }

    // boundary crossing
    const ts = circleSegments(a, b, cx, cy, r);
    if (ts.length === 0) {
      current.push({ ...a, p: a.p ?? 0.5 });
      continue;
    }
    const t = ts[0];
    const ix = a.x + (b.x - a.x) * t;
    const iy = a.y + (b.y - a.y) * t;
    const interp = { x: ix, y: iy, p: (a.p ?? 0.5 + (b.p ?? 0.5)) / 2 };

    if (aIn) {
      // entering: segment goes outside, cut here. Keep current piece, end it.
      if (current.length) {
        current.push(interp);
        pieces.push(finalizePiece(current, stroke));
        current = [];
      }
    } else {
      // leaving: segment goes inside, cut here and start new piece
      if (current.length) {
        current.push(interp);
        pieces.push(finalizePiece(current, stroke));
      } else {
        current = [{ ...a, p: a.p ?? 0.5 }];
      }
      current = [interp];
    }
    void bIn;
  }

  const last = pts[pts.length - 1];
  if (!(dist2d(last, { x: cx, y: cy }) <= r) && current.length === 0) {
    current.push({ ...last, p: last.p ?? 0.5 });
  }
  if (current.length >= 2) {
    pieces.push(finalizePiece(current, stroke));
  }

  return pieces;
}

const finalizePiece = (points, stroke) => ({
  ...stroke,
  id: stroke.id + "-" + Math.random().toString(36).slice(2, 7),
  points,
});

export function convexHull(points) {
  const pts = points.slice().sort((a, b) => (a.x - b.x) || (a.y - b.y));
  if (pts.length <= 3) return pts;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function distanceToLine(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return dist2d(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

export function boundingBox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function polylineCentroid(points) {
  if (!points.length) return { x: 0, y: 0 };
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

export function resamplePoints(points, minDist = 1.2) {
  if (points.length < 2) return points.slice();
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const d = dist2d(prev, cur);
    if (d >= minDist) out.push(cur);
  }
  return out;
}

export function interpolateSegment(a, b, step = 3) {
  const d = dist2d(a, b);
  const n = Math.max(1, Math.ceil(d / step));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, p: a.p ?? b.p ?? 0.5 });
  }
  return out;
}

export function simplifyStroke(points, tolerance = 0.9) {
  if (points.length <= 4) return points.slice();
  const keep = douglasPeucker(points, tolerance);
  return keep;
}

function douglasPeucker(points, eps) {
  if (points.length <= 2) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToLine(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > eps) {
    const left = douglasPeucker(points.slice(0, idx + 1), eps);
    const right = douglasPeucker(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

export function smoothStroke(points, iterations = 1) {
  if (points.length < 3) return points.slice();
  let pts = points.slice();
  for (let it = 0; it < iterations; it++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, p: a.p ?? 0.5 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, p: b.p ?? 0.5 });
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}
