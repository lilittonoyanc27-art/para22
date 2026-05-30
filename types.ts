export interface VerbQuestion {
  id: string;
  subject: string;
  verb: string;
  translation: string;
  correctHaber: string;
  correctParticiple: string;
  fullAnswer: string; // "he hablado"
  optionsHaber: string[];
  optionsParticiple: string[];
  sentence: string; // E.g., "Yo ___ ___ (hablar) con mi madre."
  englishSentence: string;
}

export interface IrregularVerbQuestion {
  id: string;
  verb: string;
  meaning: string;
  correctParticiple: string; // e.g. "hecho"
  incorrectParticiples: string[]; // e.g. ["hacido", "hacedo", "hechado"]
  sentence: string;
  englishSentence: string;
}

export type PedroMood = 'happy' | 'cheering' | 'thinking' | 'sad' | 'surprised' | 'neutral';

export interface GameStats {
  score: number;
  level: number;
  solvedCount: number;
  trophies: string[];
  completedGames: string[];
}

export const HABER_CONJUGATIONS = [
  { subject: 'Yo', form: 'he' },
  { subject: 'Tú', form: 'has' },
  { subject: 'Él/Ella/Usted', form: 'ha' },
  { subject: 'Nosotros/Nosotras', form: 'hemos' },
  { subject: 'Vosotros/Vosotras', form: 'habéis' },
  { subject: 'Ellos/Ellas/Ustedes', form: 'han' }
];

