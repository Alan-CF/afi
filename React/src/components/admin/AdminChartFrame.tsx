import { useEffect, useRef, useState, type ReactNode } from 'react';

type AdminChartFrameProps = {
  children: ReactNode;
};

export default function AdminChartFrame({ children }: AdminChartFrameProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-[240px] w-full min-w-0 md:h-[300px]">
      {ready ? children : null}
    </div>
  );
}
