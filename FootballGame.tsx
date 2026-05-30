import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Play, ArrowRight, RotateCcw, Award, CheckCircle } from 'lucide-react';
import { IrregularVerbQuestion, IRREGULAR_VERBS, PedroMood } from './types';
import DonPedro from './DonPedro';

interface FootballGameProps {
  onGameComplete: (score: number) => void;
  onUpdateGlobalStats: (scoreDelta: number) => void;
}

interface Goalie {
  x: number; // goal line coordinate (-100 left to 100 right)
  targetX: number;
  width: number;
  height: number;
  diveAngle: number;
}

interface SoccerBall {
  x: number;
  y: number;
  z: number; // 0 penalty spot (close/large) to 1 goal line (far/small)
  vx: number;
  vy: number;
  radius: number;
  spin: number;
}

export default function FootballGame({ onGameComplete, onUpdateGlobalStats }: FootballGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'shooting' | 'result' | 'gameover'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<IrregularVerbQuestion>(IRREGULAR_VERBS[0]);
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('¡A los penaltis! En la portería de excepciones, apunta al ángulo con el participio irregular correcto.');
  const [score, setScore] = useState<number>(0);

  // Targets coordinates in the goal frame
  // 4 targets: Top-Left, Top-Right, Bottom-Left, Bottom-Right
  const [targets, setTargets] = useState<{ text: string; location: 'tr' | 'tl' | 'br' | 'bl'; isCorrect: boolean }[]>([]);
  const [selectedTargetLocation, setSelectedTargetLocation] = useState<'tr' | 'tl' | 'br' | 'bl' | null>(null);
  const [goalSaved, setGoalSaved] = useState<boolean>(false);

  const ballRef = useRef<SoccerBall>({ x: 0, y: 0, z: 0, vx: 0, vy: 0, radius: 18, spin: 0 });
  const goalieRef = useRef<Goalie>({ x: 0, targetX: 0, width: 22, height: 48, diveAngle: 0 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Select questions for this session (5 rounds)
  const [gameQuestions, setGameQuestions] = useState<IrregularVerbQuestion[]>([]);

  useEffect(() => {
    const shuffled = [...IRREGULAR_VERBS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 5));
    setCurrentQuestion(shuffled[0]);
  }, []);

  const prepareTargets = (question: IrregularVerbQuestion) => {
    const correct = question.correctParticiple;
    const items = [...question.incorrectParticiples];
    // Shuffle and pick 3 incorrect options to form 4 target boxes
    const pickedInc = items.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [correct, ...pickedInc].sort(() => 0.5 - Math.random());

    const positions: ('tl' | 'tr' | 'bl' | 'br')[] = ['tl', 'tr', 'bl', 'br'];
    const tarList = options.map((text, idx) => ({
      text,
      location: positions[idx],
      isCorrect: text === correct
    }));

    setTargets(tarList);
    setSelectedTargetLocation(null);
    setGoalSaved(false);

    // Reset ball and goalkeeper variables
    ballRef.current = { x: 300, y: 320, z: 0, vx: 0, vy: 0, radius: 18, spin: 0 };
    goalieRef.current = { x: 300, targetX: 300, width: 25, height: 50, diveAngle: 0 };
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
    prepareTargets(q);
    setPedroMood('neutral');
    setPedroText(`¡Penalti ${roundIdx + 1} de 5!: ¿Cuál es el participio de "${q.verb.toUpperCase()}"? ¡Chuta hacia el ángulo que tiene la respuesta correcta!`);
    setGameState('playing');
  };

  const playPenalty = () => {
    setScore(0);
    startRound(0);
  };

  const handleShoot = (loc: 'tr' | 'tl' | 'br' | 'bl') => {
    if (gameState !== 'playing') return;
    setSelectedTargetLocation(loc);
    setGameState('shooting');

    const matchedTarget = targets.find(t => t.location === loc);
    const correctShot = matchedTarget?.isCorrect === true;

    // Ball target coordinates on canvas goal line
    let targetX = 300;
    let targetY = 140;

    switch (loc) {
      case 'tl': targetX = 220; targetY = 110; break;
      case 'tr': targetX = 380; targetY = 110; break;
      case 'bl': targetX = 220; targetY = 180; break;
      case 'br': targetX = 380; targetY = 180; break;
    }

    const startX = 300;
    const startY = 320;

    // Fly speed
    let count = 0;
    const duration = 50; // frames

    const animateBallPhysics = () => {
      count++;
      const t = count / duration;

      // Cubic Bezier spline interpolation
      const currentX = startX + (targetX - startX) * t;
      // Gravity curve parabola arc fly
      const currentY = startY + (targetY - startY) * t - Math.sin(t * Math.PI) * 55;
      const currentZ = t;

      ballRef.current.x = currentX;
      ballRef.current.y = currentY;
      ballRef.current.z = currentZ;
      ballRef.current.spin += 0.25;

      // Goalkeeper AI reacts
      if (correctShot) {
        // Goalkeeper dives at opposite side, diving away completely
        const oppX = targetX > 300 ? 220 : 380;
        goalieRef.current.x += (oppX - goalieRef.current.x) * 0.12;
        goalieRef.current.diveAngle = targetX > 300 ? -Math.PI / 4 : Math.PI / 4;
      } else {
        // Goalkeeper dives at correct target, defending the ball path!
        goalieRef.current.x += (targetX - goalieRef.current.x) * 0.15;
        goalieRef.current.diveAngle = targetX > 300 ? Math.PI / 4 : -Math.PI / 4;
      }

      if (count < duration) {
        requestAnimationFrame(animateBallPhysics);
      } else {
        // Evaluation finish line check
        if (correctShot) {
          setGoalSaved(false);
          setScore(s => s + 100);
          onUpdateGlobalStats(100);
          setPedroMood('cheering');
          setPedroText(`¡GOOOOOOOOLAZOOO! El participio irregular de ${currentQuestion.verb.toUpperCase()} es "${currentQuestion.correctParticiple.toUpperCase()}". ¡Excepcional fusilamiento de arquero!`);
          
          // Confetti explosion
          generateConfetti(targetX, targetY);
        } else {
          setGoalSaved(true);
          setPedroMood('sad');
          setPedroText(`¡PARADÓN DE ARQUERO! Tapó el portero. Recuerda la excepción: el participio de "${currentQuestion.verb.toUpperCase()}" es "${currentQuestion.correctParticiple.toUpperCase()}".`);
        }
        setGameState('result');
      }
    };

    animateBallPhysics();
  };

  const generateConfetti = (x: number, y: number) => {
    const colors = ['#ea580c', '#fbbf24', '#22c55e', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 16,
        vy: -(Math.random() * 10 + 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 2,
        alpha: 1
      });
    }
  };

  // Main stadium render loop
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
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Football Stadium
      // Stadium lights night sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
      skyGrad.addColorStop(0, '#020617'); // night navy blue
      skyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, 100);

      // Stadium spectator stands
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 80, width, 20);
      ctx.fillStyle = '#bfdbfe';
      // Dot patterns for spectator flashlights
      for (let i = 10; i < width; i += 40) {
        ctx.beginPath();
        ctx.arc(i + Math.sin(rippleTime() * 0.05 + i) * 6, 88, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Halogen stadium towers glow
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(30, 0); ctx.lineTo(130, 100); ctx.lineTo(-70, 100); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(570, 0); ctx.lineTo(670, 100); ctx.lineTo(470, 100); ctx.closePath(); ctx.fill();

      // Grass penalty box field (perspective trapezoid)
      const fieldGrad = ctx.createLinearGradient(0, 100, 0, height);
      fieldGrad.addColorStop(0, '#15803d'); // dark soccer green strips
      fieldGrad.addColorStop(1, '#166534');
      ctx.fillStyle = fieldGrad;
      ctx.fillRect(0, 100, width, height - 100);

      // Lawn mowed lines
      ctx.fillStyle = '#14532d';
      for (let y = 100; y < height; y += 40) {
        ctx.fillRect(0, y, width, 15);
      }

      // 2. Draw 3D Goal Posts & Net Mesh Grids
      const goalTL = { x: 180, y: 100 };
      const goalTR = { x: 420, y: 100 };
      const goalBL = { x: 180, y: 200 };
      const goalBR = { x: 420, y: 200 };

      // Goal post rear shadows
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(goalBL.x, goalBL.y);
      ctx.lineTo(goalBR.x, goalBR.y);
      ctx.lineTo(goalBR.x + 10, goalBR.y + 10);
      ctx.lineTo(goalBL.x - 10, goalBL.y + 10);
      ctx.closePath();
      ctx.fill();

      // Draw Soccer Goal Net Grid Lines (White meshes)
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
      ctx.lineWidth = 1;
      // Horizontals
      for (let y = goalTL.y; y <= goalBL.y; y += 15) {
        ctx.beginPath();
        ctx.moveTo(goalTL.x, y);
        ctx.lineTo(goalTR.x, y);
        ctx.stroke();
      }
      // Verticals
      for (let x = goalTL.x; x <= goalTR.x; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, goalTL.y);
        ctx.lineTo(x, goalBL.y);
        ctx.stroke();
      }

      // Draw Heavy White Goal Frame Posts (Crossbars)
      ctx.strokeStyle = '#f8fafc'; // solid glossy white bars
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(goalBL.x, goalBL.y);
      ctx.lineTo(goalTL.x, goalTL.y);
      ctx.lineTo(goalTR.x, goalTR.y);
      ctx.lineTo(goalBR.x, goalBR.y);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // 3. Draw Spell targets on corners
      if (gameState === 'playing') {
        targets.forEach((tar) => {
          let tx = 300;
          let ty = 140;
          switch (tar.location) {
            case 'tl': tx = 220; ty = 120; break;
            case 'tr': tx = 380; ty = 120; break;
            case 'bl': tx = 220; ty = 175; break;
            case 'br': tx = 380; ty = 175; break;
          }

          // Shimmer animation glow for correct targets
          ctx.beginPath();
          ctx.arc(tx, ty, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // target textual participle labels
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'black 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(tar.text, tx, ty + 4);
        });
      }

      // Penalty Spot mark (white circle)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(300, 320, 4, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw Animated Goalkeeper (Goalie)
      const goalie = goalieRef.current;
      ctx.save();
      ctx.translate(goalie.x, 150);
      ctx.rotate(goalie.diveAngle);

      // Goalkeeper Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.ellipse(0, goalie.height / 2 + 5, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goalie jerseys and gloves (neon green)
      ctx.fillStyle = '#22c55e'; // Green goalie kit
      ctx.fillRect(-goalie.width / 2, -goalie.height / 2, goalie.width, goalie.height * 0.7);
      
      // Goalie legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, goalie.height * 0.2, 5, goalie.height * 0.3);
      ctx.fillRect(3, goalie.height * 0.2, 5, goalie.height * 0.3);

      // Goalie Head & Cap
      ctx.fillStyle = '#ffd8bd';
      ctx.beginPath();
      ctx.arc(0, -goalie.height * 0.6, 8, 0, Math.PI * 2);
      ctx.fill();

      // Goalie raised gloves
      ctx.fillStyle = '#fbbf24'; // orange gloves
      ctx.beginPath();
      ctx.arc(-goalie.width / 2 - 4, -goalie.height * 0.4, 4, 0, Math.PI * 2);
      ctx.arc(goalie.width / 2 + 4, -goalie.height * 0.4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 5. Draw Soccer Ball scaling with 3D flight depth
      const ball = ballRef.current;
      const bFrac = ball.z; // 0 to 1
      const sizeCurrent = ball.radius * (1 - bFrac * 0.45); // downscale on approach

      // Ball shadow scaling
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(ball.x + 3, ball.y + sizeCurrent * 0.8, sizeCurrent * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Ball Body drawing details
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.spin);

      // Soccer vector outlines
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, sizeCurrent, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Black pentagons matching classic soccer panels
      ctx.fillStyle = '#0f172a';
      for (let pIdx = 0; pIdx < 5; pIdx++) {
        const pAngle = (pIdx * Math.PI * 2) / 5;
        const px = Math.cos(pAngle) * sizeCurrent * 0.65;
        const py = Math.sin(pAngle) * sizeCurrent * 0.65;
        ctx.beginPath();
        ctx.arc(px, py, sizeCurrent * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, sizeCurrent * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. Confetti particles render update
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity drop velocity
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

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, targets, score]);

  const rippleTime = () => {
    return Date.now();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto" id="football-game-panel">
      {/* Header ribbon */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-emerald-800">
        <div>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-emerald-100">
            MINI-JUEGO 5 / IRREGULARES (EXCEPCIONES)
          </span>
          <h2 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
            El Penalti Irregular (3D Football Penalties)
          </h2>
          <p className="text-sm text-emerald-50 text-light mt-0.5">
            ¡Chuta la tanda de penaltis! Encuentra las <span className="font-semibold underline">excepciones e irregularidades</span> del Pretérito Perfecto.
          </p>
        </div>
        <div className="flex gap-4 items-center bg-black/20 px-4 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">RONDA</p>
            <p className="text-lg font-black">{gameState === 'intro' ? '0' : currentRound + 1}/5</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20"></div>
          <div className="text-center">
            <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">SCORE</p>
            <p className="text-lg font-black text-yellow-300">{score}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <DonPedro mood={pedroMood} customText={pedroText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Play ground stadium center canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative border-4 border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-md">
            <canvas ref={canvasRef} className="block w-full h-[350px]" id="football-canvas" />

            {/* Stadium Goal screen ticker celebrate overlay */}
            <AnimatePresence>
              {gameState === 'result' && !goalSaved && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-sm shadow-inner"
                  id="soccer-goal-celebration"
                >
                  <Award className="w-16 h-16 text-yellow-300 animate-bounce" />
                  <h1 className="text-5xl font-black text-yellow-300 tracking-widest uppercase animate-pulse">
                    ¡GOOOOLAZO!
                  </h1>
                  <p className="text-white text-md mt-2 font-black tracking-tight text-center">
                    {currentQuestion.sentence.replace('______', currentQuestion.correctParticiple)}
                  </p>
                  <p className="text-yellow-100 text-xs italic mt-1 font-medium">"{currentQuestion.englishSentence}"</p>
                </motion.div>
              )}

              {gameState === 'result' && goalSaved && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 backdrop-blur-sm text-center p-6"
                  id="soccer-saved-announcement"
                >
                  <h1 className="text-3xl font-black text-rose-300 tracking-wider uppercase">
                    ¡TAPÓ EL PORTERO!
                  </h1>
                  <p className="text-white text-xs mt-3 max-w-xs leading-relaxed">
                    El disparo fue muy débil y predecible. El participio irregular de <span className="font-bold underline text-yellow-300 uppercase">{currentQuestion.verb}</span> es:
                  </p>
                  <div className="my-2 bg-rose-900 border border-rose-700 py-2.5 px-6 rounded-xl">
                    <p className="text-2xl font-black text-yellow-300 uppercase tracking-widest">{currentQuestion.correctParticiple}</p>
                  </div>
                  <p className="text-slate-350 text-xs italic">"{currentQuestion.englishSentence}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Shoot option buttons */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {gameState === 'intro' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="football-intro"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    ⚽ Tanda de Participios Irregulares
                  </h3>
                  <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      ¡Las excepciones de la gramática española defienden la portería! En este juego nos enfocamos en **los participios irregulares** que no acaban en -ado ni -ido.
                    </p>
                    <p className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-150 text-emerald-800 dark:text-emerald-300 font-medium">
                      <strong>Ejemplos Clave:</strong> Hacer → hecho, Ver → visto, Escribir → escrito, Romper → roto, Abrir → abierto, Decir → dicho.
                    </p>
                    <p>
                      Mide bien tu puntería. Haz click en la esquina de la portería que contenga la ortografía real corregida de la excepción.
                    </p>
                  </div>
                </div>

                <button
                  onClick={playPenalty}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-700 to-green-600 text-white font-black py-3.5 px-5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  id="start-football-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>EMPEZAR PENALTIS EN ESPAÑOL</span>
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-350 dark:border-slate-850 p-5 rounded-2xl h-full flex flex-col items-center justify-center text-center"
                id="football-gameover"
              >
                <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 animate-pulse">
                  Tanda Concluida!
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Has disparado todas las excepciones del Pretérito Perfecto de Don Pedro.
                </p>
                <div className="my-4 bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score Final de Fútbol</p>
                  <p className="text-3xl font-black text-emerald-600">{score} PTS</p>
                </div>
                <button
                  onClick={playPenalty}
                  className="w-full bg-emerald-600 hover:bg-emerald-505 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow"
                  id="retry-football-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chutar de Nuevo</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="football-playing"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                    <span>PORTERÍA DE EXCEPCIONES</span>
                    <span className="text-rose-500 font-extrabold animate-pulse">Participios Irregulares Only!</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Completa la frase de la portería:</p>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200 mt-2 font-mono">
                      {currentQuestion.sentence}
                    </p>
                    <p className="text-xs text-slate-400 italic mt-1 font-medium">"{currentQuestion.englishSentence}"</p>
                  </div>

                  {/* Shoot selector corners buttons */}
                  {gameState === 'playing' ? (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Selecciona tu esquina de chuto:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {targets.map((tar, i) => (
                          <button
                            key={i}
                            onClick={() => handleShoot(tar.location)}
                            className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 px-3 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase flex flex-col items-center gap-1 shadow-sm transition-all text-slate-700 dark:text-slate-200"
                            id={`shoot-btn-${tar.location}`}
                          >
                            <span className="text-amber-600 font-black">
                              {tar.location === 'tl' ? '↖ Ángulo Izq' : tar.location === 'tr' ? '↗ Ángulo Der' : tar.location === 'bl' ? '↙ Rastrero Izq' : '↘ Rastrero Der'}
                            </span>
                            <span className="font-mono text-[11px] underline text-slate-755 dark:text-slate-105">{tar.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-center text-slate-500 text-xs animate-pulse gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-spin"></div>
                      <span>Simulando tiro en arco 3D y atajada...</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 animate-fadeIn">
                  {gameState === 'result' ? (
                    <button
                      onClick={() => startRound(currentRound + 1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow animate-bounce"
                      id="next-football-round-btn"
                    >
                      <span>Siguiente Penalti</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-slate-950 border border-emerald-150 rounded-xl text-center text-[10px] uppercase font-bold text-emerald-600">
                      <span>Presión de Inflado del Balón: OK</span>
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
