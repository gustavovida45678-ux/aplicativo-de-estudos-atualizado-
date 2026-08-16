import { useState, useEffect } from "react";
import { Eye, CheckCircle2, Circle, Info, Lightbulb, HeartPulse, Utensils, Monitor, Activity, Brain, Sun, Moon, Droplets, Sparkles } from "lucide-react";

const STORAGE_KEY = "eye_exercises_checked_v1";

const MODULES = [
  {
    id: "mod1",
    label: "Módulo 1",
    title: "Fundamentos diários",
    color: "#58a6ff",
    icon: Eye,
    items: [
      { text: "Palming — 30 minutos por dia (pode ser dividido em 3 a 4x ao dia)", freq: "Diário" },
      { text: "Automassagem — 1x ao dia (em média 5 a 10 minutos)", freq: "Diário" },
      { text: "Diminua a ansiedade com exercícios respiratórios", freq: "2 a 3x na semana" },
      { text: "Compressa fria — 5 minutos por dia", freq: "Diário" },
      { text: "Olhar e seguir as moscas volantes até desaparecer; se houver nos 2 olhos, fazer um de cada vez", freq: "Diário" },
      { text: "Não fuja das moscas: olhe para elas até desaparecerem de vez", freq: "Diário" },
    ],
  },
  {
    id: "mod2",
    label: "Módulo 2",
    title: "Luz e descanso",
    color: "#f78166",
    icon: Sun,
    items: [
      { text: "Sunning (Ensolar) — 10 minutos", freq: "4x na semana" },
      { text: "Banho no escuro", freq: "Todas as noites" },
    ],
  },
  {
    id: "mod3",
    label: "Módulo 3",
    title: "Piscar",
    color: "#3fb950",
    icon: Sparkles,
    items: [
      { text: "Exercícios para PISCAR melhor", freq: "1x por dia" },
    ],
  },
  {
    id: "mod4",
    label: "Módulo 4",
    title: "Visão de longe",
    color: "#d2a8ff",
    icon: Activity,
    items: [
      { text: "Olhar longe — 10 minutos por dia", freq: "Diário" },
    ],
  },
  {
    id: "mod5",
    label: "Módulo 5",
    title: "Olho mais fraco",
    color: "#ffa657",
    icon: Eye,
    items: [
      { text: "Tampão e bolinha para trabalhar o olho mais fraco (se houver diferença entre os olhos) — 8 minutos", freq: "3x na semana" },
    ],
  },
];

const BONUS = [
  { icon: Monitor, title: "Pausas no computador/leitura/TV", text: "A cada 40 minutos, parar por 10 minutos no mínimo: descansar, fazer qualquer outra coisa e depois voltar." },
  { icon: Monitor, title: "11 dicas para usar o Computador e Celular", text: "Evite cansar os olhos com boas práticas de uso de telas." },
  { icon: Utensils, title: "Nutrição", text: "Bônus alimentação para a Saúde dos Olhos." },
  { icon: HeartPulse, title: "Circulação corporal", text: "Intensificar a circulação corporal — bônus Circulação para os Olhos." },
  { icon: Brain, title: "Emoções e movimento", text: "Cuidar das emoções e praticar exercícios físicos regulares." },
  { icon: Lightbulb, title: "Investigue a causa das moscas", text: "Na maioria das vezes é estresse — mas sempre investigue com o oftalmologista. Relaxe: elas são suas amigas e estão te alertando para cuidar melhor de você e dos seus olhos." },
];

function EyeExercises() {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch (e) {
      console.error("Erro ao carregar progresso dos exercícios:", e);
    }
  }, []);

  const toggle = (key) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Erro ao salvar progresso:", e);
      }
      return next;
    });
  };

  const allItems = MODULES.flatMap((m) => m.items.map((i, idx) => `${m.id}-${idx}`));
  const doneCount = allItems.filter((k) => checked[k]).length;
  const percent = allItems.length ? Math.round((doneCount / allItems.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "#58a6ff20" }}>
              <Eye size={22} style={{ color: "#58a6ff" }} />
            </span>
            Exercícios para a Saúde dos Olhos
          </h1>
          <p className="text-gray-400 mt-1">
            Programa de exercícios (Moscas Volantes e cansaço visual) — marque o que já fez.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: percent === 100 ? "#3fb950" : "#58a6ff" }}>
            {percent}%
          </div>
          <div className="text-xs text-gray-400">{doneCount}/{allItems.length} concluídos</div>
        </div>
      </div>

      {percent === 100 && (
        <div className="mb-6 rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#3fb95044", background: "#3fb95012" }}>
          <CheckCircle2 size={22} style={{ color: "#3fb950" }} />
          <span className="text-sm text-gray-200">Parabéns! Todos os exercícios do programa concluídos hoje.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {MODULES.map((mod) => (
          <div key={mod.id} className="rounded-2xl border border-gray-800 bg-[#161b22] p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: mod.color + "20" }}>
                <mod.icon size={20} style={{ color: mod.color }} />
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: mod.color }}>{mod.label}</div>
                <div className="font-semibold text-white">{mod.title}</div>
              </div>
            </div>
            <ul className="space-y-3">
              {mod.items.map((item, idx) => {
                const key = `${mod.id}-${idx}`;
                const done = !!checked[key];
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full text-left flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-800/50"
                      style={{ background: done ? "#3fb95012" : "transparent" }}
                    >
                      {done ? (
                        <CheckCircle2 size={20} style={{ color: "#3fb950" }} className="shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={20} className="text-gray-500 shrink-0 mt-0.5" />
                      )}
                      <span className="flex-1">
                        <span className={`text-sm block ${done ? "text-gray-400 line-through" : "text-gray-200"}`}>{item.text}</span>
                        <span className="text-xs mt-1 inline-block rounded-full px-2 py-0.5" style={{ background: mod.color + "18", color: mod.color }}>
                          {item.freq}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} style={{ color: "#f78166" }} /> Bônus e cuidados
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BONUS.map((b, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-[#161b22] p-4">
              <b.icon size={20} className="mb-2" style={{ color: "#f78166" }} />
              <div className="text-sm font-semibold text-white mb-1">{b.title}</div>
              <p className="text-xs text-gray-400 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border p-5 flex gap-3" style={{ borderColor: "#58a6ff33", background: "#58a6ff0d" }}>
        <Droplets size={22} style={{ color: "#58a6ff" }} className="shrink-0" />
        <p className="text-sm text-gray-300 leading-relaxed">
          <strong className="text-white">Dica:</strong> a maioria dos casos de moscas volantes está ligada ao estresse,
          mas sempre investigue com o oftalmologista. Relaxe — elas são suas amigas e estão te alertando
          para cuidar melhor de você e dos seus olhos.
        </p>
      </div>
    </div>
  );
}

export default EyeExercises;