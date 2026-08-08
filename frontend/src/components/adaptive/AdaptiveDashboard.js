import { useState, useEffect } from "react";
import axios from "axios";
import {
  Flame, Target, XCircle, Brain, BarChart3, Clock, Play,
  AlertTriangle, CheckCircle2, TrendingUp, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

function StatCard({ icon, label, value, accent }) {
  return (
    <Card className="border-0 shadow-sm bg-white/5">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdaptiveDashboard({ onStartSession, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/dashboard`);
      setData(res.data);
    } catch (e) {
      toast.error("Não foi possível carregar o dashboard adaptativo", {
        description: e?.response?.data?.detail || "Verifique se o backend está no ar.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p>Analisando seu estado de aprendizagem...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" size={36} />
        <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
        <Button className="mt-4" onClick={load}>Tentar novamente</Button>
      </div>
    );
  }

  const rec = data.recommendation;
  const overall = data.overall_mastery;

  const start = async () => {
    setStarting(true);
    try {
      const res = await axios.post(`${API}/session/start`, { limit: 8 });
      onStartSession(res.data);
    } catch (e) {
      toast.error("Não foi possível montar a sessão", {
        description: e?.response?.data?.detail || "Tente novamente.",
      });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com domínio geral */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estudo Inteligente</h2>
          <p className="text-sm text-muted-foreground">
            O sistema escolhe a melhor atividade para o seu momento — e explica por quê.
          </p>
        </div>
        {overall !== null && (
          <div className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3">
            <BarChart3 className="text-primary" size={22} />
            <div>
              <p className="text-xs text-muted-foreground">Domínio geral</p>
              <p className="text-lg font-bold">{overall}% <span className="text-sm font-normal text-muted-foreground">({data.overall_label})</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ESTUDO DE HOJE */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Flame className="text-orange-400" size={18} />} label="Revisões pendentes" value={data.due_reviews} accent="bg-orange-500/15" />
        <StatCard icon={<Target className="text-sky-400" size={18} />} label="Questões recomendadas" value={data.recommended_questions} accent="bg-sky-500/15" />
        <StatCard icon={<XCircle className="text-red-400" size={18} />} label="Erros para revisar" value={data.errors_to_review} accent="bg-red-500/15" />
        <StatCard icon={<Brain className="text-amber-400" size={18} />} label="Conteúdos em risco" value={data.at_risk_topics} accent="bg-amber-500/15" />
        <StatCard icon={<CheckCircle2 className="text-emerald-400" size={18} />} label="Domínio geral" value={overall === null ? "—" : `${overall}%`} accent="bg-emerald-500/15" />
        <StatCard icon={<Clock className="text-violet-400" size={18} />} label="Tempo hoje" value={`${data.time_studied_min} min`} accent="bg-violet-500/15" />
      </div>

      {/* Botão principal */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles size={16} /> RECOMENDAÇÃO PARA AGORA
            </p>
            <h3 className="mt-1 text-xl font-bold">{rec.title || "Montar sessão de estudo"}</h3>
            <ul className="mt-2 space-y-1">
              {rec.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="mt-0.5 shrink-0 text-primary" size={14} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="h-14 px-8 text-base font-bold" onClick={start} disabled={starting}>
            <Play className="mr-2" size={20} />
            {starting ? "Montando sessão..." : "COMEÇAR ESTUDO DE HOJE"}
          </Button>
        </CardContent>
      </Card>

      {/* Atalhos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("errors")}>
          <XCircle size={16} className="text-red-400" /> Meus Erros
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("domain")}>
          <Brain size={16} className="text-primary" /> Mapa de Domínio
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("recommend")}>
          <Target size={16} className="text-sky-400" /> O que estudar agora
        </Button>
      </div>

      {/* Revisões vencidas em breve */}
      {data.streak_topics?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Flame size={16} className="text-orange-400" /> Revisões vencidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.streak_topics.map((t) => (
              <div key={t.topic_id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-sm font-medium">{t.topic_name}</span>
                <Badge variant="secondary">{t.days_left <= 0 ? "vencido" : `${t.days_left}d`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
