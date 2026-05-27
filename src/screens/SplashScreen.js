import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Pressable, Dimensions
} from 'react-native';
import { C } from '../theme';

const { width } = Dimensions.get('window');

const MSGS = [
  'Preparando hielos...',
  'Mezclando tragos...',
  'Sirviendo copas...',
  'Casi listo...',
  '¡A beber!',
];

export default function SplashScreen({ onReady }) {
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState(MSGS[0]);
  
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const liquidH     = useRef(new Animated.Value(0)).current;
  const phaseAnim   = useRef(new Animated.Value(0)).current; 
  const neonOpacity = useRef(new Animated.Value(1)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const bubbleAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const flicker = () => {
      Animated.sequence([
        Animated.timing(neonOpacity, { toValue: 0.2, duration: 40, useNativeDriver: true }),
        Animated.timing(neonOpacity, { toValue: 1,   duration: 40, useNativeDriver: true }),
        Animated.timing(neonOpacity, { toValue: 0.4, duration: 30, useNativeDriver: true }),
        Animated.timing(neonOpacity, { toValue: 1,   duration: 100, useNativeDriver: true }),
      ]).start(() => setTimeout(flicker, Math.random() * 5000 + 1000));
    };
    flicker();
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const animateBubble = (anim, delay) => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ]).start(() => animateBubble(anim, Math.random() * 1000));
    };
    bubbleAnims.forEach((anim, i) => animateBubble(anim, i * 600));
  }, []);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 4) + 1;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setStatus(MSGS[4]);
        startTransition();
      } else {
        if (current < 30)       setStatus(MSGS[0]);
        else if (current < 60)  setStatus(MSGS[1]);
        else if (current < 85)  setStatus(MSGS[2]);
        else if (current < 100) setStatus(MSGS[3]);
      }
      setPct(current);
      Animated.timing(liquidH, { toValue: current / 100, duration: 400, useNativeDriver: false }).start();
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const startTransition = () => {
    setTimeout(() => {
      Animated.timing(phaseAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    }, 800);
  };

  const glassScale    = phaseAnim.interpolate({ inputRange: [0, 1],   outputRange: [1, 0.5] });
  const glassOpacity  = phaseAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0] });
  const btnTranslateY = phaseAnim.interpolate({ inputRange: [0, 1],   outputRange: [100, 0] });
  const btnOpacity    = phaseAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>

      <View style={s.logoContainer}>
        <View style={s.logoRow}>
          <Text style={s.textWhite}>BEBE</Text>
          <Animated.Text style={[s.textNeon, { opacity: neonOpacity }]}>TELO</Animated.Text>
        </View>
        <Text style={s.subTitle}>FREE PARTY APP</Text>
      </View>

      <View style={s.centerZone}>

        {/* VASO */}
        <Animated.View style={[s.glassWrap, { opacity: glassOpacity, transform: [{ scale: glassScale }] }]}>

          {/* Contenedor del vaso — forma de highball con taper sutil */}
          <View style={s.glassOuter}>

            {/* Cuerpo del vaso */}
            <View style={s.glassBody}>

              {/* Líquido */}
              <Animated.View style={[s.liquid, {
                height: liquidH.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}>
                {/* Brillo en la superficie */}
                <View style={s.liquidSurface} />
                {/* Shimmer interno del líquido */}
                <View style={s.liquidShimmer} />
                {/* Burbujas */}
                {bubbleAnims.map((anim, i) => (
                  <Animated.View key={i} style={[s.bubble, {
                    left: (18 + i * 22) + '%',
                    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0] }),
                    transform: [{
                      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] }),
                    }],
                  }]} />
                ))}
              </Animated.View>

              {/* Reflejo izquierdo del cristal — corre toda la altura */}
              <View style={s.reflLeft} />
              {/* Reflejo derecho — más corto y sutil */}
              <View style={s.reflRight} />

            </View>

            {/* Rim superior — borde iluminado */}
            <View style={s.rim} />

            {/* Base del vaso */}
            <View style={s.base} />
           
          </View>

          <Text style={s.pctText}>{pct}%</Text>
          <Text style={s.statusText}>{status.toUpperCase()}</Text>
        </Animated.View>

        {/* BOTÓN */}
        <Animated.View style={[s.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnTranslateY }] }]}>
          <Pressable
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.9, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1,   useNativeDriver: true }).start()}
            onPress={onReady}
          >
            <Animated.View style={[s.mainBtn, { transform: [{ scale: btnScale }] }]}>
              <Text style={s.btnText}>¡A BEBER!</Text>
              <View style={s.btnGlow} />
            </Animated.View>
          </Pressable>
        </Animated.View>

      </View>

      <Text style={s.footer}>RESPONSABILIDAD +18</Text>
    </Animated.View>
  );
}

