import { useEffect, useState } from 'react';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'finished';

export function useBasketballGame() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCountdown(3);
    setStatus('countdown');
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCountdown(null);
    setStatus('idle');
  };

  const addPoint = () => {
    setScore((prev) => prev + 1);
  };

  useEffect(() => {
    if (status !== 'countdown' || countdown === null) return;

    if (countdown === 0) {
      setStatus('playing');
      setCountdown(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, countdown]);

  useEffect(() => {
    if (status !== 'playing') return;

    if (timeLeft <= 0) {
      setStatus('finished');
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, timeLeft]);

  return {
    score,
    timeLeft,
    countdown,
    status,
    startGame,
    resetGame,
    addPoint,
  };
}