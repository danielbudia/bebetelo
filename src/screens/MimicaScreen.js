import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Vibration,
  ScrollView, TextInput, Platform, KeyboardAvoidingView, Modal, Easing,
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, CountSelector, GlowButton, ActionButton } from '../components/UI';
import { RETOS_MIMICA } from '../data';

const ACCENT = C.orange; // #ff6d00
const TIMER_TOTAL = 60;

// ─── Palabras desde data.js ───────────────────────────────────────────────────
const PALABRAS = shuffle([...RETOS_MIMICA]);
let wordIdx = 0;
const getNextWord = () => PALABRAS[wordIdx++ % PALABRAS.length];

// ─────────────────────────────────────────────
// LiquidTimer — círculo limpio, nivel suave
// ─────────────────────────────────────────────
const LiquidTimer = ({ fillRatio, timeLeft }) => {
  const SIZE = 160;
  const liquidColor = fillRatio > 0.5 ? ACCENT : fillRatio > 0.25 ? C.gold : C.red;

  const levelAnim = useRef(new Animated.Value(fillRatio)).current;

  useEffect(() => {
    Animated.spring(levelAnim, {
      toValue: fillRatio,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [fillRatio]);

  const liquidH = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SIZE] });

  return (
    <View style={{
      width: SIZE, height: SIZE, borderRadius: SIZE / 2,
      backgroundColor: '#0c0c0c', borderWidth: 2, borderColor: liquidColor + '44',
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* CAPA LÍQUIDO */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: liquidH,
        backgroundColor: liquidColor + '60',
      }} />

      {/* PARTÍCULAS */}
      {[1, 2, 3].map((i) => (
        <Particle key={i} size={SIZE} color={liquidColor} delay={i * 800} />
      ))}

      {/* NÚMERO */}
      <Text style={{ fontSize: 54, fontWeight: '900', color: '#fff', zIndex: 10 }}>
        {timeLeft}
      </Text>
    </View>
  );
};

const Particle = ({ size, color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1, duration: 3500, delay, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: 0,
      left: Math.random() * (size - 10),
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.4, 0.9, 1], outputRange: [0, 0.6, 0.3, 0] }),
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -size] }) }],
    }} />
  );
};

