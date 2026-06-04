import { useRef } from 'react';

type ThrowVelocity = {
  x: number;
  y: number;
  z: number;
};

type Props = {
  enabled: boolean;
  onThrow: (velocity: ThrowVelocity) => void;
};

export function useThrowGesture({ enabled, onThrow }: Props) {
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    if (!enabled) return;

    event.preventDefault();

    startPoint.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!enabled || !startPoint.current) return;

    event.preventDefault();

    const deltaX = event.clientX - startPoint.current.x;
    const deltaY = startPoint.current.y - event.clientY;

    startPoint.current = null;

    if (deltaY < 25) return;

    const swipePower = Math.min(Math.max(deltaY / 250, 0.35), 1.8);
    const sidePower = Math.max(Math.min(deltaX / 300, 1), -1);

    onThrow({
        x: sidePower * 0.095,
        y: 0.09 + swipePower * 0.045,
        z: -0.035 - swipePower * 0.045,
        });
  };

  return {
    onPointerDown,
    onPointerUp,
  };
}