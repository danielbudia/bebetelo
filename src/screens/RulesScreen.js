import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing, Pressable, Dimensions, Platform
} from 'react-native';
import { C, GAME_COLORS } from '../theme';
import { JUEGOS_META } from '../data';

const { width } = Dimensions.get('window');

// ── COMPONENTE: TÍTULO NEÓN ROTO Y PARPADEANTE ──────────────────────────
function FlickeringTitle({ title, color }) {
  const flicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const runFlicker = () => {
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.4, duration: 70, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.3, duration: 50, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(Math.random() * 2000 + 1000),
      ]).start(() => runFlicker());
    };
    runFlicker();
  }, []);

  return (
   <Animated.Text 
      numberOfLines={1} 
      adjustsFontSizeToFit // Esto hace que el texto se encoja si no cabe
      minimumFontScale={0.7} // Evita que se haga demasiado diminuto
      style={[s.headerTitle, { 
        color: '#FFF', 
        opacity: flicker,
        textShadowColor: color,
        textShadowRadius: 15,
        textShadowOffset: { width: 0, height: 0 }
      }]}
    >
      {title.toUpperCase()}
    </Animated.Text>
  );
}

// ── COMPONENTE: CARGA (CON MOVIMIENTO COMPLETO) ──────────────────────────
const LOADING_MSGS = {
  bomba:        ['Cortando cables...', 'Encendiendo mecha...'],
  mayormenor:   ['Repartiendo cartas...', 'Preparando el mazo...'],
  caballos:     ['Calentando caballos...', 'Alineando en la salida...'],
  confesionario:['Encendiendo luces...', 'Buscando secretos...'],
  dosmentiras:  ['Detectando engaños...', 'Midiendo narices...'],
  rompehielos:  ['Subiendo la temperatura...', 'Preparando retos...'],
  yonunca:      ['Espiando historiales...', 'Lavando trapos sucios...'],
  mimica:        ['Cerrando bocas...', 'Calentando articulaciones...'],
  sabiooebrio:   ['Repasando la Wikipedia...', 'Contando neuronas...'],
  subasta:       ['Abriendo la bolsa...', 'Subiendo las apuestas...'],
  poetaRetrete:  ['Buscando rimas sucias...', 'Inspiración de váter...'],
};

