import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  ChevronRight, 
  Compass, 
  Gamepad2, 
  HelpCircle, 
  Info, 
  PlusCircle, 
  Sparkles, 
  Trophy, 
  UserCheck, 
  Zap,
  ArrowLeft,
  Volume2,
  MessageCircle
} from 'lucide-react';
import DonPedro from './DonPedro';
import BowlingGame from './BowlingGame';
import BilliardsGame from './BilliardsGame';
import SwimmingGame from './SwimmingGame';
import RacingGame from './RacingGame';
import FootballGame from './FootballGame';
import { GameStats, HABER_CONJUGATIONS, REGULAR_VERBS, IRREGULAR_VERBS, PedroMood } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bowling' | 'billiards' | 'swimming' | 'racing' | 'football' | 'grammar-guide'>('dashboard');
  const [pedroMood, setPedroMood] = useState<PedroMood>('neutral');
  const [pedroText, setPedroText] = useState<string>('¡Hola! Bienvenido a mi salón virtual. ¡Aquí aprendemos Pretérito Perfecto jugando en 3D!');
  
  // Persistence scoring mechanisms
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('pedro_3d_arcade_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore fallback
      }
    }
    return {
      score: 0,
      level: 1,
      solvedCount: 0,
      trophies: [],
      completedGames: []
    };
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pedro_3d_arcade_stats', JSON.stringify(stats));
  }, [stats]);

  // Adjust student rank level based on accumulated scores
  useEffect(() => {
    const calculatedLevel = Math.floor(stats.score / 300) + 1;
    if (calculatedLevel !== stats.level) {
      setStats(prev => ({ ...prev, level: calculatedLevel }));
      setPedroMood('cheering');
      setPedroText(`¡Felicidades, amigo! ¡Has ascendido al Nivel ${calculatedLevel} de fluidez en español! ¡Eres grandioso!`);
    }
  }, [stats.score]);

  const updateGlobalStats = (scoreDelta: number) => {
    setStats(prev => ({
      ...prev,
      score: prev.score + scoreDelta,
      solvedCount: prev.solvedCount + 1
    }));
  };

  const handleGameComplete = (gameName: string, finalGameScore: number) => {
    // Unlock game achievement trophy
    let trophyId = '';
    let trophyLabel = '';
    switch (gameName) {
      case 'bowling': 
        trophyId = 'bowl_champ'; 
        trophyLabel = '🎳 Rey del Bolo (Bowling Strike Champion)'; 
        break;
      case 'billiards': 
        trophyId = 'billiard_pro'; 
        trophyLabel = '🎱 Maestro de Bandas (Billiard Physics Pro)'; 
        break;
      case 'swimming': 
        trophyId = 'swim_gold'; 
        trophyLabel = '🏊 Tiburón de Conjugación (Swift Swimmer)'; 
        break;
      case 'racing': 
        trophyId = 'race_nitro'; 
        trophyLabel = '🏎️ Piloto Perfecto (F1 Speed Master)'; 
        break;
      case 'football': 
        trophyId = 'football_golden'; 
        trophyLabel = '⚽ Bota de Oro Gramatical (Irregular Shootout Guard)'; 
        break;
    }

    setStats(prev => {
      const updatedTrophies = prev.trophies.includes(trophyLabel) ? prev.trophies : [...prev.trophies, trophyLabel];
      const updatedGames = prev.completedGames.includes(gameName) ? prev.completedGames : [...prev.completedGames, gameName];
      return {
        ...prev,
        trophies: updatedTrophies,
        completedGames: updatedGames
      };
    });
  };

  const resetAllProgress = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar tu puntaje de Don Pedro? This will reset your score and trophies.')) {
      setStats({
        score: 0,
        level: 1,
        solvedCount: 0,
        trophies: [],
        completedGames: []
      });
      setPedroMood('neutral');
      setPedroText('¡Marcadores reiniciados! ¡Volvamos a empezar desde la línea de partida!');
    }
  };

  const getRankName = (lvl: number) => {
    if (lvl <= 1) return 'Amateur de Verb';
    if (lvl === 2) return 'Explorador del Pasado';
    if (lvl === 3) return 'Nadador Olímpico';
    if (lvl === 4) return 'As del Volante';
    if (lvl === 5) return 'Goleador de Excepciones';
    return '¡Campeón de Don Pedro! 🏆';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans pb-16" id="pedro-arcade-root">
      {/* Upper Navigation & Stats Ribbon */}
      <span className="hidden">ARM en español pretérito perfecto.</span>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setPedroMood('neutral'); }}>
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-sm hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                Misión: Pretérito Perfecto
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Aprende con Don Pedro y sus juegos 3D interactivos
              </p>
            </div>
          </div>

          {/* Quick Active Status Badge & Global score counters */}
          <div className="flex items-center flex-wrap gap-4 md:gap-5">
            <div className="bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider shadow-sm">
              MODO ARM: ACTIVO
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-inner">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <span>Rango: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{getRankName(stats.level)}</span></span>
              </div>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                <span>Hechos: <span className="text-emerald-600 dark:text-emerald-300 font-extrabold">{stats.solvedCount}</span></span>
              </div>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Puntaje: <span className="text-indigo-650 dark:text-indigo-400 text-sm font-black">{stats.score} PTS</span></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        {/* Dynamic Navigation button when playing a game */}
        {activeTab !== 'dashboard' && (
          <button 
            onClick={() => { setActiveTab('dashboard'); setPedroMood('neutral'); setPedroText('¡Buen juego! Elige otro reto 3D de la lista.'); }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold uppercase transition-colors"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Galería de Juegos</span>
          </button>
        )}

        {/* RENDER ACTIVE VIEW */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="dashboard-tab"
            >
              {/* Main Bento Grid Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch" id="bento-dashboard-grid">
                
                {/* COLUMN 1: Prominent Indigo Don Pedro Sidebar (col-span-1, row-span-3 on large) */}
                <div className="md:col-span-1 md:row-span-3 bg-indigo-600 text-white p-6 rounded-[24px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-none relative overflow-visible flex flex-col justify-between" id="card-pedro-bento animate-fadeIn">
                  <div className="absolute right-0 bottom-0 opacity-10 bg-radial from-white to-transparent w-48 h-48 pointer-events-none rounded-full"></div>
                  
                  <div>
                    <div className="text-center pt-1">
                      <span className="bg-white/20 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest text-[#E0E7FF] self-center">
                        HABER + PARTICIPIO
                      </span>
                    </div>

                    {/* Integrated Don Pedro Speaking Avatar */}
                    <div className="my-6">
                      <div className="bg-white/10 dark:bg-black/20 p-4.5 rounded-2xl border border-white/10 shadow-inner">
                        <p className="text-xs text-[#C7D2FE] uppercase font-bold tracking-wider mb-2 text-center md:text-left">
                          Profesor Pedro dice:
                        </p>
                        <p className="font-serif italic text-sm md:text-base leading-relaxed text-center md:text-left text-white font-medium">
                          "{pedroText}"
                        </p>

                        <div className="mt-3.5 flex justify-center md:justify-end">
                          <button
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(pedroText);
                                utterance.lang = 'es-ES';
                                utterance.rate = 0.92;
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            className="text-xs text-[#E0E7FF] hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                            title="Escuchar pronunciación"
                            id="speech-button-bento"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Escuchar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complete interactive SVG Don Pedro character embedded beautifully */}
                  <div className="flex justify-center -my-2">
                    <div className="w-28 h-28 hover:scale-105 transition-transform" onClick={() => { setPedroMood('happy'); }}>
                      <DonPedro mood={pedroMood} customText={pedroText} animate={true} onlyAvatar={true} />
                    </div>
                  </div>

                  <div className="mt-5 bg-black/15 p-4 rounded-2xl border border-white/5 text-[11px] text-[#C7D2FE] leading-relaxed">
                    <p className="font-black text-white text-[10px] uppercase tracking-wider mb-1">
                      💡 TIP DE DON PEDRO:
                    </p>
                    <span>Usa el auxiliar: <strong>'he, has, ha, hemos, habéis, han'</strong> seguido del participio terminado en <strong>'-ado'</strong> o <strong>'-ido'</strong>.</span>
                  </div>
                </div>

                {/* COLUMN 2-4: Games Cabinets & Quick Panels */}
                
                {/* ITEM 2: Bowling regular verbs (column-span-1) */}
                <div 
                  onClick={() => { setActiveTab('bowling'); setPedroMood('neutral'); }}
                  className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  id="cabinet-bowling"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow">🎳</span>
                      <span className="text-[10px] bg-red-100 dark:bg-red-955 text-red-700 dark:text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Físicas 3D
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">Bowling 3D</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Derriba los pinos completando el participio de verbos regulares.
                      </p>
                      <p className="verb-example font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-bold">
                        REGULAR → LANZAR: He lanzado
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>Verbos Regulares</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* ITEM 3: Billiards sequence formula (column-span-1) */}
                <div 
                  onClick={() => { setActiveTab('billiards'); setPedroMood('neutral'); }}
                  className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  id="cabinet-billiards"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow">🎱</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Colisiones 2D
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">Billar 3D</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Golpea y mete en las troneras el auxiliar verbal y el participio exacto.
                      </p>
                      <p className="verb-example font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-bold">
                        REGULAR → JUGAR: He jugado
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>Fórmula Completa</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* ITEM 4: Swimming rapid conjugator (column-span-1) */}
                <div 
                  onClick={() => { setActiveTab('swimming'); setPedroMood('neutral'); }}
                  className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  id="cabinet-swimming"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow">🏊‍♂️</span>
                      <span className="text-[10px] bg-cyan-100 dark:bg-cyan-955 text-cyan-755 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Velocidad Pool
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">Natación 3D</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Brazadas gramaticales veloces en la piscina de cloros contra Don Pedro.
                      </p>
                      <p className="verb-example font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-bold">
                        REGULAR → NADAR: He nadado
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>Velocidad Conjugada</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* ITEM 5: Racing translation racer (column-span-1) */}
                <div 
                  onClick={() => { setActiveTab('racing'); setPedroMood('neutral'); }}
                  className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  id="cabinet-racing"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow">🏎️</span>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-955 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Pseudo-3D Racer
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">Carrera 3D</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Maneja el monoplaza sorteando de neon los portales sintácticos.
                      </p>
                      <p className="verb-example font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-bold">
                        REGULAR → CORRER: He corrido
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>Curvas de Traducciones</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* ITEM 6: Football penalty irregularities (column-span-1) */}
                <div 
                  onClick={() => { setActiveTab('football'); setPedroMood('neutral'); }}
                  className="group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  id="cabinet-football"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow">⚽</span>
                      <span className="text-[10px] bg-[#FFF7ED] text-amber-700 px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse border border-[#FFEDD5]">
                        ★ EXCEPCIONES ★
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight">Fútbol 3D</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Chuta penaltis desafiando las excepciones y participios irregulares.
                      </p>
                      <p className="verb-example font-mono text-xs text-rose-500 mt-3 font-bold">
                        EXCEPCIÓN → VER: He visto
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>Participios Rebeldes</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* ITEM 7: Wide Exceptions & Irregulars Card (col-span-2) */}
                <div className="md:col-span-2 bg-[#FFF7ED] dark:bg-amber-955/15 rounded-[24px] p-6 border border-[#FFEDD5] dark:border-amber-900/30 flex flex-col justify-between shadow-sm" id="card-exceptions-bento">
                  <div>
                    <div className="text-xl font-extrabold text-[#9A3412] dark:text-amber-400 flex items-center justify-between gap-2 mb-4">
                      <span className="flex items-center gap-2">
                        <span>⚠️ Los Irregulares</span>
                      </span>
                      <span className="text-[10px] bg-[#FFEDD5] dark:bg-amber-900/40 text-[#C2410C] dark:text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-sm">
                        Compendio Rápido
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Ver</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">visto</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Hacer</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">hecho</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Decir</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">dicho</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Romper</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">roto</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Escribir</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">escrito</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-[#FFEDD5]/80 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-400">Abrir</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">abierto</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#FFEDD5] dark:border-amber-900/10">
                    <span className="text-[11px] text-[#C2410C]/80 dark:text-amber-400 font-medium italic">Memoriza estas formas unidas en el fútbol</span>
                    <button 
                      onClick={() => { setActiveTab('grammar-guide'); setPedroMood('thinking'); }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm border border-amber-500 whitespace-nowrap self-end sm:self-auto"
                      id="exceptions-go-guide-btn"
                    >
                      Ver Guía Completa
                    </button>
                  </div>
                </div>

                {/* ITEM 8: Stats / Achievements Block (col-span-1) */}
                <div className="bg-[#F1F5F9] dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden" id="stats-bento-card">
                  <div className="w-full text-left">
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-black tracking-widest uppercase">
                      LOGROS ARM
                    </span>
                  </div>

                  <div className="my-auto py-3">
                    <div className="stat-val text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      {stats.solvedCount}
                    </div>
                    <div className="stat-label text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-black mt-1">
                      Ejercicios Logrados
                    </div>
                  </div>
                  
                  <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
                    <span>🏆 Trofeos: </span>
                    <span className="text-indigo-650 dark:text-indigo-400 font-black text-sm">{stats.trophies.length} / 5</span>
                  </div>
                </div>

              </div>

              {/* Achievements shelf rendering under the Bento Grid */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>Estantería de Trofeos de Don Pedro</span>
                  </h4>
                  {stats.trophies.length > 0 && (
                    <button 
                      onClick={resetAllProgress}
                      className="text-[10px] text-red-655 font-bold uppercase hover:underline cursor-pointer"
                      id="reset-stats-btn"
                    >
                      Reiniciar Progreso
                    </button>
                  )}
                </div>

                {stats.trophies.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <p>No tienes trofeos grabados todavía.</p>
                    <p className="text-[10px] text-slate-400 mt-1">¡Gana partidas de bolos, billar, natación, carrera o fútbol para estampar tu nombre aquí!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {stats.trophies.map((tr, idx) => (
                      <div 
                        key={idx}
                        className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-2xl flex items-center gap-3 text-xs font-black text-amber-800 dark:text-amber-200 animate-slideUp"
                        id={`trophy-shield-${idx}`}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
                        <span>{tr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ACTIVE GAMES ROUTER */}
          {activeTab === 'bowling' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              id="bowling-tab"
            >
              <BowlingGame 
                onGameComplete={(s) => handleGameComplete('bowling', s)}
                onUpdateGlobalStats={updateGlobalStats}
              />
            </motion.div>
          )}

          {activeTab === 'billiards' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              id="billiards-tab"
            >
              <BilliardsGame 
                onGameComplete={(s) => handleGameComplete('billiards', s)}
                onUpdateGlobalStats={updateGlobalStats}
              />
            </motion.div>
          )}

          {activeTab === 'swimming' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              id="swimming-tab"
            >
              <SwimmingGame 
                onGameComplete={(s) => handleGameComplete('swimming', s)}
                onUpdateGlobalStats={updateGlobalStats}
              />
            </motion.div>
          )}

          {activeTab === 'racing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              id="racing-tab"
            >
              <RacingGame 
                onGameComplete={(s) => handleGameComplete('racing', s)}
                onUpdateGlobalStats={updateGlobalStats}
              />
            </motion.div>
          )}

          {activeTab === 'football' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              id="football-tab"
            >
              <FootballGame 
                onGameComplete={(s) => handleGameComplete('football', s)}
                onUpdateGlobalStats={updateGlobalStats}
              />
            </motion.div>
          )}

          {activeTab === 'grammar-guide' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-8"
              id="grammar-guide-tab"
            >
              {/* Back to main controls */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase text-amber-500">
                    Compendio del Pretérito Perfecto de Indicativo
                  </h2>
                  <p className="text-xs text-slate-400">
                    El manual oficial de Don Pedro para entrenar antes de la tanda de juegos.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold uppercase transition-colors px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  id="guide-back-btn"
                >
                  Volver al Salón
                </button>
              </div>

              {/* 1. Haber Conjugations table layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150">
                  <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <Info className="w-4 h-4 text-rose-500" />
                    <span>1. El Verbo Auxiliar (HABER)</span>
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-450 leading-relaxed mb-4">
                    Toda conjugación en Pretérito Perfecto se abre inequívocamente con el auxiliar **HABER**. ¡Nunca se omite! He aquí las seis variaciones correspondientes:
                  </p>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-2 bg-slate-200/50 p-2.5 font-bold uppercase text-slate-500 tracking-wider">
                      <span>Pronombre</span>
                      <span>Forma de Haber</span>
                    </div>
                    {HABER_CONJUGATIONS.map((c, i) => (
                      <div key={i} className="grid grid-cols-2 p-2.5 border-t border-slate-100 font-medium">
                        <span className="font-bold text-slate-600">{c.subject}</span>
                        <span className="font-mono text-amber-600 font-extrabold">{c.form}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Forming regular participles */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 space-y-4">
                  <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-rose-500" />
                    <span>2. Los Participios Regulares</span>
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-450 leading-relaxed">
                    Posterior al auxiliar, insertamos el participio correspondiente del verbo en infinitivo. Si es regular, la raíz termina así:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 p-3 rounded-xl">
                      <p className="font-bold text-slate-700">Verbos en <span className="text-rose-500 uppercase font-black">-AR</span> → terminan en <span className="text-teal-600 underline font-black">-ADO</span></p>
                      <p className="text-[10px] text-slate-450 mt-1 italic">Ejemplo: Hablar → habl<span className="text-teal-600 font-bold font-mono">ado</span>. "Yo he hablado".</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150 p-3 rounded-xl">
                      <p className="font-bold text-slate-700">Verbos en <span className="text-rose-500 uppercase font-black">-ER</span> → terminan en <span className="text-teal-600 underline font-black">-IDO</span></p>
                      <p className="text-[10px] text-slate-450 mt-1 italic">Ejemplo: Comer → com<span className="text-teal-600 font-bold font-mono">ido</span>. "Tú has comido".</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150 p-3 rounded-xl">
                      <p className="font-bold text-slate-700">Verbos en <span className="text-rose-500 uppercase font-black">-IR</span> → terminan en <span className="text-teal-600 underline font-black">-IDO</span></p>
                      <p className="text-[10px] text-slate-450 mt-1 italic">Ejemplo: Vivir → viv<span className="text-teal-600 font-bold font-mono">ido</span>. "Nosotros hemos vivido".</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Irregulars (Exceptions) details box */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>3. ¡Las Excepciones Rebeldes! (Participios Irregulares)</span>
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-400 leading-relaxed font-medium">
                  Atención piloto y goleador. Ciertos verbos muy populares rehúsan la terminación -ado/-ido. Tienen formas propias que debes memorizar obligatoriamente. ¡Don Pedro te detalla las diez más importantes que jugarán en la tanda de penaltis!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {IRREGULAR_VERBS.slice(0, 8).map((ir, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950 p-3 rounded-xl text-center shadow-sm">
                      <p className="text-rose-500 font-bold text-xs font-mono uppercase">{ir.verb}</p>
                      <p className="text-[10px] text-slate-400 italic">({ir.meaning})</p>
                      <div className="mt-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                        → {ir.correctParticiple}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready button to go back */}
              <div className="text-center pt-4">
                <p className="text-xs text-slate-450 italic mb-3 font-semibold">"El que lee mucho y anda mucho, ve mucho y sabe mucho." - Miguel de Cervantes</p>
                <button
                  onClick={() => { setActiveTab('dashboard'); setPedroMood('happy'); setPedroText('¡Fantástico! Estás listo para arrollar las dudas gramaticales en los simuladores 3D. ¡A jugar!'); }}
                  className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-black py-3.5 px-8 rounded-xl transition shadow text-xs uppercase cursor-pointer"
                  id="guide-ready-btn"
                >
                  ¡ESTOY LISTO, DON PEDRO! EMPEZAR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
