import { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, Brain, Loader2, X, ChevronDown, ChevronUp,
  CheckCircle2, Circle, AlertTriangle, BookOpen, Sparkles,
  ListChecks, Clock, Target, Lightbulb, Copy, Download, Printer,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { BACKEND_URL } from "../lib/backendUrl";

const API = `${BACKEND_URL}/api/summary`;

const MODES = [
  { value: "full", label: "Resumo Completo", icon: BookOpen, desc: "Análise detalhada com tópicos, conceitos e mapas" },
  { value: "quick", label: "Resumo Rápido", icon: Sparkles, desc: "Resumo conciso dos pontos principais" },
  { value: "study_focus", label: "Foco em Prova", icon: Target, desc: "O que mais cai em provas" },
];

const DIFFICULTIES = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
  { value: "misto", label: "Misto" },
];

export default function SummaryGenerator() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mode, setMode] = useState("full");
  const [exerciseCount, setExerciseCount] = useState(10);
  const [difficulty, setDifficulty] = useState("misto");
  const [isSimulado, setIsSimulado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeView, setActiveView] = useState("summary");
  const [answers, setAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, { name: file.name, size: file.size, type: file.type, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }
    setLoading(true);
    setResult(null);
    setAnswers({});
    setShowExplanations({});
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("mode", mode);
      formData.append("exercise_count", exerciseCount.toString());
      formData.append("difficulty", difficulty);
      formData.append("is_simulado", isSimulado.toString());

      const response = await axios.post(`${API}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setResult(response.data);
      setActiveView("summary");
      toast.success("Material analisado com sucesso!");
    } catch (error) {
      console.error("Summary error:", error);
      toast.error(error.response?.data?.detail || "Erro ao analisar material");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (exerciseIndex, answer) => {
    setAnswers((prev) => ({ ...prev, [exerciseIndex]: answer }));
  };

  const toggleExplanation = (index) => {
    setShowExplanations((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleTopic = (index) => {
    setExpandedTopics((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getScore = () => {
    if (!result?.exercises) return null;
    let correct = 0;
    let total = result.exercises.length;
    result.exercises.forEach((ex, i) => {
      if (answers[i] === ex.correct_answer) correct++;
    });
    return { correct, total, percent: Math.round((correct / total) * 100) };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const exportMarkdown = () => {
    if (!result) return;
    const s = result.summary;
    let md = `# ${s.title}\n\n`;
    md += `**Disciplina:** ${s.discipline}\n`;
    md += `**Tempo estimado de estudo:** ${s.estimated_study_time}\n\n`;
    md += `## Resumo Geral\n\n${s.general_summary}\n\n`;
    if (s.topics?.length) {
      md += `## Tópicos\n\n`;
      s.topics.forEach((t) => {
        md += `### ${t.name} (${t.priority})\n\n${t.explanation}\n\n`;
        if (t.key_concepts?.length) md += `**Conceitos:** ${t.key_concepts.join(", ")}\n\n`;
        if (t.formulas?.length) md += `**Fórmulas:** ${t.formulas.join(", ")}\n\n`;
      });
    }
    if (s.keywords?.length) {
      md += `## Palavras-chave\n\n`;
      s.keywords.forEach((k) => { md += `- **${k.word}:** ${k.definition}\n`; });
      md += "\n";
    }
    if (result.exercises?.length) {
      md += `## Exercícios\n\n`;
      result.exercises.forEach((ex, i) => {
        md += `### Exercício ${i + 1}\n\n${ex.question}\n\n`;
        if (ex.options?.length) ex.options.forEach((o) => { md += `${o}\n`; });
        md += `\n**Resposta:** ${ex.correct_answer}\n\n**Explicação:** ${ex.explanation}\n\n---\n\n`;
      });
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-${s.title?.replace(/\s+/g, "_") || "material"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado como Markdown!");
  };

  const handlePrint = () => {
    if (!result) return;
    const s = result.summary;
    const esc = (v) =>
      String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

    const topics = (s.topics || []).map((t, i) => `
      <section class="topic">
        <h3>${i + 1}. ${esc(t.name)} <span class="pill">${esc(t.priority || "")}</span></h3>
        <p>${esc(t.explanation)}</p>
        ${t.key_concepts?.length ? `<p><strong>Conceitos-chave:</strong> ${t.key_concepts.map(esc).join("; ")}</p>` : ""}
        ${t.formulas?.length ? `<p><strong>Fórmulas:</strong></p><ul>${t.formulas.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
        ${t.examples?.length ? `<p><strong>Exemplos:</strong></p><ul>${t.examples.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
        ${t.common_errors?.length ? `<p><strong>Erros comuns:</strong></p><ul>${t.common_errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
        ${t.observations?.length ? `<p><strong>Observações:</strong></p><ul>${t.observations.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
        ${t.subtopics?.length ? `<p><strong>Subtópicos:</strong></p><ul>${t.subtopics.map((st) => `<li><em>${esc(st.name)}</em> — ${esc(st.explanation)}</li>`).join("")}</ul>` : ""}
      </section>`).join("");

    const keywords = (s.keywords || []).map((k) => `
      <li><strong>${esc(k.word)}:</strong> ${esc(k.definition)}${k.example ? ` <em>(ex: ${esc(k.example)})</em>` : ""}</li>`).join("");

    const tips = (s.study_tips || []).map((t) => `<li>${esc(t)}</li>`).join("");

    const exercises = (result.exercises || []).map((ex, i) => `
      <section class="exercise">
        <h3>Exercício ${i + 1} <span class="tag">${esc(ex.difficulty || "Médio")}</span></h3>
        <p class="question">${esc(ex.question)}</p>
        ${ex.options?.length ? `<ul class="options">${ex.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
        <p class="answer"><strong>Resposta correta:</strong> ${esc(ex.correct_answer)}</p>
        <p><strong>Explicação:</strong> ${esc(ex.explanation)}</p>
        ${ex.solution_steps?.length ? `<p><strong>Passo a passo:</strong></p><ol>${ex.solution_steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>` : ""}
        <p class="topic-ref"><strong>Tópico:</strong> ${esc(ex.topic || "")} · <strong>Conceito:</strong> ${esc(ex.concept_used || "")}</p>
      </section>`).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${esc(s.title)} — Resumo e Exercícios</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #111; line-height: 1.55; max-width: 190mm; margin: 0 auto; padding: 0 4mm; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 20px; margin: 24px 0 8px; border-bottom: 2px solid #111; padding-bottom: 4px; }
  h3 { font-size: 16px; margin: 16px 0 4px; }
  .meta { font-size: 13px; color: #444; margin-bottom: 16px; }
  .meta span { margin-right: 12px; }
  .general { white-space: pre-wrap; }
  .pill, .tag { font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #111; padding: 1px 6px; border-radius: 3px; vertical-align: middle; }
  ul, ol { margin: 4px 0 8px; padding-left: 20px; }
  .options { list-style: upper-alpha; }
  .topic, .exercise { break-inside: avoid; }
</style>
</head>
<body>
  <h1>${esc(s.title)}</h1>
  <div class="meta">
    ${s.discipline ? `<span><strong>Disciplina:</strong> ${esc(s.discipline)}</span>` : ""}
    ${s.estimated_study_time ? `<span><strong>Tempo estimado:</strong> ${esc(s.estimated_study_time)}</span>` : ""}
    <span><strong>Arquivos:</strong> ${(result.files || []).join(", ")}</span>
  </div>

  <h2>Resumo Geral</h2>
  <p class="general">${esc(s.general_summary)}</p>

  ${topics ? `<h2>Tópicos</h2>${topics}` : ""}
  ${keywords ? `<h2>Palavras-chave</h2><ul>${keywords}</ul>` : ""}
  ${tips ? `<h2>Dicas de Estudo</h2><ul>${tips}</ul>` : ""}
  ${exercises ? `<h2>Exercícios</h2>${exercises}` : ""}

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Permita pop-ups para imprimir");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const renderScore = () => {
    const score = getScore();
    if (!score) return null;
    const color = score.percent >= 70 ? "#22c55e" : score.percent >= 50 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ textAlign: "center", padding: "20px", background: `${color}15`, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color }}>{score.percent}%</div>
        <div style={{ fontSize: 16, color: "#94a3b8" }}>
          {score.correct} de {score.total} corretos
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Brain size={48} color="#a78bfa" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
          Gerador de Resumos com IA
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 8 }}>
          Envie seus materiais e receba resumos inteligentes + exercícios personalizados
        </p>
      </div>

      {!result && (
        <div style={{ background: "#1e1b2e", borderRadius: 16, padding: 24, border: "1px solid #2d2a3e" }}>
          <h2 style={{ fontSize: 18, color: "#e2e8f0", marginTop: 0, marginBottom: 16 }}>
            <Upload size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Enviar Materiais
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropped = Array.from(e.dataTransfer.files);
              setFiles((prev) => [...prev, ...dropped]);
              dropped.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPreviews((prev) => [...prev, { name: file.name, size: file.size, type: file.type, preview: reader.result }]);
                };
                reader.readAsDataURL(file);
              });
            }}
            style={{
              border: "2px dashed #4a4560",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
              marginBottom: 16,
            }}
          >
            <Upload size={40} color="#6366f1" style={{ marginBottom: 8 }} />
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
              PDF, DOCX, PPTX, TXT, MD, imagens (OCR)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.py,.js,.java,.c,.cpp,.h,.csv"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {previews.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {previews.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: "#15131f", borderRadius: 10,
                  marginBottom: 8, border: "1px solid #2d2a3e"
                }}>
                  <FileText size={20} color="#6366f1" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {(p.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={18} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 6 }}>Modo de Análise</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10, border: "none",
                      background: mode === m.value ? "#6366f1" : "#1e1b2e",
                      color: mode === m.value ? "#fff" : "#94a3b8",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      border: mode === m.value ? "2px solid #818cf8" : "2px solid #2d2a3e",
                    }}
                  >
                    <m.icon size={18} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 6 }}>Exercícios</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ color: "#64748b", fontSize: 12 }}>Quantidade</label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={exerciseCount}
                    onChange={(e) => setExerciseCount(parseInt(e.target.value) || 10)}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "2px solid #2d2a3e", background: "#15131f",
                      color: "#e2e8f0", fontSize: 14, boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: "#64748b", fontSize: 12 }}>Dificuldade</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
                          background: difficulty === d.value ? "#6366f1" : "#1e1b2e",
                          color: difficulty === d.value ? "#fff" : "#94a3b8",
                          cursor: "pointer", fontSize: 13, fontWeight: 600,
                          border: difficulty === d.value ? "2px solid #818cf8" : "2px solid #2d2a3e",
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#94a3b8" }}>
                  <input
                    type="checkbox"
                    checked={isSimulado}
                    onChange={(e) => setIsSimulado(e.target.checked)}
                    style={{ accentColor: "#6366f1", width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 14 }}>Modo Simulado (prova completa)</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || files.length === 0}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 12,
              border: "none", background: loading || files.length === 0 ? "#4a4560" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading || files.length === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analisando material...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Gerar Resumo e Exercícios
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "summary", label: "Resumo", icon: BookOpen },
              { key: "exercises", label: `Exercícios (${result.exercises?.length || 0})`, icon: ListChecks },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                style={{
                  flex: 1, minWidth: 120, padding: "12px 16px", borderRadius: 10,
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: activeView === tab.key ? "#6366f1" : "#1e1b2e",
                  color: activeView === tab.key ? "#fff" : "#94a3b8",
                  cursor: "pointer", fontWeight: 600, fontSize: 14,
                  border: activeView === tab.key ? "2px solid #818cf8" : "2px solid #2d2a3e",
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => { setResult(null); setFiles([]); setPreviews([]); }}
              style={{
                padding: "12px 16px", borderRadius: 10, border: "none",
                background: "#1e1b2e", color: "#94a3b8", cursor: "pointer",
                fontWeight: 600, fontSize: 14, border: "2px solid #2d2a3e",
              }}
            >
              Novo Material
            </button>
          </div>

          {activeView === "summary" && (
            <div style={{ background: "#1e1b2e", borderRadius: 16, padding: 24, border: "1px solid #2d2a3e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, color: "#e2e8f0", margin: 0 }}>{result.summary?.title}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handlePrint}
                    style={{ background: "#2d2a3e", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#94a3b8" }}
                    title="Imprimir resumo e exercícios"
                  >
                    <Printer size={16} />
                  </button>
                  <button onClick={() => copyToClipboard(JSON.stringify(result.summary, null, 2))}
                    style={{ background: "#2d2a3e", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#94a3b8" }}
                    title="Copiar JSON"
                  >
                    <Copy size={16} />
                  </button>
                  <button onClick={exportMarkdown}
                    style={{ background: "#2d2a3e", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#94a3b8" }}
                    title="Exportar Markdown"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ background: "#6366f120", color: "#818cf8", padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
                  {result.summary?.discipline}
                </span>
                <span style={{ background: "#22c55e20", color: "#22c55e", padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
                  <Clock size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {result.summary?.estimated_study_time}
                </span>
                <span style={{ background: "#f59e0b20", color: "#f59e0b", padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
                  {result.files?.length} arquivo(s)
                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 8 }}>Resumo Geral</h3>
                <div style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: 15 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary?.general_summary || ""}</ReactMarkdown>
                </div>
              </div>

              {result.summary?.topics?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 12 }}>Tópicos</h3>
                  {result.summary.topics.map((topic, i) => (
                    <div key={i} style={{
                      background: "#15131f", borderRadius: 12, marginBottom: 10,
                      border: "1px solid #2d2a3e", overflow: "hidden"
                    }}>
                      <button
                        onClick={() => toggleTopic(i)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 16px", background: "none", border: "none",
                          cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{
                            background: topic.priority === "alta" ? "#ef444430" : topic.priority === "media" ? "#f59e0b30" : "#22c55e30",
                            color: topic.priority === "alta" ? "#ef4444" : topic.priority === "media" ? "#f59e0b" : "#22c55e",
                            padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          }}>
                            {topic.priority}
                          </span>
                          <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15 }}>{topic.name}</span>
                        </div>
                        {expandedTopics[i] ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </button>
                      {expandedTopics[i] && (
                        <div style={{ padding: "0 16px 16px" }}>
                          <div style={{ color: "#cbd5e1", lineHeight: 1.7, marginBottom: 12 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.explanation || ""}</ReactMarkdown>
                          </div>
                          {topic.key_concepts?.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <strong style={{ color: "#818cf8", fontSize: 13 }}>Conceitos-chave:</strong>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                {topic.key_concepts.map((c, j) => (
                                  <span key={j} style={{ background: "#6366f120", color: "#818cf8", padding: "3px 10px", borderRadius: 16, fontSize: 13 }}>{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {topic.formulas?.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <strong style={{ color: "#f59e0b", fontSize: 13 }}>Fórmulas:</strong>
                              <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                {topic.formulas.map((f, j) => (
                                  <li key={j} style={{ color: "#fbbf24", fontSize: 14 }}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {topic.examples?.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <strong style={{ color: "#22c55e", fontSize: 13 }}>Exemplos:</strong>
                              <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                {topic.examples.map((e, j) => (
                                  <li key={j} style={{ color: "#86efac", fontSize: 14 }}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {topic.common_errors?.length > 0 && (
                            <div>
                              <strong style={{ color: "#ef4444", fontSize: 13 }}>Erros Comuns:</strong>
                              <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                {topic.common_errors.map((e, j) => (
                                  <li key={j} style={{ color: "#fca5a5", fontSize: 14 }}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.summary?.keywords?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 12 }}>Palavras-chave</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                    {result.summary.keywords.map((kw, i) => (
                      <div key={i} style={{ background: "#15131f", borderRadius: 10, padding: 14, border: "1px solid #2d2a3e" }}>
                        <div style={{ color: "#818cf8", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{kw.word}</div>
                        <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{kw.definition}</div>
                        {kw.example && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6, fontStyle: "italic" }}>Ex: {kw.example}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.summary?.study_tips?.length > 0 && (
                <div>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 8 }}>
                    <Lightbulb size={18} style={{ verticalAlign: "middle", marginRight: 6, color: "#fbbf24" }} />
                    Dicas de Estudo
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {result.summary.study_tips.map((tip, i) => (
                      <li key={i} style={{ color: "#cbd5e1", fontSize: 14, marginBottom: 6 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeView === "exercises" && (
            <div style={{ background: "#1e1b2e", borderRadius: 16, padding: 24, border: "1px solid #2d2a3e" }}>
              <h2 style={{ fontSize: 20, color: "#e2e8f0", marginTop: 0, marginBottom: 16 }}>
                <ListChecks size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Exercícios ({result.exercises?.length || 0})
              </h2>

              {renderScore()}

              {result.exercises?.map((ex, i) => (
                <div key={i} style={{
                  background: "#15131f", borderRadius: 12, padding: 20, marginBottom: 16,
                  border: `2px solid ${answers[i] ? (answers[i] === ex.correct_answer ? "#22c55e" : "#ef4444") : "#2d2a3e"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{
                      background: ex.difficulty === "Fácil" ? "#22c55e20" : ex.difficulty === "Difícil" ? "#ef444420" : "#f59e0b20",
                      color: ex.difficulty === "Fácil" ? "#22c55e" : ex.difficulty === "Difícil" ? "#ef4444" : "#f59e0b",
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      {ex.difficulty}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{ex.topic}</span>
                  </div>

                  <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
                    {i + 1}. {ex.question}
                  </div>

                  {ex.options?.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {ex.options.map((opt, j) => {
                        const letter = opt.charAt(0);
                        const isSelected = answers[i] === letter;
                        const isCorrect = letter === ex.correct_answer;
                        const showResult = answers[i] !== undefined;
                        let bg = "#1e1b2e";
                        let border = "#2d2a3e";
                        let color = "#cbd5e1";
                        if (showResult && isSelected && isCorrect) { bg = "#22c55e20"; border = "#22c55e"; color = "#22c55e"; }
                        else if (showResult && isSelected && !isCorrect) { bg = "#ef444420"; border = "#ef4444"; color = "#ef4444"; }
                        else if (showResult && isCorrect) { bg = "#22c55e10"; border = "#22c55e50"; color = "#86efac"; }
                        return (
                          <button
                            key={j}
                            onClick={() => !answers[i] && handleAnswerSelect(i, letter)}
                            disabled={answers[i] !== undefined}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "12px 14px", borderRadius: 10, border: `2px solid ${border}`,
                              background: bg, color, cursor: answers[i] !== undefined ? "default" : "pointer",
                              textAlign: "left", fontSize: 14, transition: "all 0.15s",
                            }}
                          >
                            {showResult && isCorrect ? <CheckCircle2 size={18} color="#22c55e" /> :
                             showResult && isSelected ? <AlertTriangle size={18} color="#ef4444" /> :
                             <Circle size={18} color="#64748b" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {answers[i] !== undefined && (
                    <div>
                      <button
                        onClick={() => toggleExplanation(i)}
                        style={{
                          background: "none", border: "none", color: "#818cf8",
                          cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0,
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        {showExplanations[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Ver explicação
                      </button>
                      {showExplanations[i] && (
                        <div style={{
                          marginTop: 12, padding: 16, background: "#1e1b2e",
                          borderRadius: 10, border: "1px solid #2d2a3e",
                        }}>
                          <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>Resposta Correta: {ex.correct_answer}</div>
                          <div style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: 14 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{ex.explanation || ""}</ReactMarkdown>
                          </div>
                          {ex.solution_steps?.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <strong style={{ color: "#818cf8", fontSize: 13 }}>Passo a passo:</strong>
                              <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                                {ex.solution_steps.map((step, j) => (
                                  <li key={j} style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
