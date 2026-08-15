import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, Circle, Play, BookOpenCheck, AlertCircle } from "lucide-react";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;
const SCHEDULE_API = `${BACKEND_URL}/api/schedule`;

export default function ScheduleStudy({ onStartSession }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/schedule`);
      setData(data);
    } catch (error) {
      console.error("Erro ao carregar cronograma:", error);
      toast.error("Não foi possível carregar o cronograma");
      setData({ subjects: [], tasks: [], available: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTopic = async (subject, topic) => {
    const prev = data;
    setData((d) => ({
      ...d,
      subjects: d.subjects.map((s) =>
        s.subject_id === subject.subject_id
          ? {
              ...s,
              pending_topics: s.pending_topics + (topic.completed ? 1 : -1),
              topics: s.topics.map((t) => (t.id === topic.id ? { ...t, completed: !t.completed } : t)),
            }
          : s
      ),
    }));
    try {
      await axios.put(`${SCHEDULE_API}/subjects/${subject.subject_id}/topics/${topic.id}/toggle`);
      toast.success(topic.completed ? "Marcado como pendente" : "Tópico concluído 🎉");
    } catch (error) {
      console.error("Erro ao alternar tópico:", error);
      setData(prev);
      toast.error("Não foi possível atualizar o tópico");
    }
  };

  const studySubject = async (subject) => {
    if (starting) return;
    setStarting(subject.subject_id);
    try {
      const { data: session } = await axios.post(`${API}/session/start`, {
        limit: 8,
        subjects: [subject.adaptive_subject],
      });
      onStartSession(session);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Não foi possível iniciar o estudo desta disciplina");
    } finally {
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="spinner" />
        <p className="mt-4 text-sm text-slate-400">Carregando cronograma...</p>
      </div>
    );
  }

  if (data && data.available === false) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <CalendarClock className="mx-auto mb-3 text-slate-400" size={40} />
        <h3 className="text-h3 text-slate-100">Cronograma indisponível no momento</h3>
        <p className="mt-2 text-sm text-slate-400">O cronograma de estudos não pôde ser carregado agora. Tente novamente em instantes.</p>
      </div>
    );
  }

  const subjects = data?.subjects || [];
  const tasks = data?.tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
          <CalendarClock size={22} />
        </div>
        <div>
          <h2 className="text-h2 text-slate-50">Seu cronograma de estudos</h2>
          <p className="text-sm text-slate-400">
            {subjects.reduce((acc, s) => acc + s.pending_topics, 0)} tópicos pendentes · marque os concluídos e estude cada disciplina
          </p>
        </div>
      </div>

      {subjects.length === 0 && tasks.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <BookOpenCheck className="mx-auto mb-3 text-slate-400" size={40} />
          <h3 className="text-h3 text-slate-100">Nenhum tópico pendente</h3>
          <p className="mt-2 text-sm text-slate-400">Seu cronograma está em dia. Parabéns! 🎉</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {subjects.map((subject) => (
          <div key={subject.subject_id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ backgroundColor: `${subject.color}22`, color: subject.color }}
                >
                  {subject.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{subject.name}</h3>
                  <p className="text-xs text-slate-400">{subject.pending_topics} pendentes</p>
                </div>
              </div>
              <button
                onClick={() => studySubject(subject)}
                disabled={starting !== null || subject.pending_topics === 0}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40"
              >
                <Play size={13} />
                {starting === subject.subject_id ? "Iniciando..." : "Estudar"}
              </button>
            </div>
            <ul className="divide-y divide-white/5">
              {subject.topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => toggleTopic(subject, topic)}
                    className="shrink-0 text-slate-400 transition hover:text-blue-400"
                    title={topic.completed ? "Marcar como pendente" : "Marcar como concluído"}
                  >
                    {topic.completed ? <CheckCircle2 size={19} className="text-green-500" /> : <Circle size={19} />}
                  </button>
                  <span className={`flex-1 text-sm ${topic.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                    {topic.title}
                  </span>
                  {topic.completed ? (
                    <span className="shrink-0 text-[11px] font-semibold text-green-500">Concluído</span>
                  ) : topic.mastery !== null && topic.mastery !== undefined ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                      Domínio {Math.round(topic.mastery)}%
                    </span>
                  ) : topic.has_questions ? (
                    <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                      Novo
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                      Sem questões
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
            <AlertCircle size={16} className="text-amber-400" /> Tarefas pendentes
          </h3>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-2.5 text-sm">
                <span className="text-slate-200">{task.task}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  task.priority === "high" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"
                }`}>
                  {task.priority === "high" ? "Alta" : "Média"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
