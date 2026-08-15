import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, Search, BookOpen, Copy, Check, Lightbulb, Loader2,
  Braces, Target, Link2, X,
} from "lucide-react";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/judge`;

const LANGS = [
  { id: "", name: "Todas" },
  { id: "python", name: "Python 3" },
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
];

export default function DictionaryView({ onBack = () => {} }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState("search");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) { toast.warning("Digite uma expressão ou objetivo"); return; }
    setLoading(true);
    try {
      const endpoint = mode === "objective" ? "/dictionary/objective" : "/dictionary/search";
      const { data } = await axios.post(`${API}${endpoint}`, { query: query.trim(), language });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const rows = result?.expressions || result?.recommended || [];
  const objectives = result?.objectives || [];

  const Field = ({ label, children }) => (
    <div className="rounded-lg bg-black/25 px-3 py-2">
      <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-400/70">{label}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
          <BookOpen size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Dicionário de Expressões</h2>
          <p className="text-sm text-muted-foreground">
            Entenda o que cada expressão faz, quando usar e o que acontece se faltar.
          </p>
        </div>
      </div>

      <form onSubmit={search} className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("search")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${mode === "search" ? "bg-cyan-500/20 text-cyan-300" : "text-muted-foreground"}`}
            >
              <Search size={13} /> Pesquisar expressão
            </button>
            <button
              type="button"
              onClick={() => setMode("objective")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${mode === "objective" ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground"}`}
            >
              <Target size={13} /> O que eu quero fazer
            </button>
          </div>
          <div className="flex gap-1.5">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLanguage(l.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  language === l.id
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "objective" ? "Ex: ler dois números da entrada, somar e imprimir" : "Ex: split, print, scanf, for, vetor..."}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Buscar
          </button>
        </div>
      </form>

      {result?.message && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
          {result.message}
        </div>
      )}

      {objectives.length > 0 && (
        <div className="mb-5 space-y-2">
          {objectives.map((o, i) => (
            <div key={i} className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
                <Lightbulb size={14} /> {o.objective}
              </div>
              {o.keywords?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {o.keywords.slice(0, 5).map((k) => (
                    <span key={k} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 && !loading && result && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
            Nada encontrado. Tente outra expressão ou descreva o que quer fazer.
          </div>
        )}
        {rows.map((e) => (
          <div key={e.expression + e.language} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <button
              onClick={() => setExpanded(expanded === e.expression ? null : e.expression)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Braces size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <code className="block truncate font-mono text-sm font-semibold">{e.expression}</code>
                <span className="text-[11px] text-muted-foreground">{e.category} • {e.language}</span>
              </div>
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); copy(e.expression, e.expression); }}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition hover:text-white"
                title="Copiar expressão"
              >
                {copied === e.expression ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </button>

            {expanded === e.expression && (
              <div className="space-y-2 border-t border-white/10 p-4">
                <Field label="O que é">{e.what_is}</Field>
                <Field label="Para que serve">{e.purpose}</Field>
                <Field label="Por que usar">{e.why_used}</Field>
                <Field label="Se faltar...">{e.what_if_removed}</Field>
                {e.when_to_use && <Field label="Quando usar">{e.when_to_use}</Field>}
                {e.how_to_identify && <Field label="Como identificar">{e.how_to_identify}</Field>}
                {e.example && (
                  <div className="rounded-lg bg-black/40 p-3">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cyan-400/70">Exemplo</div>
                    <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-emerald-200">{e.example}</pre>
                  </div>
                )}
                {(e.keywords?.length > 0 || e.related?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {e.keywords?.map((k) => (
                      <span key={k} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">#{k}</span>
                    ))}
                    {e.related?.map((r) => (
                      <span key={r} className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
                        <Link2 size={9} /> {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {rows.length === 0 && !result && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
          <X size={20} className="mx-auto mb-2" />
          O dicionário cobre as expressões mais comuns dos juízes online (entrada, saída, loops,
          vetores, funções). Pesquise algo como <b>input</b>, <b>printf</b> ou <b>for</b>.
        </div>
      )}
    </div>
  );
}
