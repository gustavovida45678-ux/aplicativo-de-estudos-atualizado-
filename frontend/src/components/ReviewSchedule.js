import { useState, useEffect } from 'react';
import { Repeat, Calendar as CalendarIcon, Bell, CheckCircle, AlertCircle, Brain, TrendingUp, Zap, Clock, BookOpen } from 'lucide-react';

const ReviewSchedule = ({ subjects, studySessions }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Generate review schedule based on spaced repetition
    const generateReviews = () => {
      const reviewList = [];
      const today = new Date();
      
      studySessions.forEach(session => {
        const sessionDate = new Date(session.date);
        
        // Spaced repetition intervals: 1 day, 3 days, 1 week, 2 weeks, 1 month
        const intervals = [1, 3, 7, 14, 30];
        
        intervals.forEach((interval, index) => {
          const reviewDate = new Date(sessionDate);
          reviewDate.setDate(reviewDate.getDate() + interval);
          
          // Only add if review date is in the future or today
          if (reviewDate >= today) {
            const daysUntil = Math.ceil((reviewDate - today) / (1000 * 60 * 60 * 24));
            
            reviewList.push({
              id: `${session.id}-${interval}`,
              sessionId: session.id,
              subject: session.subject,
              topics: session.topicsStudied,
              reviewDate: reviewDate,
              daysUntil: daysUntil,
              interval: interval,
              reviewNumber: index + 1,
              isUrgent: daysUntil <= 1,
              isPending: daysUntil <= 0,
            });
          }
        });
      });
      
      // Sort by date
      reviewList.sort((a, b) => a.reviewDate - b.reviewDate);
      setReviews(reviewList);
    };
    
    generateReviews();
  }, [studySessions]);

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#6b7280';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Desconhecido';
  };

  const pendingReviews = reviews.filter(r => r.isPending);
  const upcomingReviews = reviews.filter(r => !r.isPending && r.daysUntil <= 7);
  const futureReviews = reviews.filter(r => r.daysUntil > 7);

  return (
    <div className="review-schedule-modern">
      {/* Hero Header */}
      <div className="review-hero">
        <div className="review-hero-content">
          <div className="review-hero-icon">
            <Brain size={48} />
          </div>
          <div>
            <h1 className="review-hero-title">Sistema de Revisão Espaçada</h1>
            <p className="review-hero-subtitle">
              Maximize sua retenção de conhecimento com revisões científicas programadas 🧠
            </p>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="review-stats-grid">
        <div className="stat-card stat-card-red">
          <div className="stat-card-icon">
            <AlertCircle size={32} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{pendingReviews.length}</div>
            <div className="stat-card-label">Pendentes Hoje</div>
            <div className="stat-card-progress">
              <div 
                className="stat-card-progress-bar red" 
                style={{ width: `${Math.min((pendingReviews.length / Math.max(reviews.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="stat-card-icon">
            <Bell size={32} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{upcomingReviews.length}</div>
            <div className="stat-card-label">Próximos 7 Dias</div>
            <div className="stat-card-progress">
              <div 
                className="stat-card-progress-bar yellow" 
                style={{ width: `${Math.min((upcomingReviews.length / Math.max(reviews.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-card-icon">
            <CalendarIcon size={32} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{futureReviews.length}</div>
            <div className="stat-card-label">Futuras</div>
            <div className="stat-card-progress">
              <div 
                className="stat-card-progress-bar blue" 
                style={{ width: `${Math.min((futureReviews.length / Math.max(reviews.length, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-card-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{reviews.length}</div>
            <div className="stat-card-label">Total Agendadas</div>
            <div className="stat-card-progress">
              <div className="stat-card-progress-bar purple" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* How it Works - Modern Design */}
      <div className="review-how-it-works">
        <div className="how-it-works-header">
          <Zap size={24} />
          <h3>Como Funciona a Ciência da Repetição Espaçada</h3>
        </div>
        
        <div className="review-timeline">
          <div className="timeline-item">
            <div className="timeline-badge day-1">1</div>
            <div className="timeline-content">
              <h4>1 Dia Depois</h4>
              <p>Revisão imediata para consolidação inicial</p>
              <div className="timeline-retention">Retenção: 80%</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge day-3">3</div>
            <div className="timeline-content">
              <h4>3 Dias Depois</h4>
              <p>Fortalecimento das conexões neurais</p>
              <div className="timeline-retention">Retenção: 90%</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge day-7">7</div>
            <div className="timeline-content">
              <h4>1 Semana Depois</h4>
              <p>Fixação de médio prazo</p>
              <div className="timeline-retention">Retenção: 95%</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge day-14">14</div>
            <div className="timeline-content">
              <h4>2 Semanas Depois</h4>
              <p>Reforço e consolidação</p>
              <div className="timeline-retention">Retenção: 97%</div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge day-30">30</div>
            <div className="timeline-content">
              <h4>1 Mês Depois</h4>
              <p>Memória de longo prazo estabelecida</p>
              <div className="timeline-retention">Retenção: 99%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews - Priority Section */}
      {pendingReviews.length > 0 && (
        <div className="review-section priority-section">
          <div className="section-header priority">
            <AlertCircle size={24} />
            <h2>⚠️ Revisões Pendentes - Faça Agora!</h2>
            <span className="section-badge">{pendingReviews.length}</span>
          </div>
          
          <div className="review-cards-grid">
            {pendingReviews.map(review => (
              <div key={review.id} className="review-card priority-card">
                <div className="review-card-header">
                  <div 
                    className="review-card-dot" 
                    style={{ backgroundColor: getSubjectColor(review.subject) }}
                  />
                  <span className="review-card-subject">{getSubjectName(review.subject)}</span>
                  <span className="review-card-badge urgent">URGENTE</span>
                </div>
                
                <div className="review-card-body">
                  <div className="review-card-topics">
                    <BookOpen size={16} />
                    <span>{review.topics}</span>
                  </div>
                </div>
                
                <div className="review-card-footer">
                  <div className="review-card-meta">
                    <Clock size={14} />
                    <span>Revisão #{review.reviewNumber}</span>
                  </div>
                  <div className="review-card-interval">
                    {review.interval} dias após estudo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {upcomingReviews.length > 0 && (
        <div className="review-section">
          <div className="section-header upcoming">
            <CalendarIcon size={24} />
            <h2>📅 Próximas Revisões (7 dias)</h2>
            <span className="section-badge">{upcomingReviews.length}</span>
          </div>
          
          <div className="review-cards-grid">
            {upcomingReviews.map(review => (
              <div key={review.id} className="review-card upcoming-card">
                <div className="review-card-header">
                  <div 
                    className="review-card-dot" 
                    style={{ backgroundColor: getSubjectColor(review.subject) }}
                  />
                  <span className="review-card-subject">{getSubjectName(review.subject)}</span>
                  <span className="review-card-date">
                    {review.daysUntil === 0 ? '🔔 Hoje' : review.daysUntil === 1 ? '📅 Amanhã' : `⏰ ${review.daysUntil} dias`}
                  </span>
                </div>
                
                <div className="review-card-body">
                  <div className="review-card-topics">
                    <BookOpen size={16} />
                    <span>{review.topics}</span>
                  </div>
                </div>
                
                <div className="review-card-footer">
                  <div className="review-card-meta">
                    <Clock size={14} />
                    <span>Revisão #{review.reviewNumber}</span>
                  </div>
                  <div className="review-card-full-date">
                    {new Date(review.reviewDate).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future Reviews */}
      {futureReviews.length > 0 && (
        <div className="review-section">
          <div className="section-header future">
            <TrendingUp size={24} />
            <h2>🔮 Revisões Futuras</h2>
            <span className="section-badge">{futureReviews.length}</span>
          </div>
          
          <div className="review-cards-grid compact">
            {futureReviews.slice(0, 6).map(review => (
              <div key={review.id} className="review-card future-card">
                <div className="review-card-header">
                  <div 
                    className="review-card-dot" 
                    style={{ backgroundColor: getSubjectColor(review.subject) }}
                  />
                  <span className="review-card-subject">{getSubjectName(review.subject)}</span>
                </div>
                
                <div className="review-card-body compact">
                  <span className="review-card-topics-compact">{review.topics}</span>
                </div>
                
                <div className="review-card-footer compact">
                  <span>Em {review.daysUntil} dias</span>
                </div>
              </div>
            ))}
          </div>
          
          {futureReviews.length > 6 && (
            <div className="review-show-more">
              + {futureReviews.length - 6} revisões programadas
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && (
        <div className="empty-reviews-modern">
          <div className="empty-reviews-icon">
            <Brain size={80} />
          </div>
          <h3>Nenhuma Revisão Agendada Ainda</h3>
          <p>Comece registrando suas sessões de estudo na aba <strong>"Registro"</strong></p>
          <p className="empty-reviews-tip">
            💡 Dica: Quanto mais você estuda e registra, mais revisões automáticas serão criadas!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSchedule;