export const REGULAR_VERBS: VerbQuestion[] = [
  {
    id: 'reg-1',
    subject: 'Yo',
    verb: 'hablar',
    translation: 'speak / talk',
    correctHaber: 'he',
    correctParticiple: 'hablado',
    fullAnswer: 'he hablado',
    optionsHaber: ['he', 'has', 'ha'],
    optionsParticiple: ['hablado', 'habliado', 'hablado'],
    sentence: 'Hoy yo ______ ______ por teléfono.',
    englishSentence: 'Today I have spoken on the phone.'
  },
  {
    id: 'reg-2',
    subject: 'Nosotros',
    verb: 'comer',
    translation: 'eat',
    correctHaber: 'hemos',
    correctParticiple: 'comido',
    fullAnswer: 'hemos comido',
    optionsHaber: ['hemos', 'habéis', 'han'],
    optionsParticiple: ['comido', 'comiendo', 'comado'],
    sentence: 'Nosotros ya ______ ______ la paella.',
    englishSentence: 'We have already eaten the paella.'
  },
  {
    id: 'reg-3',
    subject: 'Tú',
    verb: 'vivir',
    translation: 'live',
    correctHaber: 'has',
    correctParticiple: 'vivido',
    fullAnswer: 'has vivido',
    optionsHaber: ['has', 'he', 'ha'],
    optionsParticiple: ['vivido', 'vivado', 'vividendo'],
    sentence: '¿Tú ______ ______ en Barcelona?',
    englishSentence: 'Have you lived in Barcelona?'
  },
  {
    id: 'reg-4',
    subject: 'Ellos',
    verb: 'comprar',
    translation: 'buy',
    correctHaber: 'han',
    correctParticiple: 'comprado',
    fullAnswer: 'han comprado',
    optionsHaber: ['han', 'ha', 'hemos'],
    optionsParticiple: ['comprado', 'compriado', 'compro'],
    sentence: 'Ellos ______ ______ una casa nueva.',
    englishSentence: 'They have bought a new house.'
  },
  {
    id: 'reg-5',
    subject: 'Ella',
    verb: 'beber',
    translation: 'drink',
    correctHaber: 'ha',
    correctParticiple: 'bebido',
    fullAnswer: 'ha bebido',
    optionsHaber: ['ha', 'has', 'han'],
    optionsParticiple: ['bebido', 'bebiendo', 'bebo'],
    sentence: 'Ella ______ ______ un zumo de naranja.',
    englishSentence: 'She has drunk an orange juice.'
  },
  {
    id: 'reg-6',
    subject: 'Vosotros',
    verb: 'estudiar',
    translation: 'study',
    correctHaber: 'habéis',
    correctParticiple: 'estudiado',
    fullAnswer: 'habéis estudiado',
    optionsHaber: ['habéis', 'hemos', 'han'],
    optionsParticiple: ['estudiado', 'estudiando', 'estudido'],
    sentence: 'Vosotros ______ ______ para el examen.',
    englishSentence: 'You (all) have studied for the exam.'
  },
  {
    id: 'reg-7',
    subject: 'Usted',
    verb: 'viajar',
    translation: 'travel',
    correctHaber: 'ha',
    correctParticiple: 'viajado',
    fullAnswer: 'ha viajado',
    optionsHaber: ['ha', 'he', 'has'],
    optionsParticiple: ['viajado', 'viajado', 'viajido'],
    sentence: 'Usted ______ ______ mucho este año.',
    englishSentence: 'You (formal) have traveled a lot this year.'
  },
  {
    id: 'reg-8',
    subject: 'Nosotras',
    verb: 'aprender',
    translation: 'learn',
    correctHaber: 'hemos',
    correctParticiple: 'aprendido',
    fullAnswer: 'hemos aprendido',
    optionsHaber: ['hemos', 'habéis', 'he'],
    optionsParticiple: ['aprendido', 'aprendado', 'aprendiendo'],
    sentence: 'Nosotras ______ ______ mucho español.',
    englishSentence: 'We have learned a lot of Spanish.'
  },
  {
    id: 'reg-9',
    subject: 'Yo',
    verb: 'decidir',
    translation: 'decide',
    correctHaber: 'he',
    correctParticiple: 'decidido',
    fullAnswer: 'he decidido',
    optionsHaber: ['he', 'ha', 'has'],
    optionsParticiple: ['decidido', 'decidado', 'decidido'],
    sentence: 'Yo ______ ______ estudiar español.',
    englishSentence: 'I have decided to study Spanish.'
  },
  {
    id: 'reg-10',
    subject: 'Tú',
    verb: 'cantar',
    translation: 'sing',
    correctHaber: 'has',
    correctParticiple: 'cantado',
    fullAnswer: 'has cantado',
    optionsHaber: ['has', 'he', 'ha'],
    optionsParticiple: ['cantado', 'cantido', 'cantado'],
    sentence: 'Tú ______ ______ muy bien.',
    englishSentence: 'You have sung very well.'
  }
];

