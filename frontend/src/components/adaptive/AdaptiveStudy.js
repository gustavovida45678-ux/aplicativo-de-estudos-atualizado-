import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BrainCircuit, LayoutDashboard, XCircle, Map, Target } from "lucide-react";
import AdaptiveDashboard from "./AdaptiveDashboard";
import AdaptiveSession from "./AdaptiveSession";
import ErrorBook from "./ErrorBook";
import DomainMap from "./DomainMap";
import Recommend from "./Recommend";
import { BACKEND_URL } from "../../lib/backendUrl";

const API = `${BACKEND_URL}/api/adaptive`;

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "session", label: "Sessão", icon: BrainCircuit },
  { id: "errors", label: "Meus Erros", icon: XCircle },
  { id: "domain", label: "Domínio", icon: Map },
  { id: "recommend", label: "Recomendar", icon: Target },
];

export default function AdaptiveStudy({ autoStart = false, autoView = null, onAutoConsumed = () => {} }) {
  const [view, setView] = useState(autoView || "dashboard");
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
    const start = async () => {
      try {
        const { data } = await axios.post(`${API}/session/start`, { limit: 8 });
        if (cancelled) return;
        setSession(data);
        setView("session");
      } catch (error) {
        if (cancelled) return;
        toast.error(error.response?.data?.detail || "Não foi possível iniciar a sessão de estudo");
        setView("dashboard");
      } finally {
        if (!cancelled) onAutoConsumed();
      }
    };
    start();
    return () => { cancelled = true; };
  }, [autoStart]);

  const startSession = (s) => {
    setSession(s);
    setView("session");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                view === v.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <Icon size={15} /> {v.label}
            </button>
          );
        })}
      </div>

      {view === "dashboard" && <AdaptiveDashboard onStartSession={startSession} onNavigate={setView} />}
      {view === "session" && session && (
        <AdaptiveSession session={session} onFinish={() => { setSession(null); setView("dashboard"); }} />
      )}
      {view === "errors" && <ErrorBook onBack={() => setView("dashboard")} />}
      {view === "domain" && <DomainMap onBack={() => setView("dashboard")} />}
      {view === "recommend" && <Recommend onBack={() => setView("dashboard")} onStartTopic={startSession} />}
    </div>
  );
}
