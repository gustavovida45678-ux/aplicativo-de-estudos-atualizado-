import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { NotebookPen, Mic, MicOff, Loader2, Award, CheckCircle2, AlertTriangle, ArrowLeft, History } from "lucide-react";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

export default function FeynmanView({ onBack = () => {} }) {
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/topics`).then(({ data }) => {
      const grouped = {};
      for (const t of data.topics || []) {
        (grouped[t.subject] = grouped[t.subject] || []).push(t);
      }
      const flat = Object.entries(grouped).map(([subject, list]) => ({ subject, list }));
      setTopics(flat);
      if (flat.length) setTopicId(flat[0].list[0].topic_id);
    }).catch(() => toast.error("Não foi possível carregar os tópicos"));
  }, []);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const toggleMic = () => {
    if (!SpeechRecognition) { toast.warning("Seu navegador não suporta ditado por voz"); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SpeechRecognition();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setExplanation((prev) => (prev ? prev + " " + text : text));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const evaluate = async () => {
    if (!topicId) { toast.warning("Escolha um tópico"); return; }
    if (explanation.trim().length < 15) { toast.warning("Escreva uma explicação com pelo menos 15 caracteres"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/feynman`, {
        topic_id: topicId,
        topic_name: "",
        explanation: explanation.trim(),
      });
      setResult(data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao avaliar a explicação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
          <NotebookPen size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Método Feynman</h2>
          <p className="text-sm text-muted-foreground">
            Explique o tópico com as suas próprias palavras, como se ensinasse a outra pessoa. Se encontrar lacunas, revise e tente de novo.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Tópico</label>
          <select
            value={topicId}
            onChange={(e) => { setTopicId(e.target.value); setResult(null); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-violet-500/60"
          >
            {topics.map((g) => (
              <optgroup key={g.subject} label={g.subject}>
                {g.list.map((t) => (
                  <option key={t.topic_id} value={t.topic_id}>{t.topic_name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Sua explicação</label>
            {SpeechRecognition && (
              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  listening ? "bg-red-500/20 text-red-400" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {listening ? <MicOff size={13} /> : <Mic size={13} />}
                {listening ? "Gravando..." : "Falar"}
              </button>
            )}
          </div>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={8}
            placeholder="Imagine que você é o professor: explique o conceito de forma simples, com um exemplo, sem jargões…"
            className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-violet-500/60"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{explanation.length} caracteres</div>
        </div>

        <button
          onClick={evaluate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
          {loading ? "Avaliando..." : "Avaliar minha explicação"}
        </button>

        {result && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="text-4xl font-black text-violet-400">{result.score}%</div>
              <div>
                <div className="font-semibold">{result.verdict}</div>
                <div className="text-xs text-muted-foreground">
                  {result.mode === "ia" ? "Avaliação por IA" : "Avaliação automática (sem chave de IA configurada)"}
                </div>
              </div>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                style={{ width: `${result.score}%` }}
              />
            </div>

            {result.feedback && (
              <p className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed">{result.feedback}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 size={14} /> O que você fez bem
                </h4>
                <ul className="space-y-1.5">
                  {(result.strengths || []).map((s, i) => (
                    <li key={i} className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs leading-relaxed text-emerald-200">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                  <AlertTriangle size={14} /> Lacunas a revisar
                </h4>
                <ul className="space-y-1.5">
                  {(result.gaps || []).map((g, i) => (
                    <li key={i} className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.reference_explanation && (
              <details className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-white">
                  Ver explicação de referência
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{result.reference_explanation}</p>
              </details>
            )}
          </div>
        )}

        {result?.history?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <History size={15} className="text-muted-foreground" /> Tentativas recentes
            </h4>
            <div className="space-y-2">
              {result.history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="font-semibold text-violet-400">{h.score}%</span>
                  <span className="flex-1 truncate text-muted-foreground">{h.topic_name}</span>
                  <span className="text-muted-foreground">{h.verdict}</span>
                  <span className="text-muted-foreground/60">{h.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
