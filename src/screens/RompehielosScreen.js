import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { C } from '../theme';
import { RETOS_ROMPEHIELOS } from '../data';
import { GameHeader, ExitModal, GlowButton, ActionButton } from '../components/UI';

export default function RompehielosScreen({ onExit }) {
  const [phase, setPhase]   = useState('idle'); // idle | active | done | timeout
  const [reto, setReto]     = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [showExit, setShowExit] = useState(false);
  const used = useRef(new Set());
  const timerRef = useRef(null);

  const cardAnim  = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(0)).current;
  const dangerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => () => clearInterval(timerRef.current), []);

  const flipIn = () => {
    Animated.sequence([
      Animated.timing(cardAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const startDanger = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dangerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dangerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  };

  const drawReto = useCallback(() => {
    clearInterval(timerRef.current);
    dangerAnim.stopAnimation();
    dangerAnim.setValue(0);

    if (used.current.size >= RETOS_ROMPEHIELOS.length) used.current.clear();
    let idx;
    do { idx = Math.floor(Math.random() * RETOS_ROMPEHIELOS.length); }
    while (used.current.has(idx));
    used.current.add(idx);

    setReto(RETOS_ROMPEHIELOS[idx]);
    setTimeLeft(45);
    flipIn();
    setPhase('active');

    // timer
    let t = 45;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 3) startDanger();
      if (t <= 0) {
        clearInterval(timerRef.current);
        dangerAnim.stopAnimation();
        setPhase('timeout');
      }
    }, 1000);
  }, []);

  const complete = () => {
    clearInterval(timerRef.current);
    dangerAnim.stopAnimation();
    setPhase('done');
  };

  const timerColor = dangerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.green, C.red],
  });

  return (
    <View style={s.root}>
      <GameHeader title="🔥 Rompehielos" onExit={() => setShowExit(true)} />

      <View style={s.body}>
        {/* carta */}
        <Animated.View style={[s.card, { opacity: cardAnim, borderColor: phase === 'timeout' ? C.red + '88' : C.blue + '66' }]}>
          {phase === 'idle' && <Text style={s.cardHint}>Toca para empezar</Text>}
          {phase !== 'idle' && reto && (
            <Text style={s.retoText}>{phase === 'done' ? '✅ ¡Reto cumplido!\nPulsa para el siguiente.' : reto.text}</Text>
          )}
        </Animated.View>

        {/* timer */}
        {phase === 'active' && (
          <View style={s.timerWrap}>
            <Animated.Text style={[s.timerNum, { color: timerColor }]}>{timeLeft}</Animated.Text>
            <Text style={s.timerLabel}>segundos</Text>
          </View>
        )}

        {/* timeout */}
        {phase === 'timeout' && (
          <View style={s.timeoutBox}>
            <Text style={s.timeoutTitle}>⏰ ¡TIEMPO!</Text>
            <Text style={s.timeoutSub}>¡BEBE {reto?.penalty ?? 3} TRAGOS!</Text>
          </View>
        )}

        {/* botones */}
        <View style={s.btns}>
          <GlowButton label="🔀 NUEVO RETO" onPress={drawReto} color={C.blue} style={{ width: '90%' }} />
          {phase === 'active' && (
            <ActionButton label="✅ RETO CUMPLIDO" onPress={complete} color={C.green} style={{ width: '90%' }} />
          )}
        </View>
      </View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { clearInterval(timerRef.current); setShowExit(false); onExit(); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  card: {
    width: '100%', minHeight: 180, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  cardHint: { color: C.dim, fontSize: 18, fontStyle: 'italic' },
  retoText: { color: C.text, fontSize: 18, lineHeight: 28, textAlign: 'center', fontWeight: '500' },
  timerWrap: { alignItems: 'center', gap: 4 },
  timerNum: { fontSize: 64, fontWeight: '900' },
  timerLabel: { color: C.dim, fontSize: 12, letterSpacing: 2 },
  timeoutBox: {
    backgroundColor: C.red + '22', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.red, width: '100%', alignItems: 'center', gap: 8,
  },
  timeoutTitle: { color: C.red, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  timeoutSub: { color: C.text, fontSize: 18, fontWeight: '800' },
  btns: { width: '100%', alignItems: 'center', gap: 12 },
});
