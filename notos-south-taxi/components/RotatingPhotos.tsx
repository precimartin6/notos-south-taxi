'use client';

import { useEffect, useState } from 'react';

interface Props {
  images: string[];
  alt: string;
  /** ms between rotations */
  interval?: number;
  /** ms staggered delay so cards don't all flip together */
  startDelay?: number;
}

/**
 * Crossfading photo rotator. Pre-loads all images so the transition is smooth,
 * then advances `current` on a timer. Pauses when the tab is hidden.
 */
export default function RotatingPhotos({
  images,
  alt,
  interval = 4000,
  startDelay = 0
}: Props) {
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  // Preload all images so the crossfade actually fades
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (loaded === images.length && !cancelled) setReady(true);
      };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [images]);

  // Rotate
  useEffect(() => {
    if (!ready || images.length < 2) return;
    let timer: ReturnType<typeof setTimeout>;
    let interv: ReturnType<typeof setInterval>;
    timer = setTimeout(() => {
      interv = setInterval(() => {
        if (document.hidden) return;
        setCurrent((c) => (c + 1) % images.length);
      }, interval);
    }, startDelay);
    return () => { clearTimeout(timer); clearInterval(interv); };
  }, [ready, images.length, interval, startDelay]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {images.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== current}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      {/* SR-only alt text for accessibility */}
      <span className="sr-only">{alt}</span>
    </div>
  );
}
