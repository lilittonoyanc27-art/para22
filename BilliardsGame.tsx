import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Play, ArrowRight, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { VerbQuestion, REGULAR_VERBS, PedroMood } from './types';
import DonPedro from './DonPedro';

interface BilliardsGameProps {
  onGameComplete: (score: number) => void;
  onUpdateGlobalStats: (scoreDelta: number) => void;
}

interface BilliardBall {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  type: 'cue' | 'haber' | 'participle' | 'incorrect';
  isCorrect: boolean;
  pocketed: boolean;
  isHit: boolean;
}

export default function BilliardsGame({ onGameComplete, onUpdateGlobalStats }: BilliardsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'evaluating' | 'result' | 'gameover'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<VerbQuestion>(REGULAR_VERBS[1]);
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('¡Hola! En el billar, apunta el taco a las conjugaciones correctas.');
  const [score, setScore] = useState<number>(0);

  // Billiard state
  const [aimAngle, setAimAngle] = useState<number>(0); // radians
  const [aimPower, setAimPower] = useState<number>(0); // 0 to 100
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Sequenced grammar checklist
  const [hitHaber, setHitHaber] = useState<boolean>(false);
  const [hitParticiple, setHitParticiple] = useState<boolean>(false);

  const ballsRef = useRef<BilliardBall[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[]>([]);

  // Selected questions for this session
  const [gameQuestions, setGameQuestions] = useState<VerbQuestion[]>([]);

  useEffect(() => {
    // Pick 5 random ones
    const shuffled = [...REGULAR_VERBS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 5));
    setCurrentQuestion(shuffled[0]);
  }, []);

  const initTable = (question: VerbQuestion) => {
    const tableWidth = 600;
    const tableHeight = 350;

    // Reset hit flags
    setHitHaber(false);
    setHitParticiple(false);

    // Position of cue ball near the bottom-left head string
    const cueBall: BilliardBall = {
      id: 'cue',
      x: 140,
      y: tableHeight / 2,
      vx: 0,
      vy: 0,
      radius: 23, // Larger, more visible cue ball
      color: '#f8fafc',
      label: 'CUE',
      type: 'cue',
      isCorrect: false,
      pocketed: false,
      isHit: false
    };

    // Correct components
    const corrH = question.correctHaber;
    const corrP = question.correctParticiple;

    // Grab incorrect candidates
    const incH = question.optionsHaber.filter(h => h !== corrH);
    const incP = question.optionsParticiple.filter(p => p !== corrP);

    // Put alternative auxiliary / participle options
    const targetBalls: BilliardBall[] = [];

    // Correct Haber Ball
    targetBalls.push({
      id: 'haber-correct',
      x: 370,
      y: 90,
      vx: 0,
      vy: 0,
      radius: 27, // Much larger and highly visible on mobile
      color: '#eab308', // Amber yellow for auxiliary verb
      label: corrH,
      type: 'haber',
      isCorrect: true,
      pocketed: false,
      isHit: false
    });

    // Correct Participle Ball
    targetBalls.push({
      id: 'participle-correct',
      x: 470,
      y: tableHeight / 2,
      vx: 0,
      vy: 0,
      radius: 27, // Much larger and highly visible on mobile
      color: '#ec4899', // Pink for target participle
      label: corrP,
      type: 'participle',
      isCorrect: true,
      pocketed: false,
      isHit: false
    });

    // Place some incorrect ones for grammar defense
    const badOptions = [
      { label: incH[0] || 'ha', y: 260, type: 'haber' as const },
      { label: incP[0] || 'comiendo', y: 75, type: 'participle' as const },
      { label: incP[1] || 'comado', y: 275, type: 'participle' as const }
    ];

    badOptions.forEach((bo, idx) => {
      targetBalls.push({
        id: `inc-${idx}`,
        x: 420 + idx * 50,
        y: bo.y,
        vx: 0,
        vy: 0,
        radius: 27, // Much larger and highly visible on mobile
        color: '#dc2626', // Red for dangerous wrong options
        label: bo.label,
        type: 'incorrect',
        isCorrect: false,
        pocketed: false,
        isHit: false
      });
    });

    ballsRef.current = [cueBall, ...targetBalls];
  };

  const startRound = (roundIdx: number) => {
    if (roundIdx >= 5) {
      setGameState('gameover');
      onGameComplete(score);
      return;
    }
    setCurrentRound(roundIdx);
    const q = gameQuestions[roundIdx];
    setCurrentQuestion(q);
    setPedroMood('neutral');
    setPedroText(`¡Ronda ${roundIdx + 1} de 5!: "${q.subject} ___ ___ (${q.verb})". ¡Dispara la bola blanca a la bola "${q.correctHaber}" y luego a "${q.correctParticiple}"!`);
    initTable(q);
    setGameState('playing');
  };

  const playBilliards = () => {
    setScore(0);
    startRound(0);
  };

  // Drag cue to launch physics details
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas logical 600x350 coordinate space
    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 350 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (!cueBall) return;

    // Check distance to cue ball (wider click radius)
    const dist = Math.hypot(x - cueBall.x, y - cueBall.y);
    if (dist < 45) {
      setIsPressing(true);
      setDragStart({ x: cueBall.x, y: cueBall.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPressing || !dragStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 350 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Angle from cue ball to cursor
    const angle = Math.atan2(y - dragStart.y, x - dragStart.x);
    setAimAngle(angle + Math.PI); // opposite direction of pull

    const pullDist = Math.hypot(x - dragStart.x, y - dragStart.y);
    setAimPower(Math.min(100, pullDist * 0.8));
  };

  const handleMouseUp = () => {
    if (!isPressing) return;
    setIsPressing(false);

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (cueBall && aimPower > 5) {
      // Launch ball using aimAngle and amplitude
      const speed = aimPower * 0.15;
      cueBall.vx = Math.cos(aimAngle) * speed;
      cueBall.vy = Math.sin(aimAngle) * speed;

      setPedroMood('thinking');
      setPedroText("¡Buen tiro! Veamos el resultado de la colisión...");
    }
    setAimPower(0);
  };

  // Touch handlers for flawless mobile gameplay
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 350 / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (!cueBall) return;

    const dist = Math.hypot(x - cueBall.x, y - cueBall.y);
    if (dist < 50) { // wider tap target on mobile
      setIsPressing(true);
      setDragStart({ x: cueBall.x, y: cueBall.y });
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPressing || !dragStart || e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 350 / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const angle = Math.atan2(y - dragStart.y, x - dragStart.x);
    setAimAngle(angle + Math.PI);

    const pullDist = Math.hypot(x - dragStart.x, y - dragStart.y);
    setAimPower(Math.min(100, pullDist * 0.8));
    if (e.cancelable) e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleMouseUp();
  };

  // Billiard rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    const height = 350;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    // We let CSS handle responsive layout size perfectly on mobile
    ctx.scale(dpr, dpr);

    const cushionLimit = 18;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Table Wood Border Cushion (3D-bevel effect)
      ctx.fillStyle = '#451a03'; // rich brown mahogany wood
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      // Table Felt Green Body
      ctx.fillStyle = '#065f46'; // dark green emerald billiard felt
      ctx.beginPath();
      ctx.roundRect(cushionLimit, cushionLimit, width - cushionLimit * 2, height - cushionLimit * 2, 8);
      ctx.fill();

      // Draw shiny table diamonds / markers
      ctx.fillStyle = '#e2e8f0';
      const diamondsY = [cushionLimit / 2, height - cushionLimit / 2];
      const diamondsX = [cushionLimit / 2, width - cushionLimit / 2];

      // Top and bottom row diamonds
      for (let x = 100; x < width - 50; x += 100) {
        diamondsY.forEach((y) => {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // Left and right column diamonds
      for (let y = 80; y < height - 50; y += 80) {
        diamondsX.forEach((x) => {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw six pockets
      const pockets = [
        { x: cushionLimit, y: cushionLimit },
        { x: width / 2, y: cushionLimit - 4 },
        { x: width - cushionLimit, y: cushionLimit },
        { x: cushionLimit, y: height - cushionLimit },
        { x: width / 2, y: height - cushionLimit + 4 },
        { x: width - cushionLimit, y: height - cushionLimit }
      ];

      ctx.fillStyle = '#0f172a'; // black pockets
      pockets.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); // enlarged from 18 to visually contain the larger balls
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // 2. Physics & Motion loop
      const balls = ballsRef.current;
      let someBallIsMoving = false;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (b.pocketed) continue;

        // Apply friction
        b.vx *= 0.985;
        b.vy *= 0.985;

        // Clip velocity to stop
        if (Math.hypot(b.vx, b.vy) < 0.05) {
          b.vx = 0;
          b.vy = 0;
        } else {
          someBallIsMoving = true;
        }

        // Apply position displacement
        b.x += b.vx;
        b.y += b.vy;

        // Pocket sensor check with threshold scaled to larger ball sizes
        for (let pIdx = 0; pIdx < pockets.length; pIdx++) {
          const pocket = pockets[pIdx];
          const distToPocket = Math.hypot(b.x - pocket.x, b.y - pocket.y);
          if (distToPocket < 24) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;

            // Handle what happens when a ball is pocketed!
            if (b.type === 'cue') {
              // Scratch! Reset cue ball
              setTimeout(() => {
                b.x = 140;
                b.y = height / 2;
                b.pocketed = false;
              }, 1000);
              setPedroMood('sad');
              setPedroText("¡Caramba! ¡Metiste la bola blanca! Intentemos de nuevo con la bola en la mesa.");
            } else if (b.type === 'haber') {
              if (b.isCorrect) {
                setHitHaber(true);
                setPedroMood('happy');
                setPedroText(`¡Excelente! Embolsaste el auxiliar "${b.label}". ¡Ahora falta el participio!`);
                // Spawn sparkles
                generateSparkles(b.x, b.y, '#eab308');
              } else {
                setPedroMood('sad');
                setPedroText(`¡Fallo de puntería! Metiste una forma incorrecta de haber.`);
              }
            } else if (b.type === 'participle') {
              if (b.isCorrect) {
                setHitParticiple(true);
                setPedroMood('cheering');
                setPedroText(`¡Espectacular disparo! "${b.label}" ha entrado. ¡Pretérito Perfecto completado!`);
                generateSparkles(b.x, b.y, '#ec4899');
              }
            } else if (b.type === 'incorrect') {
              setPedroMood('sad');
              setPedroText(`¡Ay! Esa es una trampa. "${b.label}" no se conjuga así.`);
            }
          }
        }

        // Dynamic cushion boundaries matching ball sizes
        const bMinX = cushionLimit + b.radius;
        const bMaxX = width - cushionLimit - b.radius;
        const bMinY = cushionLimit + b.radius;
        const bMaxY = height - cushionLimit - b.radius;

        // Cushion Bounces
        if (b.x < bMinX) { b.x = bMinX; b.vx = -b.vx * 0.8; }
        if (b.x > bMaxX) { b.x = bMaxX; b.vx = -b.vx * 0.8; }
        if (b.y < bMinY) { b.y = bMinY; b.vy = -b.vy * 0.8; }
        if (b.y > bMaxY) { b.y = bMaxY; b.vy = -b.vy * 0.8; }
      }

      // 3. Elastic Ball-to-Ball circular collisions (elastic collision response)
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];

          if (b1.pocketed || b2.pocketed) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist) {
            // Overlap resolution
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            b1.x -= nx * (overlap / 2);
            b1.y -= ny * (overlap / 2);
            b2.x += nx * (overlap / 2);
            b2.y += ny * (overlap / 2);

            // Elastic Collision velocities
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = nx * kx + ny * ky;

            // Simple mass-equal bounce
            if (p > 0) {
              b1.vx -= p * nx;
              b1.vy -= p * ny;
              b2.vx += p * nx;
              b2.vy += p * ny;
            }

            // Gameplay trigger on direct cue-ball collision
            if (b1.type === 'cue' || b2.type === 'cue') {
              const target = b1.type === 'cue' ? b2 : b1;
              target.isHit = true;

              if (target.type === 'haber' && target.isCorrect && !hitHaber) {
                setHitHaber(true);
                setPedroMood('happy');
                setPedroText(`¡Estupendo choque en "${target.label}"! ¡Ahora golpea el participio pasad!`);
                generateSparkles(target.x, target.y, '#eab308');
              } else if (target.type === 'participle' && target.isCorrect && hitHaber) {
                setHitParticiple(true);
                setPedroMood('cheering');
                setPedroText(`¡Felicidades! Lograste golpear "${target.label}". ¡Fórmula resuelta con carambola!`);
                generateSparkles(target.x, target.y, '#ec4899');
              } else if (target.type === 'incorrect') {
                setPedroMood('thinking');
                setPedroText(`¡Uf! La bola rosa tocó un fallo: "${target.label}". ¡Apúntale a lo correcto!`);
              }
            }
          }
        }
      }

      // 4. Evaluate Success of shooting run
      if (!someBallIsMoving && gameState === 'playing') {
        const cueB = balls.find(b => b.type === 'cue');
        if (cueB && Math.hypot(cueB.vx, cueB.vy) === 0) {
          // Check if both parts of Pretérito Perfecto were hit/solved
          if (hitHaber && hitParticiple) {
            setGameState('evaluating');
            setTimeout(() => {
              setScore((prev) => prev + 100);
              onUpdateGlobalStats(100);
              setGameState('result');
            }, 800);
          }
        }
      }

      // 5. Draw Aiming Pool Stick (Queue)
      if (gameState === 'playing' && isPressing) {
        const cueBall = balls.find(b => b.type === 'cue');
        if (cueBall) {
          // Drawing cue stick backed up from cue ball
          const stickLength = 140;
          const stickOffset = 25 + aimPower * 0.4; // back drag offset

          ctx.save();
          ctx.translate(cueBall.x, cueBall.y);
          ctx.rotate(aimAngle + Math.PI); // facing cue ball

          // Cue line guide
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-100, 0);
          ctx.lineTo(-cushionLimit, 0);
          ctx.stroke();

          // Stick body
          ctx.fillStyle = '#78350f'; // wood body
          ctx.beginPath();
          ctx.moveTo(stickOffset, -3);
          ctx.lineTo(stickOffset + stickLength, -5);
          ctx.lineTo(stickOffset + stickLength, 5);
          ctx.lineTo(stickOffset, 3);
          ctx.closePath();
          ctx.fill();

          // Ivory white joint tip on pool stick
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(stickOffset, -3, 8, 6);

          // Black bumper tip
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(stickOffset, -2, 2.5, 4);

          ctx.restore();
        }
      }

      // 6. Draw Balls
      balls.forEach((b) => {
        if (b.pocketed) return;

        // Shadow 3D projection offset
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(b.x + 3, b.y + 4, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Shiny gradient ball body
        const grad = ctx.createRadialGradient(
          b.x - b.radius * 0.3,
          b.y - b.radius * 0.3,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, b.color);
        grad.addColorStop(1, '#000000'); // dark underside

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // High gloss light reflect highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        if (b.type !== 'cue') {
          // White circle background tag for pool number
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.76, 0, Math.PI * 2);
          ctx.fill();

          // Conjugation Text label inside ball - fully auto-scaled for complete readability inside bounds
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const maxTextWidth = b.radius * 1.48; // slightly wider bounds for extra large text
          let fontSize = 17.5; // Bold and very readable base font size
          ctx.font = `black ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          const textMetrics = ctx.measureText(b.label);
          if (textMetrics.width > maxTextWidth) {
            fontSize = fontSize * (maxTextWidth / textMetrics.width);
            ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          }
          ctx.fillText(b.label, b.x, b.y);
        }
      });

      // 7. Update particles
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, hitHaber, hitParticiple, isPressing, aimAngle, aimPower, score]);

  const generateSparkles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto" id="billiards-game-panel">
      {/* Table ribbon header */}
      <div className="bg-gradient-to-r from-teal-700 to-green-600 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-teal-800">
        <div>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-emerald-100">
            MINI-JUEGO 2 / 3D PHYSICS
          </span>
          <h2 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
            El Billar del Pretérito (3D Billiards)
          </h2>
          <p className="text-sm text-teal-50 text-light mt-0.5">
            ¡Dispara el taco de billar y golpea los componentes correctos de la fórmula gramatical!
          </p>
        </div>
        <div className="flex gap-4 items-center bg-black/20 px-4 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">RONDA</p>
            <p className="text-lg font-black">{gameState === 'intro' ? '0' : currentRound + 1}/5</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20"></div>
          <div className="text-center">
            <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">SCORE</p>
            <p className="text-lg font-black text-yellow-300">{score}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <DonPedro mood={pedroMood} customText={pedroText} />
      </div>

      {/* Billiard checklist state banner */}
      {gameState !== 'intro' && gameState !== 'gameover' && (
        <div className="bg-emerald-50 dark:bg-slate-950 border-b border-emerald-150 px-6 py-2.5 flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px] text-white ${hitHaber ? 'bg-amber-500 border-amber-600' : 'bg-slate-250 border-slate-355'}`}>
              {hitHaber && '✓'}
            </div>
            <span className={hitHaber ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-400'}>
              1. {currentQuestion.correctHaber}
            </span>
          </div>
          <div className="text-slate-300">→</div>
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px] text-white ${hitParticiple ? 'bg-pink-500 border-pink-600' : 'bg-slate-200 border-slate-300'}`}>
              {hitParticiple && '✓'}
            </div>
            <span className={hitParticiple ? 'text-pink-600 dark:text-pink-400 font-extrabold' : 'text-slate-400'}>
              2. {currentQuestion.correctParticiple}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-6">
        {/* Table Canvas Column */}
        <div className="lg:col-span-8 flex flex-col items-center w-full">
          <div className="relative w-full border-4 border-slate-800 dark:border-slate-850 rounded-3xl overflow-hidden bg-slate-950 shadow-md">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="block w-full aspect-[600/350] max-h-[350px] cursor-crosshair"
              id="billiards-canvas"
            />

            {/* Cue aiming tutorial overlay in-play overlay */}
            {gameState === 'playing' && !hitHaber && !isPressing && (
              <div className="absolute top-4 left-6 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[11px] pointer-events-none flex items-center gap-2 border border-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Arrastra hacia atrás desde la bola blanca para apuntar y soltar.</span>
              </div>
            )}

            {/* Round end celebrate overlay */}
            <AnimatePresence>
              {gameState === 'result' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-teal-950/90 backdrop-blur-sm p-4 text-center"
                  id="billiards-success-overlay"
                >
                  <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-300 mb-1 sm:mb-2 animate-bounce" />
                  <h1 className="text-2xl sm:text-4xl font-black text-yellow-300 tracking-wider uppercase">
                    ¡CARAMBOLA PERFECTA!
                  </h1>
                  <p className="text-white text-sm sm:text-md mt-1 max-w-xs font-black">
                    {currentQuestion.subject} {currentQuestion.fullAnswer}
                  </p>
                  <p className="text-emerald-200 text-xs italic mt-0.5">
                    "{currentQuestion.englishSentence}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Informative Side Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {gameState === 'intro' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="billiards-intro"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    🎱 El Billar del Pretérito
                  </h3>
                  <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      Bienvenido al torneo oficial de billar de Don Pedro. Aquí, las bolas de billar tienen componentes verbales.
                    </p>
                    <p className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-150 text-emerald-800 dark:text-emerald-300 font-medium">
                      <strong>Tu Misión:</strong> Golpear consecutivamente primero la bola amarilla que contenga el auxiliar <strong>haber</strong>, y luego la bola rosa con el <strong>participio</strong> correcto.
                    </p>
                    <p className="text-red-650 flex items-center gap-1 font-semibold dark:text-red-400">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      ¡Evita las bolas rojas tramposas con conjugaciones erróneas!
                    </p>
                  </div>
                </div>

                <button
                  onClick={playBilliards}
                  className="w-full mt-6 bg-gradient-to-r from-teal-700 to-green-600 text-white font-black py-3 px-5 rounded-xl transform transition-transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                  id="start-billiards-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>EMPEZAR PARTIDA BILLAR</span>
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-350 dark:border-slate-850 p-5 rounded-2xl h-full flex flex-col items-center justify-center text-center"
                id="billiards-gameover"
              >
                <h3 className="text-xl font-black text-slate-850 dark:text-slate-100">
                  Torneo Concluido!
                </h3>
                <p className="text-slate-450 text-xs mt-2">
                  Has vaciado la mesa de billar gramatical de Don Pedro.
                </p>
                <div className="my-4 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PUNTUACIÓN</p>
                  <p className="text-3xl font-black text-emerald-600">{score} PTS</p>
                </div>
                <button
                  onClick={playBilliards}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                  id="retry-billiards-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Jugar de Nuevo</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="billiards-running-panel"
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    RETO DE CONJUGACIÓN (RONDA {currentRound + 1}/5)
                  </h4>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150">
                    <p className="text-slate-400 text-[11px] font-bold">SUJETO Y VERBO:</p>
                    <p className="text-md font-bold text-slate-800 dark:text-slate-200">
                      {currentQuestion.subject} + <span className="text-teal-600 uppercase font-black">{currentQuestion.verb}</span>
                    </p>
                    <p className="text-xs text-slate-400 italic mt-1 font-medium">"{currentQuestion.englishSentence}"</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-500">BOLAS EN EL TAPETE:</p>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-1">
                      <p className="flex justify-between">
                        <span className="text-amber-600 font-extrabold">• Auxiliar Haber:</span>
                        <span className="font-mono font-bold">"{currentQuestion.correctHaber}"</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-pink-600 font-extrabold">• Participio:</span>
                        <span className="font-mono font-bold">"{currentQuestion.correctParticiple}"</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {gameState === 'result' ? (
                    <button
                      onClick={() => startRound(currentRound + 1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                      id="next-billiards-round"
                    >
                      <span>Siguiente Reto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-450 font-bold uppercase tracking-wider animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span>Simulador de Colisión Activo</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
