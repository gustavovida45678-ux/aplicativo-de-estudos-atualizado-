import { useState } from 'react';
import { CheckCircle2, ChevronRight, X, RotateCcw, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/studyMaterials.css';

const AssessmentPractice = ({ assessment, disciplineName, onBack, onRegister }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const exercises = assessment?.questions || [];
  const total = exercises.length;

  const submitAnswer = () => {
    if (selectedAnswer === null || showResult) return;
    const ex = exercises[currentIndex];
    if (selectedAnswer === ex.correct_answer) setCorrectCount((c) => c + 1);
    setShowResult(true);
  };

  const nextExercise = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const score = total > 0 ? (correctCount / total) * 10 : 0;

  const register = () => {
    onRegister(Math.round(score * 10) / 10);
    toast.success(`Nota ${score.toFixed(1).replace('.', ',')} registrada em ${disciplineName}!`);
    onBack();
  };

  const retry = () => {
    setAttempt((a) => a + 1);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    const passed = score >= 6;
    return (
      <div className="materials-practice">
        <div className="materials-assessment-summary">
          <div className={`materials-assessment-score ${passed ? 'pass' : 'fail'}`}>
            <span className="materials-assessment-score-value">{score.toFixed(1).replace('.', ',')}</span>
            <span className="materials-assessment-score-label">/ 10</span>
          </div>
          <h3>{assessment.title}</h3>
          <p className="materials-assessment-result-text">
            Você acertou <b>{correctCount}</b> de <b>{total}</b> questões
            {passed ? ' — bom trabalho!' : ' — revise o conteúdo e tente novamente!'}
          </p>
          <div className="materials-assessment-actions">
            <button className="materials-practice-btn" onClick={register}>
              <ClipboardCheck size={18} />
              Registrar nota {score.toFixed(1).replace('.', ',')}
            </button>
            <button className="materials-practice-btn secondary" onClick={retry}>
              <RotateCcw size={18} />
              Refazer avaliação
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!total) {
    return (
      <div className="materials-practice-card">
        <div className="materials-practice-error">
          <p>Esta avaliação ainda não tem questões prontas.</p>
          <button className="materials-practice-btn secondary" onClick={onBack}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const ex = exercises[currentIndex];
  const progressPct = ((currentIndex + 1) / total) * 100;

  return (
    <div className="materials-practice">
      <div className="materials-practice-top">
        <button className="materials-practice-back" onClick={onBack}>
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          Voltar
        </button>
        <div className="materials-practice-title-block">
          <h3>{assessment.title}</h3>
          <span>{disciplineName} • Questão {currentIndex + 1} de {total}</span>
        </div>
        <div className="materials-practice-bar">
          <div className="materials-practice-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="materials-practice-question">
        <div className="materials-practice-number">{currentIndex + 1}</div>
        <p className="materials-practice-text">{ex.question}</p>

        <div className="materials-practice-options">
          {ex.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = showResult && index === ex.correct_answer;
            const isWrong = showResult && isSelected && !isCorrect;
            let cls = 'materials-practice-option';
            if (showResult && isCorrect) cls += ' correct';
            if (isWrong) cls += ' wrong';
            else if (isSelected && !showResult) cls += ' selected';
            return (
              <button
                key={`${attempt}-${index}`}
                className={cls}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
              >
                <span className="materials-practice-option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="materials-practice-option-text">{option}</span>
                {showResult && isCorrect && <CheckCircle2 size={18} className="ok" />}
                {isWrong && <X size={18} className="no" />}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`materials-practice-result ${selectedAnswer === ex.correct_answer ? 'correct' : 'wrong'}`}>
            <h4>{selectedAnswer === ex.correct_answer ? 'Correto!' : 'Incorreto'}</h4>
            <p>{ex.explanation}</p>
          </div>
        )}

        <div className="materials-practice-actions">
          {!showResult ? (
            <button className="materials-practice-btn" onClick={submitAnswer} disabled={selectedAnswer === null}>
              Enviar Resposta
            </button>
          ) : (
            <button className="materials-practice-btn" onClick={nextExercise}>
              {currentIndex < total - 1 ? 'Próxima Questão' : 'Ver resultado'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPractice;
