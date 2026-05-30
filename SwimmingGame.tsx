import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Play, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { VerbQuestion, REGULAR_VERBS, PedroMood } from './types';
import DonPedro from './DonPedro';

interface SwimmingGameProps {
  onGameComplete: (score: number) => void;
  onUpdateGlobalStats: (scoreDelta: number) => void;
}

interface Swimmer {
  name: string;
  lane: number;
  x: number; // 0 to 100 representing pool completion
  color: string;
  strokeAngle: number;
  speed: number;
  avatarId: 'user' | 'pedro';
}

export default function SwimmingGame({ onGameComplete, onUpdateGlobalStats }: SwimmingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'swimming' | 'result' | 'gameover'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<VerbQuestion>(REGULAR_VERBS[2]);
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('¡Al agua patos! Responde rápido para nadar con velocidad y ganarme la carrera.');
  const [score, setScore] = useState<number>(0);

  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctRef, setCorrectRef] = useState<boolean>(false);

  const swimmersRef = useRef<Swimmer[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const rippleTimeRef = useRef<number>(0);

  const [gameQuestions, setGameQuestions] = useState<VerbQuestion[]>([]);

  useEffect(() => {
    const shuffled = [...REGULAR_VERBS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 5));
    setCurrentQuestion(shuffled[0]);
  }, []);

  // Set randomized option targets
  const prepareOptions = (question: VerbQuestion) => {
    const correctFull = question.fullAnswer; // "he vivido"
    
    // Build incorrect ones
    const bad1 = `${question.optionsHaber[0]} ${question.optionsParticiple[0]}`;
    const bad2 = `${question.optionsHaber[1]} ${question.optionsParticiple[1]}`;
    const bad3 = `${question.correctHaber} ${question.optionsParticiple[1]}`;

    const opts = Array.from(new Set([correctFull, bad1, bad2, bad3])).slice(0, 4);
    // Shuffle options
    setOptions(opts.sort(() => 0.5 - Math.random()));
    setSelectedOption('');
    setIsAnswered(false);
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
    prepareOptions(q);
    setPedroMood('neutral');
    setPedroText(`¡Pregunta ${roundIdx + 1} de 5!: Completa la frase y nada como un profesional.`);
    setGameState('swimming');
  };

  const startRace = () => {
    setScore(0);
    // Reset positions of swimmers
    swimmersRef.current = [
      {
        name: 'Tú (Estudiante)',
        lane: 1,
        x: 10,
        color: '#06b6d4', // Cyan swimsuit
        strokeAngle: 0,
        speed: 0.05,
        avatarId: 'user'
      },
      {
        name: 'Don Pedro',
        lane: 2,
        x: 10,
        color: '#ef4444', // Red traditional swimsuit
        strokeAngle: 0,
        speed: 0.08,
        avatarId: 'pedro'
      }
    ];
    startRound(0);
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQuestion.fullAnswer;
    setCorrectRef(isCorrect);

    const swimmers = swimmersRef.current;
    const player = swimmers.find(s => s.avatarId === 'user');
    const pedro = swimmers.find(s => s.avatarId === 'pedro');

    if (isCorrect) {
      setPedroMood('happy');
      setPedroText('¡Fantástico! ¡Estás combinando los tiempos con excelente técnica aerodinámica!');
      setScore(s => s + 100);
      onUpdateGlobalStats(100);

      // Boost player speed and push X!
      if (player) {
        player.speed = 1.8; // Turbo boost velocity
        player.x = Math.min(92, player.x + 16);
      }
      if (pedro) {
        pedro.x = Math.min(92, pedro.x + 7); // Pedro moves standard amount
      }
    } else {
      setPedroMood('sad');
      setPedroText(`¡Casi! El agua entró a tus antiparras. La respuesta correcta es "${currentQuestion.fullAnswer}".`);
      
      // Pedro gets a relative boost on player's mistake
      if (pedro) {
        pedro.speed = 1.4;
        pedro.x = Math.min(92, pedro.x + 14);
      }
      if (player) {
        player.x = Math.min(92, player.x + 3); // player moves only a bit
      }
    }

    // Set transition to result/next panel
    setTimeout(() => {
      setGameState('result');
    }, 1800);
  };

  // Canvas Swimming Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    const height = 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rippleTimeRef.current += 0.05;

      const horizonY = 50;

      // 1. Draw Pool 3D Perspective Body
      // Horizon background
      const gradBg = ctx.createLinearGradient(0, 0, 0, horizonY);
      gradBg.addColorStop(0, '#0284c7');
      gradBg.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, width, horizonY);

      // Spectator tiles and background
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, horizonY - 10, width, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      for (let i = 0; i < width; i += 30) {
        ctx.fillRect(i, horizonY - 10, 2, 10);
      }

      // Draw swimming pool water with 3D perspective lines
      const poolBottomL = 10;
      const poolBottomR = width - 10;
      const poolTopL = 80;
      const poolTopR = width - 80;

      // Draw deep water gradient
      const waterGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      waterGrad.addColorStop(0, '#0e7490'); // cyan waters
      waterGrad.addColorStop(0.5, '#0891b2');
      waterGrad.addColorStop(1, '#0e7490');
      ctx.fillStyle = waterGrad;

      ctx.beginPath();
      ctx.moveTo(poolBottomL, height);
      ctx.lineTo(poolTopL, horizonY);
      ctx.lineTo(poolTopR, horizonY);
      ctx.lineTo(poolBottomR, height);
      ctx.closePath();
      ctx.fill();

      // Horizontal pool lane tile grids with sine waving ripples
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      const horizontalLanesCount = 8;
      for (let i = 0; i <= horizontalLanesCount; i++) {
        const factor = i / horizontalLanesCount;
        const currentY = horizonY + (height - horizonY) * factor;

        ctx.beginPath();
        ctx.moveTo(poolTopL + (poolBottomL - poolTopL) * factor, currentY + Math.sin(rippleTimeRef.current + i) * 1.5);
        ctx.lineTo(poolTopR + (poolBottomR - poolTopR) * factor, currentY + Math.sin(rippleTimeRef.current + i) * 1.5);
        ctx.stroke();
      }

      // Lane floats / swimming red ropes separating lanes (3 ropes total)
      const lp = [0.22, 0.5, 0.78];
      ctx.lineWidth = 3.5;
      
      lp.forEach((factor) => {
        const axTop = poolTopL + (poolTopR - poolTopL) * factor;
        const axBottom = poolBottomL + (poolBottomR - poolBottomL) * factor;

        ctx.beginPath();
        ctx.moveTo(axTop, horizonY);
        ctx.lineTo(axBottom, height);
        
        ctx.strokeStyle = '#dc2626'; // Red nodes
        ctx.setLineDash([12, 12]);
        ctx.stroke();

        ctx.strokeStyle = '#f8fafc'; // White nodes
        ctx.setLineDash([12, 12]);
        ctx.lineDashOffset = 12;
        ctx.stroke();

        ctx.setLineDash([]);
      });

      // 2. Draw swimmers
      const contestants = swimmersRef.current;
      contestants.forEach((s) => {
        // Find center position of lane
        const laneStartFactor = s.lane === 1 ? 0.22 : 0.5;
        const laneEndFactor = s.lane === 1 ? 0.5 : 0.78;
        const midLaneFactor = (laneStartFactor + laneEndFactor) / 2;

        // Current completion fraction
        const compFrac = s.x / 100; // 0.1 to 0.95

        // Map to 3D perspective width
        const scale = 1 - compFrac * 0.45; // smaller as they get further
        const poolWidthCurrent = (poolBottomR - poolBottomL) * compFrac + (poolTopR - poolTopL) * (1 - compFrac);
        
        // Horizontal projection
        const px = poolTopL + (poolTopR - poolTopL) * midLaneFactor * (s.x / 100) + (poolBottomL + (poolBottomR - poolBottomL) * midLaneFactor) * (1 - s.x / 100);
        // Vertical projection
        const py = horizonY + (height - horizonY) * compFrac;

        // Update stroke animation
        s.strokeAngle += 0.12 * (s.speed + 0.5);
        
        // Decay speed back to low idle
        s.speed = Math.max(0.1, s.speed * 0.95);

        // Draw Swimmer splash trail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let j = 0; j < 5; j++) {
          const splashX = px + (Math.random() - 0.5) * 15 * scale;
          const splashY = py + (Math.random() - 0.5) * 8 * scale + 15 * scale;
          ctx.beginPath();
          ctx.arc(splashX, splashY, (Math.random() * 3 + 1.5) * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Swimmer body (overhead view)
        ctx.save();
        ctx.translate(px, py);

        // 3D Shadow underneath
        ctx.fillStyle = 'rgba(2, 44, 34, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10 * scale, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stroke arm animations (circles rotating around shoulder joints)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5 * scale;
        const armLength = 15 * scale;
        
        // Left arm stroke
        ctx.beginPath();
        ctx.moveTo(-5 * scale, -2 * scale);
        const lx = -5 * scale - Math.cos(s.strokeAngle) * armLength;
        const ly = -2 * scale - Math.sin(s.strokeAngle) * armLength;
        ctx.lineTo(lx, ly);
        ctx.stroke();

        // Right arm stroke (opposite phase)
        ctx.beginPath();
        ctx.moveTo(5 * scale, -2 * scale);
        const rx = 5 * scale + Math.cos(s.strokeAngle + Math.PI) * armLength;
        const ry = -2 * scale + Math.sin(s.strokeAngle + Math.PI) * armLength;
        ctx.lineTo(rx, ry);
        ctx.stroke();

        // Shoulders / Torso
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.ellipse(0, 3 * scale, 8 * scale, 13 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swimmer head cap
        ctx.fillStyle = s.avatarId === 'pedro' ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(0, -10 * scale, 5.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Goggles band
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(-5 * scale, -10 * scale);
        ctx.lineTo(5 * scale, -10 * scale);
        ctx.stroke();

        // Goggles circles
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-2 * scale, -11 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.arc(2 * scale, -11 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Swimmer name tag text
        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${8 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(s.name, 0, 24 * scale);

        ctx.restore();
      });

      // Finish Touch Wall indicators
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, height - 12, width, 12);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("=== TOQUE FINAL / METETA === ", width / 2, height - 3);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, score]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto" id="swimming-game-panel">
      {/* Header ribbon */}
      <div className="bg-gradient-to-r from-cyan-600 to-sky-700 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-sky-800">
        <div>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-cyan-100">
            MINI-JUEGO 3 / 3D PERSPECTIVE pool
          </span>
          <h2 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
            Natación de Pretérito (3D Swim Race)
          </h2>
          <p className="text-sm text-cyan-50 text-light mt-0.5">
            ¡Neda contra Don Pedro! Elige la respuesta correcta para ganar velocidad en el agua.
          </p>
        </div>
        <div className="flex gap-4 items-center bg-black/20 px-4 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider">PREGUNTA</p>
            <p className="text-lg font-black">{gameState === 'intro' ? '0' : currentRound + 1}/5</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20"></div>
          <div className="text-center">
            <p className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider">SCORE</p>
            <p className="text-lg font-black text-yellow-300">{score}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <DonPedro mood={pedroMood} customText={pedroText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Pool visual render columns */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative border-4 border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-md">
            <canvas ref={canvasRef} className="block w-full h-[300px]" id="swimming-canvas" />

            {/* Dynamic splash result banner */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full font-extrabold text-sm border shadow-lg text-white ${
                    correctRef
                      ? 'bg-emerald-600 border-emerald-500 animate-bounce'
                      : 'bg-rose-600 border-rose-500'
                  }`}
                  id="swim-boost-banner"
                >
                  {correctRef ? '¡TURBO IMPULSO DE CONJUGACIÓN! 🏊💨' : '¡AGUA EN EL TUBO! 💧'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reto grammar options */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {gameState === 'intro' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="swimming-intro"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    🏊‍♂️ Reglamento Acuático
                  </h3>
                  <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      Don Pedro es un nadador veterano muy veloz. Para vencerlo, debes coordinar tus brazadas con velocidad gramatical.
                    </p>
                    <p className="bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-xl border border-cyan-150 text-cyan-800 dark:text-cyan-300 font-medium">
                      <strong>Dinámica:</strong> Se te presentará una frase incompleta. Elige rápidamente la opción que contenga el conjugador exacto (haber + participio).
                    </p>
                  </div>
                </div>

                <button
                  onClick={startRace}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-sky-700 text-white font-bold py-3.5 px-5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  id="start-swim-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>PREPARARSE EN EL PARTIDOR</span>
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-350 dark:border-slate-850 p-5 rounded-2xl h-full flex flex-col items-center justify-center text-center"
                id="swimming-complete"
              >
                <h3 className="text-xl font-black text-slate-850 dark:text-slate-100">
                  Carrera Terminada!
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-xs">
                  Has nadado las 5 piscinas en el torneo de Pretérito Perfecto.
                </p>
                <div className="my-4 bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Puntos de Natación</p>
                  <p className="text-3xl font-black text-cyan-600">{score} PTS</p>
                </div>
                <button
                  onClick={startRace}
                  className="w-full bg-cyan-600 hover:bg-cyan-505 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                  id="retry-swim-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nadar de Nuevo</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="swimming-running"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>PISCINA {currentRound + 1} DE 5</span>
                    <span className="text-cyan-500 uppercase">Fórmula: HABER + PARTICIPIO</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-150 shadow-sm text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">
                      ¿Qué falta en la frase? (Sujeto: <span className="text-cyan-600 underline font-black">{currentQuestion.subject}</span>)
                    </p>
                    <p className="text-md font-bold text-slate-850 dark:text-slate-200 mt-2">
                      {currentQuestion.sentence}
                    </p>
                    <p className="text-xs text-slate-400 italic mt-2">
                       "{currentQuestion.englishSentence}"
                    </p>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {options.map((opt, i) => {
                      const isCorrectOpt = opt === currentQuestion.fullAnswer;
                      const isSelected = selectedOption === opt;
                      
                      let btnBg = 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                      if (isAnswered) {
                        if (isCorrectOpt) {
                          btnBg = 'bg-emerald-600 border-emerald-600 text-white shadow-md font-extrabold';
                        } else if (isSelected) {
                          btnBg = 'bg-rose-600 border-rose-600 text-white shadow-md line-through';
                        } else {
                          btnBg = 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-200';
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={isAnswered}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full py-3 px-4 rounded-xl border font-bold text-sm text-left transition-all flex items-center justify-between ${btnBg}`}
                          id={`swim-opt-${i}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrectOpt && <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">¡Correcto!</span>}
                          {isAnswered && isSelected && !isCorrectOpt && <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Fallo</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4">
                  {gameState === 'result' ? (
                    <button
                      onClick={() => startRound(currentRound + 1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow"
                      id="next-swim-round"
                    >
                      <span>Continuar Carrera</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-cyan-50 dark:bg-slate-950 border border-cyan-150 rounded-xl text-center text-[10px] uppercase font-bold text-cyan-600 flex items-center justify-center gap-2 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                      <span>Nivel de Cloro e Hidrodinámica Optimizado</span>
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
