import { useEffect, useRef, useState, type ReactNode } from 'react';

export type ChartSize = {
  width: number;
  height: number;
};

type AdminChartFrameProps = {
  children: (size: ChartSize) => ReactNode;
};

export default function AdminChartFrame({ children }: AdminChartFrameProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-[240px] w-full min-w-0 md:h-[300px]">
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
