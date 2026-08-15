import { CheckCircle2, Circle } from 'lucide-react';

const TopicsList = ({ subjects, onToggleTopic }) => {
  return (
    <div className="topics-container">
      {subjects.map((subject) => {
        const completedCount = subject.topics.filter(t => t.completed).length;
        const totalCount = subject.topics.length;
        const progress = (completedCount / totalCount) * 100;

        return (
          <div key={subject.id} className="subject-card">
            <div className="subject-header" style={{ borderLeftColor: subject.color }}>
              <div className="subject-info">
                <span className="subject-icon" style={{ color: subject.color }}>
                  {subject.icon}
                </span>
                <h3 className="subject-name">{subject.name}</h3>
              </div>
              <div className="subject-progress">
                <span className="progress-text">
                  {completedCount}/{totalCount} concluídos
                </span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: subject.color 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="topics-list">
              {subject.topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`topic-item ${topic.completed ? 'completed' : ''}`}
                  onClick={() => onToggleTopic(subject.id, topic.id)}
                >
                  <div className="topic-checkbox">
                    {topic.completed ? (
                      <CheckCircle2 size={20} style={{ color: subject.color }} />
                    ) : (
                      <Circle size={20} className="unchecked-circle" />
                    )}
                  </div>
                  <span className="topic-title">{topic.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopicsList;
