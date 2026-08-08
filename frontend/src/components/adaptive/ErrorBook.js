import { useState, useEffect } from "react";
import axios from "axios";
import {
  XCircle, CheckCircle2, ChevronDown, ChevronUp, Flag, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

export default function ErrorBook({ onBack }) {
  const [errors, setErrors] = useState(null);
  const [errorTypes, setErrorTypes] = useState({});
  const [open, setOpen] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [subject, setSubject] = useState("");

  const load = async () => {
    try {
      const params = {};
      if (subject) params.subject = subject;
      if (showResolved) params.resolved = true;
      const res = await axios.get(`${API}/errors`, { params });
      setErrors(res.data.errors);
      setErrorTypes(res.data.error_types || {});
    } catch (e) {
      toast.error("Não foi possível carregar os erros");
    }
  };

  useEffect(() => { load(); }, [showResolved, subject]);

  const resolve = async (id) => {
    try {
      await axios.post(`${API}/errors/${id}/resolve`, { correction: "" });
      toast.success("Erro marcado como corrigido 🎉");
      load();
    } catch {
      toast.error("Não foi possível atualizar");
    }
  };

  const classify = async (id, type) => {
    try {
      await axios.post(`${API}/errors/${id}/classify`, { error_type: type });
      toast.success("Classificação atualizada");
      load();
    } catch {
      toast.error("Falha ao classificar");
    }
  };

  const subjects = [...new Set((errors || []).map((e) => e.subject).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meus Erros</h2>
          <p className="text-sm text-muted-foreground">
            Cada erro é um diagnóstico. Revisá-los evita repeti-los.
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Todas as disciplinas</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`rounded-lg border px-3 py-2 text-sm transition ${showResolved ? "border-primary bg-primary/20" : "border-white/10 bg-white/5"}`}
        >
          Mostrar corrigidos
        </button>
      </div>

      {errors === null && <p className="py-8 text-center text-muted-foreground">Carregando...</p>}
      {errors !== null && errors.length === 0 && (
        <Card className="py-10 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
          Nenhum erro registrado aqui. Continue estudando!
        </Card>
      )}

      <div className="grid gap-3">
        {errors.map((e) => (
          <Card key={e.id} className="border-0 bg-white/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive"><XCircle size={11} className="mr-1" /> {errorTypes[e.error_type] || e.error_type_label || e.error_type}</Badge>
                    <Badge variant="outline">{e.topic_name}</Badge>
                    <Badge variant="secondary">{e.subject}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{e.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}repetições: {e.repetitions || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!e.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolve(e.id)}>
                      <CheckCircle2 size={14} className="mr-1 text-emerald-500" /> Corrigido
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setOpen(open === e.id ? null : e.id)}>
                    {open === e.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
              </div>

              {open === e.id && (
                <div className="mt-4 space-y-3 rounded-xl bg-white/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-red-400">
                    <Flag size={14} /> Análise do erro
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <b>Resposta do aluno:</b> {String(e.student_answer)}
                  </p>
                  {e.explanation && (
                    <p className="text-sm"><b>Correção:</b> {e.explanation}</p>
                  )}
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Classificação:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(errorTypes).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => classify(e.id, key)}
                          className={`rounded-full border px-2.5 py-1 text-xs transition ${
                            e.error_type === key ? "border-primary bg-primary/20" : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
