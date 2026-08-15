import { Clock, AlertCircle, BookOpen, CheckCircle } from 'lucide-react';

const WeeklyCalendar = ({ schedule, attendedClasses = [], onToggleAttended }) => {
  const isAttended = (day, time) => {
    return attendedClasses.includes(`${day}-${time}`);
  };

  return (
    <div className="weekly-calendar-wrapper">
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot attended"></div>
          <span>Aulas Assistidas</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot class"></div>
          <span>Aulas de Cálculo (I, II, III e Numérico)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot other"></div>
          <span>Outras Matérias</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot study"></div>
          <span>Horários Livres para Estudo</span>
        </div>
      </div>

      <div className="calendar-info-box">
        <p>💡 <strong>Dica:</strong> Clique em uma aula para marcá-la como assistida (ficará verde)</p>
      </div>

      <div className="weekly-calendar">
        {schedule.map((day, dayIndex) => (
          <div key={dayIndex} className="calendar-day-column">
            <div className="calendar-day-header">
              <span className="day-name">{day.day}</span>
              <span className="day-short">{day.dayShort}</span>
            </div>
            <div className="calendar-slots">
              {day.slots.map((slot, slotIndex) => {
                const attended = isAttended(day.day, slot.time);
                const canToggle = slot.type === 'class' || slot.type === 'other';
                
                return (
                  <div
                    key={slotIndex}
                    className={`calendar-slot ${slot.type} ${attended ? 'attended' : ''} ${canToggle ? 'clickable' : ''}`}
                    onClick={() => canToggle && onToggleAttended(day.day, slot.time)}
                  >
                    <div className="slot-time">
                      <Clock size={14} />
                      {slot.time}
                    </div>
                    {slot.type === 'class' ? (
                      <div className="slot-content class-slot">
                        {attended && <CheckCircle size={16} className="attended-icon" />}
                        {!attended && <AlertCircle size={16} />}
                        <div className="slot-details">
                          <span className="slot-subject">{slot.subject}</span>
                          {slot.room && <span className="slot-room">Sala: {slot.room}</span>}
                        </div>
                      </div>
                    ) : slot.type === 'other' ? (
                      <div className="slot-content other-slot">
                        {attended && <CheckCircle size={16} className="attended-icon" />}
                        {!attended && <BookOpen size={16} />}
                        <div className="slot-details">
                          <span className="slot-subject">{slot.subject}</span>
                          {slot.room && <span className="slot-room">Sala: {slot.room}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="slot-content study-slot">
                        <span>{slot.subject || 'Horário Livre'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
