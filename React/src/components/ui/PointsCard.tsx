import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

type Props = {
  points: number;
  label: string;
  onDone: () => void;
};

export default function PointsCard({ points, label, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}>
      <div className="flex items-center gap-3 bg-secondary text-white px-5 py-3 rounded-2xl shadow-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]">
          <StarIcon className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <p className="font-extrabold text-sm">{label}</p>
          <p className="text-xs text-white/70">+{points} points earned</p>
        </div>
      </div>
    </div>
  );
}