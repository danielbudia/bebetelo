import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Vibration, 
  ScrollView, TextInput, Platform, KeyboardAvoidingView,
  Modal 
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
// Asegúrate de que la ruta a tus componentes sea correcta
import { GameHeader, ExitModal, CountSelector, GlowButton, ActionButton } from '../components/UI';

// Generamos mazo de números del 1 al 12
const GENERAR_MAZO = () => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

export default function MayorMenorScreen({ onExit = () => {} }) {
  const [phase, setPhase] = useState('setup'); // setup | game | reveal
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers] = useState([]); 
  const [turnIdx, setTurnIdx] = useState(0);
  
  const [current, setCurrent] = useState(null); // Carta izquierda
  const [next, setNext] = useState(null);       // Carta derecha
  
  const [bet, setBet] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [showExit, setShowExit] = useState(false);

  const deck = useRef([]);
  const entryAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const [showError, setShowError] = useState(false);

  // Sincronizar nombres cuando cambia el número de jugadores
  useEffect(() => {
    setPlayers(prev => {
      const arr = [...prev];
      if (arr.length < numPlayers) {
        for (let i = arr.length; i < numPlayers; i++) arr.push('');
      } else {
        return arr.slice(0, numPlayers);
      }
      return arr;
    });
  }, [numPlayers]);

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNameChange = (text, index) => {
    const newPlayers = [...players];
    newPlayers[index] = text;
    setPlayers(newPlayers);
  };

 const startGame = () => {
    // Validar si hay nombres vacíos
    const hasEmptyNames = players.some(n => n.trim() === '');

    if (hasEmptyNames) {
      setShowError(true);
      return;
    }

    const finalNames = players.map(n => n.trim());
    setPlayers(finalNames);
    deck.current = GENERAR_MAZO();
    setCurrent(deck.current.pop());
    setTurnIdx(0);
    setPhase('game');
  };

  const guess = (dir) => {
    if (deck.current.length < 2) deck.current = GENERAR_MAZO();
    const drawn = deck.current.pop();
    setNext(drawn); // Solo actualizamos la derecha
    
    revealAnim.setValue(0);
    Animated.spring(revealAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();

    let type, msg;
    if (drawn === current) {
      type = 'tie';
      msg = '🤝 ¡MISMO NÚMERO!\nBEBEN TODOS';
      Vibration.vibrate([0, 100, 100, 100]);
    } else {
      const success = (dir === 'mayor' && drawn > current) || (dir === 'menor' && drawn < current);
      if (success) {
        type = 'win';
        msg = `✅ ¡CORRECTO!\nRepartes ${bet} trago${bet > 1 ? 's' : ''}`;
      } else {
        type = 'lose';
        msg = `❌ ¡FALLASTE!\nBebes ${bet} trago${bet > 1 ? 's' : ''}`;
        Vibration.vibrate(200);
      }
    }
    setVerdict({ msg, type });
    setPhase('reveal');
  };

  const nextRound = () => {
    setCurrent(next); // La de la derecha pasa a la izquierda
    setNext(null);
    setTurnIdx(i => (i + 1) % players.length);
    setBet(1);
    setVerdict(null);
    setPhase('game');
  };

  const headerY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const contentY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const verdictColor = verdict?.type === 'win' ? C.green : verdict?.type === 'tie' ? C.gold : C.red;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={s.root}
    >
      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: entryAnim }}>
        <GameHeader 
          title="Mayor o Menor" 
          color={C.violet} 
          onExit={() => setShowExit(true)} 
        />
      </Animated.View>

      <Animated.View style={[s.body, { opacity: entryAnim, transform: [{ translateY: contentY }] }]}>
        
        {phase === 'setup' ? (
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉN JUEGA?</Text>
            <View style={s.selectorBox}>
               <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={10} color={C.violet} />
            </View>

            <ScrollView 
              style={s.namesScroll} 
              contentContainerStyle={s.namesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {players.map((name, i) => (
                <View key={i} style={s.inputRow}>
                  <Text style={s.inputNumber}>{i + 1}</Text>
                  <TextInput
                    style={s.nameInput}
                    placeholder={`Nombre del Jugador...`}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={name}
                    onChangeText={(t) => handleNameChange(t, i)}
                    maxLength={12}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={s.footerBtn}>
              <GlowButton label="EMPEZAR" onPress={startGame} color={C.violet} />
            </View>
          </View>
        ) : (
          <View style={s.gameContainer}>
            <View style={s.turnBadge}>
              <Text style={s.turnLabel}>TURNO DE</Text>
              <Text style={s.turnName}>{players[turnIdx]}</Text>
            </View>

            <View style={s.cardsRow}>
              <View style={s.cardSlot}>
                <Text style={s.slotLabel}>ACTUAL</Text>
                <View style={[s.numCard, { borderColor: C.violet + '66' }]}>
                  <Text style={s.numText}>{current}</Text>
                </View>
              </View>

              <View style={s.cardSlot}>
                <Text style={s.slotLabel}>SIGUIENTE</Text>
                {phase === 'reveal' ? (
                  <Animated.View style={[s.numCard, { borderColor: verdictColor, transform: [{ scale: revealAnim }] }]}>
                    <Text style={[s.numText, { color: verdictColor }]}>{next}</Text>
                  </Animated.View>
                ) : (
                  <View style={[s.numCard, s.numCardHidden]}>
                    <Text style={s.hiddenMark}>?</Text>
                  </View>
                )}
              </View>
            </View>

            {phase === 'game' ? (
              <View style={s.uiBottom}>
                <View style={s.betWrap}>
                  <Text style={s.betTitle}>APUESTA DE TRAGOS</Text>
                  <View style={s.betRow}>
                    {[1, 2, 3, 4].map(n => (
                      <TouchableOpacity
                        key={n} onPress={() => setBet(n)}
                        style={[s.betBtn, bet === n && { backgroundColor: C.violet, borderColor: C.violet }]}
                      >
                        <Text style={[s.betBtnText, bet === n && { color: '#FFF' }]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={s.actionRow}>
                  <ActionButton label="⬆️ MAYOR" onPress={() => guess('mayor')} color={C.green} />
                  <ActionButton label="⬇️ MENOR" onPress={() => guess('menor')} color={C.red} />
                </View>
              </View>
            ) : (
              <Animated.View style={[s.verdictBox, { borderColor: verdictColor + '44' }]}>
                <Text style={[s.verdictText, { color: verdictColor }]}>{verdict?.msg}</Text>
                <GlowButton label="SIGUIENTE TURNO →" onPress={nextRound} color={C.violet} style={{ marginTop: 20 }} />
              </Animated.View>
            )}
          </View>
        )}
      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { 
          setShowExit(false); 
          if (onExit) onExit(); // Seguridad extra
        }}
      />

      {/* MODAL DE ERROR ESTILO CASINO/APUESTAS */}
      <Modal visible={showError} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.errorCard}>
            <Text style={s.errorEmoji}>🎲</Text>
            <Text style={s.errorTitle}>¡JUGADORES ANÓNIMOS!</Text>
            <Text style={s.errorText}>
              En esta mesa no se aceptan apuestas fantasma. {"\n\n"}
              <Text style={{color: C.violet, fontWeight: '800'}}>Identifica a todos los apostadores</Text> si no quieres que el crupier se quede con tus tragos.
            </Text>
            
            <TouchableOpacity 
              style={s.errorBtn} 
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>DAR LA CARA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  body: { flex: 1, width: '100%' },
  
  // Setup
  setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  setupTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: 20 },
  selectorBox: { marginBottom: 30, alignItems: 'center' },
  namesScroll: { flex: 1, marginBottom: 100 },
  namesContent: { paddingBottom: 20 },
  inputRow: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 15, height: 55
  },
  inputNumber: { color: C.violet, fontWeight: '900', fontSize: 16, marginRight: 15, width: 20 },
  nameInput: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
  footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },

  // Juego
  gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  turnBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 15,
    alignItems: 'center', width: '100%', borderWidth: 1, borderColor: C.violet + '33', marginBottom: 30
  },
  turnLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  turnName: { color: C.violet, fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },

  cardsRow: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  cardSlot: { alignItems: 'center', gap: 10 },
  slotLabel: { color: C.dim, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  numCard: {
    width: 125, height: 170, backgroundColor: '#111', borderRadius: 20,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: C.violet, shadowRadius: 10, shadowOpacity: 0.2
  },
  numCardHidden: { borderStyle: 'dashed', borderColor: '#222', backgroundColor: '#080808' },
  numText: { color: '#FFF', fontSize: 60, fontWeight: '900' },
  hiddenMark: { color: '#222', fontSize: 60, fontWeight: '900' },

  uiBottom: { width: '100%', alignItems: 'center', gap: 30 },
  betWrap: { alignItems: 'center', gap: 12 },
  betTitle: { color: C.dim, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  betRow: { flexDirection: 'row', gap: 10 },
  betBtn: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#222',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a'
  },
  betBtnText: { color: C.dim, fontSize: 18, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 20 },
  verdictBox: {
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 30,
    alignItems: 'center', width: '100%', borderWidth: 2,
  },
  verdictText: { fontSize: 19, fontWeight: '900', textAlign: 'center', lineHeight: 28 },
// Estilos del Modal de Error (Violeta)
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30
  },
  errorCard: {
    backgroundColor: '#111',
    borderRadius: 30,
    padding: 30,
    width: '100%',
    borderWidth: 2,
    borderColor: C.violet,
    alignItems: 'center',
    shadowColor: C.violet,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  errorEmoji: { fontSize: 50, marginBottom: 15 },
  errorTitle: { 
    color: C.violet, 
    fontSize: 20, 
    fontWeight: '900', 
    letterSpacing: 2, 
    textAlign: 'center',
    marginBottom: 15 
  },
  errorText: { 
    color: '#DDD', 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 25 
  },
  errorBtn: {
    backgroundColor: C.violet,
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorBtnText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 14, 
    letterSpacing: 2 
  },
  
});