import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Pressable,
} from 'react-native';
import { C, R } from '../theme';

// ── botón gordo con glow ──────────────────────────────────────────────────
export function GlowButton({ label, onPress, color = C.violet, style, textStyle, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.glowBtn,
          { borderColor: color, opacity: disabled ? 0.4 : 1 },
        ]}
      >
        <Text style={[styles.glowBtnText, { color }, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── botón pequeño de acción ───────────────────────────────────────────────
export function ActionButton({ label, onPress, color = C.violet, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], ...style }}>
      <Pressable
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={onPress}
        style={[styles.actionBtn, { borderColor: color, backgroundColor: color + '22' }]}
      >
        <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── header de pantalla de juego ───────────────────────────────────────────
export function GameHeader({ title, onExit }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onExit} style={styles.exitBtn}>
        <Text style={styles.exitText}>SALIR</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

// ── selector de cantidad con + / − ────────────────────────────────────────
export function CountSelector({ value, onChange, min = 2, max = 12, label, color = C.violet }) {
  return (
    <View style={styles.countWrap}>
      {label ? <Text style={[styles.countLabel, { color }]}>{label}</Text> : null}
      <View style={styles.countRow}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          style={[styles.countBtn, { borderColor: color }]}
        >
          <Text style={[styles.countBtnText, { color }]}>−</Text>
        </TouchableOpacity>
        <Text style={styles.countVal}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          style={[styles.countBtn, { borderColor: color }]}
        >
          <Text style={[styles.countBtnText, { color }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── card de carta de baraja ───────────────────────────────────────────────
export function PlayingCard({ label, size = 'md', style }) {
  const isRed = label?.includes('♥') || label?.includes('♦');
  const sz = size === 'lg' ? 100 : 72;
  return (
    <View style={[styles.card, { width: sz, height: sz * 1.4 }, style]}>
      <Text style={[styles.cardLabel, { color: isRed ? C.red : C.text, fontSize: size === 'lg' ? 32 : 22 }]}>
        {label ?? '?'}
      </Text>
    </View>
  );
}

// ── modal de confirmación de salida ──────────────────────────────────────
export function ExitModal({ visible, onCancel, onConfirm }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.modalOverlay, { opacity }]}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>¿ABANDONAR PARTIDA?</Text>
        <Text style={styles.modalSub}>Si sales ahora, se pierde el progreso.</Text>
        <View style={styles.modalBtns}>
          <TouchableOpacity onPress={onCancel} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>CANCELAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={styles.modalConfirm}>
            <Text style={styles.modalConfirmText}>SALIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // GlowButton
 // GlowButton
  glowBtn: {
    height: 52,
    borderRadius: R,
    borderWidth: 1.5,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    textAlign: 'center',       
  },
  glowBtnText: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',      
    width: '100%',             
  },
  // ActionButton
  actionBtn: {
    height: 48,
    borderRadius: R,
    borderWidth: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // GameHeader
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(188,19,254,0.2)',
    backgroundColor: C.bg,
  },
  exitBtn: { width: 60 },
  exitText: { color: C.red, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  headerTitle: { color: C.text, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  // CountSelector
  countWrap: { alignItems: 'center', gap: 8 },
  countLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  countBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  countBtnText: { fontSize: 22, fontWeight: '300' },
  countVal: { color: C.text, fontSize: 32, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  // PlayingCard
  card: {
    backgroundColor: '#1e1e2f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(188,19,254,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontWeight: '800' },
  // ExitModal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalBox: {
    backgroundColor: '#1e1e2f',
    borderRadius: R,
    borderWidth: 1,
    borderColor: C.red,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800', letterSpacing: 2, marginBottom: 8 , textAlign: 'center' },
  modalSub: { color: C.dim, fontSize: 13, textAlign: 'center', marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1, height: 44, backgroundColor: '#333', borderRadius: R,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { color: C.text, fontWeight: '700' },
  modalConfirm: {
    flex: 1, height: 44, backgroundColor: C.red + '33', borderRadius: R,
    borderWidth: 1, borderColor: C.red,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { color: C.red, fontWeight: '700' },
});
