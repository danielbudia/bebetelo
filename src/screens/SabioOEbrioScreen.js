import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Vibration,
  ScrollView, TextInput, Platform, KeyboardAvoidingView, Modal, Easing,
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, CountSelector, GlowButton, ActionButton } from '../components/UI';
import { PREGUNTAS_SABIO } from '../data';

const ACCENT = C.lime;
const TIMER_TOTAL = 10;
const LETTERS = ['A', 'B', 'C', 'D'];

const PREGUNTAS = shuffle([...PREGUNTAS_SABIO]);
let qIdx = 0;
const getNextQ = () => PREGUNTAS[qIdx++ % PREGUNTAS.length];

const SIZE = 120;

const CircularTimer = ({ fillRatio, timeLeft }) => {
  const timerColor = fillRatio > 0.5 ? ACCENT : fillRatio > 0.25 ? C.gold : C.red;
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE,
        borderRadius: SIZE / 2, borderWidth: 8, borderColor: '#1a1a1a',
      }} />
      <Text style={{ fontSize: 38, fontWeight: '900', color: timerColor, zIndex: 10 }}>
        {timeLeft}
      </Text>
      <ArcOverlay ratio={fillRatio} color={timerColor} />
    </View>
  );
};

const ArcOverlay = ({ ratio, color }) => {
  const r = SIZE / 2;
  const borderW = 8;
  const full   = ratio >= 1;
  const threeQ = ratio >= 0.75;
  const half   = ratio >= 0.5;
  const quadStyle = { position: 'absolute', width: r, height: r, overflow: 'hidden' };
  const circHalf  = {
    position: 'absolute', width: SIZE, height: SIZE,
    borderRadius: r, borderWidth: borderW, borderColor: color,
  };
  return (
    <View style={{ position: 'absolute', width: SIZE, height: SIZE }}>
      <View style={[quadStyle, { top: 0, right: 0 }]}>
        <Animated.View style={[circHalf, { top: 0, left: -r }]} />
      </View>
      {(half || threeQ || full) && (
        <View style={[quadStyle, { bottom: 0, right: 0 }]}>
          <View style={[circHalf, { bottom: 0, left: -r }]} />
        </View>
      )}
      {(threeQ || full) && (
        <View style={[quadStyle, { bottom: 0, left: 0 }]}>
          <View style={[circHalf, { bottom: 0, right: -r }]} />
        </View>
      )}
      {full && (
        <View style={[quadStyle, { top: 0, left: 0 }]}>
          <View style={[circHalf, { top: 0, right: -r }]} />
        </View>
      )}
    </View>
  );
};

