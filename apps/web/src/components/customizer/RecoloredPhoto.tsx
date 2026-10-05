'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderRecolored, type RecolorSource } from '@/lib/photoRecolor';

interface RecoloredPhotoProps {
  source: RecolorSource;
  bodyHex?: string | null;
  trimHex?: string | null;
  alt: string;
  /** Applied to both the photo and the recoloured canvas so they occupy the same box. */
  className: string;
  imgDataCy?: string;
  onError?: () => void;
}

/**
 * The product photo recoloured through its masks. The plain photo shows until the first recolour
 * is ready (and stays if recolouring is impossible, e.g. a mask without CORS); later colour changes
 * repaint the canvas in place.
 */
export function RecoloredPhoto({ source, bodyHex, trimHex, alt, className, imgDataCy, onError }: RecoloredPhotoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState<{ body: string; trim: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    renderRecolored(source, bodyHex, trimHex)
      .then((out) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        canvas.width = out.width;
        canvas.height = out.height;
        canvas.getContext('2d')?.drawImage(out, 0, 0);
        setRendered({ body: bodyHex || '', trim: trimHex || '' });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[RecoloredPhoto] Recolouring unavailable; showing the plain photo.', err);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [source.base, source.bodyMask, source.trimMask, bodyHex, trimHex]);

  const ready = rendered !== null && !failed;
  return (
    <>
      <img
        src={source.base}
        alt={alt}
        crossOrigin="anonymous"
        data-cy={imgDataCy}
        draggable={false}
        onError={onError}
        className={`${className} ${ready ? 'invisible' : ''}`}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-cy="customizer-recolored-photo"
        data-state={failed ? 'failed' : ready ? 'ready' : 'loading'}
        data-rendered-body={rendered?.body ?? ''}
        data-rendered-trim={rendered?.trim ?? ''}
        className={`absolute inset-0 ${className} ${ready ? '' : 'invisible'}`}
      />
    </>
  );
}
