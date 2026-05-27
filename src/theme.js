// colores y tokens del diseño — no toques esto sin pensar
export const C = {
  bg: '#121212',
  bg2: '#1a1a2e',
  card: '#1e1e2f',
  violet: '#BC13FE',
  pink: '#FF00FF',
  blue: '#0091ff',
  green: '#00e676',
  red: '#ff1744',
  gold: '#FFD700',
  // --- NUEVOS TOKENS DE COLOR PARA DIFERENCIAR ---
  orange: '#ff6d00',
  cyan: '#00e5ff',
  lime: '#aeea00',
  purpleDark: '#7209b7',
  
  text: '#f0f0f0',
  dim: '#888',
  border: 'rgba(188,19,254,0.35)',
};

export const GLOW = {
  violet: ['#BC13FE', '#BC13FE44'],
  pink:   ['#FF00FF', '#FF00FF55'],
  blue:   ['#0091ff', '#0091ff44'],
  green:  ['#00e676', '#00e67644'],
  red:    ['#ff1744', '#ff174444'],
  gold:   ['#FFD700', '#FFD70044'],
  // --- NUEVOS GLOWS ---
  orange: ['#ff6d00', '#ff6d0044'],
  cyan:   ['#00e5ff', '#00e5ff44'],
  lime:   ['#aeea00', '#aeea0044'],
  purple: ['#7209b7', '#7209b744'],
};

export const GAME_COLORS = {
  bomba:        { accent: '#ff1744', glow: GLOW.red,    icon: '💣' },
  mayormenor:   { accent: '#BC13FE', glow: GLOW.violet, icon: '🃏' },
  caballos:     { accent: '#0091ff', glow: GLOW.blue,   icon: '🏇' },
  confesionario:{ accent: '#FFD700', glow: GLOW.gold,   icon: '🎭' },
  dosmentiras:  { accent: '#FF00FF', glow: GLOW.pink,   icon: '🤥' },
  rompehielos:  { accent: '#00e5ff', glow: GLOW.cyan,   icon: '🔥' },
  yonunca:      { accent: '#00e676', glow: GLOW.green,  icon: '🙈' },
  
  // --- COMPLETA INDEPENDENCIA DE COLORES E ICONOS ---
  mimica:       { accent: '#ff6d00', glow: GLOW.orange, icon: '😶' }, // ¡MUDO! (Naranja Neón / Gesto de Shhh)
  sabiooebrio:  { accent: '#aeea00', glow: GLOW.lime,   icon: '✨' }, // ¿LISTO O EBRIO? (Verde Lima / Chispas/Idea)
  subasta:      { accent: '#7209b7', glow: GLOW.purple, icon: '⚖️' }, // LUDOPATÍA (Morado Oscuro / Balanza-Apuestas)
  poetaRetrete: { accent: '#0091ff', glow: GLOW.blue,   icon: '✏️' }, // RIMA O BEBE (Mantiene tu Azul, icono Lápiz/Rima)
};

export const R = 16; // border radius base