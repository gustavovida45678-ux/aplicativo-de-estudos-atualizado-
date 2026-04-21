import { useState, useEffect } from 'react';
import {
  GraduationCap, Calendar, CheckCircle2, Circle, BookOpen,
  Target, Clock, Award, TrendingUp, User, MapPin, ChevronDown, ChevronRight,
  PenTool, Repeat, Package, Trophy,
} from 'lucide-react';
import { roadmapInfo, phases, typeConfig } from '../data/roadmap110Days';
import '../styles/roadmap110.css';

const STORAGE_KEY = 'roadmap110_completed_v1';

const RoadmapPlan = () => {
  const [completed, setCompleted] = useState({});
  const [expandedPhase, setExpandedPhase] = useState('phase1');

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }, [completed]);

  const toggleDay = (phaseId, weekNum, dayRange) => {
    const key = `${phaseId}-w${weekNum}-d${dayRange}`;
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate totals
  const allDays = phases.flatMap(p =>
    p.weeksData.flatMap(w =>
      w.days.map(d => ({ phaseId: p.id, weekNum: w.number, dayRange: d.range, type: d.type }))
    )
  );

  const totalBlocks = allDays.length;
  const completedBlocks = allDays.filter(
    d => completed[`${d.phaseId}-w${d.weekNum}-d${d.dayRange}`]
  ).length;
  const progressPercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  // Count by type
  const countByType = (type) => {
    return allDays.filter(d => d.type === type).length;
  };

  const completedByType = (type) => {
    return allDays.filter(
      d => d.type === type && completed[`${d.phaseId}-w${d.weekNum}-d${d.dayRange}`]
    ).length;
  };

  // Phase progress
  const getPhaseProgress = (phase) => {
    const phaseDays = phase.weeksData.flatMap(w =>
      w.days.map(d => `${phase.id}-w${w.number}-d${d.range}`)
    );
    const phaseCompleted = phaseDays.filter(k => completed[k]).length;
    return {
      total: phaseDays.length,
      done: phaseCompleted,
      percent: phaseDays.length > 0 ? Math.round((phaseCompleted / phaseDays.length) * 100) : 0,
    };
  };

  const getTypeIcon = (type) => {
    const iconProps = { size: 14 };
    switch (type) {
      case 'study': return <BookOpen {...iconProps} />;
      case 'exercise': return <PenTool {...iconProps} />;
      case 'review': return <Repeat {...iconProps} />;
      case 'delivery': return <Package {...iconProps} />;
      default: return <Circle {...iconProps} />;
    }
  };

  return (
    <div className="roadmap110-container">
      {/* Hero Header */}
      <div className="roadmap110-hero">
        <div className="roadmap110-hero-content">
          <div className="roadmap110-hero-icon">
            <GraduationCap size={48} />
          </div>
          <div className="roadmap110-hero-text">
            <div className="roadmap110-hero-badge">Plano de Estudos Detalhado</div>
            <h1 className="roadmap110-hero-title">Roteiro 110 Dias</h1>
            <p className="roadmap110-hero-subtitle">{roadmapInfo.subject}</p>
            <div className="roadmap110-hero-meta">
              <div className="hero-meta-item">
                <User size={16} />
                <span>Prof. {roadmapInfo.professor}</span>
              </div>
              <div className="hero-meta-item">
                <MapPin size={16} />
                <span>{roadmapInfo.institution}</span>
              </div>
              <div className="hero-meta-item">
                <Award size={16} />
                <span>{roadmapInfo.course}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="roadmap110-info-banner">
        <div className="info-card info-date">
          <Calendar size={22} />
          <div>
            <div className="info-card-label">Início</div>
            <div className="info-card-value">1 Abril 2026</div>
          </div>
        </div>
        <div className="info-card info-date">
          <Target size={22} />
          <div>
            <div className="info-card-label">Entrega</div>
            <div className="info-card-value">10 Julho 2026</div>
          </div>
        </div>
        <div className="info-card info-date">
          <Clock size={22} />
          <div>
            <div className="info-card-label">Duração</div>
            <div className="info-card-value">110 dias • 15 sem</div>
          </div>
        </div>
        <div className="info-card info-progress">
          <TrendingUp size={22} />
          <div>
            <div className="info-card-label">Progresso Geral</div>
            <div className="info-card-value">{progressPercent}% • {completedBlocks}/{totalBlocks}</div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="overall-progress-wrapper">
        <div className="overall-progress-track">
          <div
            className="overall-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="breakdown-section">
        <h2 className="breakdown-title">
          <TrendingUp size={20} />
          Estrutura do Cronograma
        </h2>
        <div className="breakdown-grid">
          <div className="breakdown-card breakdown-study">
            <div className="breakdown-icon"><BookOpen size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('study')}/{countByType('study')}</div>
              <div className="breakdown-label">Estudo de Conteúdo</div>
              <div className="breakdown-sub">~70 dias planejados</div>
            </div>
          </div>
          <div className="breakdown-card breakdown-exercise">
            <div className="breakdown-icon"><PenTool size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('exercise')}/{countByType('exercise')}</div>
              <div className="breakdown-label">Exercícios & Atividades</div>
              <div className="breakdown-sub">~25 dias planejados</div>
            </div>
          </div>
          <div className="breakdown-card breakdown-review">
            <div className="breakdown-icon"><Repeat size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('review')}/{countByType('review')}</div>
              <div className="breakdown-label">Revisões Programadas</div>
              <div className="breakdown-sub">~10 dias planejados</div>
            </div>
          </div>
          <div className="breakdown-card breakdown-delivery">
            <div className="breakdown-icon"><Trophy size={24} /></div>
            <div className="breakdown-data">
              <div className="breakdown-number">{completedByType('delivery')}/{countByType('delivery')}</div>
              <div className="breakdown-label">Finalização & Entrega</div>
              <div className="breakdown-sub">~5 dias planejados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="roadmap110-legend">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div className="legend-pill" key={key}>
            <span className="legend-dot" style={{ background: cfg.color }} />
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div className="phases-wrapper">
        {phases.map((phase) => {
          const progress = getPhaseProgress(phase);
          const isExpanded = expandedPhase === phase.id;

          return (
            <div key={phase.id} className="phase-card" style={{ borderLeftColor: phase.color }}>
              <button
                className="phase-header"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="phase-header-left">
                  <div
                    className="phase-number-badge"
                    style={{ background: phase.color }}
                  >
                    {phase.number}
                  </div>
                  <div className="phase-title-block">
                    <div className="phase-label-line">
                      <span className="phase-title-main">FASE {phase.number}: {phase.name}</span>
                      <span className="phase-weeks-badge">Semanas {phase.weeks} • {phase.totalDays} dias</span>
                    </div>
                    <div className="phase-description">{phase.description}</div>
                  </div>
                </div>
                <div className="phase-header-right">
                  <div className="phase-progress-info">
                    <div className="phase-progress-text">
                      {progress.done}/{progress.total} concluídos
                    </div>
                    <div className="phase-progress-bar-wrapper">
                      <div
                        className="phase-progress-bar-fill"
                        style={{ width: `${progress.percent}%`, background: phase.color }}
                      />
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                </div>
              </button>

              {isExpanded && (
                <div className="phase-content">
                  {phase.weeksData.map((week) => (
                    <div className="week-block" key={`${phase.id}-w${week.number}`}>
                      <div className="week-header">
                        <div className="week-number">Semana {week.number}</div>
                        <div className="week-info">
                          <div className="week-title">{week.title}</div>
                          <div className="week-date-range">{week.dateRange}</div>
                        </div>
                      </div>
                      <div className="week-days">
                        {week.days.map((day, idx) => {
                          const key = `${phase.id}-w${week.number}-d${day.range}`;
                          const isDone = !!completed[key];
                          const cfg = typeConfig[day.type];

                          return (
                            <div
                              key={idx}
                              className={`day-item ${isDone ? 'done' : ''}`}
                              style={{
                                background: isDone ? 'rgba(16, 185, 129, 0.1)' : cfg.bgColor,
                                borderColor: isDone ? 'rgba(16, 185, 129, 0.4)' : cfg.borderColor,
                              }}
                              onClick={() => toggleDay(phase.id, week.number, day.range)}
                            >
                              <div className="day-check">
                                {isDone ? (
                                  <CheckCircle2 size={22} className="check-done" />
                                ) : (
                                  <Circle size={22} className="check-idle" />
                                )}
                              </div>
                              <div className="day-main">
                                <div className="day-top-row">
                                  <span className="day-range">Dia{day.range.includes('-') ? 's' : ''} {day.range}</span>
                                  <span className="day-date">{day.date}</span>
                                  <span
                                    className="day-type-badge"
                                    style={{
                                      color: cfg.color,
                                      borderColor: cfg.borderColor,
                                      background: 'rgba(0,0,0,0.25)',
                                    }}
                                  >
                                    {getTypeIcon(day.type)}
                                    {cfg.label}
                                  </span>
                                </div>
                                <div className={`day-topic ${isDone ? 'strikethrough' : ''}`}>
                                  {day.topic}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="roadmap110-footer">
        <div className="footer-icon">
          <Trophy size={32} />
        </div>
        <div className="footer-text">
          <h3>Consistência é a chave do sucesso</h3>
          <p>Siga o cronograma, marque o progresso diário e alcance a entrega final em 10 de Julho de 2026.</p>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPlan;
