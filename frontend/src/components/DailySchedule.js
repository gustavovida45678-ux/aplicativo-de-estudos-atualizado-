import React from 'react';
import { Calendar, Clock, MapPin, GraduationCap } from 'lucide-react';
import { CLASSES_SCHEDULE, BLOCK_TYPE_LABELS } from '../data/dailySchedule';

const DAY_ORDER = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const today = new Date();
const todayIndex = (today.getDay() + 6) % 7; // 0 = segunda

const DailySchedule = () => {
  return (
    <div className="materials-daily-schedule">
      <div className="materials-daily-header">
        <div>
          <h2>Cronograma Diário de Estudos</h2>
          <p>Horários de aula + estudo individual + simulados semanais (IFG Jataí)</p>
        </div>
      </div>

      <div className="materials-daily-legend">
        {Object.entries(BLOCK_TYPE_LABELS).map(([key, cfg]) => (
          <span key={key} className="materials-daily-legend-item">
            <span className="materials-daily-legend-dot" style={{ background: cfg.color }} />
            {cfg.label}
          </span>
        ))}
      </div>

      <div className="materials-daily-grid">
        {DAY_ORDER.map((day, dayIdx) => {
          const dayData = CLASSES_SCHEDULE.find((d) => d.day === day) || { blocks: [] };
          const isToday = dayIdx === todayIndex;
          return (
            <div className={`materials-daily-day ${isToday ? 'today' : ''}`} key={day}>
              <div className="materials-daily-day-title">
                <Calendar size={14} />
                {day}
                {isToday && <span className="materials-daily-today-badge">Hoje</span>}
              </div>
              <div className="materials-daily-blocks">
                {dayData.blocks.map((block, idx) => {
                  const typeCfg = BLOCK_TYPE_LABELS[block.type] || BLOCK_TYPE_LABELS.study;
                  return (
                    <div
                      key={idx}
                      className={`materials-daily-block ${block.type}`}
                      style={{ borderLeftColor: typeCfg.color }}
                    >
                      <div className="materials-daily-block-time">
                        <Clock size={12} />
                        {block.time}
                      </div>
                      <div className="materials-daily-block-title">
                        <span className="materials-daily-block-icon">{block.icon}</span>
                        <span>{block.discipline}</span>
                      </div>
                      <div className="materials-daily-block-room">
                        <MapPin size={11} />
                        {block.room}
                      </div>
                      {block.type === 'class' && (
                        <span className="materials-daily-block-tag">Aula</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="materials-daily-footer">
        <GraduationCap size={16} />
        <span>
          Dica: a cada bloco de estudo de 2h, faça 25 min de foco + 5 min de pausa (Pomodoro).
          O simulado semanal é o do cronograma (semana atual do plano de 16 semanas).
        </span>
      </div>
    </div>
  );
};

export default DailySchedule;
