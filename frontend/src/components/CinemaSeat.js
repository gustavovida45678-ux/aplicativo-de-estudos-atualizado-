import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';

export default function WelcomeScreen({ userName }) {
  return (
    <div className="welcome-screen-static" data-testid="welcome-screen">
      <div className="welcome-content">
        {/* Cute Cat Studying - Better visual */}
        <div className="cat-studying">
          <div className="cat-scene">
            <div className="cat-emoji">🐈‍⬛</div>
            <div className="glasses-emoji">👓</div>
          </div>
          <div className="study-items">
            <span>📚</span>
            <span>✏️</span>
            <span>📖</span>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="welcome-message">
          <h1 className="welcome-title">
            Olá, {userName}! 👋
          </h1>
          <p className="welcome-subtitle">
            Seja bem-vindo ao seu espaço de estudos
          </p>
        </div>

        {/* Icon */}
        <div className="welcome-icon">
          <GraduationCap size={48} />
        </div>
      </div>
    </div>
  );
}
