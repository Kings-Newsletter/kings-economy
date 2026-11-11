import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  GraduationCap,
  ShoppingBasket,
} from 'lucide-react';
import { BASIC_LESSONS } from '../../data/basics';
import { OneSentence, SectionHead } from '../ui/RangeField';

interface BasicsTrailProps {
  lessonIndex: number;
  onLessonChange: (index: number) => void;
}

const DONE_KEY = 'ke-licoes-concluidas';

const readDone = (): string[] => {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

export const BasicsTrail: React.FC<BasicsTrailProps> = ({ lessonIndex, onLessonChange }) => {
  const [done, setDone] = useState<string[]>(readDone);
  const [answer, setAnswer] = useState<number | null>(null);

  const lesson = BASIC_LESSONS[lessonIndex] ?? BASIC_LESSONS[0];
  const total = BASIC_LESSONS.length;
  const isCorrect = answer === lesson.check.correctIndex;

  useEffect(() => {
    setAnswer(null);
  }, [lessonIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      /* sem armazenamento, o progresso vale só nesta visita */
    }
  }, [done]);

  const choose = (index: number) => {
    setAnswer(index);
    if (index === lesson.check.correctIndex && !done.includes(lesson.id)) {
      setDone((prev) => [...prev, lesson.id]);
    }
  };

  return (
    <section id="do-zero" className="band band-learn" aria-labelledby="do-zero-title">
      <div className="wrap">
        <SectionHead id="do-zero-title" title="Economia do zero" icon={GraduationCap}>
          Sete lições curtas, na ordem certa para quem nunca estudou o assunto. Cada uma termina
          com uma pergunta para você conferir se entendeu.
        </SectionHead>

        <div className="trail-progress" aria-live="polite">
          <span>
            Você concluiu <strong>{done.length}</strong> de {total} lições
          </span>
          <span className="trail-progress-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${done.length / total})` }} />
          </span>
        </div>

        <div className="trail">
          <ol className="trail-list" aria-label="Lições">
            {BASIC_LESSONS.map((l, i) => {
              const isDone = done.includes(l.id);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-current={i === lessonIndex ? 'step' : undefined}
                    onClick={() => onLessonChange(i)}
                  >
                    <span className={`trail-num ${isDone ? 'is-done' : ''}`} aria-hidden="true">
                      {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    <span>
                      {l.title}
                      {isDone && <span className="sr-only"> (concluída)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <article className="lesson" key={lesson.id} aria-labelledby="lesson-title">
            <p className="lesson-count">
              Lição {lessonIndex + 1} de {total}
            </p>
            <h3 id="lesson-title">{lesson.title}</h3>
            <OneSentence>{lesson.inOneSentence}</OneSentence>
            {lesson.explanation.map((p) => (
              <p key={p}>{p}</p>
            ))}

            <div className="everyday">
              <ShoppingBasket aria-hidden="true" size={22} strokeWidth={1.75} />
              <p>
                <strong>No dia a dia:</strong> {lesson.everydayExample}
              </p>
            </div>

            <fieldset className="quiz">
              <legend>Teste rápido: {lesson.check.question}</legend>
              <div className="quiz-options">
                {lesson.check.options.map((opt, i) => {
                  const state =
                    answer === null
                      ? ''
                      : i === lesson.check.correctIndex
                        ? 'is-right'
                        : i === answer
                          ? 'is-wrong'
                          : '';
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`quiz-option ${state}`}
                      aria-pressed={answer === i}
                      onClick={() => choose(i)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="quiz-feedback" aria-live="polite">
                {answer !== null &&
                  (isCorrect ? (
                    <p className="is-right">
                      <CircleCheck aria-hidden="true" size={20} />
                      <span>
                        <strong>Isso mesmo.</strong> {lesson.check.whyCorrect}
                      </span>
                    </p>
                  ) : (
                    <p className="is-wrong">
                      <CircleX aria-hidden="true" size={20} />
                      <span>
                        <strong>Ainda não.</strong> A resposta certa está marcada em verde.{' '}
                        {lesson.check.whyCorrect}
                      </span>
                    </p>
                  ))}
              </div>
            </fieldset>

            <div className="lesson-nav">
              <button
                type="button"
                className="button"
                onClick={() => onLessonChange(lessonIndex - 1)}
                disabled={lessonIndex === 0}
              >
                <ArrowLeft aria-hidden="true" size={18} /> Lição anterior
              </button>
              {lessonIndex < total - 1 ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => onLessonChange(lessonIndex + 1)}
                >
                  Próxima lição <ArrowRight aria-hidden="true" size={18} />
                </button>
              ) : (
                <a className="button button-primary" href="#temas">
                  Escolher um tema <ArrowRight aria-hidden="true" size={18} />
                </a>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
