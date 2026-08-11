/**
 * Backend URL centralizado.
 *
 * Usa REACT_APP_BACKEND_URL quando informado no build (Render/Emergent),
 * mas valida o valor: URLs invalidas (ex: "2", "undefined", vazias) fazem
 * fallback para a URL real do backend no Render.
 */
export const BACKEND_URL = (() => {
  const envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
  if (envUrl && /^https?:\/\/.+/.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://aplicativo-de-estudos-atualizado-s.onrender.com";
})();
