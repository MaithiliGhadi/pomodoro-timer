import { useEffect, useRef } from 'react';
import createStarkWorkspace from '../effects/stark';

const EFFECTS = {
  stark: createStarkWorkspace,
};

export default function Background({ effect = 'stark', enabled = true }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const createEffect = EFFECTS[effect];
    if (!createEffect) return undefined;

    let animationFrame = 0;
    let destroyed = false;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const getSize = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = getSize();
      canvas.width = Math.floor(size.width * dpr);
      canvas.height = Math.floor(size.height * dpr);
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engineRef.current?.resize(size);
    };

    const toCanvasPoint = (event) => ({
      x: event.clientX,
      y: event.clientY,
    });

    const engine = createEffect(ctx, getSize(), {
      reducedMotion,
      enableAudio: true,
      showHoloHUD: true,
      enableDume: true,
    });
    engineRef.current = engine;

    const handlePointerMove = (event) => {
      const point = toCanvasPoint(event);
      engine.onPointerMove?.(point.x, point.y);
    };

    const handlePointerDown = (event) => {
      const point = toCanvasPoint(event);
      engine.onPointerDown?.(point.x, point.y);
    };

    const handlePointerUp = () => engine.onPointerUp?.();

    const render = (time) => {
      if (destroyed) return;
      engine.update?.(time);
      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    animationFrame = requestAnimationFrame(render);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      engine.destroy?.();
      engineRef.current = null;
    };
  }, [effect, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="interactive-background"
      aria-hidden="true"
    />
  );
}
