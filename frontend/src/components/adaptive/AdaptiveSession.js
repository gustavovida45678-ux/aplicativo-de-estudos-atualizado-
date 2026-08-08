import { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  CheckCircle2, XCircle, HelpCircle, Lightbulb, ArrowRight,
  Flag, Clock, Award, TrendingDown, TrendingUp, CalendarClock, Brain,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

const CONFIDENCE_LEVELS = [
  { emoji: "😰", label: "0–20%", value: 10 },
  { emoji: "😕", label: "20–40%", value: 30 },
  { emoji: "😐", label: "40–60%", value: 50 },
  { emoji: "🙂", label: "60–80%", value: 70 },
  { emoji: "😎", label: "80–100%", value: 90 },
];

const ERROR_TYPES = [
  "nao_sabia", "esqueci_formula", "nao_entendi_enunciado", "estrategia_errada",
  "erro_calculo", "distracao", "nao_sabia_por_onde_comecar", "confundi_conceitos",
  "interpretei_errado", "outro",
];

const ERROR_LABELS = {
  nao_sabia: "Não sabia o conteúdo",
  esqueci_formula: "Esqueci a fórmula",
  nao_entendi_enunciado: "Não entendi o enunciado",
  estrategia_errada: "Escolhi a estratégia errada",
  erro_calculo: "Errei o cálculo",
  distracao: "Errei por distração",
  nao_sabia_por_onde_comecar: "Não sabia por onde começar",
  confundi_conceitos: "Confundi dois conceitos",
  interpretei_errado: "Interpretei errado",
  outro: "Outro",
};

const TYPE_STYLE = {
  recuperacao: "bg-red-500/15 text-red-400",
  revisao: "bg-orange-500/15 text-orange-400",
  fraco: "bg-amber-500/15 text-amber-400",
  novo: "bg-sky-500/15 text-sky-400",
  intercalado: "bg-violet-500/15 text-violet-400",
};

export default function AdaptiveSession({ session, onFinish }) {
  const [items, setItems] = useState(session.items);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [dontKnow, setDontKnow] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [summary, setSummary] = useState(null);
  const t0 = useRef(Date.now());
  const [classified, setClassified] = useState(null);

  const item = items[idx];
  if (!item) return null;
  const q = item.question;
  const isMc = !!q?.options;
  const canSubmit = dontKnow || (isMc ? selected !== null : text.trim().length > 0);

  const reset = () => {
    setSelected(null); setText(""); setConfidence(50); setDontKnow(false);
    setHintsUsed(0); setHintText(""); setFeedback(null); setClassified(null);
    t0.current = Date.now();
  };

  const askHint = () => {
    const n = hintsUsed + 1;
    setHintsUsed(n);
    const explanation = q?.explanation || "";
    const sentences = explanation.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (n === 1) setHintText(`💡 Releia o enunciado pensando no tópico: ${item.topic_name}. Identifique o que está sendo pedido.`);
    else if (n === 2) setHintText(`📘 Dica de conceito: ${sentences[0] || explanation.slice(0, 160)}`);
    else if (n === 3) setHintText(`🧭 Estratégia: ${sentences.slice(0, 2).join(" ") || "Resolva passo a passo e confira o resultado."}`);
    else setHintText("📖 Explicação completa (solução revelada): " + explanation);
  };

  const submit = async () => {
    setAnswering(true);
    try {
      const res = await axios.post(`${API}/session/${session.session_id}/answer`, {
        item_id: item.item_id,
        answer: isMc ? selected : null,
        answer_text: isMc ? "" : text,
        confidence,
        dont_know: dontKnow,
        time_spent_sec: Math.max(1, Math.round((Date.now() - t0.current) / 1000)),
        hints_used: hintsUsed,
      });
      setFeedback(res.data);
      if (res.data.items) setItems(res.data.items);
    } catch (e) {
      toast.error("Erro ao enviar resposta", { description: e?.response?.data?.detail });
    } finally {
      setAnswering(false);
    }
  };

  const next = async () => {
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      reset();
    } else {
      try {
        const res = await axios.post(`${API}/session/${session.session_id}/end`, { stats: {} });
        setSummary(res.data);
      } catch {
        setSummary({ score: 0, duration_min: 0, stats: {}, strong_topics: [], weak_topics: [] });
      }
    }
  };

  const classify = async (type) => {
    if (!feedback?.error_id) return;
    try {
      await axios.post(`${API}/errors/${feedback.error_id}/classify`, { error_type: type });
      setClassified(type);
      toast.success("Classificação do erro registrada");
    } catch {
      toast.error("Não foi possível classificar");
    }
  };

  // ------------------------------------------------------------------ resumo
  if (summary) {
    return (
      <Card className="mx-auto max-w-2xl border-0 shadow-sm bg-white/5">
        <CardContent className="space-y-5 p-8 text-center">
          <Award className="mx-auto text-primary" size={48} />
          <h2 className="text-2xl font-bold">Sessão concluída</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{summary.score}%</p>
              <p className="text-xs text-muted-foreground">Nota</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{summary.stats?.correct || 0}</p>
              <p className="text-xs text-emerald-500">Acertos</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{(summary.stats?.wrong || 0) + (summary.stats?.dont_know || 0)}</p>
              <p className="text-xs text-red-500">Erros</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{summary.duration_min}min</p>
              <p className="text-xs text-muted-foreground">Tempo</p>
            </div>
          </div>
          {summary.strong_topics?.length > 0 && (
            <div className="text-left">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-500">
                <TrendingUp size={16} /> Pontos fortes
              </p>
              {summary.strong_topics.map((t) => (
                <Badge key={t.topic_id} className="mr-2">{t.topic_name}</Badge>
              ))}
            </div>
          )}
          {summary.weak_topics?.length > 0 && (
            <div className="text-left">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
                <TrendingDown size={16} /> Pontos fracos
              </p>
              {summary.weak_topics.map((t) => (
                <Badge key={t.topic_id} variant="destructive" className="mr-2">{t.topic_name}</Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Os erros foram registrados no caderno de erros e o domínio foi atualizado.
          </p>
          <Button onClick={onFinish}>Voltar ao Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  // ------------------------------------------------------------- pergunta
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* progresso */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Badge variant="secondary">Questão {idx + 1} de {items.length}</Badge>
        <span className="flex items-center gap-1"><Clock size={14} /> {Math.max(1, Math.round((Date.now() - t0.current) / 1000))}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
      </div>

      <Card className="border-0 shadow-sm bg-white/5">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={TYPE_STYLE[item.type] || "bg-sky-500/15 text-sky-400"}>
              {item.title}
            </Badge>
            <Badge variant="outline">{item.topic_name}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <Brain size={13} className="mr-1 inline" />
            {item.reason}
          </p>

          {!feedback ? (
            <>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{q?.question || ""}</ReactMarkdown>
              </div>

              {isMc ? (
                <div className="grid gap-2">
                  {(q.options || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected === i
                          ? "border-primary bg-primary/20 font-medium"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-2 font-mono text-muted-foreground">{String.fromCharCode(65 + i)})</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-primary"
                />
              )}

              {/* confiança */}
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Quão confiante você está?</p>
                <div className="flex flex-wrap gap-2">
                  {CONFIDENCE_LEVELS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setConfidence(c.value)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        confidence === c.value ? "border-primary bg-primary/20" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                      title={c.label}
                    >
                      <span className="mr-1 text-lg">{c.emoji}</span>{c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* dicas */}
              {hintText && (
                <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">{hintText}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" onClick={askHint} disabled={hintsUsed >= 4}>
                  <Lightbulb size={15} className="mr-1" /> Pedir dica ({hintsUsed}/4)
                </Button>
                <Button
                  variant={dontKnow ? "destructive" : "default"}
                  onClick={() => setDontKnow(!dontKnow)}
                >
                  <HelpCircle size={15} className="mr-1" /> Não sei
                </Button>
                <Button className="ml-auto" onClick={submit} disabled={!canSubmit || answering}>
                  {answering ? "Enviando..." : <>Enviar resposta <ArrowRight size={15} className="ml-1" /></>}
                </Button>
              </div>
            </>
          ) : (
            /* --------------------------------------------------- feedback */
            <div className="space-y-4">
              <div className={`flex items-start gap-3 rounded-2xl p-4 ${feedback.correct ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {feedback.correct
                  ? <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={22} />
                  : feedback.result === "dont_know"
                    ? <HelpCircle className="mt-1 shrink-0 text-amber-400" size={22} />
                    : <XCircle className="mt-1 shrink-0 text-red-400" size={22} />}
                <div className="min-w-0">
                  <p className="font-bold">
                    {feedback.correct ? "ACERTOU" : feedback.result === "dont_know" ? "REGISTRADO — VOCÊ NÃO SABIA" : "ERROU"}
                  </p>
                  <div className="prose prose-invert prose-sm mt-1 max-w-none text-muted-foreground">
                    <ReactMarkdown>{feedback.explanation || ""}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* atualização do domínio */}
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Domínio do tópico</p>
                  <p className="text-lg font-bold">{feedback.mastery_old}% → {feedback.mastery_now}%</p>
                  <Badge variant="secondary">{feedback.mastery_label}</Badge>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Próxima revisão</p>
                  <p className="flex items-center justify-center gap-1 text-lg font-bold">
                    <CalendarClock size={15} /> {feedback.next_review}
                  </p>
                  <p className="text-xs text-muted-foreground">intervalo: {feedback.interval_days} dia(s)</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Sessão</p>
                  <p className="text-lg font-bold">
                    {feedback.session_stats?.correct || 0}✓ / {(feedback.session_stats?.wrong || 0) + (feedback.session_stats?.dont_know || 0)}✗
                  </p>
                  <p className="text-xs text-muted-foreground">{feedback.remaining} restantes</p>
                </div>
              </div>

              {/* análise do erro */}
              {feedback.analysis && (
                <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="flex items-center gap-2 font-bold text-red-400">
                    <Flag size={16} /> VOCÊ ERROU — análise do erro
                  </p>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Tipo de erro ({classified || feedback.analysis.error_type_label})</p>
                    <p className="mt-1 text-sm">{feedback.analysis.fez}</p>
                    <p className="mt-2 text-sm"><b>O que deveria ter percebido:</b> {feedback.analysis.perceber}</p>
                    <p className="mt-2 text-sm"><b>Como evitar:</b> {feedback.analysis.evitar}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Por que você acha que errou? (corrija a classificação)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ERROR_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => classify(t)}
                          className={`rounded-full border px-2.5 py-1 text-xs transition ${
                            (classified || feedback.analysis.error_type) === t
                              ? "border-primary bg-primary/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {ERROR_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {feedback.recovery_question && (
                    <p className="rounded-xl bg-sky-500/10 p-3 text-sm text-sky-300">
                      🔄 A próxima questão é de <b>recuperação</b>: testa a mesma habilidade com um problema diferente.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={next}>
                  {idx + 1 < items.length ? "Próxima questão" : "Concluir sessão"} <ArrowRight size={15} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
