import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart as BarChartIcon, Clock, ListChecks, Flame, TrendingUp,
  Brain, CheckCircle2, Loader2, ArrowLeft, Target, BookOpen,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

export default function WeeklyReport({ onBack = () => {} }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/report/weekly`).then(({ data }) => setData(data))
      .catch(() => toast.error("Não foi possível carregar o relatório semanal"));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasActivity = data.total_minutes > 0 || data.total_questions > 0;

  const cards = [
    { label: "Minutos na semana", value: data.total_minutes, icon: Clock, color: "text-cyan-400 bg-cyan-500/10" },
    { label: "Questões respondidas", value: data.total_questions, icon: ListChecks, color: "text-violet-400 bg-violet-500/10" },
    { label: "Sessões concluídas", value: data.total_sessions, icon: BookOpen, color: "text-amber-400 bg-amber-500/10" },
    { label: "Dias seguidos", value: data.streak, icon: Flame, color: "text-orange-400 bg-orange-500/10" },
    { label: "Domínio médio", value: data.overall_mastery != null ? `${data.overall_mastery}%` : "—", icon: Brain, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Erros corrigidos (7d)", value: data.errors_resolved_week, icon: CheckCircle2, color: "text-green-400 bg-green-500/10" },
  ];

  const subjRows = Object.entries(data.per_subject || {});
  const maxSubj = Math.max(1, ...subjRows.map(([, r]) => r.correct + r.wrong));

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <TrendingUp size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Relatório da semana</h2>
          <p className="text-sm text-muted-foreground">Seus últimos 7 dias de estudo com dados reais das sessões.</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
                <Icon size={16} />
              </div>
              <div className="text-lg font-bold">{c.value}</div>
              <div className="text-[11px] leading-tight text-muted-foreground">{c.label}</div>
            </div>
          );
        })}
      </div>

      {!hasActivity ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <BarChartIcon size={30} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Nenhuma atividade registrada ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete uma sessão de estudo e o relatório passa a mostrar sua evolução.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Clock size={15} className="text-cyan-400" /> Minutos estudados por dia
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="weekday" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="minutes" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Target size={15} className="text-violet-400" /> Acertos x Erros por dia
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="weekday" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="correct" name="Acertos" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="wrong" name="Erros" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {subjRows.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-3 text-sm font-semibold">Desempenho por disciplina</h3>
              <div className="space-y-3">
                {subjRows.map(([subj, r]) => {
                  const total = r.correct + r.wrong;
                  const p = total ? Math.round((r.correct / total) * 100) : 0;
                  return (
                    <div key={subj}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium">{subj}</span>
                        <span className="text-muted-foreground">{r.correct}✓ {r.wrong}✗ • {p}%</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-emerald-500" style={{ width: `${(r.correct / maxSubj) * 100}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${(r.wrong / maxSubj) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.top_topics?.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-3 text-sm font-semibold">Tópicos que mais precisam de atenção</h3>
              <div className="space-y-2">
                {data.top_topics.map((t) => (
                  <div key={t.topic_id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <Brain size={14} className="text-muted-foreground" />
                    <span className="flex-1">{t.topic_name}</span>
                    <span className="font-semibold text-amber-400">{t.mastery}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
