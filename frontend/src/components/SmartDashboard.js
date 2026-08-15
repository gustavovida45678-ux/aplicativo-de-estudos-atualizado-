import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Flame, Clock, Target, AlertTriangle, XCircle, Map, RefreshCw,
  ArrowRight, Play, BookOpenCheck, Trophy, Sparkles, ChevronDown,
} from "lucide-react";
import { BACKEND_URL } from "../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

function masteryBarColor(mastery) {
  if (mastery === null || mastery === undefined) return "bg-slate-600";
  if (mastery < 21) return "bg-red-500";
  if (mastery < 41) return "bg-orange-500";
  if (mastery < 61) return "bg-amber-400";
  if (mastery < 76) return "bg-lime-500";
  if (mastery < 91) return "bg-emerald-500";
  return "bg-green-500";
}

function masteryLabel(m) {
  if (m === null || m === undefined) return "Sem dados";
  if (m < 21) return "Crítico";
  if (m < 41) return "Muito fraco";
  if (m < 61) return "Em desenvolvimento";
  if (m < 76) return "Básico";
  if (m < 91) return "Bom";
  return "Dominado";
}

function MasteryBar({ mastery }) {
  const pct = Math.max(0, Math.min(100, Math.round(mastery ?? 0)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Domínio: ${pct}%`}>
      <div className={`h-full rounded-full transition-all duration-700 ${masteryBarColor(mastery)}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-blue-400" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold text-slate-100">{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function SmartDashboard({ currentUser, onStartStudy, onOpenErrors, onOpenDomain, onOpenStudy }) {
  const [dash, setDash] = useState(null);
  const [domain, setDomain] = useState(null);
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, dom, err] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/domain`),
        axios.get(`${API}/errors`),
      ]);
      setDash(d.data);
      setDomain(dom.data);
      setErrors(err.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24">
        <div className="spinner-large" />
        <p className="mt-4 text-sm text-slate-400">Carregando seu estudo de hoje...</p>
      </div>
    );
  }

  const name = currentUser?.name?.split(" ")[0] || "Estudante";
  const rec = dash?.recommendation || {};
  const mastery = dash?.overall_mastery;
  const streakTopics = dash?.streak_topics || [];

  const critical = streakTopics.filter((t) => t.days_left <= -3).length;
  const important = streakTopics.filter((t) => t.days_left > -3 && t.days_left < 0).length;
  const maintenance = streakTopics.filter((t) => t.days_left >= 0).length;

  const weakTopics = (domain?.subjects || [])
    .flatMap((s) => (s.topics || []).map((t) => ({ ...t, subject: s.subject })))
    .filter((t) => (t.mastery ?? 0) < 61)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
    .slice(0, 5);

  const recentErrors = (errors?.errors || []).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-slate-50">Olá, {name} 👋</h1>
          <p className="mt-1 text-slate-400">Seu estudo de hoje</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          title="Atualizar informações"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Target} label="Questões disponíveis" value={dash?.recommended_questions ?? 0} sub="prontas para você" color="text-blue-400" />
        <StatCard icon={Clock} label="Tempo hoje" value={dash?.time_studied_min ?? 0} sub="minutos" color="text-violet-400" />
        <StatCard icon={Trophy} label="Domínio médio" value={mastery !== null && mastery !== undefined ? `${mastery}%` : "—"} sub={dash?.overall_label || "ainda sem dados"} color="text-emerald-400" />
        <StatCard icon={BookOpenCheck} label="Revisões pendentes" value={dash?.due_reviews ?? 0} sub="hoje" color="text-amber-400" />
      </div>

      {/* PRÓXIMO ESTUDO */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-white/5 to-transparent p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-300">
          <Sparkles size={15} /> Próximo estudo
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-h2 text-slate-50">{rec.title || "Ainda não temos dados suficientes"}</h2>
            {rec.topic_name && (
              <p className="mt-1 text-sm text-slate-400">
                {rec.subject ? <span className="capitalize">{rec.subject}</span> : "Conteúdo"} · {rec.topic_name}
                {mastery !== null && mastery !== undefined && <> · Domínio atual: <strong className="text-slate-200">{mastery}%</strong></>}
              </p>
            )}
            {rec.minutes > 0 && <p className="mt-1 text-sm text-slate-400">Tempo estimado: {rec.minutes} minutos</p>}
            {rec.reasons?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {rec.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={onStartStudy}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <Play size={17} /> Começar agora
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* REVISÃO DE HOJE */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <RefreshCw size={17} className="text-amber-400" /> Revisão de hoje
            </div>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
              {dash?.due_reviews ?? 0} pendentes
            </span>
          </div>
          {streakTopics.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma revisão vencida. Volte amanhã para manter o domínio. 🎉</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                {critical > 0 && <span className="rounded-full bg-red-500/15 px-2.5 py-1 font-semibold text-red-300">🔴 {critical} críticas</span>}
                {important > 0 && <span className="rounded-full bg-orange-500/15 px-2.5 py-1 font-semibold text-orange-300">🟠 {important} importantes</span>}
                {maintenance > 0 && <span className="rounded-full bg-green-500/15 px-2.5 py-1 font-semibold text-green-300">🟢 {maintenance} manutenção</span>}
              </div>
              <ul className="mb-4 space-y-2">
                {streakTopics.slice(0, 5).map((t) => (
                  <li key={t.topic_id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-200">{t.topic_name}</span>
                    <span className={`shrink-0 text-xs font-semibold ${t.days_left < 0 ? "text-red-300" : "text-green-300"}`}>
                      {t.days_left < 0 ? `${Math.abs(t.days_left)}d atrasada` : "hoje"}
                    </span>
                  </li>
                ))}
              </ul>
              <button onClick={onStartStudy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20">
                Começar revisão <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>

        {/* PONTOS FRACOS */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-100">
            <AlertTriangle size={17} className="text-red-400" /> Precisa de atenção
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-slate-400">
              {domain?.subjects?.length ? "Nenhum tópico com domínio abaixo de 61%. Ótimo trabalho! 🎉" : "Estude um pouco para começarmos a medir seu domínio."}
            </p>
          ) : (
            <ul className="space-y-3">
              {weakTopics.map((t) => (
                <li key={t.topic_id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-slate-200">{t.topic_name}</span>
                      <span className="shrink-0 text-xs font-bold text-slate-400">{Math.round(t.mastery ?? 0)}%</span>
                    </div>
                    <MasteryBar mastery={t.mastery} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* MEU DOMÍNIO */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <Map size={17} className="text-violet-400" /> Meu domínio
            </div>
            <button onClick={onOpenDomain} className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">
              Ver completo <ArrowRight size={13} />
            </button>
          </div>
          {!domain?.subjects?.length ? (
            <p className="text-sm text-slate-400">Ainda não temos dados suficientes. Comece uma sessão de estudo para mapear seu domínio.</p>
          ) : (
            <ul className="space-y-3">
              {domain.subjects.map((s) => {
                const isOpen = expandedSubject === s.subject;
                return (
                  <li key={s.subject} className="rounded-xl border border-white/5 bg-white/5">
                    <button
                      onClick={() => setExpandedSubject(isOpen ? null : s.subject)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium capitalize text-slate-200">{s.subject}</span>
                          <span className="shrink-0 text-xs font-bold text-slate-300">
                            {s.mastery !== null && s.mastery !== undefined ? `${Math.round(s.mastery)}% · ${masteryLabel(s.mastery)}` : "Sem dados"}
                          </span>
                        </div>
                        <MasteryBar mastery={s.mastery} />
                      </div>
                      <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <ul className="space-y-2 border-t border-white/5 px-4 py-3">
                        {(s.topics || []).map((t) => (
                          <li key={t.topic_id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-slate-300">{t.topic_name}</span>
                            <span className="shrink-0 text-xs font-semibold text-slate-400">
                              {t.mastery !== null && t.mastery !== undefined ? `${Math.round(t.mastery)}%` : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* SEUS ERROS */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <XCircle size={17} className="text-red-400" /> Seus erros
            </div>
            <span className="rounded-full bg-red-400/15 px-3 py-1 text-xs font-bold text-red-300">
              {(dash?.errors_to_review ?? 0)} aguardando
            </span>
          </div>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum erro registrado. Quando você errar, ele aparece aqui com explicação e questão de recuperação.</p>
          ) : (
            <>
              <ul className="mb-4 space-y-2.5">
                {recentErrors.map((e) => (
                  <li key={e.id} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold capitalize text-slate-300">{e.topic_name || e.topic_id}</span>
                      {e.error_type_label && (
                        <span className="shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 font-semibold text-purple-300">{e.error_type_label}</span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-400">{e.question}</p>
                  </li>
                ))}
              </ul>
              <button onClick={onOpenErrors} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20">
                Revisar meus erros <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>
      </div>

      {/* EVOLUÇÃO (honesta: só dados reais) */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
          <Flame size={17} className="text-orange-400" /> Sua evolução
        </div>
        {dash?.time_studied_min === 0 && dash?.recommended_questions === 0 && (dash?.due_reviews ?? 0) === 0 ? (
          <p className="text-sm text-slate-400">
            Ainda não temos dados suficientes para mostrar sua evolução. Comece uma sessão de estudo — cada questão e revisão será contabilizada aqui.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{dash?.time_studied_min ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">minutos hoje</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{dash?.recommended_questions ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">questões recomendadas</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">
                {dash?.at_risk_topics ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-400">tópicos em risco de esquecimento</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
