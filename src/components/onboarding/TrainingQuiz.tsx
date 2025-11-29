import { useState } from 'react';
import { Button } from '../ui/button';
import { QUIZ_QUESTIONS, PASSING_SCORE, TOTAL_QUESTIONS, type QuizQuestion } from '../../lib/onboardingQuestions';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrainingQuizProps {
  onPass: (score: number) => void;
  onRetry: () => void;
}

export function TrainingQuiz({ onPass, onRetry }: TrainingQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(TOTAL_QUESTIONS).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === TOTAL_QUESTIONS - 1;
  const hasAnswered = selectedAnswers[currentQuestion] !== -1;

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  }

  function handleNext() {
    if (isLastQuestion) {
      calculateScore();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function calculateScore() {
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);

    if (correct >= PASSING_SCORE) {
      onPass(correct);
    }
  }

  function handleRetry() {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(TOTAL_QUESTIONS).fill(-1));
    setShowResults(false);
    setScore(0);
    onRetry();
  }

  if (showResults) {
    const passed = score >= PASSING_SCORE;
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className={`p-8 border-4 ${
            passed ? 'bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-[#00FF00]' : 'bg-[#151515] border-[#FF4444]'
          }`}>
            {/* Icon */}
            <div className="text-center mb-6">
              {passed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-block p-6 bg-[#00FF00] border-4 border-[#F6F2EE]"
                >
                  <CheckCircle2 className="w-16 h-16 text-[#050505]" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-block p-6 bg-[#FF4444] border-4 border-[#F6F2EE]"
                >
                  <XCircle className="w-16 h-16 text-[#F6F2EE]" />
                </motion.div>
              )}
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <h2 className="text-[#F6F2EE] mb-2">
                {passed ? 'Congratulations! 🎉' : 'Not Quite There'}
              </h2>
              <div className="mb-4">
                <span className={`text-6xl font-bold ${passed ? 'text-[#FFD700]' : 'text-[#FF4444]'}`}>
                  {score}/{TOTAL_QUESTIONS}
                </span>
                <p className="text-[#F6F2EE] mt-2">({percentage}%)</p>
              </div>
              <p className="text-[#F6F2EE]">
                {passed 
                  ? "You passed! You're ready to start earning." 
                  : `You need ${PASSING_SCORE}/${TOTAL_QUESTIONS} (80%) to pass.`}
              </p>
            </div>

            {/* Results breakdown */}
            <div className="mb-6 p-4 bg-[#050505]/50 border-2 border-[#F6F2EE]">
              <h4 className="text-[#F6F2EE] text-sm uppercase tracking-wider mb-3">
                {passed ? 'What You Got Right:' : 'Review:'}
              </h4>
              <div className="space-y-2">
                {QUIZ_QUESTIONS.map((q, index) => {
                  const isCorrect = selectedAnswers[index] === q.correctAnswer;
                  return (
                    <div key={q.id} className="flex items-start gap-2 text-sm">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00FF00] flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#FF4444] flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={isCorrect ? 'text-[#00FF00]' : 'text-[#FF4444]'}>
                          Question {index + 1}
                        </p>
                        {!isCorrect && (
                          <p className="text-[#A0A0A0] text-xs mt-1">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {!passed && (
                <Button
                  onClick={handleRetry}
                  className="w-full h-12 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake Quiz
                </Button>
              )}
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full text-[#8A4FFF] text-sm hover:text-[#FF7A59] transition-colors"
              >
                Review Training Videos
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#F6F2EE]">Knowledge Check</h3>
          <div className="px-3 py-1 bg-[#8A4FFF] border-2 border-[#F6F2EE]">
            <span className="text-[#F6F2EE] text-sm font-bold">
              {currentQuestion + 1}/{TOTAL_QUESTIONS}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#050505] border-2 border-[#F6F2EE]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / TOTAL_QUESTIONS) * 100}%` }}
            className="h-full bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]"
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              {/* Question text */}
              <div className="p-6 bg-[#8A4FFF] border-4 border-[#F6F2EE]">
                <p className="text-[#F6F2EE] text-lg font-bold">
                  {question.question}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion] === index;
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-5 border-3 text-left transition-all ${
                        isSelected
                          ? 'bg-[#8A4FFF] border-[#F6F2EE]'
                          : 'bg-[#151515] border-[#F6F2EE] hover:border-[#8A4FFF]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Radio */}
                        <div className={`w-6 h-6 rounded-full border-3 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          isSelected ? 'border-[#F6F2EE] bg-[#F6F2EE]' : 'border-[#F6F2EE]'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-[#8A4FFF]" />
                          )}
                        </div>

                        {/* Option text */}
                        <p className={`flex-1 ${isSelected ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'}`}>
                          {option}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button */}
              <Button
                onClick={handleNext}
                disabled={!hasAnswered}
                className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Help text */}
              <p className="text-[#A0A0A0] text-xs text-center">
                You need {PASSING_SCORE}/{TOTAL_QUESTIONS} correct to pass (80%)
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
