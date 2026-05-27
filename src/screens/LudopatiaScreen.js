import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Vibration,
  ScrollView, TextInput, Platform, KeyboardAvoidingView, Modal, Easing,
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, CountSelector, GlowButton, ActionButton } from '../components/UI';
import { RETOS_SUBASTA } from '../data';

// --- CONFIGURACIÓN DE TEMA: LUDOPATÍA (SUBATA) ---
const ACCENT = '#7209b7'; // El morado oscuro de GAME_COLORS.subasta
const TIMER_TOTAL = 15;

const CATEGORIAS = shuffle([...RETOS_SUBASTA]);
let catIdx = 0;
const getNextCat = () => CATEGORIAS[catIdx++ % CATEGORIAS.length];

// ─── LiquidTimer (Círculo de tiempo como en Mímica) ─────────────────────────
const LiquidTimer = ({ fillRatio, timeLeft }) => {
  const SIZE = 140;
  const liquidColor = fillRatio > 0.5 ? ACCENT : fillRatio > 0.25 ? C.gold : C.red;
  const levelAnim = useRef(new Animated.Value(fillRatio)).current;

  useEffect(() => {
    Animated.spring(levelAnim, { toValue: fillRatio, friction: 12, useNativeDriver: false }).start();
  }, [fillRatio]);

  const liquidH = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SIZE] });

  return (
    <View style={[s.timerCircle, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: liquidColor + '44' }]}>
      <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: liquidH, backgroundColor: liquidColor + '40' }} />
      <Text style={s.timerNum}>{timeLeft}</Text>
    </View>
  );
};

// ─── BidChip (Visualización de la apuesta actual) ────────────────────────────
const BidChip = ({ words, drinks, color }) => (
  <View style={[s.bidBox, { borderColor: color + '55', shadowColor: color }]}>
    <View style={s.bidCol}>
      <Text style={[s.bidNum, { color }]}>{words}</Text>
      <Text style={s.bidLabel}>PALABRAS</Text>
    </View>
    <Text style={[s.bidSep, { color: color + '33' }]}>×</Text>
    <View style={s.bidCol}>
      <Text style={[s.bidNum, { color }]}>{drinks}</Text>
      <Text style={s.bidLabel}>TRAGOS</Text>
    </View>
  </View>
);

