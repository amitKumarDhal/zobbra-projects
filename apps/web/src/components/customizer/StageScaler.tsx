'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StageScalerProps {
  /** Natural (unscaled) width of the stage in CSS px. */
  baseWidth: number;
  /** Natural (unscaled) height of the stage in CSS px. */
  baseHeight: number;
  maxScale?: number;
  minScale?: number;
  children: React.ReactNode;
}

/**
 * Fits a fixed-size stage (mockup + Fabric canvas) into whatever space the layout gives it by
 * scaling the whole stage uniformly with a CSS transform. Fabric's internal coordinates are
 * untouched; its pointer math already corrects for CSS scaling via getBoundingClientRect.
 */
export function StageScaler({
  baseWidth,
  baseHeight,
  maxScale = 1.15,
  minScale = 0.3,
  children,
}: StageScalerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const next = Math.max(minScale, Math.min(w / baseWidth, h / baseHeight, maxScale));
      setScale((prev) => (Math.abs(prev - next) < 0.005 ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [baseWidth, baseHeight, maxScale, minScale]);

  return (
    <div ref={hostRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0"
        style={{ width: baseWidth * scale, height: baseHeight * scale }}
      >
        <div
          style={{
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
