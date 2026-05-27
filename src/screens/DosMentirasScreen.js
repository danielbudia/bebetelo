import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform, KeyboardAvoidingView, Animated,
  Modal 
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, GlowButton, CountSelector } from '../components/UI';

export default function DosMentirasScreen({ onExit = () => {} }) {
  const [phase, setPhase]           = useState('setup'); // setup | narrator | voting | reveal
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers]       = useState([]);
  const [turnIdx, setTurnIdx]       = useState(0);
  const [truth, setTruth]           = useState(1);
  const [groupChoice, setGroupChoice] = useState(null); // Guarda la frase que eligió el grupo
  const [showExit, setShowExit]     = useState(false);
  const [showError, setShowError] = useState(false);
  // Animación de entrada inicial
  const entryAnim = useRef(new Animated.Value(0)).current;

  // Sincronizar nombres dinámicamente (Clonado de MayorMenor)
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
    // Validar si hay algún nombre vacío
    const hasEmptyNames = players.some(n => n.trim() === '');

    if (hasEmptyNames) {
      setShowError(true);
      return;
    }

    const finalNames = players.map((n) => n.trim());
    const shuffled = shuffle(finalNames);
    setPlayers(shuffled);
    setTurnIdx(0);
    setTruth(1);
    setPhase('narrator');
  };

  const castGroupVote = (n) => {
    setGroupChoice(n);
    setPhase('reveal');
  };

  const nextRound = () => {
    setTurnIdx(i => i + 1);
    setTruth(1);
    setGroupChoice(null);
    setPhase('narrator');
  };

  const narrator = players[turnIdx % players.length] ?? '?';
  const groupAcertó = groupChoice === truth;

  const headerY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const contentY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={s.root}
    >
      {/* HEADER */}
      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: entryAnim }}>
        <GameHeader title="🤥 2 Mentiras 1 Verdad" color={C.pink} onExit={() => setShowExit(true)} />
      </Animated.View>

      {/* BODY ANIMADO GLOBAL */}
      <Animated.View style={[s.body, { opacity: entryAnim, transform: [{ translateY: contentY }] }]}>
        
        {phase === 'setup' ? (
          /* ── REGISTRO DE JUGADORES ── */
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉN JUEGA?</Text>
            <View style={s.selectorBox}>
              <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={12} color={C.pink} />
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
              <GlowButton label="EMPEZAR" onPress={startGame} color={C.pink} />
            </View>
          </View>
        ) : phase === 'narrator' ? (
          /* ── TURNO DEL NARRADOR ── */
          <View style={s.gameContainer}>
            <Text style={s.turnBadge}>TURNO DE</Text>
            <Text style={[s.bigName, { color: C.pink }]}>{narrator}</Text>
            <Text style={s.instructions}>
              Di 3 frases sobre ti mismo en voz alta.{'\n'}
              <Text style={{ fontWeight: '900', color: '#FFF' }}>2 mentiras + 1 verdad.</Text>{'\n'}
              ¡Intenta que no se te note en la cara!
            </Text>
            
            <View style={s.truthSelector}>
              <Text style={s.selectorLabel}>SELECCIONA EN SECRETO TU VERDAD</Text>
              <View style={s.truthBtns}>
                {[1, 2, 3].map(n => (
                  <TouchableOpacity
                    key={n} onPress={() => setTruth(n)}
                    style={[s.truthBtn, truth === n && { backgroundColor: C.pink + '22', borderColor: C.pink }]}
                  >
                    <Text style={[s.truthBtnText, truth === n && { color: C.pink }]}>Frase {n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <GlowButton label="LISTO → PASAR AL GRUPO" onPress={() => setPhase('voting')} color={C.pink} style={{ width: '100%', marginTop: 10 }} />
          </View>
        ) : phase === 'voting' ? (
          /* ── VOTACIÓN DEL GRUPO COMPLETAMENTE DIRECTA ── */
          <View style={s.gameContainer}>
            <Text style={s.voteTitle}>👥 ¿QUÉ DICE EL GRUPO?</Text>
            <Text style={s.instructions}>
              Debatid bien... ¿Cuál de las 3 opciones que ha dicho{' '}
              <Text style={{ color: C.pink, fontWeight: '700' }}>{narrator}</Text> es la real?
            </Text>
            
            <View style={s.voteBtns}>
              {[1, 2, 3].map(n => (
                <TouchableOpacity key={n} onPress={() => castGroupVote(n)} style={s.voteBtn}>
                  <Text style={s.voteBtnNum}>{n}</Text>
                  <Text style={s.voteBtnLabel}>Votar Frase {n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* ── REVELACIÓN DE RESULTADOS DIRECTA ── */
          <View style={s.gameContainer}>
            <Text style={s.revealTitle}>¡REVELACIÓN!</Text>
            
            <View style={[s.revealBox, { borderColor: groupAcertó ? C.green + '55' : C.red + '55' }]}>
              <Text style={s.revealTruth}>
                La verdad era la <Text style={{ color: C.pink, fontWeight: '900' }}>Frase {truth}</Text>
              </Text>
              <Text style={[s.groupChoiceText, { color: groupAcertó ? C.green : C.red }]}>
                El grupo votó la Frase {groupChoice}
              </Text>
            </View>
            
            <View style={s.revealResults}>
              {groupAcertó ? (
                <View style={s.resultOutcome}>
                  <Text style={s.resultIcon}>✅</Text>
                  <Text style={[s.resultLine, { color: C.green, fontWeight: '800' }]}>
                    ¡EL GRUPO HA ACERTADO!
                  </Text>
                  <Text style={s.resultSubline}>
                    Cazasteis a {narrator}. Le toca beber <Text style={{ fontWeight: '900', color: '#FFF' }}>2 tragos</Text> por mentiroso.
                  </Text>
                </View>
              ) : (
                <View style={s.resultOutcome}>
                  <Text style={s.resultIcon}>😈</Text>
                  <Text style={[s.resultLine, { color: C.red, fontWeight: '800' }]}>
                    ¡ENGAÑO PERFECTO!
                  </Text>
                  <Text style={s.resultSubline}>
                    {narrator} os la ha colado doblada. ¡Beben <Text style={{ fontWeight: '900', color: '#FFF' }}>1 trago cada uno</Text> del grupo!
                  </Text>
                </View>
              )}
            </View>

            <GlowButton label="SIGUIENTE TURNO →" onPress={nextRound} color={C.pink} style={{ width: '100%', marginTop: 10 }} />
          </View>
        )}

      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); setPhase('setup'); onExit(); }}
      />
      {/* MODAL DE ERROR ESTILO DETECTOR DE MENTIRAS */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.errorCard}>
            <Text style={s.errorEmoji}>🤥</Text>
            <Text style={s.errorTitle}>¡DETECTADA MENTIRA!</Text>
            <Text style={s.errorText}>
              No intentes engañarnos antes de empezar... faltan nombres por rellenar. {"\n\n"}
              <Text style={{color: C.pink, fontWeight: '800'}}>Identifica a todos los mentirosos</Text> para que podamos empezar el interrogatorio.
            </Text>
            
            <TouchableOpacity 
              style={s.errorBtn} 
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>DECIR LA VERDAD</Text>
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
  
  // Setup idéntico a MayorMenor
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
  inputNumber: { color: C.pink, fontWeight: '900', fontSize: 16, marginRight: 15, width: 20 },
  nameInput: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
  footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },

  // Contenedor global de juego
  gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, width: '100%', gap: 16 },
  turnBadge: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  bigName: { fontSize: 26, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  instructions: { color: C.dim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginVertical: 4 },
  
  truthSelector: { width: '100%', gap: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  selectorLabel: { color: C.dim, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  truthBtns: { flexDirection: 'row', gap: 10 },
  truthBtn: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#222', backgroundColor: C.card,
  },
  truthBtnText: { color: C.dim, fontWeight: '800', fontSize: 13 },
  
  voteTitle: { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  voteBtns: { gap: 12, width: '100%', marginTop: 15 },
  voteBtn: {
    backgroundColor: C.card, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: C.violet + '33',
    flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 3,
  },
  voteBtnNum: { color: C.violet, fontSize: 22, fontWeight: '900', width: 24 },
  voteBtnLabel: { color: C.text, fontSize: 16, fontWeight: '600' },
  
  revealTitle: { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
  revealBox: {
    backgroundColor: C.card, borderRadius: 16, padding: 20,
    borderWidth: 1, width: '100%', alignItems: 'center', gap: 4
  },
  revealTruth: { color: C.text, fontSize: 17, fontWeight: '700' },
  groupChoiceText: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  
  revealResults: {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    width: '100%', borderWidth: 1, borderColor: '#222', marginVertical: 10,
  },
  resultOutcome: { alignItems: 'center', gap: 8 },
  resultIcon: { fontSize: 32 },
  resultLine: { fontSize: 16, letterSpacing: 1, textAlign: 'center' },
  resultSubline: { color: C.dim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 4 },
  // Estilos del Modal de Error (Rosa)
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30
  },
  errorCard: {
    backgroundColor: C.card,
    borderRadius: 30,
    padding: 30,
    width: '100%',
    borderWidth: 2,
    borderColor: C.pink,
    alignItems: 'center',
    shadowColor: C.pink,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorEmoji: { fontSize: 55, marginBottom: 15 },
  errorTitle: { 
    color: C.pink, 
    fontSize: 22, 
    fontWeight: '900', 
    letterSpacing: 2, 
    textAlign: 'center',
    marginBottom: 15 
  },
  errorText: { 
    color: '#EEE', 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 25 
  },
  errorBtn: {
    backgroundColor: C.pink,
    paddingVertical: 16,
    borderRadius: 18,
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