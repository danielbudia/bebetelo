import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { C } from '../theme';
import { FRASES_YO_NUNCA } from '../data';
// Ya no necesitamos shuffle aquí porque usaremos la lógica del Set
import { GameHeader, ExitModal } from '../components/UI';

export default function YoNuncaScreen({ onExit }) {
  // 1. Iniciamos con un índice aleatorio
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FRASES_YO_NUNCA.length));
  const [showExit, setShowExit] = useState(false);
  
  // 2. Referencia para guardar los índices ya usados (Lógica anti-repetición)
  const used = useRef(new Set([idx])); 

  const phraseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const next = () => {
    // Animaciones
    Animated.sequence([
      Animated.parallel([
        Animated.timing(phraseAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(phraseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    // --- LÓGICA ANTI-REPETICIÓN ---
    // Si ya usamos todas las frases, vaciamos el set para empezar de nuevo
    if (used.current.size >= FRASES_YO_NUNCA.length) {
      used.current.clear();
    }

    let newIdx;
    // Buscamos un índice que no esté en el set de usados
    do {
      newIdx = Math.floor(Math.random() * FRASES_YO_NUNCA.length);
    } while (used.current.has(newIdx));

    // Lo añadimos a usados y actualizamos el estado
    used.current.add(newIdx);
    setIdx(newIdx);
  };

  return (
    <View style={s.root}>
      <GameHeader title="🙈 Yo Nunca" onExit={() => setShowExit(true)} />

      <TouchableOpacity style={s.tapArea} onPress={next} activeOpacity={1}>
        
        <Animated.View style={[s.card, { opacity: phraseAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.prefix}>Yo nunca…</Text>
          <Text style={s.phrase}>{FRASES_YO_NUNCA[idx]}</Text>
        </Animated.View>

        <View style={s.drinkHint}>
          <Text style={s.drinkEmoji}>🍺</Text>
          <Text style={s.drinkText}>Si lo has hecho → bebe 1 trago</Text>
        </View>

        <Text style={s.tapHint}>Toca en cualquier parte para la siguiente frase →</Text>
      </TouchableOpacity>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); onExit(); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  tapArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 28 },
  card: {
    backgroundColor: C.card, borderRadius: 24,
    borderWidth: 1.5, borderColor: C.green + '55',
    padding: 32, width: '100%', gap: 16,
    alignItems: 'center',
    shadowColor: C.green, shadowOpacity: 0.15, shadowRadius: 20,
  },
  prefix: { color: C.green, fontSize: 14, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' },
  phrase: { color: C.text, fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 32 },
  drinkHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drinkEmoji: { fontSize: 22 },
  drinkText: { color: C.dim, fontSize: 14 },
  tapHint: { color: C.dim + '88', fontSize: 12, letterSpacing: 1, textAlign: 'center' },
});