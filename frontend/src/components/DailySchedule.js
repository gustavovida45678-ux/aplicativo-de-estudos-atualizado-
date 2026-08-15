import React, { useMemo } from 'react';
import {
  Calendar, Clock, GraduationCap, MapPin, School, BookOpen, Coffee, Moon, Timer, Trophy,
} from 'lucide-react';
import { CLASSES_SCHEDULE, BLOCK_TYPE_LABELS, WEEK_START } from '../data/dailySchedule';

const DAY_ORDER = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const TYPE_ICONS = {
  class: School,
  study: BookOpen,
  break: Coffee,
  rest: Moon,
};

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const getCurrentWeek = () => {
  const start = new Date(`${WEEK_START}T00:00:00`);
  const diff = Math.floor((new Date() - start) / (7 * 24 * 3600 * 1000));
  return Math.max(1, Math.min(16, diff + 1));
};

const DailySchedule = () => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayIndex = (now.getDay() + 6) % 7;
  const currentWeek = useMemo(getCurrentWeek, []);

  const stats = useMemo(() => {
    const count = { class: 0, study: 0, break: 0, rest: 0 };
    CLASSES_SCHEDULE.forEach((d) =>
      d.blocks.forEach((b) => {
        if (count[b.type] != null) count[b.type] += 1;
      })
    );
    return count;
  }, []);

  const isNow = (time) => {
    const m = time.match(/^(\d{2}:\d{2}) - (\d{2}:\d{2})$/);
    if (!m) return false;
    return nowMin >= toMinutes(m[1]) && nowMin < toMinutes(m[2]);
  };

  return (
    <div className="materials-daily-schedule">
      <div className="materials-daily-hero">
        <div className="materials-daily-hero-icon">
          <GraduationCap size={26} />
        </div>
        <div className="materials-daily-hero-text">
          <h2>Cronograma Diário de Estudos</h2>
          <p>Horários de aula + estudo individual + simulados semanais (IFG Jataí)</p>
        </div>
        <div className="materials-daily-week-badge">
          <Trophy size={14} />
          Semana <b>{currentWeek}</b> de 16
        </div>
      </div>

      <div className="materials-daily-stats">
        {Object.entries(BLOCK_TYPE_LABELS).map(([key, cfg]) => {
          const Icon = TYPE_ICONS[key] || BookOpen;
          return (
            <div className="materials-daily-stat" key={key} style={{ borderColor: `${cfg.color}33`, color: cfg.color }}>
              <Icon size={16} />
              <b>{stats[key]}</b>
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      <div className="materials-daily-timeline">
        {DAY_ORDER.map((day, dayIdx) => {
          const dayData = CLASSES_SCHEDULE.find((d) => d.day === day) || { blocks: [] };
          const isToday = dayIdx === todayIndex;
          const isRestDay = dayData.blocks.length === 1 && dayData.blocks[0].type === 'rest';

          return (
            <div className={`materials-daily-day ${isToday ? 'today' : ''}`} key={day}>
              <div className="materials-daily-day-title">
                <Calendar size={14} />
                {day}
                {isToday && <span className="materials-daily-today-badge">● Hoje</span>}
              </div>

              {isRestDay ? (
                <div className="materials-daily-restday">
                  <span className="materials-daily-restday-icon">{dayData.blocks[0].icon}</span>
                  <div>
                    <b>{dayData.blocks[0].discipline}</b>
                    <p>{dayData.blocks[0].room}</p>
                  </div>
                </div>
              ) : (
                <div className="materials-daily-blocks">
                  {dayData.blocks.map((block, idx) => {
                    const typeCfg = BLOCK_TYPE_LABELS[block.type] || BLOCK_TYPE_LABELS.study;
                    const [startT, endT] = block.time.split(' - ');
                    const nowActive = isToday && isNow(block.time);
                    const last = idx === dayData.blocks.length - 1;
                    return (
                      <div
                        key={idx}
                        className={`materials-daily-block-row ${block.type} ${nowActive ? 'now' : ''}`}
                      >
                        <div className="materials-daily-block-time" style={{ color: typeCfg.color }}>
                          <b>{startT}</b>
                          {endT && <small>{endT}</small>}
                        </div>
                        <div className="materials-daily-block-track">
                          <span className="materials-daily-block-dot" style={{ background: typeCfg.color }} />
                          {!last && <span className="materials-daily-block-line" style={{ background: `${typeCfg.color}44` }} />}
                        </div>
                        <div className="materials-daily-block-card" style={{ borderColor: `${typeCfg.color}33` }}>
                          <span className="materials-daily-block-icon" style={{ background: `${typeCfg.color}1f` }}>
                            {block.icon}
                          </span>
                          <div className="materials-daily-block-body">
                            <div className="materials-daily-block-title">
                              {block.discipline}
                              {nowActive && <span className="materials-daily-now-pill">Agora</span>}
                            </div>
                            <div className="materials-daily-block-sub">
                              {block.room !== 'Estudo (ED)' && block.room !== 'Estudo (SD)' && (
                                <MapPin size={11} />
                              )}
                              {block.room}
                            </div>
                          </div>
                          <span
                            className="materials-daily-block-tag"
                            style={{ color: typeCfg.color, background: `${typeCfg.color}1f`, borderColor: `${typeCfg.color}44` }}
                          >
                            {typeCfg.short}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="materials-daily-tip">
        <Timer size={18} />
        <span>
          <b>Dica Pomodoro:</b> a cada bloco de estudo de 2h, faça 25 min de foco + 5 min de pausa. O
          simulado semanal é o do cronograma (semana atual do plano de 16 semanas).
        </span>
      </div>
    </div>
  );
};

export default DailySchedule;
