import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, Timer, Loader2, CheckCircle2, XCircle, ClipboardList,
  Trophy, RotateCcw, Send,
} from "lucide-react";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

const fmtTime = (s) => {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export default function SimuladoView({ onBack = () => {} }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [quantity, setQuantity] = useState(8);
  const [duration, setDuration] = useState(15);
  const [phase, setPhase] = useState("config");

  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [bySubject, setBySubject] = useState({});
  const t0 = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/topics`).then(({ data }) => {
      const grouped = {};
      for (const t of data.topics || []) {
        const list = (grouped[t.subject] = grouped[t.subject] || []);
        if (!list.some((x) => x.topic_name === t.topic_name)) list.push(t);
      }
      const flat = Object.entries(grouped).map(([subject, list]) => ({ subject, list }));
      setSubjects(flat);
      if (flat.length) setSelectedSubjects([flat[0].subject]);
    }).catch(() => toast.error("Não foi possível carregar as disciplinas"));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(timerRef.current); finish(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const toggleSubject = (s) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const start = async () => {
    if (!selectedSubjects.length) { toast.warning("Escolha pelo menos uma disciplina"); return; }
    setPhase("loading");
    try {
      const { data } = await axios.post(`${API}/session/start`, {
        subjects: selectedSubjects,
        limit: quantity,
        simulado: true,
      });
      setSession(data);
      setItems(data.items || []);
      setIdx(0);
      setFeedback(null);
      setSelected(null);
      setText("");
      setBySubject({});
      setRemaining(duration * 60);
      t0.current = Date.now();
      setPhase("running");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao montar o simulado");
      setPhase("config");
    }
  };

  const item = items[idx];
  const isMc = !!item?.question?.options;

  const submit = async () => {
    if (!session) return;
    const correct = feedback !== null; // já respondida -> só avança
    if (correct) { next(); return; }
    if (!(selected !== null || text.trim() || false)) { toast.warning("Responda antes de enviar"); return; }
    setAnswering(true);
    try {
      const res = await axios.post(`${API}/session/${session.session_id}/answer`, {
        item_id: item.item_id,
        answer: isMc ? selected : null,
        answer_text: isMc ? "" : text,
        confidence: 60,
        dont_know: false,
        time_spent_sec: Math.max(1, Math.round((Date.now() - t0.current) / 1000)),
      });
      const data = res.data;
      setBySubject((prev) => {
        const key = item.subject || "geral";
        const row = { ...(prev[key] || { correct: 0, wrong: 0, total: 0 }) };
        row.total += 1;
        if (data.correct) row.correct += 1; else row.wrong += 1;
        return { ...prev, [key]: row };
      });
      setFeedback(data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao enviar resposta");
    } finally {
      setAnswering(false);
    }
  };

  const next = () => {
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      setFeedback(null);
      setSelected(null);
      setText("");
      t0.current = Date.now();
    } else {
      finish();
    }
  };

  const skip = async () => {
    if (!session) return;
    setBySubject((prev) => {
      const key = item.subject || "geral";
      const row = { ...(prev[key] || { correct: 0, wrong: 0, total: 0 }) };
      row.total += 1; row.wrong += 1;
      return { ...prev, [key]: row };
    });
    try {
      await axios.post(`${API}/session/${session.session_id}/answer`, {
        item_id: item.item_id, answer: null, answer_text: "",
        confidence: 10, dont_know: true, time_spent_sec: 1,
      });
    } catch (e) { /* segue mesmo se falhar */ }
    next();
  };

  const finish = async () => {
    clearInterval(timerRef.current);
    const stats = Object.values(bySubject).reduce(
      (acc, r) => ({ correct: acc.correct + r.correct, wrong: acc.wrong + r.wrong, total: acc.total + r.total }),
      { correct: 0, wrong: 0, total: 0 }
    );
    setPhase("saving");
    try {
      await axios.post(`${API}/session/${session.session_id}/end`, {
        stats: { ...stats, dont_know: 0 },
      });
    } catch (e) { /* resultado local ainda é mostrado */ }
    setPhase("result");
  };

  if (phase === "config") {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Simulado</h2>
            <p className="text-sm text-muted-foreground">
              Prova com várias disciplinas, cronômetro e resultado detalhado por disciplina.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Disciplinas</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s.subject}
                  onClick={() => toggleSubject(s.subject)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedSubjects.includes(s.subject)
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {s.subject} <span className="opacity-60">({s.list.length})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Quantidade de questões</label>
              <input
                type="number" min={4} max={20} value={quantity}
                onChange={(e) => setQuantity(Math.max(4, Math.min(20, Number(e.target.value) || 4)))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Duração (minutos)</label>
              <input
                type="number" min={5} max={120} value={duration}
                onChange={(e) => setDuration(Math.max(5, Math.min(120, Number(e.target.value) || 5)))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <button
            onClick={start}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            <ClipboardList size={16} /> Começar simulado
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" || phase === "saving") {
    const rows = Object.entries(bySubject);
    const total = rows.reduce((a, [, r]) => a + r.total, 0);
    const correct = rows.reduce((a, [, r]) => a + r.correct, 0);
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          {phase === "saving" ? (
            <Loader2 size={28} className="mx-auto mb-3 animate-spin text-amber-400" />
          ) : (
            <Trophy size={32} className="mx-auto mb-3 text-amber-400" />
          )}
          <h2 className="text-2xl font-bold">{phase === "saving" ? "Registrando resultado..." : `${pct}% de acerto`}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {correct} acertos de {total} questões{phase === "result" && ` • ${duration} min de prova`}
          </p>
        </div>

        {phase === "result" && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-3 text-sm font-semibold">Resultado por disciplina</h3>
              <div className="space-y-3">
                {rows.map(([subj, r]) => {
                  const p = r.total ? Math.round((r.correct / r.total) * 100) : 0;
                  return (
                    <div key={subj}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium">{subj}</span>
                        <span className="text-muted-foreground">{r.correct}/{r.total} ({p}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${p >= 70 ? "bg-emerald-500" : p >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPhase("config"); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-white/10"
              >
                <RotateCcw size={15} /> Refazer
              </button>
              <button
                onClick={onBack}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                <CheckCircle2 size={15} /> Concluir
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!item) return null;
  const q = item.question;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
          <Timer size={15} className={remaining < 60 ? "text-red-400" : "text-amber-400"} />
          <b className={remaining < 60 ? "text-red-400" : ""}>{fmtTime(remaining)}</b>
        </div>
        <div className="flex-1 text-center text-xs text-muted-foreground">
          Questão {idx + 1} de {items.length} • {item.subject}
        </div>
        <button
          onClick={skip}
          disabled={answering}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-white/10 disabled:opacity-50"
        >
          Pular
        </button>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${((idx + (feedback ? 1 : 0)) / items.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-400/80">{item.topic_name}</p>
        <p className="text-sm leading-relaxed">{q.question}</p>
        {q.statement && <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{q.statement}</p>}
        {q.python_code && (
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed">{q.python_code}</pre>
        )}
      </div>

      {isMc ? (
        <div className="space-y-2">
          {(q.options || []).map((opt, i) => {
            const isSel = selected === i;
            const showState = feedback && (i === q.correct_answer || isSel);
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                disabled={!!feedback}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  showState && feedback.correct === false && i === q.correct_answer
                    ? "border-emerald-500 bg-emerald-500/10"
                    : showState && feedback.correct === false && isSel
                    ? "border-red-500 bg-red-500/10"
                    : showState && feedback.correct !== false
                    ? "border-emerald-500 bg-emerald-500/10"
                    : isSel
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-relaxed">{opt}</span>
                {showState && i === q.correct_answer && <CheckCircle2 size={16} className="ml-auto flex-shrink-0 text-emerald-400" />}
                {showState && feedback.correct === false && isSel && <XCircle size={16} className="ml-auto flex-shrink-0 text-red-400" />}
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!feedback}
          placeholder="Digite sua resposta..."
          rows={4}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-amber-500/60"
        />
      )}

      {feedback && (
        <div className={`rounded-xl border p-4 text-sm ${feedback.correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-red-500/40 bg-red-500/10 text-red-200"}`}>
          <b>{feedback.correct ? "Acertou!" : "Errou."}</b>{" "}
          {feedback.explanation ? <span className="mt-1 block leading-relaxed text-muted-foreground">{feedback.explanation}</span> : null}
        </div>
      )}

      <button
        onClick={submit}
        disabled={answering || (!feedback && isMc ? selected === null : !text.trim())}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
      >
        {answering ? <Loader2 size={16} className="animate-spin" /> : feedback ? "Próxima" : <Send size={15} />}
        {answering ? "Enviando..." : feedback ? (idx + 1 < items.length ? "Próxima questão" : "Finalizar") : "Confirmar resposta"}
      </button>
    </div>
  );
}
