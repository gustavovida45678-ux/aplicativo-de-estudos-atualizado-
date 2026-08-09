import axios from "axios";
import { BACKEND_URL } from "../../lib/backendUrl";
import { buildTreeElements } from "./mindmap";
import { getCustomApiKey } from "../ApiKeySettings";

const API = `${BACKEND_URL}/api`;

function sanitizeTree(node, depth) {
  const title = String(node.title || node.text || node || "").trim() || "Nó";
  const kids = Array.isArray(node.children) ? node.children.slice(0, 6) : [];
  return {
    title,
    children: depth < 3 ? kids.map((k) => sanitizeTree(k, depth + 1)) : [],
  };
}

function buildLocalTree(topic) {
  const t = String(topic || "").trim();
  const title = t.split(/[.:;,\n]/)[0].trim() || "Tema";
  const words = t
    .toLowerCase()
    .replace(/[^a-zà-ú0-9ç ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["para", "como", "quando", "onde", "quem", "qual", "que", "sobre"].includes(w))
    .slice(0, 5);
  const defs = words.length
    ? words
    : ["Conceitos", "Exemplos", "Aplicações", "Resumo", "Revisão"];
  return {
    title,
    children: defs.map((w) => ({
      title: w[0].toUpperCase() + w.slice(1),
      children: [
        { title: "Definição" },
        { title: "Exemplo" },
        { title: "Detalhes" },
      ],
    })),
  };
}

export async function generateMindMapTree(topic) {
  const customKey = getCustomApiKey();
  try {
    const { data } = await axios.post(
      `${API}/mindmap/generate`,
      { topic, provider: "auto" },
      customKey ? { headers: { "X-Custom-API-Key": customKey } } : undefined
    );
    if (data && (data.title || (data.root && data.root.title))) {
      return sanitizeTree(data.root || data, 0);
    }
  } catch (err) {
    const detail = err.response?.data?.detail;
    console.warn("IA indisponível para mapa mental, usando fallback local:", detail || err.message);
  }
  return buildLocalTree(topic);
}

export async function generateMindMapElements(topic, origin, opts = {}) {
  const tree = await generateMindMapTree(topic);
  const { elements, rootId } = buildTreeElements(tree.title, tree.children, origin, opts);
  return { elements, rootId, tree };
}
