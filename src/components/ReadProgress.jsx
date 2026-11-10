import { useState, useEffect } from 'react';

export default function ReadProgress() {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    let queued = false;

    const paint = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScale(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      queued = false;
    };

    const handleScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(paint);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', paint);
    paint();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', paint);
    };
  }, []);

  return (
    <div className="read-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${scale})` }} />
    </div>
  );
}
