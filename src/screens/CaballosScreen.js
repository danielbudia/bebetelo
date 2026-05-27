import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, ScrollView
} from 'react-native';
import { C } from '../theme';
import { SUIT_KEYS, SUIT_EMOJI, FENCE_POS, TRACK_LEN, BARAJA } from '../data';
import { shuffle, pick } from '../utils';
import { GameHeader, ExitModal, GlowButton, CountSelector } from '../components/UI';

const { width } = Dimensions.get('window');
const TRACK_W = width - 32;
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const LANE_COLORS = {
  spades:   { primary: C.violet ?? '#7C3AED', glow: '#A78BFA' },
  hearts:   { primary: C.pink ?? '#DC2626', glow: '#F87171' },
  diamonds: { primary: '#60A5FA', glow: '#2563EB' },
  clubs:    { primary: C.green ?? '#059669', glow: '#34D399' },
};

export default function CaballosScreen({ onExit }) {
  const [phase, setPhase]         = useState('setup'); // setup | race
  const [apuesta, setApuesta]     = useState(2);
  const [positions, setPositions] = useState({ spades: 0, hearts: 0, diamonds: 0, clubs: 0 });
  const [fencePassed, setFencePassed] = useState([false, false]);
  const [log, setLog]             = useState('Toca para sacar la primera carta...');
  const [winner, setWinner]       = useState(null);
  const [popup, setPopup]         = useState(null);
  const [showExit, setShowExit]   = useState(false);
  const [finished, setFinished]   = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [rankings, setRankings]   = useState([]);

  // Animaciones de transiciones calcadas de la base
  const entryAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const posAnims = useRef({
    spades:   new Animated.Value(0),
    hearts:   new Animated.Value(0),
    diamonds: new Animated.Value(0),
    clubs:    new Animated.Value(0),
  }).current;

  const popupAnim = useRef(new Animated.Value(0)).current;
  const popupShakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const surpriseDeck = useRef([]);

  // Disparo de la animación inicial de carga
  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateHorse = (suit, newPct) => {
    Animated.spring(posAnims[suit], {
      toValue: newPct,
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const showPopup = (suit, val, action) => {
    setPopup({ suit, val, action });
    popupAnim.setValue(0);
    popupShakeAnim.setValue(0);

    const shakeSeq = action === 'retreat'
      ? Animated.sequence([
          Animated.timing(popupShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(popupShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(popupShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(popupShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ])
      : Animated.timing(popupShakeAnim, { toValue: 0, duration: 0, useNativeDriver: true });

    Animated.sequence([
      Animated.spring(popupAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      shakeSeq,
      Animated.delay(900),
      Animated.timing(popupAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setPopup(null));
  };

  const startRace = () => {
    const initPos = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
    setPositions(initPos);
    setFencePassed([false, false]);
    setWinner(null);
    setFinished(false);
    setCardCount(0);
    setRankings([]);
    fadeAnim.setValue(0); 
    setLog('¡Que empiece la carrera!');
    surpriseDeck.current = shuffle([...BARAJA]);
    SUIT_KEYS.forEach(s => posAnims[s].setValue(0));
    setPhase('race');
    startPulse();
  };

  const nextCard = useCallback(() => {
    if (finished) return;

    const winningSuit = SUIT_KEYS[Math.floor(Math.random() * SUIT_KEYS.length)];
    const val = pick(CARD_VALUES);

    setCardCount(c => c + 1);

    setPositions(prev => {
      const next = { ...prev };
      if (next[winningSuit] < TRACK_LEN) next[winningSuit]++;

      const newPct = next[winningSuit] / TRACK_LEN;
      animateHorse(winningSuit, newPct);
      showPopup(winningSuit, val, 'advance');
      setLog(`${SUIT_EMOJI[winningSuit]} avanza  •  ${next[winningSuit]} / ${TRACK_LEN}`);

      FENCE_POS.forEach((fp, idx) => {
        setFencePassed(fp_arr => {
          if (fp_arr[idx]) return fp_arr;
          const allPassed = SUIT_KEYS.every(s => next[s] >= fp);
          if (!allPassed) return fp_arr;

          const card = surpriseDeck.current.pop() ?? BARAJA[0];
          const sym = card.label.slice(-1);
          const penSuit = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' }[sym] ?? 'spades';
          if (next[penSuit] > 0) {
            next[penSuit]--;
            animateHorse(penSuit, next[penSuit] / TRACK_LEN);
          }
          setTimeout(() => showPopup(penSuit, '🚧', 'retreat'), 1300);
          setLog(`🚧 Valla — ${SUIT_EMOJI[penSuit]} retrocede`);

          const updated = [...fp_arr];
          updated[idx] = true;
          return updated;
        });
      });

      if (next[winningSuit] >= TRACK_LEN) {
        setFinished(true);
        setWinner(winningSuit);
        const sorted = [...SUIT_KEYS].sort((a, b) => next[b] - next[a]);
        setRankings(sorted);
        pulseAnim.stopAnimation();

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }

      return next;
    });
  }, [finished]);

  const resetRace = () => {
    setPhase('setup');
    setWinner(null);
    setFinished(false);
    fadeAnim.setValue(0);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    SUIT_KEYS.forEach(s => posAnims[s].setValue(0));
  };

  const getLiveRanking = (positions) => {
    return [...SUIT_KEYS].sort((a, b) => positions[b] - positions[a]);
  };

  const activeColor = '#0091ff';

  // Interpolaciones idénticas sacadas del código de base
  const headerY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const contentY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <View style={s.root}>
      {/* HEADER: Desplazamiento hacia abajo exacto */}
      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: entryAnim }}>
        <GameHeader title="🏇 Caballos" color={activeColor} onExit={() => setShowExit(true)} />
      </Animated.View>

      {/* BODY COMPLETO: Desplazamiento general hacia arriba exacto */}
      <Animated.View style={[s.body, { opacity: entryAnim, transform: [{ translateY: contentY }] }]}>
        
        {phase === 'setup' ? (
          /* ── CONFIGURACIÓN DEL HIPÓDROMO ── */
          <View style={s.setupContainer}>
            <Text style={s.mainIcon}>🏇</Text>
            <Text style={s.title}>HIPÓDROMO</Text>
            <Text style={s.instructions}>Elegid vuestro caballo de palabra antes de empezar</Text>
            
            <View style={s.suitRow}>
              {SUIT_KEYS.map(s2 => (
                <View key={s2} style={[s.suitBadge, { borderColor: LANE_COLORS[s2].primary + '55' }]}>
                  <Text style={[s.suitBadgeText, { color: LANE_COLORS[s2].primary }]}>
                    {SUIT_EMOJI[s2]}
                  </Text>
                </View>
              ))}
            </View>

            <View style={s.setupCard}>
              <Text style={s.setupCardLabel}>TRAGOS EN JUEGO</Text>
              <CountSelector value={apuesta} onChange={setApuesta} min={1} max={10} color={activeColor} />
            </View>

            <View style={s.glowBtnContainer}>
              <GlowButton label="¡EMPEZAR CARRERA!" onPress={startRace} color={activeColor} style={{ width: '100%' }} />
            </View>
          </View>
        ) : (
          /* ── PISTA DE CARRERAS INTERNA ── */
          <View style={s.gameContainer}>
            <ScrollView 
              style={s.scrollRoot} 
              contentContainerStyle={s.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* MAPA GRANDE DE LOS CABALLOS */}
              <View style={s.stadium}>
                <View style={s.grassBg}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <View key={i} style={[s.grassStripe, i % 2 === 0 && s.grassStripeDark]} />
                  ))}
                </View>

                {FENCE_POS.map(fp => (
                  <View key={fp} style={[s.fenceVertical, { left: 34 + (fp / TRACK_LEN) * (TRACK_W - 80) }]}>
                    <Text style={s.fenceIcon}>🚧</Text>
                  </View>
                ))}

                <View style={s.finishLine}>
                  <Text style={s.finishFlag}>🏁</Text>
                </View>
                <View style={s.startLine} />

                {SUIT_KEYS.map((suit, idx) => {
                  const liveRank = getLiveRanking(positions);
                  const pos = liveRank.indexOf(suit) + 1;
                  const color = LANE_COLORS[suit].primary;

                  return (
                    <View key={suit} style={s.lane}>
                      {idx > 0 && <View style={s.laneDivider} />}

                      <View style={[s.laneNum, { backgroundColor: color + '15', borderColor: color + '33' }]}>
                        <Text style={[s.laneNumText, { color }]}>{idx + 1}</Text>
                      </View>

                      <Animated.View style={[s.horseWrap, {
                        left: posAnims[suit].interpolate({
                          inputRange: [0, 1],
                          outputRange: [34, TRACK_W - 64],
                        }),
                      }]}>
                        <View style={[s.horseShadow, { backgroundColor: color + '44' }]} />
                        <Text style={s.horseEmoji2}>🏇</Text>
                        <View style={[s.horseTag, { backgroundColor: color }]}>
                          <Text style={s.horseTagText}>{SUIT_EMOJI[suit]}</Text>
                        </View>
                      </Animated.View>

                      <View style={[s.rankBadge, { backgroundColor: pos === 1 ? activeColor : C.card, borderColor: pos === 1 ? activeColor : '#333' }]}>
                        <Text style={[s.rankText, { color: pos === 1 ? '#000' : C.dim }]}>{pos}°</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* LOGS + BOTÓN DE RESET INTEGRADO */}
              <View style={s.logBar}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.logText}>{log}</Text>
                  <Text style={s.cardCounter}>Carta #{cardCount}</Text>
                </View>
                <TouchableOpacity style={s.resetActionBtn} onPress={startRace}>
                  <Text style={s.resetActionIcon}>🔄</Text>
                </TouchableOpacity>
              </View>

              {/* ACCIÓN DE SACAR CARTA */}
              {!finished && (
                <Animated.View style={[s.dealBtnWrap, { transform: [{ scale: pulseAnim }], width: '100%' }]}>
                  <TouchableOpacity style={[s.dealBtn, { backgroundColor: activeColor }]} onPress={nextCard} activeOpacity={0.8}>
                    <Text style={s.dealBtnIcon}>🃏</Text>
                    <Text style={s.dealBtnText}>SACAR CARTA</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* PANTALLA COMPLETA DE GANADOR CON FADE IN */}
              {finished && winner && (
                <Animated.View style={[s.winScreen, {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }]}>
                  <View style={[s.winnerBanner, { borderColor: LANE_COLORS[winner].primary + '55' }]}>
                    <Text style={s.winnerCrown}>🏆</Text>
                    <Text style={[s.winnerSuit, { color: LANE_COLORS[winner].primary }]}>
                      {SUIT_EMOJI[winner]} GANADOR
                    </Text>
                  </View>

                  <View style={s.drinkRow}>
                    <View style={[s.drinkBox, { borderColor: C.green ?? '#34D399' }]}>
                      <Text style={s.drinkLabel}>REPARTEN</Text>
                      <Text style={[s.drinkVal, { color: C.green ?? '#34D399' }]}>{apuesta * 2} Tragazos 🍻</Text>
                    </View>
                    <View style={[s.drinkBox, { borderColor: C.pink ?? '#F87171' }]}>
                      <Text style={s.drinkLabel}>PERDEDORES BEBEN</Text>
                      <Text style={[s.drinkVal, { color: C.pink ?? '#F87171' }]}>{apuesta} Traguitos 🍺</Text>
                    </View>
                  </View>

                  {/* MARCADOR FINAL */}
                  <View style={s.leaderboard}>
                    <Text style={s.leaderboardTitle}>CLASIFICACIÓN FINAL</Text>
                    {rankings.map((suit, index) => {
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🐴';
                      return (
                        <View key={suit} style={s.leaderboardRow}>
                          <View style={s.leaderboardLeft}>
                            <Text style={s.leaderboardMedal}>{medal}</Text>
                            <Text style={[s.leaderboardSuit, { color: LANE_COLORS[suit].primary }]}>
                              {SUIT_EMOJI[suit]} {suit.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={s.leaderboardPosText}>{index + 1}° Puesto</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={s.glowBtnContainerResults}>
                    <GlowButton label="OTRA CARRERA 🔄" onPress={resetRace} color={activeColor} style={{ width: '100%' }} />
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {/* POPUP DE VALLAS / AVANCES */}
      {popup && (
        <Animated.View style={[s.popup, {
          opacity: popupAnim,
          transform: [
            { scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            { translateX: popupShakeAnim },
          ],
          borderColor: LANE_COLORS[popup.suit].primary + '66',
        }]}>
          <Text style={[s.popupSuit, { color: LANE_COLORS[popup.suit].primary }]}>
            {SUIT_EMOJI[popup.suit]}
          </Text>
          <Text style={s.popupVal}>{popup.val}</Text>
          <View style={[s.popupActionBadge, {
            backgroundColor: popup.action === 'advance' ? '#34D39922' : '#F8717122',
          }]}>
            <Text style={[s.popupActionText, {
              color: popup.action === 'advance' ? '#34D399' : '#F87171',
            }]}>
              {popup.action === 'advance' ? '▲ AVANZA' : '▼ RETROCEDE'}
            </Text>
          </View>
        </Animated.View>
      )}

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); resetRace(); onExit(); }}
      />
    </View>
  );
}

const LANE_H = 80;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, width: '100%' }, // El nodo animado base que controla la subida global de la pantalla

  // Layouts internos de Fase
  setupContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 16 },
  gameContainer: { flex: 1, width: '100%' },

  scrollRoot: { flex: 1, width: '100%' },
  scrollBody: { alignItems: 'center', gap: 18, padding: 16, paddingBottom: 40 },
  mainIcon: { fontSize: 64 },
  title: { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  instructions: { color: C.dim, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  
  suitRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  suitBadge: {
    width: 56, height: 56, borderRadius: 14, borderWidth: 1.5,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  suitBadgeText: { fontSize: 26 },
  setupCard: {
    backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: '#333',
    padding: 20, alignItems: 'center', gap: 12, width: '90%',
  },
  setupCardLabel: { color: C.dim, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  
  glowBtnContainer: { width: '85%', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  glowBtnContainerResults: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 8 },

  stadium: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#222',
    position: 'relative',
    backgroundColor: '#0a0d0a',
  },
  grassBg: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  grassStripe: { flex: 1, backgroundColor: '#090f09' },
  grassStripeDark: { backgroundColor: '#060a06' },

  fenceVertical: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', zIndex: 5,
  },
  fenceIcon: { fontSize: 11, marginTop: 4 },
  finishLine: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
    backgroundColor: '#fff', alignItems: 'center', zIndex: 5,
  },
  finishFlag: { fontSize: 12, marginTop: 2 },
  startLine: {
    position: 'absolute', left: 34, top: 0, bottom: 0, width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 4,
  },

  lane: { height: LANE_H, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  laneDivider: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  laneNum: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 6, zIndex: 10 },
  laneNumText: { fontSize: 12, fontWeight: '900' },

  horseWrap: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  horseShadow: { position: 'absolute', bottom: -2, width: 42, height: 8, borderRadius: 10, opacity: 0.5 },
  horseEmoji2: { fontSize: 42 },
  horseTag: { position: 'absolute', top: -2, right: -6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  horseTagText: { fontSize: 10, fontWeight: '900', color: '#000' },

  rankBadge: { position: 'absolute', right: 12, width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  rankText: { fontSize: 12, fontWeight: '900' },

  logBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: '#222', width: '100%',
  },
  logText: { color: C.text, fontSize: 14, fontWeight: '700' },
  cardCounter: { color: C.dim, fontSize: 12, fontWeight: '500', marginTop: 1 },
  resetActionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  resetActionIcon: { fontSize: 16 },

  dealBtnWrap: { alignItems: 'center' },
  dealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, width: '100%', paddingVertical: 16, elevation: 4,
  },
  dealBtnIcon: { fontSize: 22 },
  dealBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  winScreen: { gap: 12, alignItems: 'center', width: '100%', marginTop: 4 },
  winnerBanner: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, padding: 16, alignItems: 'center', width: '100%' },
  winnerCrown: { fontSize: 36 },
  winnerSuit: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  
  drinkRow: { flexDirection: 'row', gap: 10, width: '100%' },
  drinkBox: { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4 },
  drinkLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  drinkVal: { fontSize: 14, fontWeight: '900' },

  leaderboard: {
    width: '100%', backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: '#222', padding: 16, gap: 10
  },
  leaderboardTitle: {
    color: C.dim, fontSize: 11, fontWeight: '900', letterSpacing: 2,
    marginBottom: 4, textAlign: 'center'
  },
  leaderboardRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)'
  },
  leaderboardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderboardMedal: { fontSize: 18 },
  leaderboardSuit: { fontSize: 14, fontWeight: '700' },
  leaderboardPosText: { color: C.dim, fontSize: 13, fontWeight: '600' },

  popup: {
    position: 'absolute', alignSelf: 'center', top: '35%',
    backgroundColor: '#0a0a0a', borderRadius: 20, borderWidth: 2,
    padding: 24, alignItems: 'center', gap: 6, zIndex: 100,
  },
  popupSuit: { fontSize: 44 },
  popupVal: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  popupActionBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  popupActionText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});