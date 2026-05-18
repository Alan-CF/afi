import { useState, useEffect } from "react";
import PointsToast from "./PointsToast";

export default function PointsToastGlobal() {
  const [toast, setToast] = useState<{
    points: number;
    label: string;
    description: string;
    eventKey: string;
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { points, label, description, eventKey } = (e as CustomEvent).detail;
      setToast({ points, label, description, eventKey });
    };
    window.addEventListener("points-earned", handler);
    return () => window.removeEventListener("points-earned", handler);
  }, []);

  if (!toast) return null;

  return (
    <PointsToast
      points={toast.points}
      label={toast.label}
      description={toast.description}
      eventKey={toast.eventKey}
      onDone={() => setToast(null)}
    />
  );
}