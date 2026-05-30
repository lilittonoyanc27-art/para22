import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Play, ArrowRight, RotateCcw, Zap, TrendingUp } from 'lucide-react';
import { VerbQuestion, REGULAR_VERBS, PedroMood } from './types';
import DonPedro from './DonPedro';

interface RacingGameProps {
  onGameComplete: (score: number) => void;
  onUpdateGlobalStats: (scoreDelta: number) => void;
}

interface RacingGate {
  z: number; // 0 to 200 (200 is horizon, 0 is player)
  text: string;
  isCorrect: boolean;
  lane: number; // -1 (left), 0 (center), 1 (right)
}

export default function RacingGame({ onGameComplete, onUpdateGlobalStats }: RacingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'racing' | 'result' | 'gameover'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<VerbQuestion>(REGULAR_VERBS[3]);
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('¡Arranca el motor! Conduce tu coche hacia el portal que tenga la respuesta perfecta.');
  const [score, setScore] = useState<number>(0);

  // Racing state
  const [carX, setCarX] = useState<number>(0); // -1.0 (left side of road) to 1.0 (right side of road)
  const [carTargetX, setCarTargetX] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(10); // current racing velocity index
  const [isNitro, setIsNitro] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const trackTimeRef = useRef<number>(0);

  // Gates generated for the current question
  const [gates, setGates] = useState<RacingGate[]>([]);

  // Selected questions for this session
  const [gameQuestions, setGameQuestions] = useState<VerbQuestion[]>([]);

  useEffect(() => {
    const shuffled = [...REGULAR_VERBS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 5));
    setCurrentQuestion(shuffled[0]);
  }, []);

  const prepareGates = (question: VerbQuestion) => {
    // Generate gates: 1 correct option, 2 incorrect options
    const correct = question.fullAnswer;
    const inc = question.optionsHaber;
    const incP = question.optionsParticiple;

    const opt2 = `${inc[0] || 'he'} ${question.correctParticiple}`;
    const opt3 = `${question.correctHaber} ${incP[0] || 'comiendo'}`;

    const items = Array.from(new Set([correct, opt2, opt3])).slice(0, 3);
    
    // Shuffle
    const shuffledItems = items.sort(() => 0.5 - Math.random());

    const initialGates: RacingGate[] = shuffledItems.map((text, idx) => ({
      z: 220, // start far at horizon
      text,
      isCorrect: text === correct,
      lane: idx === 0 ? -0.5 : idx === 1 ? 0 : 0.5 // left, center, right
    }));

    setGates(initialGates);
    setIsNitro(false);
    setIsCrashed(false);
    setSpeed(12);
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
    prepareGates(q);
    setCarX(0);
    setCarTargetX(0);
    setPedroMood('neutral');
    setPedroText(`¡Carrera ${roundIdx + 1} de 5!: Sortea las curvas y pasa por el portal de "${q.fullAnswer}".`);
    setGameState('racing');
  };

  const startGrandPrix = () => {
    setScore(0);
    startRound(0);
  };

  // Keyboard navigation control listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'racing') return;
      if (e.key === 'ArrowLeft') {
        setCarTargetX(prev => Math.max(-0.9, prev - 0.45));
      } else if (e.key === 'ArrowRight') {
        setCarTargetX(prev => Math.min(0.9, prev + 0.45));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main pseudo-3D canvas simulation loop
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

      // Smooth step vehicle steering glide
      setCarX((prev) => prev + (carTargetX - prev) * 0.155);

      // Parallax update road ticker
      if (!isCrashed) {
        trackTimeRef.current += speed * 0.05;
      }

      const horizonY = 120;
      const vpX = width / 2;

      // 1. Draw Parallax Background Sky & Mountains
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#1e1b4b'); // deep twilight purple-blue
      skyGrad.addColorStop(1, '#311042');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Starry sparkle field
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 15; s++) {
        const starX = (Math.sin(s * 144) * 0.5 + 0.5) * width;
        const starY = (Math.cos(s * 255) * 0.5 + 0.5) * (horizonY - 30);
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Parallax distant blue silhouette mountains
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(80, horizonY - 40);
      ctx.lineTo(160, horizonY);
      ctx.lineTo(240, horizonY - 60);
      ctx.lineTo(320, horizonY);
      ctx.lineTo(440, horizonY - 30);
      ctx.lineTo(520, horizonY - 50);
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Sun halo rising behind vanishing point
      const sunGrad = ctx.createRadialGradient(vpX, horizonY, 5, vpX, horizonY, 80);
      sunGrad.addColorStop(0, '#f59e0b');
      sunGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
      sunGrad.addColorStop(1, 'rgba(49, 16, 66, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(vpX, horizonY, 80, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Pseudo-3D Road Surface line-by-line
      const numLines = height - horizonY;
      for (let line = 0; line < numLines; line++) {
        const screenY = horizonY + line;
        
        // Non-linear scale coefficient (geometric scaling)
        const perspective = line / numLines; // 0 (horizon) to 1 (screen bottom)
        const scale = perspective;

        // Curved road math: warp the center point using a sine wave synced to road ticker
        const curveStrength = 80;
        const curveOffset = Math.sin(perspective * 2.8 + trackTimeRef.current * 0.08) * curveStrength * (1 - perspective) * (1 - perspective);
        const lCenter = vpX + curveOffset;

        // Road width widening geometric projection
        const roadWidth = 80 + scale * 340;

        const leftX = lCenter - roadWidth / 2;
        const rightX = lCenter + roadWidth / 2;

        // Alternating gray concrete ground & grass bands (OutRun style!)
        const trackTickModulo = Math.floor(trackTimeRef.current - (1 / Math.max(0.01, perspective)) * 12) % 2 === 0;
        
        // Ground pasture grass sides
        ctx.fillStyle = trackTickModulo ? '#047857' : '#065f46'; // dark green switcher
        ctx.fillRect(0, screenY, width, 1);

        // Main asphalt road lane
        ctx.fillStyle = trackTickModulo ? '#334155' : '#1e293b'; // asphalt stripes
        ctx.beginPath();
        ctx.moveTo(leftX, screenY);
        ctx.lineTo(rightX, screenY);
        ctx.fill();

        // Curb borders (Zebra stripes red & white edge guides)
        const curbWidth = 10 + scale * 30;
        ctx.fillStyle = trackTickModulo ? '#dc2626' : '#f8fafc';
        ctx.fillRect(leftX - curbWidth, screenY, curbWidth, 1);
        ctx.fillRect(rightX, screenY, curbWidth, 1);

        // Center dash lines lanes
        if (trackTickModulo) {
          ctx.fillStyle = '#f59e0b'; // golden center dividers
          const dashWidth = 2 + scale * 10;
          ctx.fillRect(lCenter - dashWidth / 2, screenY, dashWidth, 1);
        }
      }

      // 3. Draw Sign Gate Portals flying downstream from horizon
      if (gameState === 'racing') {
        let gateCollisionIndex = -1;

        gates.forEach((g, idx) => {
          // Progress speed displacement
          g.z -= speed * 0.5;

          // If gate passes off bottom of screen, trigger analysis evaluation
          if (g.z <= 10) {
            gateCollisionIndex = idx;
          }

          // Projection coordinate calculations of gate
          const horizonZFraction = g.z / 220; // 1 at horizon, 0 near player
          if (horizonZFraction < 0 || horizonZFraction > 1) return;

          const scale = 1 - horizonZFraction; // 0 at horizon, 1 at screen-level

          // Projected road calculations at current gate depth
          const curveOffsetAtZ = Math.sin(scale * 2.8 + trackTimeRef.current * 0.08) * 80 * (1 - scale) * (1 - scale);
          const rCenterAtZ = vpX + curveOffsetAtZ;
          const roadWAtZ = 80 + scale * 340;

          // Horizontal alignment of this gate's lane
          const gateX = rCenterAtZ + g.lane * roadWAtZ * 0.7;
          const gateY = horizonY + (height - horizonY) * scale - 12; // lower vertical rise

          const size = 12 + scale * 60; // dimensions of board

          // Draw Gate Pole structure
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1 + scale * 3.5;
          ctx.beginPath();
          ctx.moveTo(gateX, gateY + size);
          ctx.lineTo(gateX, gateY + size * 1.8);
          ctx.stroke();

          // Gate neon frame glow
          ctx.shadowBlur = 4 + scale * 12;
          ctx.shadowColor = g.isCorrect ? '#10b981' : '#ef4444'; // Glowing red vs green boards

          ctx.fillStyle = g.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(gateX - size * 1.1, gateY, size * 2.2, size);

          ctx.strokeStyle = g.isCorrect ? '#10b981' : '#ef4444';
          ctx.lineWidth = 1.5 + scale * 3;
          ctx.strokeRect(gateX - size * 1.1, gateY, size * 2.2, size);

          // Remove canvas shadow blur for further items in render tree
          ctx.shadowBlur = 0;

          // Gate grammatical words text label centring
          ctx.fillStyle = '#f8fafc';
          ctx.font = `bold ${Math.max(6, 6 + scale * 13)}px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(g.text, gateX, gateY + size / 2);
        });

        // Handle collision when passing gates
        if (gateCollisionIndex !== -1) {
          // Check if player's car horizontal coordinate (carX is [-1 to 1]) matched the gate
          // Calculate closest gate based on car coordinates
          let chosenGate = gates[1]; // center default
          if (carX < -0.2) {
            chosenGate = gates[0]; // left lane
          } else if (carX > 0.2) {
            chosenGate = gates[2]; // right lane
          }

          if (chosenGate.isCorrect) {
            // NITRO BURST SUCCESS
            setIsNitro(true);
            setSpeed(28); // high velocity zoom!
            setScore(s => s + 100);
            onUpdateGlobalStats(100);
            setPedroMood('happy');
            setPedroText("¡SÚPER NITRO! Cruzaste el portal correcto a velocidad hipersónica. ¡100 puntos!");
          } else {
            // ENGINE SMOKE FAILURE
            setIsCrashed(true);
            setSpeed(1); // dead drag
            setPedroMood('sad');
            setPedroText(`¡Fallo de motor! Rompiste la biela por ir al portal equivocado. El correcto era: "${currentQuestion.fullAnswer}".`);
          }

          setGameState('result');
        }
      }

      // 4. Draw Player's Racing F1 Formula Car
      const carScreenX = vpX + carX * 200;
      const carScreenY = height - 55;
      const f1Width = 65;
      const f1Height = 40;

      ctx.save();
      ctx.translate(carScreenX, carScreenY);

      // Nitro back fire combustion
      if (isNitro && Math.random() > 0.3) {
        const fireGrad = ctx.createRadialGradient(0, f1Height / 2 + 10, 2, 0, f1Height / 2 + 10, 25);
        fireGrad.addColorStop(0, '#facc15');
        fireGrad.addColorStop(0.5, '#ef4444');
        fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(0, f1Height / 2 + 10, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#67e8f9'; // neon azure spark tail
        ctx.fillRect(-22, f1Height / 2 + 12, 4, 10);
        ctx.fillRect(18, f1Height / 2 + 12, 4, 10);
      }

      // Engine crash smoke indicator
      if (isCrashed && Math.random() > 0.2) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.8)'; // dark thick smoke
        ctx.beginPath();
        ctx.arc((Math.random() - 0.5) * 15, -15, Math.random() * 12 + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Car shadow reflection
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-f1Width / 2 - 4, f1Height / 2 + 2, f1Width + 8, 8);

      // F1 Tires
      ctx.fillStyle = '#0f172a'; // Deep slate carbon tires
      ctx.roundRect(-f1Width / 2 - 2, -15, 10, 18, 4); // front left
      ctx.roundRect(f1Width / 2 - 8, -15, 10, 18, 4);  // front right
      ctx.roundRect(-f1Width / 2 - 5, f1Height / 2 - 12, 12, 22, 4); // rear left
      ctx.roundRect(f1Width / 2 - 7, f1Height / 2 - 12, 12, 22, 4);  // rear right
      ctx.fill();

      // Rear massive aerodynamic spoiler wing
      ctx.fillStyle = '#be123c'; // Spanish deep red plate
      ctx.fillRect(-f1Width / 2 - 3, f1Height / 2 - 14, f1Width + 6, 6);
      ctx.fillStyle = '#9f1239'; // shadow panel
      ctx.fillRect(-f1Width / 2 - 3, f1Height / 2 - 8, 3, 10);
      ctx.fillRect(f1Width / 2, f1Height / 2 - 8, 3, 10);

      // Sleek racing chassis body
      const chassisGrad = ctx.createLinearGradient(-f1Width / 2, 0, f1Width / 2, 0);
      chassisGrad.addColorStop(0, '#dc2626'); // vibrant red
      chassisGrad.addColorStop(0.5, '#ef4444');
      chassisGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = chassisGrad;

      ctx.beginPath();
      ctx.moveTo(-16, -18); // nose cone tip
      ctx.lineTo(16, -18);
      ctx.lineTo(20, 14);   // wide sidepod hips
      ctx.lineTo(-20, 14);
      ctx.closePath();
      ctx.fill();

      // Yellow racing sports stripes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, -15, 6, 25);

      // Glass cockpit windshield cabin
      ctx.fillStyle = '#38bdf8'; // sky blue visor glass reflection
      ctx.beginPath();
      ctx.ellipse(0, -2, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -6, 4, 0, Math.PI * 2);
      ctx.fill(); // Driver helmet

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, speed, carX, carTargetX, isNitro, isCrashed, gates, score]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto" id="racing-game-panel">
      {/* Header dashboard */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-indigo-900">
        <div>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-indigo-100">
            MINI-JUEGO 4 / PSEUDO-3D RETRO RACER
          </span>
          <h2 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
            Fórmula Perfecto (3D Retro Racing)
          </h2>
          <p className="text-sm text-indigo-50 text-light mt-0.5">
            ¡Conduce tu bólido de Fórmula-1 a través del túnel con el Pretérito Perfecto correcto!
          </p>
        </div>
        <div className="flex gap-4 items-center bg-black/20 px-4 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">MANGAS</p>
            <p className="text-lg font-black">{gameState === 'intro' ? '0' : currentRound + 1}/5</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20"></div>
          <div className="text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">SCORE</p>
            <p className="text-lg font-black text-yellow-300">{score}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <DonPedro mood={pedroMood} customText={pedroText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Canvas Screen road rendering */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative border-4 border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-md w-full">
            <canvas ref={canvasRef} className="block w-full h-[350px]" id="racing-canvas" />

            {/* In-game active nitro/crash warning notifications */}
            <AnimatePresence>
              {isNitro && (
                <motion.div
                  initial={{ right: -100, opacity: 0 }}
                  animate={{ right: 20, opacity: 1 }}
                  exit={{ right: -100, opacity: 0 }}
                  className="absolute top-4 right-4 bg-amber-500 border border-amber-400 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-lg"
                  id="nitro-alert"
                >
                  <Zap className="w-4 h-4 text-slate-900 animate-bounce fill-current" />
                  <span>¡NITRO MULTIPLICADOR DE VELOCIDAD!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Steer Lane Clickers */}
          {gameState === 'racing' && (
            <div className="w-full grid grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => setCarTargetX(-0.5)}
                className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors ${
                  carTargetX === -0.5
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                id="steer-left-btn"
              >
                ◀ Pista Izquierda (Lane 1)
              </button>
              <button
                onClick={() => setCarTargetX(0)}
                className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors ${
                  carTargetX === 0
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                id="steer-center-btn"
              >
                ▲ Pista Central (Lane 2)
              </button>
              <button
                onClick={() => setCarTargetX(0.5)}
                className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors ${
                  carTargetX === 0.5
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                id="steer-right-btn"
              >
                Pista Derecha (Lane 3) ▶
              </button>
            </div>
          )}
        </div>

        {/* Side educational/control cards */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {gameState === 'intro' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="racing-intro"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    🏎️ Reglamento del Piloto
                  </h3>
                  <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      Maneja tu bólido rojo de carreras esquivando obstáculos y colocándolo en el carril correcto. 
                    </p>
                    <p className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-150 text-purple-900 dark:text-purple-300 font-medium">
                      <strong>Fórmula del Piloto:</strong> Atiende el sujeto y infinitivo de la caja y esquiva los portales incorrectos. ¡Cruza a toda marcha el portal correcto!
                    </p>
                    <p className="text-slate-400 italic">
                      💡 Consejo: Utiliza los botones inferiores o las flechas de tu teclado (◀ / ▶) para maniobrar el timón.
                    </p>
                  </div>
                </div>

                <button
                  onClick={startGrandPrix}
                  className="w-full mt-6 bg-gradient-to-r from-purple-800 to-indigo-700 text-white font-black py-3.5 px-5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  id="start-racing-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ENCENDER MOTOR (START RALLY)</span>
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-350 dark:border-slate-850 p-5 rounded-2xl h-full flex flex-col items-center justify-center text-center"
                id="racing-gameover"
              >
                <h3 className="text-xl font-black text-slate-850 dark:text-slate-100">
                  Gran Premio Terminado!
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Has ondeado la bandera a cuadros de Fórmula Perfecto.
                </p>
                <div className="my-4 bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Puntos Obtenido</p>
                  <p className="text-3xl font-black text-purple-600">{score} PTS</p>
                </div>
                <button
                  onClick={startGrandPrix}
                  className="w-full bg-purple-600 hover:bg-purple-505 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow"
                  id="retry-racing-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar Carrera</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-full flex flex-col justify-between"
                id="racing-hud-panel"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                    <span>PILOTO SPEED HUD</span>
                    <span className="flex items-center gap-0.5 text-purple-600">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      RPM ESTABLE
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-450 font-bold uppercase">RETO DE VELOCIDAD:</p>
                    <p className="text-md font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {currentQuestion.subject} + <span className="text-amber-500 uppercase font-black">{currentQuestion.verb}</span>
                    </p>
                    <p className="text-xs text-slate-400 italic mt-1 font-medium">"{currentQuestion.englishSentence}"</p>
                  </div>

                  {/* Steering direction indicator mockup */}
                  <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase">Posición Carro:</span>
                    <span className="text-purple-600">
                      {carX < -0.2 ? 'Carril Izquierdo ◀' : carX > 0.2 ? 'Carril Derecho ▶' : 'Carril Central ▲'}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  {gameState === 'result' ? (
                    <button
                      onClick={() => startRound(currentRound + 1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow"
                      id="next-racing-round-btn"
                    >
                      <span>Siguiente Manga</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-purple-50 dark:bg-slate-950 border border-purple-150 rounded-xl text-center text-[10px] uppercase font-bold text-purple-600 flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      <span>Cargando Siguiente Curva...</span>
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