// ─────────────────────────────────────────────
// WordCard — flip suave ocultar/revelar
// ─────────────────────────────────────────────
const WordCard = ({ word, onToggle, accent }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showing, setShowing] = useState(true);

  const doFlip = () => {
    Animated.timing(flipAnim, {
      toValue: 1, duration: 160,
      easing: Easing.in(Easing.cubic), useNativeDriver: true,
    }).start(() => {
      setShowing(v => !v);
      flipAnim.setValue(-1);
      Animated.timing(flipAnim, {
        toValue: 0, duration: 160,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    });
    if (onToggle) onToggle();
  };

  const scaleX = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <TouchableOpacity onPress={doFlip} activeOpacity={1} style={{ width: '100%' }}>
      <Animated.View style={[
        s.wordCard,
        showing
          ? { borderColor: accent + '88', backgroundColor: '#111' }
          : { borderStyle: 'dashed', borderColor: '#2a2a2a', backgroundColor: '#080808' },
        { transform: [{ scaleX }] },
      ]}>
        {showing ? (
          <>
            <Text style={[s.wordText, { color: accent }]}>{word}</Text>
            <Text style={s.wordSub}>👁  TOCA PARA OCULTAR</Text>
          </>
        ) : (
          <>
            <Text style={s.hiddenMark}>?</Text>
            <Text style={s.hiddenSub}>TOCA PARA REVELAR</Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────
export default function MimicaScreen({ onExit = () => {} }) {
  const [phase, setPhase]             = useState('setup');
  const [numPlayers, setNumPlayers]   = useState(4);
  const [players, setPlayers]         = useState([]);
  const [turnIdx, setTurnIdx]         = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft]       = useState(TIMER_TOTAL);
  const [fillRatio, setFillRatio]     = useState(1);
  const [wordVisible, setWordVisible] = useState(true);
  const [verdict, setVerdict]         = useState(null);
  const [showExit, setShowExit]       = useState(false);
  const [showError, setShowError]     = useState(false);

  const entryAnim   = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(0)).current;
  const revealAnim  = useRef(new Animated.Value(0)).current;
  const timerRef    = useRef(null);
  const timeLeftRef = useRef(TIMER_TOTAL);

  // Sync array de jugadores con numPlayers
  useEffect(() => {
    setPlayers(prev => {
      const arr = [...prev];
      if (arr.length < numPlayers) {
        for (let i = arr.length; i < numPlayers; i++) arr.push('');
      } else return arr.slice(0, numPlayers);
      return arr;
    });
  }, [numPlayers]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(headerY,   { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleNameChange = (text, index) => {
    const arr = [...players]; arr[index] = text; setPlayers(arr);
  };

  const startGame = () => {
    if (players.some(n => n.trim() === '')) { setShowError(true); return; }
    setPlayers(players.map(n => n.trim()));
    setTurnIdx(0);
    setCurrentWord(getNextWord());
    setPhase('game');
  };

  const endRound = useCallback((result) => {
    clearInterval(timerRef.current);
    setVerdict(result);
    revealAnim.setValue(0);
    Animated.spring(revealAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    Vibration.vibrate(result === 'lose' ? 300 : [0, 80, 80, 80]);
    setPhase('reveal');
  }, []);

  const handleReveal = () => {
    timeLeftRef.current = TIMER_TOTAL;
    setTimeLeft(TIMER_TOTAL);
    setFillRatio(1);
    setWordVisible(true);
    setPhase('timer');

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = timeLeftRef.current;
      setTimeLeft(remaining);
      setFillRatio(remaining / TIMER_TOTAL);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        endRound('lose');
      }
    }, 1000);
  };

  const nextRound = () => {
    setTurnIdx(i => (i + 1) % players.length);
    setCurrentWord(getNextWord());
    setVerdict(null);
    setPhase('game');
  };

  const hY          = headerY.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const verdictColor = verdict === 'win' ? C.green : C.red;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.root}
    >
      <Animated.View style={{ transform: [{ translateY: hY }], opacity: entryAnim }}>
        <GameHeader title="Mímica" color={ACCENT} onExit={() => setShowExit(true)} />
      </Animated.View>

      <Animated.View style={[s.body, {
        opacity: entryAnim,
        transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }]}>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉN ACTÚA?</Text>

            <View style={s.selectorBox}>
              <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={10} color={ACCENT} />
            </View>
            <ScrollView
              style={s.namesScroll}
              contentContainerStyle={s.namesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {players.map((name, i) => (
                <View key={i} style={s.inputRow}>
                  <Text style={[s.inputNumber, { color: ACCENT }]}>{i + 1}</Text>
                  <TextInput
                    style={s.nameInput}
                    placeholder="Nombre del actor o Grupo..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={name}
                    onChangeText={t => handleNameChange(t, i)}
                    maxLength={12}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={s.footerBtn}>
              <GlowButton label="EMPEZAR" onPress={startGame} color={ACCENT} />
            </View>
          </View>
        )}

        {/* ── GAME (palabra oculta, antes de revelar) ── */}
        {phase === 'game' && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>LE TOCA ACTUAR A</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>
            <View style={[s.wordCard, s.wordCardHidden]}>
              <Text style={s.hiddenMark}>?</Text>
              <Text style={s.hiddenSub}>SOLO EL ACTOR PUEDE VER</Text>
            </View>
            <View style={s.rulesBox}>
              <Text style={s.ruleItem}>🤫  Prohibido hablar y emitir sonidos</Text>
              <Text style={s.ruleItem}>👉  Prohibido señalar objetos reales</Text>
              <Text style={s.ruleItem}>⏱  1 minuto para que alguien adivine</Text>
            </View>
            <GlowButton label="👁  VER MI PALABRA" onPress={handleReveal} color={ACCENT} />
          </View>
        )}

        {/* ── TIMER (palabra visible + cronómetro) ── */}
        {phase === 'timer' && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>ACTÚA</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>

            <WordCard
              word={currentWord}
              visible={wordVisible}
              onToggle={() => setWordVisible(v => !v)}
              accent={ACCENT}
            />

            <View style={s.timerWrap}>
              <LiquidTimer fillRatio={fillRatio} timeLeft={timeLeft} />
              <Text style={s.timerLabel}>SEGUNDOS RESTANTES</Text>
            </View>

            <View style={s.actionRow}>
              <ActionButton label="ADIVINARON" onPress={() => endRound('win')}  color={C.green} />
              <ActionButton label="TIEMPO"     onPress={() => endRound('lose')} color={C.red}   />
            </View>
          </View>
        )}

        {/* ── REVEAL ── */}
        {phase === 'reveal' && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: verdictColor + '33' }]}>
              <Text style={s.turnLabel}>ACTUÓ</Text>
              <Text style={[s.turnName, { color: verdictColor }]}>{players[turnIdx]}</Text>
            </View>
            <Animated.View style={[s.wordCard, {
              borderColor: verdictColor + '66',
              transform: [{ scale: revealAnim }],
            }]}>
              <Text style={s.wordSub}>LA PALABRA ERA</Text>
              <Text style={[s.wordText, { color: verdictColor }]}>{currentWord}</Text>
            </Animated.View>
            <Animated.View style={[s.verdictBox, { borderColor: verdictColor + '44' }]}>
              <Text style={[s.verdictText, { color: verdictColor }]}>
                {verdict === 'win'
                  ? `✅ ¡INCREÍBLE!\n${players[turnIdx]} reparte\n3 tragos`
                  : `❌ ¡SIN ÉXITO!\n${players[turnIdx]} bebe\n3 tragos`}
              </Text>
            </Animated.View>
            <GlowButton label="SIGUIENTE TURNO →" onPress={nextRound} color={ACCENT} />
          </View>
        )}

      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); onExit(); }}
      />

      <Modal visible={showError} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.errorCard, { borderColor: ACCENT }]}>
            <Text style={s.errorEmoji}>😶</Text>
            <Text style={[s.errorTitle, { color: ACCENT }]}>¡ACTORES SIN NOMBRE!</Text>
            <Text style={s.errorText}>
              En este teatro no se sube al escenario sin identidad.{'\n\n'}
              <Text style={{ color: ACCENT, fontWeight: '800' }}>Bautiza a todos los actores</Text>
              {' '}antes de que empiece la función.
            </Text>
            <TouchableOpacity
              style={[s.errorBtn, { backgroundColor: ACCENT }]}
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>ENTENDIDO, MAESTRO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, width: '100%' },

  setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  setupTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: 20 },
  selectorBox: { marginBottom: 30, alignItems: 'center' },
  namesScroll: { flex: 1, marginBottom: 100 },
  namesContent: { paddingBottom: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 15, height: 55,
  },
  inputNumber: { fontWeight: '900', fontSize: 16, marginRight: 15, width: 20 },
  nameInput: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
  footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },

  gameContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'space-evenly',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
  },
  turnBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 15, alignItems: 'center',
    width: '100%', borderWidth: 1,
  },
  turnLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  turnName:  { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },

  wordCard: {
    width: '100%',
    height: 150,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    elevation: 8,
    shadowColor: '#ff6d00',
    shadowRadius: 12,
    shadowOpacity: 0.2,
    overflow: 'hidden',
  },
  wordCardHidden: { borderStyle: 'dashed', borderColor: '#222', backgroundColor: '#080808' },
  wordText: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  wordSub:  { color: C.dim, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 6, textAlign: 'center' },
  hiddenMark: { color: '#222', fontSize: 60, fontWeight: '900' },
  hiddenSub:  { color: '#444', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  rulesBox: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  ruleItem: { color: C.dim, fontSize: 13, fontWeight: '600' },

  timerWrap:  { alignItems: 'center', gap: 10 },
  timerLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },

  actionRow: { flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'center' },

  verdictBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24, padding: 24, alignItems: 'center',
    width: '100%', borderWidth: 2,
  },
  verdictText: { fontSize: 19, fontWeight: '900', textAlign: 'center', lineHeight: 28 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  errorCard: {
    backgroundColor: '#111', borderRadius: 30, padding: 30,
    width: '100%', borderWidth: 2, alignItems: 'center',
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  errorEmoji: { fontSize: 50, marginBottom: 15 },
  errorTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 15 },
  errorText:  { color: '#DDD', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 25 },
  errorBtn:   { paddingVertical: 16, borderRadius: 20, width: '100%', alignItems: 'center' },
  errorBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});