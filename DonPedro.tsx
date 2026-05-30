import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, Volume2 } from 'lucide-react';
import { PedroMood, DON_PEDRO_QUOTES } from './types';

interface DonPedroProps {
  mood: PedroMood;
  customText?: string;
  animate?: boolean;
  onlyAvatar?: boolean;
}

export default function DonPedro({ mood, customText, animate = true, onlyAvatar = false }: DonPedroProps) {
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');

  useEffect(() => {
    if (customText) {
      setSpeechBubbleText(customText);
    } else {
      // Pick random default remark based on mood
      let list = DON_PEDRO_QUOTES.intro;
      if (mood === 'cheering' || mood === 'happy') {
        list = DON_PEDRO_QUOTES.correct;
      } else if (mood === 'sad') {
        list = DON_PEDRO_QUOTES.incorrect;
      } else if (mood === 'thinking') {
        list = [
          "Déjame pensar... El verbo auxiliar va delante del participio.",
          "¿Lleva una 'h'? Sí, el auxiliar del perfecto viene del verbo HABER.",
          "Hmm... ¿Será un participio regular o una excepción rebelde?"
        ];
      }
      const rand = list[Math.floor(Math.random() * list.length)];
      setSpeechBubbleText(rand);
    }
  }, [mood, customText]);

  // Determine colors and eyebrow angles based on mood
  const getMoodConfig = () => {
    switch (mood) {
      case 'happy':
        return {
          eyebrowsY: -2,
          eyebrowsRotate: 5,
          mouthPath: "M 35 60 Q 50 72 65 60", // smiling wide
          eyeYScale: 1,
          blush: true,
          badgeColor: 'bg-emerald-500',
          badgeText: '¡Olé! ¡Muy bien!'
        };
      case 'cheering':
        return {
          eyebrowsY: -4,
          eyebrowsRotate: 10,
          mouthPath: "M 32 58 Q 50 80 68 58 Z", // super open laugh
          eyeYScale: 0.7,
          blush: true,
          badgeColor: 'bg-amber-500 animate-bounce',
          badgeText: '¡SÚPER STRIKE!'
        };
      case 'thinking':
        return {
          eyebrowsY: -2,
          eyebrowsRotate: -8,
          mouthPath: "M 40 60 Q 50 58 60 62", // slightly flat wondering mouth
          eyeYScale: 1.1,
          blush: false,
          badgeColor: 'bg-blue-500',
          badgeText: '¿Pensando, amigo?'
        };
      case 'sad':
        return {
          eyebrowsY: 1,
          eyebrowsRotate: -15, // worried
          mouthPath: "M 38 66 Q 50 56 62 66", // sad arch
          eyeYScale: 0.8,
          blush: false,
          badgeColor: 'bg-rose-500',
          badgeText: '¡Ay de mí!'
        };
      case 'surprised':
        return {
          eyebrowsY: -6,
          eyebrowsRotate: 0,
          mouthPath: "M 42 62 Q 50 72 58 62 Z", // small circle open mouth
          eyeYScale: 1.3,
          blush: true,
          badgeColor: 'bg-purple-500',
          badgeText: '¿Qué tenemos aquí?'
        };
      case 'neutral':
      default:
        return {
          eyebrowsY: 0,
          eyebrowsRotate: 0,
          mouthPath: "M 38 60 Q 50 66 62 60", // small gentle smile
          eyeYScale: 1,
          blush: true,
          badgeColor: 'bg-slate-500',
          badgeText: 'Don Pedro'
        };
    }
  };

  const config = getMoodConfig();

  // Gentle idle bobbing motion
  const bobbingTransition = animate
    ? {
        y: {
          duration: 2.2,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut' as const
        },
        rotate: {
          duration: 4.4,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut' as const
        }
      }
    : undefined;

  const bobbingAnimate = animate
    ? {
        y: [0, -6, 0],
        rotate: [-1.5, 1.5, -1.5]
      }
    : {};

  if (onlyAvatar) {
    return (
      <motion.div
        className="relative w-full h-full flex-shrink-0 cursor-pointer"
        animate={bobbingAnimate}
        transition={bobbingTransition}
        whileHover={{ scale: 1.05 }}
        id="don-pedro-avatar-container"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* DEFINITIONS for gradients */}
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd8bd" />
              <stop offset="100%" stopColor="#f5b993" />
            </radialGradient>
            <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="vestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
          </defs>

          {/* Shoulders & Traditional Spanish Vest */}
          <path d="M 15 90 C 20 70, 80 70, 85 90 Z" fill="#ddcbb4" />
          <path d="M 20 82 C 30 74, 70 74, 80 82 L 82 92 L 18 92 Z" fill="#b91c1c" />
          {/* White inner shirt collar */}
          <polygon points="40,78 50,88 60,78 50,75" fill="#f8fafc" />
          {/* Golden vest details */}
          <circle cx="46" cy="85" r="2" fill="#fbbf24" />
          <circle cx="54" cy="85" r="2" fill="#fbbf24" />

          {/* Face */}
          <circle cx="50" cy="50" r="28" fill="url(#faceGrad)" />

          {/* Red Cheeks (blush) */}
          {config.blush && (
            <>
              <circle cx="30" cy="54" r="5" fill="#f43f5e" fillOpacity="0.4" />
              <circle cx="70" cy="54" r="5" fill="#f43f5e" fillOpacity="0.4" />
            </>
          )}

          {/* Eyes (Animated shapes) */}
          <g>
            {/* Left Eye */}
            <ellipse
              cx="38"
              cy="42"
              rx="4"
              ry={4 * config.eyeYScale}
              fill="#0f172a"
            />
            <circle cx="36.5" cy="40" r="1.2" fill="#ffffff" />
            
            {/* Right Eye */}
            <ellipse
              cx="62"
              cy="42"
              rx="4"
              ry={4 * config.eyeYScale}
              fill="#0f172a"
            />
            <circle cx="60.5" cy="40" r="1.2" fill="#ffffff" />
          </g>

          {/* Eyebrows (Dynamic rotation/positions) */}
          <motion.g
            animate={{
              y: config.eyebrowsY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {/* Left Eyebrow */}
            <rect
              x="31"
              y="33"
              width="13"
              height="2.5"
              rx="1.2"
              fill="#334155"
              transform={`rotate(${config.eyebrowsRotate} 37.5 34.25)`}
            />
            {/* Right Eyebrow */}
            <rect
              x="56"
              y="33"
              width="13"
              height="2.5"
              rx="1.2"
              fill="#334155"
              transform={`rotate(${-config.eyebrowsRotate} 62.5 34.25)`}
            />
          </motion.g>

          {/* Big Majestic Spanish Mustache */}
          <path
            d="M 28 54 C 36 50, 48 51, 50 56 C 52 51, 64 50, 72 54 C 80 57, 68 64, 50 60 C 32 64, 20 57, 28 54 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="0.5"
          />

          {/* Mouth (behind mustache but showing lower edge/tongue depending on mood) */}
          <motion.path
            d={config.mouthPath}
            fill={mood === 'cheering' || mood === 'surprised' ? '#e11d48' : 'none'}
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Round Red Nose */}
          <circle cx="50" cy="47" r="4.5" fill="#f43f5e" fillOpacity="0.8" />

          {/* Traditional Spanish Newsboy Cap */}
          <path
            d="M 18 36 C 18 16, 82 16, 82 36 C 82 40, 18 40, 18 36 Z"
            fill="url(#capGrad)"
          />
          {/* Cap peak / visor */}
          <path
            d="M 23 35 C 32 28, 68 28, 77 35 C 80 38, 20 38, 23 35 Z"
            fill="#0f172a"
          />
          {/* Small button on cap */}
          <circle cx="50" cy="21" r="3.5" fill="#64748b" />
        </svg>

        {/* Dynamic Badge with Don Pedro Name/Title */}
        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wider uppercase whitespace-nowrap shadow ${config.badgeColor} transition-colors duration-300`}>
          {config.badgeText}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-visible max-w-2xl mx-auto my-2">
      {/* Dynamic Sparkles for cheers */}
      {mood === 'cheering' && (
        <>
          <Sparkles className="absolute left-2 top-2 text-yellow-400 w-6 h-6 animate-pulse" />
          <Sparkles className="absolute right-4 bottom-2 text-amber-400 w-5 h-5 animate-bounce" />
          <Sparkles className="absolute left-1/3 -top-3 text-emerald-400 w-6 h-6 animate-ping" />
        </>
      )}

      {/* Don Pedro Animated SVG Avatar */}
      <motion.div
        className="relative w-36 h-36 flex-shrink-0 cursor-pointer"
        animate={bobbingAnimate}
        transition={bobbingTransition}
        whileHover={{ scale: 1.05 }}
        id="don-pedro-avatar-container"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* DEFINITIONS for gradients */}
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd8bd" />
              <stop offset="100%" stopColor="#f5b993" />
            </radialGradient>
            <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="vestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
          </defs>

          {/* Shoulders & Traditional Spanish Vest */}
          <path d="M 15 90 C 20 70, 80 70, 85 90 Z" fill="#ddcbb4" />
          <path d="M 20 82 C 30 74, 70 74, 80 82 L 82 92 L 18 92 Z" fill="#b91c1c" />
          {/* White inner shirt collar */}
          <polygon points="40,78 50,88 60,78 50,75" fill="#f8fafc" />
          {/* Golden vest details */}
          <circle cx="46" cy="85" r="2" fill="#fbbf24" />
          <circle cx="54" cy="85" r="2" fill="#fbbf24" />

          {/* Face */}
          <circle cx="50" cy="50" r="28" fill="url(#faceGrad)" />

          {/* Red Cheeks (blush) */}
          {config.blush && (
            <>
              <circle cx="30" cy="54" r="5" fill="#f43f5e" fillOpacity="0.4" />
              <circle cx="70" cy="54" r="5" fill="#f43f5e" fillOpacity="0.4" />
            </>
          )}

          {/* Eyes (Animated shapes) */}
          <g>
            {/* Left Eye */}
            <ellipse
              cx="38"
              cy="42"
              rx="4"
              ry={4 * config.eyeYScale}
              fill="#0f172a"
            />
            <circle cx="36.5" cy="40" r="1.2" fill="#ffffff" />
            
            {/* Right Eye */}
            <ellipse
              cx="62"
              cy="42"
              rx="4"
              ry={4 * config.eyeYScale}
              fill="#0f172a"
            />
            <circle cx="60.5" cy="40" r="1.2" fill="#ffffff" />
          </g>

          {/* Eyebrows (Dynamic rotation/positions) */}
          <motion.g
            animate={{
              y: config.eyebrowsY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {/* Left Eyebrow */}
            <rect
              x="31"
              y="33"
              width="13"
              height="2.5"
              rx="1.2"
              fill="#334155"
              transform={`rotate(${config.eyebrowsRotate} 37.5 34.25)`}
            />
            {/* Right Eyebrow */}
            <rect
              x="56"
              y="33"
              width="13"
              height="2.5"
              rx="1.2"
              fill="#334155"
              transform={`rotate(${-config.eyebrowsRotate} 62.5 34.25)`}
            />
          </motion.g>

          {/* Big Majestic Spanish Mustache */}
          <path
            d="M 28 54 C 36 50, 48 51, 50 56 C 52 51, 64 50, 72 54 C 80 57, 68 64, 50 60 C 32 64, 20 57, 28 54 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="0.5"
          />

          {/* Mouth (behind mustache but showing lower edge/tongue depending on mood) */}
          <motion.path
            d={config.mouthPath}
            fill={mood === 'cheering' || mood === 'surprised' ? '#e11d48' : 'none'}
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Round Red Nose */}
          <circle cx="50" cy="47" r="4.5" fill="#f43f5e" fillOpacity="0.8" />

          {/* Traditional Spanish Newsboy Cap */}
          <path
            d="M 18 36 C 18 16, 82 16, 82 36 C 82 40, 18 40, 18 36 Z"
            fill="url(#capGrad)"
          />
          {/* Cap peak / visor */}
          <path
            d="M 23 35 C 32 28, 68 28, 77 35 C 80 38, 20 38, 23 35 Z"
            fill="#0f172a"
          />
          {/* Small button on cap */}
          <circle cx="50" cy="21" r="3.5" fill="#64748b" />
        </svg>

        {/* Dynamic Badge with Don Pedro Name/Title */}
        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wider uppercase whitespace-nowrap shadow ${config.badgeColor} transition-colors duration-300`}>
          {config.badgeText}
        </span>
      </motion.div>

      {/* Speech bubble */}
      <div className="flex-1 min-w-[200px] flex flex-col justify-center">
        <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Speech Bubble Arrow Indicator pointer */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 md:-left-2 md:top-1/3 md:translate-x-0 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 transform rotate-45 rotate-[-45deg] md:rotate-[-45deg] sx:hidden"></div>

          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Don Pedro dice...</span>
          </div>

          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 italic leading-relaxed">
            "{speechBubbleText}"
          </p>

          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                // Read text using speech synthesis if supported
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(speechBubbleText);
                  utterance.lang = 'es-ES';
                  utterance.rate = 0.9;
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
              title="Escuchar pronunciación"
              id="listen-pronunciation-btn"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Escuchar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
