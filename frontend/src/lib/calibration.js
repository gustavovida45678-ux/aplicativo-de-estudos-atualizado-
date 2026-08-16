// CalibrationManager: mapeia a área capturada pela câmera para a lousa.
// O usuário aponta o dedo indicador para os 4 cantos da tela; cada ponto
// é capturado automaticamente quando a mão fica estável. Com os 4 pares
// (posição na câmera -> canto da lousa) calculamos uma transformação
// afim (escala, deslocamento e rotação pequena) por mínimos quadrados.

const STORAGE_KEY = "lousa_calibration_v1";

// Ordem de calibração: 1 = canto superior esquerdo, 2 = superior direito,
// 3 = inferior direito, 4 = inferior esquerdo (sentido horário).
export const CALIB_TARGETS = [
  { boardX: 0, boardY: 0, label: "Canto superior esquerdo" },
  { boardX: 1, boardY: 0, label: "Canto superior direito" },
  { boardX: 1, boardY: 1, label: "Canto inferior direito" },
  { boardX: 0, boardY: 1, label: "Canto inferior esquerdo" },
];

export function loadCalibration() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cal = JSON.parse(raw);
    if (cal && Array.isArray(cal.points) && cal.points.length === 4) {
      return cal;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function saveCalibration(points) {
  const cal = { points, created_at: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cal));
  } catch (e) {
    // ignore
  }
  return cal;
}

export function clearCalibration() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

// Resolve o sistema linear 3x3 (método de Gauss) para os coeficientes.
function solve3x3(m, v) {
  const a = [
    [m[0], m[1], m[2], v[0]],
    [m[3], m[4], m[5], v[1]],
    [m[6], m[7], m[8], v[2]],
  ];
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const d = a[col][col];
    if (Math.abs(d) < 1e-10) return null;
    for (let c = col; c < 4; c++) a[col][c] /= d;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = a[r][col];
      if (Math.abs(f) < 1e-12) continue;
      for (let c = col; c < 4; c++) a[r][c] -= f * a[col][c];
    }
  }
  return [a[0][3], a[1][3], a[2][3]];
}

// Ajusta uma transformação afim bx = a*u + b*v + c, by = d*u + e*v + f
// minimizando o erro quadrático nos pontos capturados.
function fitAffine(points) {
  const n = points.length;
  if (n < 3) return null;
  let su = 0, sv = 0, suu = 0, suv = 0, svv = 0, sbx = 0, subx = 0, svbx = 0, sby = 0, suby = 0, svby = 0;
  for (const p of points) {
    const u = p.camX, v = p.camY, bx = p.boardX, by = p.boardY;
    su += u; sv += v;
    suu += u * u; suv += u * v; svv += v * v;
    sbx += bx; subx += u * bx; svbx += v * bx;
    sby += by; suby += u * by; svby += v * by;
  }
  const m = [suu, suv, su, suv, svv, sv, su, sv, n];
  const abc = solve3x3(m, [subx, svbx, sbx]);
  const def = solve3x3(m, [suby, svby, sby]);
  if (!abc || !def) return null;
  return { a: abc[0], b: abc[1], c: abc[2], d: def[0], e: def[1], f: def[2] };
}

export function buildCalibration(points) {
  const coeffs = fitAffine(points);
  if (!coeffs) return null;
  return {
    points,
    coeffs,
    apply(u, v) {
      return {
        x: coeffs.a * u + coeffs.b * v + coeffs.c,
        y: coeffs.d * u + coeffs.e * v + coeffs.f,
      };
    },
  };
}

export function applyCalibration(calib, u, v) {
  if (!calib || !calib.coeffs) {
    return { x: u, y: v };
  }
  const c = calib.coeffs;
  return { x: c.a * u + c.b * v + c.c, y: c.d * u + c.e * v + c.f };
}
