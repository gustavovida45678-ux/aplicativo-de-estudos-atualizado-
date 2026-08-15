import { useState, useEffect } from "react";
import axios from "axios";
import { Target, TrendingUp, Clock, Play, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

export default function Recommend({ onBack, onStartTopic }) {
  const [rec, setRec] = useState(null);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/recommend`);
      setRec(res.data);
    } catch (e) {
      toast.error("Não foi possível calcular a recomendação");
    }
  };

  useEffect(() => { load(); }, []);

  const start = async () => {
    setStarting(true);
    try {
      const res = await axios.post(`${API}/session/start`, { limit: 8 });
      onStartTopic(res.data);
    } catch (e) {
      toast.error("Não foi possível montar a sessão");
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">O que devo estudar agora?</h2>
          <p className="text-sm text-muted-foreground">O sistema analisa seu histórico e explica a escolha.</p>
        </div>
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>

      {!rec && <p className="py-8 text-center text-muted-foreground">Calculando recomendação...</p>}

      {rec && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="space-y-4 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Target size={16} /> RECOMENDAÇÃO
            </p>
            <h3 className="text-2xl font-bold">{rec.title || "Nenhuma recomendação específica"}</h3>

            {rec.has_recommendation && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} /> Tempo sugerido: {rec.minutes} minutos
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Por que isso?</p>
                  {rec.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-sm">
                      <TrendingUp className="mt-0.5 shrink-0 text-primary" size={14} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="w-full" onClick={start} disabled={starting}>
                  <Play size={18} className="mr-2" />
                  {starting ? "Montando..." : "Estudar isso agora"} <ArrowRight size={16} className="ml-2" />
                </Button>
              </>
            )}

            {!rec.has_recommendation && (
              <p className="text-sm text-muted-foreground">
                Estude um tópico novo no mapa de domínio ou gere exercícios na aba Exercícios.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