const OptionButton = ({ letter, text, state: optState, onPress, disabled }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  const cardStyle = optState === 'correct'
    ? { borderColor: C.green + '99', backgroundColor: C.green + '15' }
    : optState === 'wrong'
    ? { borderColor: C.red + '99',   backgroundColor: C.red   + '15' }
    : optState === 'reveal'
    ? { borderColor: C.green + '66', backgroundColor: C.green + '0D' }
    : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' };
  const letterColor = optState === 'correct' ? C.green : optState === 'wrong' ? C.red : optState === 'reveal' ? C.green : ACCENT;
  const textColor   = optState === 'correct' ? C.green : optState === 'wrong' ? C.red : optState === 'reveal' ? C.green : C.text;
  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={1}>
      <Animated.View style={[s.optBtn, cardStyle, { transform: [{ scale: pressAnim }] }]}>
        <Text style={[s.optLetter, { color: letterColor }]}>{letter}</Text>
        <Text style={[s.optText,   { color: textColor   }]}>{text}</Text>
        {(optState === 'correct' || optState === 'reveal') && (
          <Text style={{ color: C.green, fontWeight: '900', fontSize: 16, marginLeft: 'auto' }}>✓</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SabioOEbrioScreen({ onExit = () => {} }) {
  const [phase, setPhase]           = useState('setup');
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers]       = useState(['', '', '', '']);
  const [turnIdx, setTurnIdx]       = useState(0);
  const [currentQ, setCurrentQ]     = useState(null);
  const [timeLeft, setTimeLeft]     = useState(TIMER_TOTAL);
  const [fillRatio, setFillRatio]   = useState(1);
  const [selected, setSelected]     = useState(null);
  const [verdict, setVerdict]       = useState(null);
  const [showExit, setShowExit]     = useState(false);
  const [showError, setShowError]   = useState(false);

  const entryAnim  = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef(null);
  const timeRef    = useRef(TIMER_TOTAL);

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

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleNameChange = (text, index) => {
    const arr = [...players]; arr[index] = text; setPlayers(arr);
  };

  const startGame = () => {
    if (players.some(n => n.trim() === '')) { setShowError(true); return; }
    setPlayers(players.map(n => n.trim()));
    setTurnIdx(0);
    setPhase('game');
  };

  const endRound = useCallback((result, sel) => {
    clearInterval(timerRef.current);
    setVerdict(result);
    setSelected(sel);
    revealAnim.setValue(0);
    Animated.spring(revealAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    Vibration.vibrate(result === 'win' ? [0, 80, 80, 80] : 300);
    setPhase('reveal');
  }, []);

  // ── FIX: cargamos la pregunta, la pasamos directamente al estado
  //    y cambiamos la fase DESPUÉS de tenerla, evitando el render negro
  const handleReveal = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const q = getNextQ();

    setSelected(null);
    setVerdict(null);
    timeRef.current = TIMER_TOTAL;
    setTimeLeft(TIMER_TOTAL);
    setFillRatio(1);
    setCurrentQ(q);        // primero guardamos la pregunta
    setPhase('question');  // luego cambiamos la fase

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endRound('timeout', null);
          return 0;
        }
        const nextTime = prev - 1;
        setFillRatio(nextTime / TIMER_TOTAL);
        return nextTime;
      });
    }, 1000);
  };

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    const result = idx === currentQ.ans ? 'win' : 'lose';
    endRound(result, idx);
  };

  const nextRound = () => {
    setTurnIdx(i => (i + 1) % players.length);
    setSelected(null);
    setVerdict(null);
    setCurrentQ(null);
    setPhase('game');
  };

  const hY           = headerY.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const verdictColor = verdict === 'win' ? C.green : C.red;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.root}
    >
      <Animated.View style={{ transform: [{ translateY: hY }], opacity: entryAnim }}>
        <GameHeader title="Sabio o Ebrio" color={ACCENT} onExit={() => setShowExit(true)} />
      </Animated.View>

      <Animated.View style={[s.body, {
        opacity: entryAnim,
        transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }]}>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉN JUEGA?</Text>
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
                    placeholder="Nombre del jugador..."
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

        {/* ── GAME (pregunta oculta) ── */}
        {phase === 'game' && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>LE TOCA A</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>

            <View style={[s.qCard, s.qCardHidden]}>
              <Text style={s.hiddenMark}>?</Text>
              <Text style={s.hiddenSub}>LA PREGUNTA ESTÁ OCULTA</Text>
            </View>

            <View style={s.rulesBox}>
              <Text style={s.ruleItem}>🧠  4 opciones, solo 1 es correcta</Text>
              <Text style={s.ruleItem}>⏱  10 segundos para responder</Text>
              <Text style={s.ruleItem}>✅  Acierto → te libras y eliges víctima</Text>
              <Text style={s.ruleItem}>❌  Fallo o tiempo → 2 tragos</Text>
            </View>

            <GlowButton label="👁  VER LA PREGUNTA" onPress={handleReveal} color={ACCENT} />
          </View>
        )}

        {/* ── QUESTION & REVEAL ── */}
        {/* FIX: separamos las condiciones para que nunca rendericemos sin currentQ */}
        {phase === 'question' && currentQ && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>TURNO DE</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>
            <View style={s.questionTopRow}>
              <CircularTimer fillRatio={fillRatio} timeLeft={timeLeft} />
            </View>
            <View style={[s.catBadge, { borderColor: ACCENT + '44' }]}>
              <Text style={[s.catText, { color: ACCENT }]}>{currentQ.cat}</Text>
            </View>
            <View style={s.qCard}>
              <Text style={[s.qText, { color: ACCENT }]}>{currentQ.q}</Text>
            </View>
            <View style={s.optionsBox}>
              {currentQ.opts.map((opt, i) => (
                <OptionButton
                  key={i}
                  letter={LETTERS[i]}
                  text={opt}
                  state={selected === i ? (i === currentQ.ans ? 'correct' : 'wrong') : 'idle'}
                  onPress={() => handleAnswer(i)}
                  disabled={selected !== null}
                />
              ))}
            </View>
          </View>
        )}

        {phase === 'reveal' && currentQ && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: verdictColor + '33' }]}>
              <Text style={s.turnLabel}>RESPONDIÓ</Text>
              <Text style={[s.turnName, { color: verdictColor }]}>{players[turnIdx]}</Text>
            </View>
            <Animated.View style={[s.verdictBox, { borderColor: verdictColor + '55', transform: [{ scale: revealAnim }] }]}>
              <Text style={[s.verdictText, { color: verdictColor }]}>
                {verdict === 'win'
                  ? `✅ ¡CORRECTO!\n${players[turnIdx]} se libra`
                  : verdict === 'timeout'
                  ? `⏱ ¡TIEMPO!\n${players[turnIdx]} bebe 2 tragos`
                  : `❌ ¡FALLASTE!\n${players[turnIdx]} bebe 2 tragos`}
              </Text>
            </Animated.View>
            <View style={s.optionsBox}>
              {currentQ.opts.map((opt, i) => (
                <OptionButton
                  key={i}
                  letter={LETTERS[i]}
                  text={opt}
                  state={i === currentQ.ans ? 'reveal' : (selected === i ? 'wrong' : 'idle')}
                  onPress={() => {}}
                  disabled
                />
              ))}
            </View>
            <GlowButton label="SIGUIENTE TURNO →" onPress={nextRound} color={ACCENT} />
          </View>
        )}

      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); onExit(); }}
      />

      {/* ── POPUP: sin cerebros — con más gracia ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.errorCard, { borderColor: ACCENT }]}>
            <Text style={s.errorEmoji}>🧠💨</Text>
            <Text style={[s.errorTitle, { color: ACCENT }]}>¡AQUÍ FALTA ALGUIEN!</Text>
            <Text style={s.errorText}>
              Hay un hueco vacío en la mesa y el hueco
              {' '}<Text style={{ color: ACCENT, fontWeight: '800' }}>no sabe jugar</Text>.{'\n\n'}
              Ponle nombre a <Text style={{ color: ACCENT, fontWeight: '800' }}>todos los jugadores</Text>
              {' '}antes de empezar a quemar neuronas... si es que os quedan.
            </Text>
            <TouchableOpacity
              style={[s.errorBtn, { backgroundColor: ACCENT }]}
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>¡ENTENDIDO, LISTILLO!</Text>
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
  nameInput:   { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
  footerBtn:   { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },

  gameContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'space-evenly',
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24,
  },
  turnBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 15, alignItems: 'center',
    width: '100%', borderWidth: 1,
  },
  turnLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  turnName:  { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },

  questionTopRow: { flexDirection: 'row', width: '100%', gap: 12, alignItems: 'center', justifyContent: 'center' },

  catBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(174,234,0,0.08)',
  },
  catText: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  qCard: {
    width: '100%', minHeight: 110,
    backgroundColor: '#111',
    borderRadius: 22, borderWidth: 2, borderColor: C.lime + '66',
    alignItems: 'center', justifyContent: 'center',
    padding: 22, elevation: 8,
    shadowColor: C.lime, shadowRadius: 12, shadowOpacity: 0.2,
  },
  qCardHidden: { borderStyle: 'dashed', borderColor: '#222', backgroundColor: '#080808' },
  qText:       { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 28 },
  hiddenMark:  { color: '#222', fontSize: 60, fontWeight: '900' },
  hiddenSub:   { color: '#444', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  optionsBox: { width: '100%', gap: 9 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12,
  },
  optLetter: { fontSize: 13, fontWeight: '900', minWidth: 22 },
  optText:   { fontSize: 15, fontWeight: '700', flex: 1 },

  rulesBox: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  ruleItem: { color: C.dim, fontSize: 13, fontWeight: '600' },

  verdictBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 22, padding: 22, alignItems: 'center',
    width: '100%', borderWidth: 2,
  },
  verdictText: { fontSize: 18, fontWeight: '900', textAlign: 'center', lineHeight: 28 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  errorCard: {
    backgroundColor: '#0f0f0f', borderRadius: 28, padding: 28,
    width: '100%', borderWidth: 2, alignItems: 'center',
    shadowColor: C.lime, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  errorEmoji:   { fontSize: 54, marginBottom: 14, letterSpacing: -4 },
  errorTitle:   { fontSize: 19, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 14 },
  errorText:    { color: '#bbb', fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 24 },
  errorBtn:     { paddingVertical: 15, borderRadius: 18, width: '100%', alignItems: 'center' },
  errorBtnText: { color: '#0a0a0a', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});