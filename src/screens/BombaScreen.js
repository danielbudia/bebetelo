import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Vibration, Platform
} from 'react-native';
import { C } from '../theme';
import { CATEGORIAS_BOMBA } from '../data';
import { pick } from '../utils';
import { GameHeader, ExitModal, GlowButton } from '../components/UI';

const MIN_T = 20, MAX_T = 45;

export default function BombaScreen({ onExit }) {
  const [phase, setPhase] = useState('idle');
  const [category, setCategory] = useState('¿LISTOS?');
  const [showExit, setShowExit] = useState(false);

  const timeLeft = useRef(0);
  const totalTime = useRef(0);
  const bombTimer = useRef(null);
  const animationLoop = useRef(null);
  
  // Animaciones existentes
  const bombAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const explodeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // --- NUEVA ANIMACIÓN DE ENTRADA ---
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Disparamos la entrada al montar el componente
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => clearAll();
  }, []);

  const clearAll = useCallback(() => {
    clearInterval(bombTimer.current);
    if (animationLoop.current) animationLoop.current.stop();
    Vibration.cancel();
  }, []);

  const getVisualSpeed = (t) => {
    if (t > 15) return 700;
    if (t > 8) return 350;
    if (t > 4) return 200;
    return 100;
  };

  const getVibrationStrength = () => {
    const elapsed = totalTime.current - timeLeft.current;
    const progress = elapsed / totalTime.current;
    return 20 + (progress * 230); 
  };

  const runPulse = (duration) => {
    animationLoop.current = Animated.sequence([
      Animated.timing(bombAnim, { toValue: 1.3, duration: duration * 0.3, useNativeDriver: true }),
      Animated.timing(bombAnim, { toValue: 1, duration: duration * 0.7, useNativeDriver: true }),
    ]);

    animationLoop.current.start(() => {
      if (timeLeft.current > 0) {
        runPulse(getVisualSpeed(timeLeft.current));
      }
    });
  };

  const startBomba = () => {
    clearAll();
    const cat = pick(CATEGORIAS_BOMBA);
    const randomTime = Math.floor(Math.random() * (MAX_T - MIN_T + 1)) + MIN_T;
    
    setCategory(cat);
    setPhase('ticking');
    timeLeft.current = randomTime;
    totalTime.current = randomTime;

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    runPulse(getVisualSpeed(timeLeft.current));

    bombTimer.current = setInterval(() => {
      timeLeft.current--;
      const strength = getVibrationStrength();
      Vibration.vibrate(strength); 
      if (timeLeft.current <= 0) {
        clearAll();
        explode();
      }
    }, 1000);
  };

  const explode = () => {
    setPhase('exploded');
    Vibration.vibrate([0, 500, 110, 500, 110, 1000]);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.sequence([
        ...Array(12).fill(null).map((_, i) =>
          Animated.timing(shakeAnim, { toValue: i % 2 === 0 ? 25 : -25, duration: 40, useNativeDriver: true })
        ),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]),
      Animated.spring(explodeAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true })
    ]).start();
  };

  const reset = () => {
    clearAll();
    bombAnim.setValue(1);
    glowAnim.setValue(0);
    explodeAnim.setValue(0);
    flashAnim.setValue(0);
    shakeAnim.setValue(0);
    setCategory('¿LISTOS?');
    setPhase('idle');
  };

  const bgRed = glowAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: ['rgba(255,23,68,0)', 'rgba(255,23,68,0.2)'] 
  });

  // --- INTERPOLACIONES DE ENTRADA ---
  const headerY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] });
  const contentY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const contentOpacity = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ff1744', opacity: flashAnim, zIndex: 99, pointerEvents: 'none' }]} />

      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: entryAnim }}>
        <GameHeader title="💣 Bomba" color={C.red} onExit={() => { clearAll(); setShowExit(true); }} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: bgRed, pointerEvents: 'none', marginTop: 56 }]} />

      <Animated.View style={[s.body, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
        {phase !== 'exploded' ? (
          <>
            <View style={s.catBox}>
              <Text style={s.catLabel}>CATEGORÍA</Text>
              <Text style={s.catText}>{category}</Text>
            </View>

            <Animated.Text style={[s.bombEmoji, {
              transform: [
                { scale: bombAnim }, 
                { translateX: shakeAnim },
              ],
            }]}>
              💣
            </Animated.Text>

            <Text style={s.hint}>Di una palabra y pasa el móvil</Text>

            {phase === 'idle' && (
              <GlowButton label="ENCENDER MECHA" onPress={startBomba} color={C.red} />
            )}
          </>
        ) : (
          <View style={s.explodedContainer}>
            <Animated.Text style={[s.explodeEmoji, { transform: [{ scale: explodeAnim }] }]}>💥</Animated.Text>
            <Text style={s.explodeTitle}>¡BOOM!</Text>
            <Text style={s.explodeSub}>EL QUE TENGA EL MÓVIL BEBE</Text>
            <GlowButton label="OTRA RONDA" onPress={reset} color={C.red} style={{ marginTop: 20 }} />
          </View>
        )}
      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { reset(); setShowExit(false); onExit(); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  catBox: {
    backgroundColor: C.card, borderRadius: 20, padding: 25,
    alignItems: 'center', gap: 10, width: '100%',
    borderWidth: 2, borderColor: C.red + '33', marginBottom: 40
  },
  catLabel: { color: C.red, fontSize: 12, fontWeight: '900', letterSpacing: 4 },
  catText: { color: C.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  bombEmoji: { fontSize: 130, marginBottom: 40 },
  hint: { color: C.dim, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  explodedContainer: { alignItems: 'center', justifyContent: 'center' },
  explodeEmoji: { fontSize: 160 },
  explodeTitle: { color: C.text, fontSize: 56, fontWeight: '900', letterSpacing: 2, marginTop: -20 },
  explodeSub: { color: C.red, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 10 },
});