"use client";

import { useEffect, useRef } from "react";

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const colors = [
      "#ff5722",
      "#ff7a00",
      "#ffaa00",
      "#2e7d32",
      "#43a047",
      "#00c853",
      "#ff2a6d",
      "#9c27b0",
      "#673ab7",
      "#2196f3",
      "#00e5ff",
      "#ffd700",
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      oscillationSpeed: number;
      oscillationDistance: number;
      life: number;
      maxLife: number;
      shape: "rect" | "circle" | "star" | "diamond";
    }

    const particleCount = 140;
    const particles: Particle[] = [];

    // Dual-cannon burst from left and right center
    for (let i = 0; i < particleCount; i++) {
      const isLeft = i % 2 === 0;
      const angle = isLeft
        ? (Math.random() * 0.4 + 0.95) * -Math.PI // launches up and right
        : (Math.random() * 0.4 + 0.05) * -Math.PI; // launches up and left
      const speed = Math.random() * 16 + 8;
      const shapes: ("rect" | "circle" | "star" | "diamond")[] = [
        "rect",
        "rect",
        "circle",
        "star",
        "diamond",
      ];

      particles.push({
        x: isLeft ? width * 0.25 : width * 0.75,
        y: height * 0.55 + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 9 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 16,
        oscillationSpeed: Math.random() * 0.08 + 0.04,
        oscillationDistance: Math.random() * 4 + 1.5,
        life: 0,
        maxLife: Math.random() * 110 + 130,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let animId: number;
    const gravity = 0.24;
    const drag = 0.972;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let anyAlive = false;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        anyAlive = true;

        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx + Math.sin(p.life * p.oscillationSpeed) * p.oscillationDistance;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        const opacity = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.55);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          ctx.beginPath();
          const s = p.size * 0.9;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else if (p.shape === "diamond") {
          ctx.beginPath();
          const s = p.size * 0.8;
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.6, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (anyAlive) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      aria-hidden="true"
    />
  );
}
