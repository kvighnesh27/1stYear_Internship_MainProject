"use client";

import { useEffect, useRef } from "react";

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    const stars = Array.from({ length: 170 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      vx: (Math.random() - 0.5) * 0.08,
      vy: Math.random() * 0.18 + 0.02
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const draw = () => {
      frame += 1;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(4, 8, 15, 0.42)";
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.y += star.vy / height;
        star.x += star.vx / width;
        if (star.y > 1.03) star.y = -0.03;
        if (star.x > 1.03) star.x = -0.03;
        if (star.x < -0.03) star.x = 1.03;

        const pulse = 0.45 + Math.sin(frame * 0.02 + star.x * 8) * 0.35;
        context.beginPath();
        context.fillStyle = `rgba(125, 211, 252, ${0.22 + pulse * 0.38})`;
        context.arc(star.x * width, star.y * height, star.z * 1.7, 0, Math.PI * 2);
        context.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 -z-30" aria-hidden />
      <div className="cyber-grid fixed inset-0 -z-20 opacity-70" aria-hidden />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,0.12),transparent_34rem)]" aria-hidden />
    </>
  );
}
