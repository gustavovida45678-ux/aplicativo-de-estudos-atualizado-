import { useState } from "react";
import { BrainCircuit, LayoutDashboard, XCircle, Map, Target } from "lucide-react";
import AdaptiveDashboard from "./AdaptiveDashboard";
import AdaptiveSession from "./AdaptiveSession";
import ErrorBook from "./ErrorBook";
import DomainMap from "./DomainMap";
import Recommend from "./Recommend";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "session", label: "Sessão", icon: BrainCircuit },
  { id: "errors", label: "Meus Erros", icon: XCircle },
  { id: "domain", label: "Domínio", icon: Map },
  { id: "recommend", label: "Recomendar", icon: Target },
];

export default function AdaptiveStudy() {
  const [view, setView] = useState("dashboard");
  const [session, setSession] = useState(null);

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
