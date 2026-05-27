import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Animated, Dimensions, StatusBar
} from 'react-native';
import { C, GAME_COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

// Ajustes de grid
const PADDING = 20;
const GAP = 16;
const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;

// 🟢 JUEGOS FAMILY FRIENDLY / CHILL
const GAMES_NORMAL = [
  { key: 'bomba', label: 'BOMBA', desc: 'Tensión máxima', badge: 'CAOS' },
  { key: 'mayormenor', label: 'MAYOR/MENOR', desc: 'Desafía al azar', badge: 'CLÁSICO' },
  { key: 'caballos', label: 'CABALLOS', desc: 'La carrera mítica', badge: 'EUFORIA' },
  { key: 'dosmentiras', label: 'MENTIRAS', desc: '¿Sabrás engañar?', badge: 'FAROL' },
  { key: 'mimica', label: '¡MUDO!', desc: 'Exprésate sin hablar', badge: 'MÍMICA' },
  { key: 'sabiooebrio', label: '¿LISTO O EBRIO?', desc: 'Cultura bajo presión', badge: 'CEREBRO' },
  { key: 'subasta', label: 'LUDOPATÍA', desc: 'Apuéstalo todo', badge: 'APUESTA' },
  { key: 'poetaRetrete', label: 'RIMA O BEBE', desc: 'Ritmo y rimas sucias', badge: 'RITMO' },
];

// 🌶️ JUEGOS SUBIDOS DE TONO / SALSEO
const GAMES_SPICY = [
  { key: 'confesionario', label: 'CONFESIONES', desc: 'Secretos íntimos', badge: 'PICANTE' },
  { key: 'rompehielos', label: 'ICEBREAKER', desc: 'Acción sin filtros', badge: 'RETO' },
];

// El Yo Nunca lo dejamos al final como el jefe final del salseo
const FULL_GAME = {
  key: 'yonunca', label: 'YO NUNCA...', desc: 'El juego definitivo para destapar las verdades más oscuras.', badge: 'OBLIGATORIO'
};

// COMPONENTE: ORBE DE LUZ DE FONDO
function BackgroundOrb({ color, size, top, left, duration }) {
  const moveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(moveAnim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const scale = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  return (
    <Animated.View style={[s.orb, {
      backgroundColor: color, width: size, height: size,
      top, left, transform: [{ translateY }, { scale }]
    }]} />
  );
}

function GameCard({ game, onPress, fullWidth, index }) {
  const theme = GAME_COLORS[game.key] || { accent: C.violet, icon: '🔥' };
  const entryAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entryAnim, {
      toValue: 1,
      tension: 15,
      friction: 6,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const onIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[
      { width: fullWidth ? '100%' : CARD_WIDTH, opacity: entryAnim },
      {
        transform: [
          { scale },
          { translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }
        ]
      }
    ]}>
      <Pressable
        onPressIn={onIn} onPressOut={onOut} onPress={onPress}
        style={({ pressed }) => [
          s.card,
          { borderColor: theme.accent + '66' },
          pressed && { borderColor: theme.accent, backgroundColor: '#1A1A1A' }
        ]}
      >
        <View style={[s.cardInnerGlow, { shadowColor: theme.accent }]} />
        <View style={[s.cornerLight, { backgroundColor: theme.accent }]} />

        <View style={s.cardContent}>
          <View style={s.cardHeader}>
            <View style={[s.badgeBox, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '44' }]}>
              <Text style={[s.badgeText, { color: theme.accent }]}>{game.badge}</Text>
            </View>
            <Text style={s.cardIcon}>{theme.icon}</Text>
          </View>

          <View>
            <Text style={[s.cardTitle, { textShadowColor: theme.accent }]}>{game.label}</Text>
            <Text style={s.cardDesc} numberOfLines={fullWidth ? 2 : 3}>{game.desc}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MenuScreen({ onSelect }) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* CAPA 1: FONDO */}
      <View style={StyleSheet.absoluteFill}>
        <BackgroundOrb color={C.violet} size={300} top={-50} left={-100} duration={4000} />
        <BackgroundOrb color="#4400aa" size={250} top={height * 0.4} left={width * 0.6} duration={6000} />
      </View>

      {/* CAPA 2: HEADER */}
      <View style={s.header}>
        <Text style={s.headerText}>BEBE<Text style={{ color: C.violet }}>TELO</Text></Text>
        <View style={s.headerIndicator} />
      </View>

      {/* CAPA 3: CONTENIDO SCROLLABLE */}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ========================================== */}
        {/*  SECCIÓN CHILL          */}
        {/* ========================================== */}
        <View style={s.sectionHeaderNormal}>
          <Text style={s.sectionTitleNormal}>BUEN ROLLO</Text>
          <Text style={s.sectionSubNormal}>Para beber y reír sin destruir amistades</Text>
        </View>

        <View style={s.grid}>
          {GAMES_NORMAL.map((g, i) => (
            <GameCard key={g.key} game={g} index={i} onPress={() => onSelect(g.key)} />
          ))}
        </View>



        <View style={s.dangerSeparator}>
          <View style={s.dangerLine} />
          <Text style={s.dangerIcon}>⚠️ ZONA PELIGROSA ⚠️</Text>
          <View style={s.dangerLine} />
        </View>

        {/* Caja roja que envuelve a los juegos picantes para que resalten */}
        <View style={s.spicyZone}>
          <View style={s.spicyHeader}>
            <Text style={s.spicySub}>Salseo, confesiones y tensión máxima</Text>
          </View>

          {/* Mapeamos las cartas picantes pasándoles fullWidth */}
          {GAMES_SPICY.map((g, i) => (
            <View key={g.key} style={{ marginBottom: GAP }}>
              <GameCard
                game={g}
                index={GAMES_NORMAL.length + i}
                fullWidth // <--- AÑADE ESTO
                onPress={() => onSelect(g.key)}
              />
            </View>
          ))}

          {/* Carta del Jefe Final */}
          <GameCard
            game={FULL_GAME}
            index={GAMES_NORMAL.length + GAMES_SPICY.length}
            fullWidth
            onPress={() => onSelect(FULL_GAME.key)}
          />
        </View>


        {/* ========================================== */}
        {/* FOOTER                                     */}
        {/* ========================================== */}
        <View style={s.footer}>
          <Text style={s.footerText}>BEBETELO V1.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
    filter: 'blur(60px)',
  },

  header: {
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
    zIndex: 10,
  },
  headerText: {
    fontSize: 26, fontWeight: '900', color: '#FFF',
    fontStyle: 'italic', letterSpacing: 4,
    textShadowColor: C.violet, textShadowRadius: 15
  },
  headerIndicator: { width: 30, height: 3, backgroundColor: C.violet, marginTop: 4, borderRadius: 2 },

  scroll: { paddingHorizontal: PADDING, paddingTop: 10 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GAP
  },

  /* --- ESTILOS SECCIÓN NORMAL --- */
  sectionHeaderNormal: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  sectionTitleNormal: { color: '#FFF', fontSize: 16, letterSpacing: 3, fontWeight: '900' },
  sectionSubNormal: { color: '#AAA', fontSize: 11, marginTop: 4, fontWeight: '600' },

  /* --- SEPARADOR DE PELIGRO --- */
  dangerSeparator: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  dangerLine: { flex: 1, height: 1, backgroundColor: '#ff336644' },
  dangerIcon: { marginHorizontal: 10, fontSize: 12, color: '#ff3366', fontWeight: 'bold', letterSpacing: 2 },

  /* --- ESTILOS CAJA MODO DIABLO --- */
  spicyZone: {
    backgroundColor: 'rgba(255, 10, 50, 0.06)', // Fondo rojo muy sutil
    borderWidth: 1.5,
    borderColor: 'rgba(255, 10, 50, 0.3)', // Borde rojo sangre
    borderRadius: 30,
    padding: 15,
    paddingTop: 25,
    // Brillo exterior rojo
    shadowColor: '#ff0033',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  spicyHeader: { alignItems: 'center', marginBottom: 25 },
  spicyTitle: {
    color: '#ff3366',
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: '900',
    textShadowColor: '#ff3366',
    textShadowRadius: 10
  },
  spicySub: { color: '#ffb3c6', fontSize: 11, marginTop: 5, fontWeight: '800' },

  /* --- TARJETA --- */
  card: {
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 150,
    overflow: 'hidden',
    padding: 18,
  },
  cardInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  cornerLight: {
    position: 'absolute', top: -10, left: -10,
    width: 40, height: 40, borderRadius: 20,
    opacity: 0.2,
  },
  cardContent: { flex: 1, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  badgeBox: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  cardIcon: { fontSize: 30 },

  cardTitle: {
    color: '#FFF', fontSize: 14, fontWeight: '900', marginBottom: 6,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10
  },
  cardDesc: { color: '#888', fontSize: 11, lineHeight: 15, fontWeight: '600' },

  spacer: { width: '100%', height: 10 },
  footer: { marginTop: 40, marginBottom: 60, alignItems: 'center' },
  footerText: { color: '#333', fontSize: 10, letterSpacing: 3, fontWeight: '800' }
});