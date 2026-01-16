import React, { useCallback, useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  targetX: number;
  targetY: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

interface BatchUploadAnimationsProps {
  isActive: boolean;
  onComplete: boolean;
  sourceRef: React.RefObject<HTMLElement>;
  targetRef: React.RefObject<HTMLElement>;
}

export const BatchUploadAnimations: React.FC<BatchUploadAnimationsProps> = ({
  isActive,
  onComplete,
  sourceRef,
  targetRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number>();

  const createParticle = useCallback(() => {
    if (!sourceRef.current || !targetRef.current) return;
    
    const sourceRect = sourceRef.current.getBoundingClientRect();
    const targetRect = targetRef.current.getBoundingClientRect();
    
    const colors = ['#22C55E', '#3B82F6', '#FBBF24', '#EF4444', '#8B5CF6'];
    
    particlesRef.current.push({
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      life: 1,
      targetX: targetRect.left + Math.random() * targetRect.width,
      targetY: targetRect.top + targetRect.height / 2
    });
  }, [sourceRef, targetRef]);

  const createConfetti = useCallback(() => {
    const colors = ['#22C55E', '#3B82F6', '#FBBF24', '#EF4444', '#A855F7', '#EC4899'];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    for (let i = 0; i < 100; i++) {
      confettiRef.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      p.x += dx * 0.05 + p.vx;
      p.y += dy * 0.05 + p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= 0.01;

      if (p.life > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Update and draw confetti
    confettiRef.current = confettiRef.current.filter(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.3; // gravity
      c.rotation += c.rotationSpeed;
      c.life -= 0.01;

      if (c.life > 0) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = c.life;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size / 2);
        ctx.restore();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    animate();
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    if (isActive && sourceRef.current && targetRef.current) {
      const interval = setInterval(createParticle, 50);
      return () => clearInterval(interval);
    }
  }, [isActive, createParticle, sourceRef, targetRef]);

  useEffect(() => {
    if (onComplete) {
      createConfetti();
    }
  }, [onComplete, createConfetti]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
