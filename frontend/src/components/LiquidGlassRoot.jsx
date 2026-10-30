import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LiquidGlass } from '@ybouane/liquidglass';

export default function LiquidGlassRoot({ children }) {
  const rootRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    let cancelled = false;
    let instance;

    async function startGlass() {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled || !rootRef.current) return;
      const glassElements = [...rootRef.current.querySelectorAll(':scope > [data-glass]')];
      if (!glassElements.length) return;
      try {
        const nextInstance = await LiquidGlass.init({ root: rootRef.current, glassElements });
        if (cancelled) nextInstance.destroy();
        else instance = nextInstance;
      } catch (error) {
        // CSS glass remains visible if WebGL is unavailable or initialization fails.
        console.warn('Liquid glass effect is unavailable; using CSS fallback.', error);
      }
    }

    startGlass();
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [pathname]);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  return (
    <div className="glass-root" ref={rootRef}>
      <div className="glass-backdrop" aria-hidden="true"><span /></div>
      {!isAuthPage && <Link className="glass-nav-pill" to="/" data-glass aria-label="TaskFlow workspace home">TaskFlow <span>Workspace</span></Link>}
      <div className="glass-app-content">{children}</div>
    </div>
  );
}