export const IRREGULAR_VERBS: IrregularVerbQuestion[] = [
  {
    id: 'irreg-1',
    verb: 'hacer',
    meaning: 'do / make',
    correctParticiple: 'hecho',
    incorrectParticiples: ['hacido', 'hechado', 'hacedo'],
    sentence: '¿Qué ______ tú hoy? (hacer)',
    englishSentence: 'What have you done today?'
  },
  {
    id: 'irreg-2',
    verb: 'escribir',
    meaning: 'write',
    correctParticiple: 'escrito',
    incorrectParticiples: ['escribido', 'escritado', 'escribado'],
    sentence: 'María ha ______ una carta de amor. (escribir)',
    englishSentence: 'Maria has written a love letter.'
  },
  {
    id: 'irreg-3',
    verb: 'ver',
    meaning: 'see / watch',
    correctParticiple: 'visto',
    incorrectParticiples: ['vido', 'veído', 'vistado'],
    sentence: 'Nosotros hemos ______ una película 3D. (ver)',
    englishSentence: 'We have watched a 3D movie.'
  },
  {
    id: 'irreg-4',
    verb: 'decir',
    meaning: 'say / tell',
    correctParticiple: 'dicho',
    incorrectParticiples: ['decido', 'dichado', 'dijido'],
    sentence: 'Ellos ya han ______ la verdad. (decir)',
    englishSentence: 'They have already told the truth.'
  },
  {
    id: 'irreg-5',
    verb: 'abrir',
    meaning: 'open',
    correctParticiple: 'abierto',
    incorrectParticiples: ['abrido', 'abiertado', 'abro'],
    sentence: '¿Quién ha ______ la ventana? (abrir)',
    englishSentence: 'Who has opened the window?'
  },
  {
    id: 'irreg-6',
    verb: 'poner',
    meaning: 'put / place',
    correctParticiple: 'puesto',
    incorrectParticiples: ['ponido', 'puestado', 'ponado'],
    sentence: 'He ______ mis libros en la mesa. (poner)',
    englishSentence: 'I have put my books on the table.'
  },
  {
    id: 'irreg-7',
    verb: 'romper',
    meaning: 'break',
    correctParticiple: 'roto',
    incorrectParticiples: ['rompido', 'rotado', 'rompado'],
    sentence: 'El gato ha ______ el jarrón. (romper)',
    englishSentence: 'The cat has broken the vase.'
  },
  {
    id: 'irreg-8',
    verb: 'volver',
    meaning: 'return',
    correctParticiple: 'vuelto',
    incorrectParticiples: ['volcido', 'voltado', 'volvido'],
    sentence: 'Juan ha ______ de sus vacaciones. (volver)',
    englishSentence: 'Juan has returned from his holidays.'
  },
  {
    id: 'irreg-9',
    verb: 'morir',
    meaning: 'die',
    correctParticiple: 'muerto',
    incorrectParticiples: ['morido', 'muertado', 'morido'],
    sentence: 'La planta se ha ______. (morir)',
    englishSentence: 'The plant has died.'
  },
  {
    id: 'irreg-10',
    verb: 'resolver',
    meaning: 'solve',
    correctParticiple: 'resuelto',
    incorrectParticiples: ['resolvido', 'resueltado', 'resolvado'],
    sentence: 'Nosotros hemos ______ el misterio. (resolver)',
    englishSentence: 'We have solved the mystery.'
  }
];

export const DON_PEDRO_QUOTES = {
  correct: [
    "¡Fantástico! ¡Has tirado todos los bolos de la duda!",
    "¡GOLAZO! ¡Qué tiro tan preciso al ángulo!",
    "¡Excelente tiro! La bola de billar sabe su gramática.",
    "¡Nadas como un pez veloz en las aguas del idioma!",
    "¡A toda velocidad! ¡Rebasaste las dudas ortográficas!",
    "¡Magnífico, mi amigo! Estás dominando el Pretérito Perfecto.",
    "¡Impresionante! Ese participio es oro puro.",
    "¡Olé! ¡Qué arte tienes con el español!"
  ],
  incorrect: [
    "¡Ay caramba! ¡Por poco! Recuerda la fórmula: Haber + Participio.",
    "No pasa nada, amigo. ¡El que tropieza y no cae, adelanta camino!",
    "Uf, esa bola dio en la banda equivocada. ¡Inténtalo de nuevo!",
    "¡Trágate un poco de agua y sigue nadando con fuerza!",
    "¡Cuidado con la curva! Baja una marcha y revisa el verbo auxiliar.",
    "Casi... el portero hizo una gran atajada, ¡pero tú puedes anotarle!",
    "No te preocupes. Del error se aprende más que del acierto.",
    "¡Ánimo! Intenta visualizar si acaba en -ado o -ido."
  ],
  intro: [
    "¡Hola! Soy Don Pedro. Bienvenidos a mi salón de juegos 3D en español.",
    "¿Listo para conjugar mientras te diviertes? ¡Hagamos unos strikes!",
    "El Pretérito Perfecto sirve para hablar del pasado reciente. ¡Súper útil!",
    "En mi torneo, las excepciones de los participios juegan fútbol. ¡Cuidado!"
  ]
};