const GLASS_W  = 72;   // ancho del vaso
const GLASS_H  = 120;  // alto del cuerpo
const RIM_H    = 4;    // alto del rim
const BASE_H   = 6;    // alto de la base

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  logoContainer: { alignItems: 'center' },
  logoRow: { flexDirection: 'row' },
  textWhite: { fontSize: 60, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  textNeon: {
    fontSize: 60, fontWeight: '900', color: C.violet, fontStyle: 'italic',
    textShadowColor: C.violet, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subTitle: { color: C.dim, letterSpacing: 8, fontSize: 10, marginTop: -5 },
  centerZone: { height: 270, width: '100%', alignItems: 'center', justifyContent: 'center' },
  glassWrap: { alignItems: 'center' },

  /* Contenedor externo — añade sombra al conjunto */
  glassOuter: {
    alignItems: 'center',
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },

  /* Rim — borde superior brillante, ligeramente más ancho que el cuerpo */
  rim: {
    width: GLASS_W + 6,
    height: RIM_H,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopLeftRadius:  3,
    borderTopRightRadius: 3,
    // Sombra blanca hacia arriba simulando cristal grueso
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  /* Cuerpo del vaso — highball con taper de 4px (más estrecho arriba) */
  glassBody: {
    width:  GLASS_W,
    height: GLASS_H,
    // Taper visual: border izquierdo/derecho en transparente crean el efecto cónico sutil
    borderLeftWidth:   2,
    borderRightWidth:  2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
    borderBottomLeftRadius:  6,
    borderBottomRightRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  /* Líquido */
  liquid: {
    width: '100%',
    backgroundColor: C.violet,
    position: 'absolute',
    bottom: 0,
    opacity: 0.88,
  },

  /* Superficie del líquido */
  liquidSurface: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },

  /* Shimmer interno — franja diagonal translúcida */
  liquidShimmer: {
    position: 'absolute',
    top: 4,
    left: '15%',
    width: '18%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ skewX: '-8deg' }],
  },

  /* Burbujas */
  bubble: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 3,
  },

  /* Reflejo izquierdo — línea fina brillante de arriba a abajo */
  reflLeft: {
    position: 'absolute',
    top: 8,
    left: 7,
    width: 2,
    height: '78%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1,
  },

  /* Reflejo derecho — más corto y difuso */
  reflRight: {
    position: 'absolute',
    top: 16,
    right: 10,
    width: 4,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
  },

  /* Base — plataforma más gruesa que el cuerpo */
  base: {
    width: GLASS_W + 10,
    height: BASE_H,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  /* Glow bajo la base — cambia con el nivel de líquido */
  baseGlow: {
    width: GLASS_W + 20,
    height: 12,
    backgroundColor: C.violet,
    borderRadius: 8,
    opacity: 0.15,
    marginTop: 2,
    // blur simulado con sombra
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  pctText:   { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 18 },
  statusText: { color: C.violet, fontSize: 12, letterSpacing: 3, fontWeight: '600', marginTop: 5 },

  btnWrap: { width: '80%', position: 'absolute' },
  mainBtn: {
    height: 70,
    borderRadius: 20,
    backgroundColor: C.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  btnText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  btnGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff55',
    opacity: 0.3,
  },
  footer: { color: '#222', fontSize: 10, letterSpacing: 5 },
});