export function GameLoadingOverlay({ gameKey, onDone }) {
  const theme = GAME_COLORS[gameKey] || { accent: C.violet, icon: '🔥' };
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const [msgIdx, setMsgIdx] = useState(0);
  const msgs = LOADING_MSGS[gameKey] || ['Cargando...', 'Preparando...'];

  useEffect(() => {
    // Aparecer suave
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Pulso constante del emoji (como un latido)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Carga de la barra
    Animated.timing(progress, { 
      toValue: 1, 
      duration: 2500, 
      useNativeDriver: false 
    }).start();

    const t1 = setTimeout(() => setMsgIdx(1), 1200);
    const done = setTimeout(onDone, 2800);
    
    return () => { clearTimeout(t1); clearTimeout(done); };
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[s.loadRoot, { opacity, zIndex: 99999 }]}>
      
      {/* Icono con el mismo resplandor que el resto del juego */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[s.loadIconNeon, { textShadowColor: theme.accent }]}>
          {theme.icon}
        </Text>
      </Animated.View>

      {/* Usamos el mismo título parpadeante para los mensajes de carga */}
      <View style={{ height: 40, marginBottom: 30 }}>
        <FlickeringTitle title={msgs[msgIdx]} color={theme.accent} />
      </View>
      
      {/* Barra de progreso: Un tubo de neón simple */}
      <View style={s.neonBarTrack}>
        <Animated.View style={[s.neonBarFill, { 
          width: barWidth, 
          backgroundColor: theme.accent,
          shadowColor: theme.accent,
        }]}>
          {/* El brillo de la punta del neón */}
          <View style={[s.neonBarTip, { backgroundColor: '#FFF', shadowColor: theme.accent }]} />
        </Animated.View>
      </View>

    </Animated.View>
  );
}
// ── PANTALLA DE NORMAS (EQUILIBRADA) ───────────────────────────────────────
export default function RulesScreen({ gameKey, onBack, onStart }) {
  const data = JUEGOS_META[gameKey];
  const theme = GAME_COLORS[gameKey] || { accent: C.violet, icon: '🔥' };
  const [loading, setLoading] = useState(false);
  
  const sectionsAnim = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    Animated.stagger(150, sectionsAnim.map(anim => 
      Animated.spring(anim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true })
    )).start();
  }, [gameKey]);

  if (!data) return null;

  return (
    <View style={s.root}>
      {/* Header con Neón Roto */}
      {/* Header con Neón y X Circular */}
<View style={[s.header, { borderBottomColor: theme.accent + '22' }]}>
  <Pressable 
    onPress={onBack} 
    hitSlop={15}
    style={({ pressed }) => [
      s.backCircle, 
      { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }, 
      pressed && { transform: [{ scale: 0.9 }], backgroundColor: theme.accent + '30' }
    ]}
  >
    <Text style={[s.backX, { color: theme.accent }]}>✕</Text>
  </Pressable>
  
  <View style={s.titleContainer}>
    <FlickeringTitle title={data.titulo} color={theme.accent} />
  </View>

  {/* Este View vacío compensa el ancho del botón para que el título quede centrado perfecto */}
  <View style={{ width: 42 }} /> 
</View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.section, { 
          opacity: sectionsAnim[0], 
          borderColor: theme.accent + '22',
          transform: [{ translateY: sectionsAnim[0].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
        }]}>
          <Text style={[s.sectionHead, { color: theme.accent }]}>COMO SE JUEGA</Text>
          <Text style={s.sectionText}>{data.comoFunciona}</Text>
        </Animated.View>

        <Animated.View style={[s.section, { 
          opacity: sectionsAnim[1], 
          borderColor: theme.accent + '22',
          transform: [{ translateY: sectionsAnim[1].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
        }]}>
          <Text style={[s.sectionHead, { color: theme.accent }]}>REGLAS DE ORO</Text>
          {data.reglas.map((r, i) => (
            <View key={i} style={s.ruleRow}>
              <View style={[s.ruleDot, { backgroundColor: theme.accent }]} />
              <Text style={s.ruleText}>{r}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[s.section, { 
          opacity: sectionsAnim[2], 
          borderColor: theme.accent + '22',
          transform: [{ translateY: sectionsAnim[2].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
        }]}>
          <View style={s.penaltyInner}>
            <Text style={[s.sectionHead, { color: theme.accent }]}>EL CASTIGO</Text>
            <Text style={[s.penaltyText, { color: '#FFF' }]}>{data.castigo}</Text>
          </View>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        <Pressable 
          style={({ pressed }) => [
            s.startBtn, 
            { backgroundColor: theme.accent, shadowColor: theme.accent },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => setLoading(true)}
        >
          <Text style={s.startBtnText}>¡A JUGAR!</Text>
        </Pressable>
      </View>

      {loading && <GameLoadingOverlay gameKey={gameKey} onDone={() => onStart(gameKey)} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#050505',
    paddingTop: Platform.OS === 'ios' ? 35 : 10,
    borderBottomWidth: 1,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  backX: { fontSize: 18, fontWeight: '900' },
  titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { 
    fontSize: 18, fontWeight: '900', letterSpacing: 2, 
    fontStyle: 'italic', textAlign: 'center' 
  },
  
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 16 }, 
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24, padding: 22, borderWidth: 1, 
  },
  sectionHead: { fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
  sectionText: { color: '#CCC', fontSize: 14.5, lineHeight: 22 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  ruleText: { color: '#CCC', fontSize: 14.5, lineHeight: 21, flex: 1 },
  penaltyInner: { alignItems: 'center' },
  penaltyText: { fontSize: 19, fontWeight: '900', textAlign: 'center', fontStyle: 'italic' },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  startBtn: {
    height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10,
  },
  startBtnText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 5 },

  // Estilos de Carga (Estética Juego)
  loadRoot: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadIconNeon: { 
    fontSize: 100, 
    marginBottom: 20, 
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 }
  },
  neonBarTrack: { 
    width: '70%', 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 10, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  neonBarFill: { 
    height: '100%', 
    borderRadius: 10, 
    shadowRadius: 10, 
    shadowOpacity: 1,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  neonBarTip: {
    width: 4,
    height: '100%',
    shadowRadius: 5,
    shadowOpacity: 1,
  }
});