import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  oscillation: number;
  oscillationSpeed: number;
  fadeDirection: number;
  fadeSpeed: number;
}

export const useParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const isVisible = useRef(true);
  const lastTime = useRef<number>(0);

  // Dynamic particle count based on screen size and device performance
  const getOptimalParticleCount = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenSize = width * height;
    const baseCount = Math.floor(screenSize / 15000);
    return Math.max(10, baseCount);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Optimization: Pre-calculate values
    const TWO_PI = Math.PI * 2;
    const particleCount = getOptimalParticleCount();

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }, 250);
    };

    // Initialize particles with more natural properties
    const initParticles = () => {
      const rect = canvas.getBoundingClientRect();
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 1.5 + 0.5, // Smaller size range
        speedX: (Math.random() - 0.5) * 0.05, // Slower movement
        speedY: (Math.random() - 0.5) * 0.01 - 0.015, // Slight upward drift
        opacity: Math.random() * 0.15 + 0.05, // Lower opacity
        oscillation: Math.random() * TWO_PI, // Random start phase
        oscillationSpeed: Math.random() * 0.001 + 0.0005, // Very slow oscillation
        fadeDirection: Math.random() < 0.5 ? 1 : -1, // Random fade direction
        fadeSpeed: Math.random() * 0.0001 + 0.0002, // Very slow fade
      }));
    };

    // More efficient animation loop with delta time
    const animate = (currentTime: number) => {
      if (!ctx || !isVisible.current) return;

      const deltaTime = currentTime - lastTime.current;
      lastTime.current = currentTime;

      // Skip frame if delta is too high (tab was inactive)
      if (deltaTime > 50) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();

      // Update and draw particles
      particles.current.forEach((p) => {
        // Update position with delta time
        p.x += p.speedX * deltaTime;
        p.y += p.speedY * deltaTime;
        p.oscillation += p.oscillationSpeed * deltaTime;

        // Natural fade effect
        p.opacity += p.fadeSpeed * p.fadeDirection;
        if (p.opacity > 0.2) {
          p.fadeDirection = -1;
        } else if (p.opacity < 0.05) {
          p.fadeDirection = 1;
        }

        // Slight horizontal oscillation
        const oscillationOffset = Math.sin(p.oscillation) * 0.1;
        const drawX = p.x + oscillationOffset;

        // Screen wrapping with smooth transition
        if (drawX < -p.size) p.x = rect.width + p.size;
        if (drawX > rect.width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = rect.height + p.size;
        if (p.y > rect.height + p.size) p.y = -p.size;

        // Draw with slight blur for more natural look
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(drawX, p.y, 0, drawX, p.y, p.size);
        gradient.addColorStop(0, `rgba(200, 200, 200, ${p.opacity})`);
        gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(drawX, p.y, p.size, 0, TWO_PI);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Performance-aware visibility handling
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
      if (isVisible.current) {
        lastTime.current = performance.now();
        animate(performance.now());
      } else if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    // Initialize with requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        handleResize();
        initParticles();
        lastTime.current = performance.now();
        animate(performance.now());
      });
    } else {
      handleResize();
      initParticles();
      lastTime.current = performance.now();
      animate(performance.now());
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return canvasRef;
};