export default function LudopatiaScreen({ onExit = () => {} }) {
  const [phase, setPhase]           = useState('setup');
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers]       = useState(['', '']);
  const [turnIdx, setTurnIdx]       = useState(0);
  const [challenger, setChallenger] = useState(0);
  const [currentCat, setCurrentCat] = useState('');
  const [bidWords, setBidWords]     = useState(1);
  const [bidDrinks, setBidDrinks]   = useState(1);
  const [timeLeft, setTimeLeft]     = useState(TIMER_TOTAL);
  const [fillRatio, setFillRatio]   = useState(1);
  const [verdict, setVerdict]       = useState(null);
  const [showExit, setShowExit]     = useState(false);
  const [showError, setShowError]   = useState(false);

  const entryAnim  = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef(null);

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

  const handleNameChange = (text, i) => { const a = [...players]; a[i] = text; setPlayers(a); };

  const startGame = () => {
    if (players.some(n => n.trim() === '')) { setShowError(true); return; }
    setPlayers(players.map(n => n.trim()));
    setTurnIdx(0);
    setCurrentCat(getNextCat());
    setPhase('bidding');
  };

  const raiseBid = (w, d) => {
    setBidWords(prev => prev + w);
    setBidDrinks(prev => prev + d);
    setTurnIdx(i => (i + 1) % players.length);
  };

  const callBluff = () => {
    setChallenger(turnIdx);
    setTurnIdx((turnIdx - 1 + players.length) % players.length);
    setPhase('challenge');
    let time = TIMER_TOTAL;
    timerRef.current = setInterval(() => {
      time -= 1;
      setTimeLeft(time);
      setFillRatio(time / TIMER_TOTAL);
      if (time <= 0) { clearInterval(timerRef.current); endChallenge('lose'); }
    }, 1000);
  };

  const endChallenge = (res) => {
    clearInterval(timerRef.current);
    setVerdict(res);
    revealAnim.setValue(0);
    Animated.spring(revealAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    Vibration.vibrate(res === 'win' ? [0, 80, 80, 80] : 300);
    setPhase('reveal');
  };

  const nextRound = () => {
    setCurrentCat(getNextCat());
    setBidWords(1); setBidDrinks(1);
    setVerdict(null); setFillRatio(1); setTimeLeft(TIMER_TOTAL);
    setPhase('bidding');
  };

  const hY = headerY.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const verdictColor = verdict === 'win' ? C.green : C.red;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <Animated.View style={{ transform: [{ translateY: hY }], opacity: entryAnim }}>
        <GameHeader title="Ludopatía" color={ACCENT} onExit={() => setShowExit(true)} />
      </Animated.View>

      <Animated.View style={[s.body, { opacity: entryAnim }]}>

        {/* SETUP */}
        {phase === 'setup' && (
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉNES APUESTAN?</Text>
            <View style={s.selectorBox}>
              <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={6} color={ACCENT} />
            </View>
            <ScrollView style={s.namesScroll} showsVerticalScrollIndicator={false}>
              {players.map((name, i) => (
                <View key={i} style={s.inputRow}>
                  <Text style={[s.inputNumber, { color: ACCENT }]}>{i + 1}</Text>
                  <TextInput style={s.nameInput} placeholder="Nombre..." placeholderTextColor="#444" value={name} onChangeText={t => handleNameChange(t, i)} maxLength={12} />
                </View>
              ))}
            </ScrollView>
            <View style={s.footerBtn}><GlowButton label="ENTRAR AL CASINO" onPress={startGame} color={ACCENT} /></View>
          </View>
        )}

        {/* BIDDING */}
        {phase === 'bidding' && (
          <View style={s.gameContainer}>
            <View style={[s.card, { borderColor: ACCENT + '44' }]}>
              <Text style={s.cardLabel}>CATEGORÍA</Text>
              <Text style={[s.cardText, { color: ACCENT }]}>{currentCat}</Text>
            </View>
            <BidChip words={bidWords} drinks={bidDrinks} color={ACCENT} />
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>TURNO DE SUBIR</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>
            <View style={s.raiseGrid}>
              <TouchableOpacity style={[s.raiseBtn, { borderColor: ACCENT + '44' }]} onPress={() => raiseBid(1, 0)}>
                <Text style={[s.raisePlus, { color: ACCENT }]}>+1 P</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.raiseBtn, { borderColor: C.orange + '44' }]} onPress={() => raiseBid(0, 1)}>
                <Text style={[s.raisePlus, { color: C.orange }]}>+1 T</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.raiseBtn, { borderColor: C.red + '44' }]} onPress={() => raiseBid(2, 1)}>
                <Text style={[s.raisePlus, { color: C.red }]}>+2/+1</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.bluffBtn} onPress={callBluff}>
              <Text style={s.bluffText}>💥 ¡NO HAY HUEVOS!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CHALLENGE */}
        {phase === 'challenge' && (
          <View style={s.gameContainer}>
            <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
              <Text style={s.turnLabel}>DEMUESTRA QUE NO MIENTES</Text>
              <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
            </View>
            <BidChip words={bidWords} drinks={bidDrinks} color={ACCENT} />
            <LiquidTimer fillRatio={fillRatio} timeLeft={timeLeft} />
            <View style={s.actionRow}>
              <ActionButton label="LOGRADO" onPress={() => endChallenge('win')} color={C.green} />
              <ActionButton label="FALLADO" onPress={() => endChallenge('lose')} color={C.red} />
            </View>
          </View>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && (
          <View style={s.gameContainer}>
            <Animated.View style={[s.verdictBox, { borderColor: verdictColor + '66', transform: [{ scale: revealAnim }] }]}>
              <Text style={[s.verdictText, { color: verdictColor }]}>
                {verdict === 'win' 
                  ? `✅ ¡CUMPLIÓ!\n${players[challenger]} bebe ${bidDrinks} tragos`
                  : `❌ ¡ERA UN FAROL!\n${players[turnIdx]} bebe ${bidDrinks} tragos`}
              </Text>
            </Animated.View>
            <GlowButton label="SIGUIENTE RONDA" onPress={nextRound} color={ACCENT} />
          </View>
        )}

      </Animated.View>

      <ExitModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); onExit(); }} />

      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.errorCard, { borderColor: ACCENT }]}>
            <Text style={s.errorEmoji}>💸</Text>
            <Text style={[s.errorTitle, { color: ACCENT }]}>¡MESA VACÍA!</Text>
            <Text style={s.errorText}>
              No hay subasta sin apostadores y no hay apostadores sin nombre.{'\n\n'}
              <Text style={{ color: ACCENT, fontWeight: '800' }}>Bautiza a todos los jugadores</Text>
              {' '}antes de que empiece el circo financiero.
            </Text>
            <TouchableOpacity
              style={[s.errorBtn, { backgroundColor: ACCENT }]}
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>¡VOY A ELLO, JEFE!</Text>
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
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222',
    paddingHorizontal: 15, height: 55,
  },
  inputNumber: { fontWeight: '900', fontSize: 16, marginRight: 15 },
  nameInput: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
  footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 },
  card: { width: '100%', backgroundColor: '#0c0c0c', borderRadius: 24, borderWidth: 2, padding: 20, alignItems: 'center' },
  cardLabel: { color: C.dim, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 5 },
  cardText: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  bidBox: { 
    flexDirection: 'row', width: '100%', backgroundColor: '#111', borderRadius: 24, 
    borderWidth: 2, padding: 20, justifyContent: 'center', gap: 30,
    elevation: 10, shadowRadius: 15, shadowOpacity: 0.3 
  },
  bidCol: { alignItems: 'center' },
  bidNum: { fontSize: 38, fontWeight: '900' },
  bidLabel: { color: C.dim, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  bidSep: { fontSize: 24, fontWeight: '900' },
  turnBadge: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1 },
  turnLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  turnName: { fontSize: 22, fontWeight: '900' },
  raiseGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  raiseBtn: { flex: 1, backgroundColor: '#0c0c0c', borderWidth: 1.5, borderRadius: 15, paddingVertical: 15, alignItems: 'center' },
  raisePlus: { fontSize: 18, fontWeight: '900' },
  bluffBtn: { width: '100%', backgroundColor: '#7209b722', borderColor: '#7209b7', borderWidth: 2, borderRadius: 20, paddingVertical: 18, alignItems: 'center' },
  bluffText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  timerCircle: { backgroundColor: '#080808', borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: 48, fontWeight: '900', color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 15 },
  verdictBox: { width: '100%', backgroundColor: '#0c0c0c', borderRadius: 24, borderWidth: 2, padding: 30, alignItems: 'center' },
  verdictText: { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 28 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorCard: { backgroundColor: '#111', borderRadius: 30, padding: 30, width: '100%', borderWidth: 2, alignItems: 'center' },
  errorEmoji: { fontSize: 50, marginBottom: 15 },
  errorTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  errorText: { color: '#ddd', textAlign: 'center', marginBottom: 20 },
  errorBtn: { paddingVertical: 15, borderRadius: 15, width: '100%', alignItems: 'center' },
  errorBtnText: { color: '#fff', fontWeight: '900' },
});