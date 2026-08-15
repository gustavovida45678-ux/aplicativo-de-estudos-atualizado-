import { useState, useEffect } from "react";
import axios from "axios";
import {
  Brain, ChevronDown, ChevronUp, Flame, CalendarClock, Target,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

const STATE_COLOR = {
  critico: "bg-red-500",
  muito_fraco: "bg-orange-500",
  desenvolvimento: "bg-amber-500",
  basico: "bg-yellow-500",
  bom: "bg-emerald-500",
  dominado: "bg-green-500",
};

function Bar({ mastery }) {
  const color = mastery < 21 ? "bg-red-500" : mastery < 41 ? "bg-orange-500" : mastery < 61 ? "bg-amber-500" : mastery < 76 ? "bg-yellow-400" : mastery < 91 ? "bg-emerald-500" : "bg-green-500";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${mastery}%` }} />
    </div>
  );
}

export default function DomainMap({ onBack }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/domain`);
      setData(res.data.subjects);
    } catch (e) {
      toast.error("Não foi possível carregar o mapa de domínio");
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meu Domínio</h2>
          <p className="text-sm text-muted-foreground">
            Quanto mais você estuda e revisa, mais preciso este mapa fica.
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>

      {!data && <p className="py-8 text-center text-muted-foreground">Carregando...</p>}
      {data && data.length === 0 && (
        <Card className="py-10 text-center text-muted-foreground">
          <Brain className="mx-auto mb-2 text-primary" size={32} />
          Nenhum tópico estudado ainda. Comece uma sessão para gerar seu mapa.
        </Card>
      )}

      <div className="grid gap-3">
        {data?.map((subj) => (
          <Card key={subj.subject} className="border-0 bg-white/5">
            <CardContent className="p-4">
              <button
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setOpen(open === subj.subject ? null : subj.subject)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{subj.subject}</span>
                  <Badge variant="secondary">{subj.topics.length} tópicos</Badge>
                </div>
                <span className="flex items-center gap-2">
                  <span className="font-bold">{subj.mastery ?? "—"}%</span>
                  {open === subj.subject ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {open === subj.subject && (
                <div className="mt-4 space-y-3">
                  {subj.topics.map((t) => (
                    <div key={t.topic_id} className="rounded-xl bg-white/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{t.topic_name}</p>
                        <div className="flex items-center gap-2">
                          {t.overdue && <Badge variant="destructive"><Flame size={11} className="mr-1" /> atrasado</Badge>}
                          <Badge variant="secondary">{t.label}</Badge>
                          <span className="text-sm font-bold">{t.mastery}%</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Bar mastery={t.mastery} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Revisões: {t.reviews_count}</span>
                        <span className="text-emerald-500">Acertos: {t.correct_count}</span>
                        <span className="text-red-400">Erros: {t.wrong_count}</span>
                        <span className="flex items-center gap-1"><Target size={11} /> confiança: {t.confidence}%</span>
                        <span className="flex items-center gap-1">
                          <CalendarClock size={11} /> próxima revisão: {t.next_review || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
