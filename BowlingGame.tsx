import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, RotateCcw, Award, CheckCircle, HelpCircle } from 'lucide-react';
import { VerbQuestion, REGULAR_VERBS, PedroMood } from './types';
import DonPedro from './DonPedro';

interface BowlingGameProps {
  onGameComplete: (score: number) => void;
  onUpdateGlobalStats: (scoreDelta: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface Pin {
  x: number; // 3D-perspective coordinates (x: -1 to 1)
  y: number; // z-coord (0 is front, 1 is back at pins)
  radius: number;
  hit: boolean;
  angle: number;
  label: string;
  vx: number;
  vy: number;
}

export default function BowlingGame({ onGameComplete, onUpdateGlobalStats }: BowlingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'rolling' | 'result' | 'gameover'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<VerbQuestion>(REGULAR_VERBS[0]);
  const [selectedHaber, setSelectedHaber] = useState<string>('');
  const [selectedParticiple, setSelectedParticiple] = useState<string>('');
  const [answerEvaluated, setAnswerEvaluated] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('');
  const [score, setScore] = useState<number>(0);

  // Bowling game variables
  const [ballX, setBallX] = useState<number>(0); // -100 to 100 for lane width adjustment
  const [ballAngle, setBallAngle] = useState<number>(0); // spin/aim coefficient
  const pinsRef = useRef<Pin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Roll physics
  const rollDistRef = useRef<number>(0); // 0 at screen, 1 at pin line
  const pinsExplodedRef = useRef<boolean>(false);

  // Randomize questions for the game (5 rounds total)
  const [gameQuestions, setGameQuestions] = useState<VerbQuestion[]>([]);

  useEffect(() => {
    // Shuffle and pick 5 random questions
    const shuffled = [...REGULAR_VERBS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 5));
    setCurrentQuestion(shuffled[0]);
  }, []);

  // Initialize the pins on the 3D plane
  const initPins = () => {
    // Standard 10-pin triangle layout in 3D projection
    // Layer 1 (front): 1 pin
    // Layer 2: 2 pins
    // Layer 3: 3 pins
    // Layer 4 (back): 4 pins
    const pins: Pin[] = [];
    const pinLabels = ['he', 'has', 'ha', 'hemos', 'habéis', 'han', 'ado', 'ido', '+', 'PP'];
    
    // Pin layout positions relative to vanishing point
    const layouts = [
      { rx: 0, ry: 0.90 }, // Row 1

      { rx: -0.1, ry: 0.93 }, // Row 2
      { rx: 0.1, ry: 0.93 },

      { rx: -0.2, ry: 0.96 }, // Row 3
      { rx: 0, ry: 0.96 },
      { rx: 0.2, ry: 0.96 },

      { rx: -0.3, ry: 0.99 }, // Row 4
      { rx: -0.1, ry: 0.99 },
      { rx: 0.1, ry: 0.99 },
      { rx: 0.3, ry: 0.99 },
    ];

    layouts.forEach((pos, idx) => {
      pins.push({
        x: pos.rx,
        y: pos.ry,
        radius: 12,
        hit: false,
        angle: 0,
        label: pinLabels[idx] || 'V',
        vx: 0,
        vy: 0
      });
    });

    pinsRef.current = pins;
    pinsExplodedRef.current = false;
  };

  // Start a round
  const startRound = (roundIdx: number) => {
    if (roundIdx >= 5) {
      setGameState('gameover');
      onGameComplete(score);
      return;
    }
    setCurrentRound(roundIdx);
    setCurrentQuestion(gameQuestions[roundIdx]);
    setSelectedHaber('');
    setSelectedParticiple('');
    setAnswerEvaluated(false);
    setIsCorrect(false);
    setPedroMood('neutral');
    setPedroText(`¡Ronda ${roundIdx + 1} de 5! Completa la frase y lanza la bola.`);
    initPins();
    rollDistRef.current = 0;
    setGameState('playing');
  };

  // Trigger ball roll down the lane
  const launchBallRef = () => {
    // First, grade the expression
    const corrH = currentQuestion.correctHaber.toLowerCase().trim();
    const corrP = currentQuestion.correctParticiple.toLowerCase().trim();
    const isAnsCorrect =
      selectedHaber.toLowerCase().trim() === corrH &&
      selectedParticiple.toLowerCase().trim() === corrP;

    setIsCorrect(isAnsCorrect);
    setAnswerEvaluated(true);
    setGameState('rolling');
    rollDistRef.current = 0;

    if (isAnsCorrect) {
      setPedroMood('happy');
      setPedroText('¡Respuesta perfecta! ¡Se viene un súper tiro directo al centro!');
    } else {
      setPedroMood('thinking');
      setPedroText(`¡Cuidado! El auxiliar o participio tiene un fallo. ¡La bola se puede desviar!`);
    }
  };

  // Main Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high pixel density support
    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    const height = 400;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // vanPoint is the top horizon point of vanishing lanes
      const horizonY = 80;
      const vpX = width / 2;

      // 1. Draw Sky/Arena Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Wood neon ceiling lights
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(vpX - 80, horizonY - 15, 160, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(vpX - 100, horizonY - 25, 200, 3);

      // Draw scoreboard indicator in arena
      ctx.fillStyle = '#334155';
      ctx.fillRect(vpX - 120, 15, 240, 40);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vpX - 120, 15, 240, 40);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(vpX - 116, 18, 232, 34);

      // Scoreboard text - slightly larger for enhanced contrast and mobile legibility
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PEDRO'S LANES - ROUND ${currentRound + 1}/5`, vpX, 31);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`SCORE: ${score} PTS  |  ACCURACY: ${Math.round((score / Math.max(1, currentRound * 100)) * 100)}%`, vpX, 44);

      // 2. Draw 3D Bowling Lane (trapezoid layout)
      const laneBottomLeft = 40;
      const laneBottomRight = width - 40;
      const laneTopLeft = vpX - 60;
      const laneTopRight = vpX + 60;

      const laneGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      laneGrad.addColorStop(0, '#d97706'); // warm golden wood
      laneGrad.addColorStop(0.5, '#b45309');
      laneGrad.addColorStop(1, '#78350f'); // darker rich mahogany near player
      ctx.fillStyle = laneGrad;

      ctx.beginPath();
      ctx.moveTo(laneBottomLeft, height);
      ctx.lineTo(laneTopLeft, horizonY);
      ctx.lineTo(laneTopRight, horizonY);
      ctx.lineTo(laneBottomRight, height);
      ctx.closePath();
      ctx.fill();

      // Neon glowing gutters
      // Left gutter
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(laneBottomLeft, height);
      ctx.lineTo(laneTopLeft, horizonY);
      ctx.lineTo(laneTopLeft - 15, horizonY);
      ctx.closePath();
      ctx.fill();

      // Right gutter
      ctx.beginPath();
      ctx.moveTo(laneBottomRight, height);
      ctx.lineTo(width, height);
      ctx.lineTo(laneTopRight + 15, horizonY);
      ctx.lineTo(laneTopRight, horizonY);
      ctx.closePath();
      ctx.fill();

      // Glowing blue Neon rail lighting in gutters
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneTopLeft, horizonY);
      ctx.lineTo(laneBottomLeft, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(laneTopRight, horizonY);
      ctx.lineTo(laneBottomRight, height);
      ctx.stroke();

      // Lane Arrows & Plank guides
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      const numLines = 6;
      for (let i = 1; i < numLines; i++) {
        const ratio = i / numLines;
        const xBottom = laneBottomLeft + (laneBottomRight - laneBottomLeft) * ratio;
        const xTop = laneTopLeft + (laneTopRight - laneTopLeft) * ratio;
        ctx.beginPath();
        ctx.moveTo(xBottom, height);
        ctx.lineTo(xTop, horizonY);
        ctx.stroke();
      }

      // Lane dots/guide triangles in mid lane
      ctx.fillStyle = '#78350f';
      const arrowY = horizonY + 80;
      const arrowWidth = laneTopRight - laneTopLeft;
      for (let i = 1; i <= 3; i++) {
        const factor = i / 4;
        const ax = laneTopLeft + arrowWidth * factor;
        ctx.beginPath();
        ctx.arc(ax, arrowY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Pins
      pinsRef.current.forEach((pin) => {
        // Project 3D-perspective coordinate to 2D screen positions
        // pin.y is [0.9m to 1.0]. Convert pin.y [horizonY to height]
        const z = pin.y; // 0.8 to 1.0
        
        // Map pin.y [0.90 to 0.99] to a wider, closer visual projection (0.70 to 0.82) to make pins look closer and bigger
        const visualZ = 0.68 + (z - 0.90) * 1.4;
        const scale = 1 - visualZ; // closer to horizon means smaller
        
        // Width of lane at visualZ
        const laneWCurrent = (laneBottomRight - laneBottomLeft) * scale + (laneTopRight - laneTopLeft) * (1 - scale);
        
        // Center x position with enhanced horizontal spacing so that larger pins don't block each other
        const lx = vpX + pin.x * 1.65 * (laneWCurrent / 2);
        
        // Position them vertically further down the lane (closer to the ball strike point)
        const ly = horizonY + (height - horizonY) * (1 - scale) * 0.18;

        ctx.save();
        ctx.translate(lx, ly);
        
        // Scale up the entire pin coordinate drawing by 2.6 to make it huge and clean
        ctx.scale(2.6, 2.6);

        // Falling physics if hit
        if (pin.hit) {
          ctx.translate(pin.vx * 1.5, pin.vy * 1.5);
          ctx.rotate(pin.angle);
          ctx.globalAlpha = Math.max(0, 1 - pin.vy / 40);
        }

        // Pin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 8 * z, 3 * z, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pin body
        ctx.fillStyle = '#f8fafc'; // glossy white
        ctx.beginPath();
        ctx.moveTo(-5 * z, 10 * z);
        ctx.quadraticCurveTo(-15 * z, 0, -3 * z, -15 * z); // base belly
        ctx.lineTo(-2 * z, -28 * z); // neck
        ctx.quadraticCurveTo(0, -35 * z, 2 * z, -28 * z); // head cap
        ctx.lineTo(3 * z, -15 * z);
        ctx.quadraticCurveTo(15 * z, 0, 5 * z, 10 * z);
        ctx.closePath();
        ctx.fill();

        // Red stripes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-2.5 * z, -26 * z, 5 * z, 3 * z);
        ctx.fillRect(-3 * z, -19 * z, 6 * z, 2.5 * z);

        // Highlight/Gloss
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-1 * z, -29 * z, 1.5 * z, 0, Math.PI * 2);
        ctx.fill();

        // Pin text labels representing verb conjugation forms - auto-scaled to fit and remain fully within the boundaries of each bottle
        ctx.fillStyle = '#0f172a';
        const maxTextWidth = 14 * z; // Maximum allowed width in local coordinates to stay inside the bottle belly
        let fontSize = 6.8; // Base local font size which will automatically be scaled down if the text is wider
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        const textMetrics = ctx.measureText(pin.label);
        
        if (textMetrics.width > maxTextWidth) {
          fontSize = fontSize * (maxTextWidth / textMetrics.width);
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pin.label, 0, -1.5 * z);

        ctx.restore();
      });

      // 4. Update and Draw Bowling Ball
      if (gameState === 'rolling') {
        const dist = rollDistRef.current;
        // The roll speed
        rollDistRef.current += 0.015;

        // Path calculation
        // If wrong answer, the ball drifts to gutters based on error factor
        let offsetFactor = 0;
        if (!isCorrect) {
          // Gutter curve drift
          offsetFactor = (ballX > 0 ? 1 : -1) * 0.4 * Math.sin(dist * Math.PI);
        }
        
        // Calculate current ball position on 3D perspective
        const laneScale = 1 - dist; // 1 at player, 0.1 at pins
        const laneW = (laneBottomRight - laneBottomLeft) * laneScale + (laneTopRight - laneTopLeft) * (1 - laneScale);
        
        // Starting X is determined by ballX range [-100 to 100]
        const startingXFrac = ballX / 200; // [-0.5 to 0.5]
        // Adding curve steer
        const currentXFrac = startingXFrac + (ballAngle / 100) * dist * 0.8 + offsetFactor;

        const bx = vpX + currentXFrac * (laneW / 2);
        // Map y dist which ranges from 0 (bottom) to 1 (horizon pins)
        const by = height - (height - (horizonY + 30)) * dist;

        // Size scaling based on distance
        const ballSize = 35 * (1 - dist * 0.7);

        // Check if ball has hit the pins at the end line
        if (dist >= 0.88 && !pinsExplodedRef.current) {
          pinsExplodedRef.current = true;
          // Apply hit physics to pins
          pinsRef.current.forEach((pin, i) => {
            const pinDistanceX = Math.abs(pin.x - currentXFrac);
            if (isCorrect) {
              // STRIKE! All pins fly out
              pin.hit = true;
              pin.vx = (pin.x + (Math.random() - 0.5) * 0.5) * 20;
              pin.vy = -(6 + Math.random() * 12);
              pin.angle = (Math.random() - 0.5) * 4;
            } else {
              // Miss or partial hit (hits elements close to gutter, or just 1-2 elements)
              if (pinDistanceX < 0.25) {
                pin.hit = true;
                pin.vx = (pin.x + (Math.random() - 0.5) * 0.2) * 12;
                pin.vy = -(4 + Math.random() * 6);
                pin.angle = (Math.random() - 0.5) * 3;
              }
            }
          });

          // Add spectacular particle smoke sparks
          const colors = isCorrect ? ['#facc15', '#fbbf24', '#f59e0b', '#38bdf8', '#c084fc'] : ['#64748b', '#475569', '#334155'];
          const counts = isCorrect ? 40 : 10;
          for (let p = 0; p < counts; p++) {
            particlesRef.current.push({
              x: bx,
              y: by - 20,
              vx: (Math.random() - 0.5) * 14,
              vy: -(Math.random() * 8 + 2),
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 4 + 2,
              alpha: 1
            });
          }

          // Move state to evaluate result details
          setTimeout(() => {
            if (isCorrect) {
              setScore((prev) => prev + 100);
              setPedroMood('cheering');
              setPedroText('¡STRIKE SENSACIONAL! ¡Has arrollado las dudas! ¡100 puntos en el bolsillo!');
              onUpdateGlobalStats(100);
            } else {
              setPedroMood('sad');
              setPedroText(`¡Fallo de canal! La bola se desvió. Pedro te aconseja repasar: "${currentQuestion.subject} ${currentQuestion.fullAnswer}".`);
            }
            setGameState('result');
          }, 800);
        }

        // Draw Ball Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(bx, by + ballSize * 0.2, ballSize * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3D glossy Bowling Ball
        const ballGrad = ctx.createRadialGradient(
          bx - ballSize * 0.3,
          by - ballSize * 0.3,
          ballSize * 0.1,
          bx,
          by,
          ballSize
        );
        if (isCorrect) {
          ballGrad.addColorStop(0, '#f43f5e'); // fiery red
          ballGrad.addColorStop(0.7, '#be123c');
          ballGrad.addColorStop(1, '#881337');
        } else {
          ballGrad.addColorStop(0, '#64748b'); // cold steel gray for failure
          ballGrad.addColorStop(0.7, '#334155');
          ballGrad.addColorStop(1, '#0f172a');
        }
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(bx, by, ballSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3 finger holes for real bowling ball effect!
        ctx.fillStyle = '#0f172a';
        const holeSize = ballSize * 0.15;
        const hOffset = ballSize * 0.3;
        ctx.beginPath();
        ctx.arc(bx - hOffset * 0.4, by - hOffset * 0.5, holeSize, 0, Math.PI * 2);
        ctx.arc(bx + hOffset * 0.4, by - hOffset * 0.5, holeSize, 0, Math.PI * 2);
        ctx.arc(bx, by + hOffset * 0.2, holeSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw fire trial sparks if answer is correct
        if (isCorrect && Math.random() > 0.4) {
          particlesRef.current.push({
            x: bx + (Math.random() - 0.5) * 10,
            y: by + ballSize,
            vx: -ballAngle / 10 + (Math.random() - 0.5) * 2,
            vy: 4,
            color: '#facc15',
            size: Math.random() * 3,
            alpha: 0.9
          });
        }
      } else if (gameState === 'playing') {
        // Draw Stationary Ball at the base for positioning aim
        const bx = vpX + (ballX / 200) * (laneBottomRight - laneBottomLeft);
        const by = height - 50;
        const ballSize = 35;

        // Aim lines
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        // Project aim line line using ballAngle
        const aimX = bx + (ballAngle * 1.5);
        ctx.lineTo(aimX, horizonY + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive Ball Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(bx, by + 10, ballSize * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Interactive Ball Body
        const ballGrad = ctx.createRadialGradient(
          bx - ballSize * 0.3,
          by - ballSize * 0.3,
          ballSize * 0.1,
          bx,
          by,
          ballSize
        );
        ballGrad.addColorStop(0, '#facc15'); // vibrant Spanish gold
        ballGrad.addColorStop(0.7, '#d97706');
        ballGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(bx, by, ballSize, 0, Math.PI * 2);
        ctx.fill();

        // Finger holes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(bx - 5, by - 6, 4, 0, Math.PI * 2);
        ctx.arc(bx + 5, by - 6, 4, 0, Math.PI * 2);
        ctx.arc(bx, by + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Draw Exploding Particles / Confetti
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity effect
        p.alpha -= 0.02;

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

      // Continue loop unless game over or intro
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, ballX, ballAngle, currentRound, isCorrect, score]);

  // Start the entire bowling challenge
  const playBowling = () => {
    setScore(0);
    startRound(0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto" id="bowling-game-panel">
      {/* Game Header Ribbon */}
      <div className="bg-gradient-to-r from-red-600 to-amber-500 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-rose-700">
        <div>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-yellow-100">
            MINI-JUEGO 1 / 3D
          </span>
          <h2 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
            El Boliche Gramatical (3D Bowling)
          </h2>
          <p className="text-sm text-red-50 text-light mt-0.5">
            Derrumba los bolos conjugando correctamente verbos regulares en <span className="font-semibold underline">Pretérito Perfecto</span>!
          </p>
        </div>
        <div className="flex gap-4 items-center bg-black/20 px-4 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">RONDA</p>
            <p className="text-lg font-black">{gameState === 'intro' ? '0' : currentRound + 1}/5</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20"></div>
          <div className="text-center">
            <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">PUNTOS</p>
            <p className="text-lg font-black text-yellow-300">{score}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <DonPedro mood={pedroMood} customText={pedroText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Side: Game Canvas & Aim Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4 items-center">
          <div className="relative w-full border-4 border-slate-700 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-md">
            <canvas ref={canvasRef} className="block w-full aspect-[3/2] max-h-[400px]" />

            {/* Strikes Screen Overlay */}
            <AnimatePresence>
              {gameState === 'result' && isCorrect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-sm select-none p-4"
                  id="bowling-strike-overlay"
                >
                  <Award className="w-10 h-10 sm:w-20 sm:h-20 text-yellow-400 animate-bounce mb-1" />
                  <h1 className="text-2xl sm:text-5xl font-black text-yellow-300 tracking-wider uppercase animate-pulse">
                    ¡STRIKE!
                  </h1>
                  <p className="text-white text-sm sm:text-lg mt-1 sm:mt-2 font-black">
                    {currentQuestion.subject} {currentQuestion.fullAnswer}
                  </p>
                  <p className="text-yellow-250 text-xs sm:text-sm italic mt-0.5">"{currentQuestion.englishSentence}"</p>
                </motion.div>
              )}

              {gameState === 'result' && !isCorrect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/95 backdrop-blur-sm text-center p-4"
                  id="bowling-gutter-overlay"
                >
                  <h1 className="text-2xl sm:text-4xl font-black text-rose-400 tracking-widest uppercase">
                    ¡CANAL / GUTTER!
                  </h1>
                  <p className="text-white text-xs sm:text-sm mt-1 sm:mt-2 max-w-md">
                    ¡La bola se desvió! El verbo correcto era:
                  </p>
                  <div className="my-1.5 sm:my-3 bg-rose-900/60 py-1.5 px-3 sm:p-3 rounded-xl border border-rose-700">
                    <p className="text-base sm:text-xl font-bold text-yellow-200">
                      {currentQuestion.subject} <span className="underline font-black">{currentQuestion.correctHaber} {currentQuestion.correctParticiple}</span>
                    </p>
                  </div>
                  <p className="text-slate-300 text-[10px] sm:text-xs italic">"{currentQuestion.englishSentence}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Aim Steer Sliders */}
          {gameState === 'playing' && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Controles de Lanzamiento</span>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horizontal Ball Line Position Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Posición de Salida:</span>
                    <span className="font-mono text-amber-600">{ballX > 0 ? 'Derecha' : ballX < 0 ? 'Izquierda' : 'Centro'}</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={ballX}
                    onChange={(e) => setBallX(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                    id="ball-x-slider"
                  />
                </div>

                {/* Spin Angle Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Ángulo de Tiro:</span>
                    <span className="font-mono text-amber-600">{ballAngle > 0 ? '↗ Efecto Derecho' : ballAngle < 0 ? '↖ Efecto Izquierdo' : '↑ Recto'}</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={ballAngle}
                    onChange={(e) => setBallAngle(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                    id="ball-angle-slider"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Education Conjugation Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {gameState === 'intro' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-full flex flex-col justify-between"
                id="bowling-intro-card"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    🎳 Reglamento del Boliche
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      El bowling de Don Pedro requiere cálculo mental y excelente dominio espacial y gramatical.
                    </p>
                    <p className="bg-amber-100 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 font-medium">
                      <strong>Fórmula:</strong> Sujeto + Haber [he, has, ha, hemos, habéis, han] + Participio [-ado para -AR / -ido para -ER, -IR].
                    </p>
                    <p>
                      Por cada acierto, tu bola será un bólido incandescente que logrará un <strong>¡STRIKE!</strong> sumando 100 puntos. Los fallos irán directo a la canal de desagüe.
                    </p>
                  </div>
                </div>

                <button
                  onClick={playBowling}
                  className="w-full mt-6 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black py-4 px-6 rounded-xl hover:from-red-500 hover:to-amber-400 transform hover:-translate-y-0.5 active:translate-y-0 transition flex items-center justify-center gap-2 shadow-lg"
                  id="start-bowling-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>EMPEZAR PARTIDA DE BOLOS</span>
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center"
                id="bowling-gameover-card"
              >
                <Award className="w-16 h-16 text-yellow-500 animate-bounce mb-3" />
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  Partida Concluida!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs">
                  Has completado las 5 rondas de El Boliche Gramatical de Don Pedro.
                </p>
                <div className="my-4 bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Puntuación Final</p>
                  <p className="text-4xl font-extrabold text-amber-500">{score} <span className="text-sm font-bold text-slate-500">PTS</span></p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={playBowling}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-amber-600"
                    id="retry-game-btn"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reintentar</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-100 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full"
                id="bowling-question-card"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full font-bold">
                      RONDA {currentRound + 1} DE 5
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                      VERBO: <span className="text-red-500 uppercase font-bold">{currentQuestion.verb}</span> ({currentQuestion.translation})
                    </span>
                  </div>

                  {/* Sentence Prompt */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-md border border-slate-205 dark:border-slate-750 text-center">
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
                      {currentQuestion.sentence.split('______').map((part, index, arr) => {
                        if (index === arr.length - 1) return <span key={index}>{part}</span>;
                        return (
                          <span key={index} className="inline-flex flex-wrap justify-center items-center gap-1">
                            {part}
                            <span className="mx-1 px-4 py-1.5 bg-yellow-100 dark:bg-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200 border-b-4 border-amber-400 font-extrabold animate-pulse text-xl md:text-2xl shadow-sm">
                              {selectedHaber ? selectedHaber : '____'}
                            </span>
                            <span className="mx-1 px-4 py-1.5 bg-red-100 dark:bg-rose-900/60 rounded-xl text-red-900 dark:text-rose-200 border-b-4 border-red-400 font-extrabold animate-pulse text-xl md:text-2xl shadow-sm">
                              {selectedParticiple ? selectedParticiple : '____'}
                            </span>
                          </span>
                        );
                      })}
                    </p>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 italic mt-3 font-semibold">
                      Traducción: "{currentQuestion.englishSentence}"
                    </p>
                  </div>

                  {/* Interactive Selectors */}
                  {gameState === 'playing' ? (
                    <div className="space-y-5 pt-2">
                      {/* Step A: Choose HABER form */}
                      <div>
                        <p className="text-xs sm:text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-[10px] text-rose-600 dark:text-rose-400 font-black">1</span>
                          Selecciona el Verbo Auxiliar (haber) para <span className="font-extrabold underline">{currentQuestion.subject}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['he', 'has', 'ha', 'hemos', 'habéis', 'han'].map((form) => (
                            <button
                              key={form}
                              onClick={() => setSelectedHaber(form)}
                              className={`py-3 px-3 rounded-xl font-bold text-sm sm:text-base border transition-all ${
                                selectedHaber === form
                                  ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350'
                              }`}
                              id={`haber-btn-${form}`}
                            >
                              {form}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step B: Choose Participle */}
                      <div>
                        <p className="text-xs sm:text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-[10px] text-rose-600 dark:text-rose-400 font-black">2</span>
                          Selecciona el Participio Pasado para el verbo <span className="font-extrabold underline">{currentQuestion.verb}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from(new Set([
                            currentQuestion.correctParticiple,
                            ...currentQuestion.optionsParticiple
                          ])).map((participle, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedParticiple(participle)}
                              className={`py-3 px-3 rounded-xl font-black text-sm sm:text-base border transition-all ${
                                selectedParticiple === participle
                                  ? 'bg-rose-500 border-rose-600 text-white shadow-md font-extrabold'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350'
                              }`}
                              id={`participle-btn-${index}`}
                            >
                              {participle}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 flex justify-center">
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-3 animate-pulse">
                        <CheckCircle className="w-5 h-5 text-amber-500 animate-spin" />
                        <span>¡Lanzando bola de bolos 3D por la pista!</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  {gameState === 'playing' ? (
                    <button
                      disabled={!selectedHaber || !selectedParticiple}
                      onClick={launchBallRef}
                      className={`w-full py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                        selectedHaber && selectedParticiple
                          ? 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white transform hover:-translate-y-0.5'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                      id="launch-ball-btn"
                    >
                      <span>Lanzar e Intentar Strike</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : gameState === 'result' ? (
                    <button
                      onClick={() => startRound(currentRound + 1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow"
                      id="next-round-btn"
                    >
                      <span>Siguiente Ronda</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
