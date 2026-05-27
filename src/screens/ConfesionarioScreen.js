import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, Alert, 
  Modal // <--- AÑADE ESTO AQUÍ
} from 'react-native';
import { C } from '../theme';
import { PREGUNTAS_CONF } from '../data';
import { shuffle } from '../utils'; // Quitamos 'pick' porque usaremos nuestra lógica
import { GameHeader, ExitModal, GlowButton, ActionButton, CountSelector } from '../components/UI';

export default function ConfesionarioScreen({ onExit = () => {} }) {
  const [phase, setPhase]           = useState('setup'); 
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers]       = useState([]); 
  const [turnIdx, setTurnIdx]       = useState(0);
  const [question, setQuestion]     = useState('');
  const [result, setResult]         = useState(null);
  const [showExit, setShowExit]     = useState(false);
  const [showError, setShowError] = useState(false);
  // --- LÓGICA ANTI-REPETICIÓN ---
  const usedQuestions = useRef(new Set());

  const getNewQuestion = () => {
    // Si ya usamos todas las preguntas, vaciamos el saco
    if (usedQuestions.current.size >= PREGUNTAS_CONF.length) {
      usedQuestions.current.clear();
    }

    let newIdx;
    do {
      newIdx = Math.floor(Math.random() * PREGUNTAS_CONF.length);
    } while (usedQuestions.current.has(newIdx));

    usedQuestions.current.add(newIdx);
    return PREGUNTAS_CONF[newIdx];
  };
  // ------------------------------

  const entryAnim = useRef(new Animated.Value(0)).current;
  const flashlightAnim = useRef(new Animated.Value(1)).current;

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
    Animated.timing(entryAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (phase === 'question') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashlightAnim, { toValue: 0.15, duration: 250, useNativeDriver: true }),
          Animated.timing(flashlightAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(flashlightAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(flashlightAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      flashlightAnim.setValue(1);
    }
  }, [phase]);

  const handleNameChange = (text, index) => {
    const newPlayers = [...players];
    newPlayers[index] = text;
    setPlayers(newPlayers);
  };

 const startGame = () => {
  // Validar si hay algún nombre vacío
  const hasEmptyNames = players.some(n => n.trim() === '');

  if (hasEmptyNames) {
    setShowError(true); // Abrimos nuestro modal con estilo
    return;
  }

  const finalNames = players.map((n) => n.trim());
  const shuffled = shuffle(finalNames);
  setPlayers(shuffled);
  setTurnIdx(0);
  setResult(null);
  setQuestion(getNewQuestion());
  setPhase('question');
};

  const handleChoice = (choice) => {
    if (choice === 'drink') {
      setResult({ text: `🍺 ${players[turnIdx % players.length]} eligió el silencio.\nBebe 3 tragos.`, color: C.red });
      setPhase('result');
    } else {
      setPhase('verdict');
    }
  };

  const handleVerdict = (v) => {
    const victim = players[turnIdx % players.length];
    const text = v === 'truth'
      ? `✅ El grupo cree que ${victim} ha dicho la verdad.\nSe salva.`
      : `❌ El grupo pilló la mentira.\n${victim} bebe 2 tragos igualmente.`;
    const color = v === 'truth' ? C.green : C.red;
    setResult({ text, color });
    setPhase('result');
  };

  const nextTurn = () => {
    setTurnIdx(i => i + 1);
    // Usamos nuestra nueva lógica
    setQuestion(getNewQuestion());
    setResult(null);
    setPhase('question');
  };

  const victim = players[turnIdx % players.length] ?? '?';
  const headerY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const contentY = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <Animated.View style={{ transform: [{ translateY: headerY }], opacity: entryAnim }}>
        <GameHeader title="🎭 Confesionario" color={C.gold} onExit={() => setShowExit(true)} />
      </Animated.View>

      <Animated.View style={[s.body, { opacity: entryAnim, transform: [{ translateY: contentY }] }]}>
        
        {phase === 'setup' ? (
          <View style={s.setupContainer}>
            <Text style={s.setupTitle}>¿QUIÉN JUEGA?</Text>
            <View style={s.selectorBox}>
              <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={12} color={C.gold} />
            </View>

            <ScrollView style={s.namesScroll} contentContainerStyle={s.namesContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {players.map((name, i) => (
                <View key={i} style={s.inputRow}>
                  <Text style={s.inputNumber}>{i + 1}</Text>
                  <TextInput
                    style={s.nameInput}
                    placeholder={`Nombre del pecador ${i + 1}...`}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={name}
                    onChangeText={(t) => handleNameChange(t, i)}
                    maxLength={12}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={s.footerBtn}>
              <GlowButton label="ENTRAR AL PECADO" onPress={startGame} color={C.gold} />
            </View>
          </View>
        ) : phase === 'question' ? (
          <View style={s.gameContainer}>
            <Animated.Text style={[s.spotlightSmall, { opacity: flashlightAnim }]}>🔦</Animated.Text>
            <Text style={s.victimName}>{victim}</Text>
            <View style={s.questionCard}>
              <Text style={s.questionText}>{question}</Text>
            </View>
            <View style={s.choicesRow}>
              <ActionButton label="🗣️ CONFESAR" onPress={() => handleChoice('confess')} color={C.green} />
              <ActionButton label="🍺 BEBER" onPress={() => handleChoice('drink')} color={C.red} />
            </View>
          </View>
        ) : phase === 'verdict' ? (
          <View style={s.gameContainer}>
            <Text style={s.verdictTitle}>⚖️ ¿QUÉ DICE EL GRUPO?</Text>
            <Text style={[s.victimName, { color: C.pink, marginTop: 10, marginBottom: 20 }]}>Víctima: {victim}</Text>
            <View style={s.choicesRow}>
              <ActionButton label="✅ ES VERDAD" onPress={() => handleVerdict('truth')} color={C.green} />
              <ActionButton label="❌ ES MENTIRA" onPress={() => handleVerdict('lie')} color={C.red} />
            </View>
          </View>
        ) : (
          <View style={s.gameContainer}>
            {result && (
              <View style={[s.resultBox, { borderColor: result.color + '55' }]}>
                <Text style={[s.resultText, { color: result.color }]}>{result.text}</Text>
              </View>
            )}
            <GlowButton label="SIGUIENTE VÍCTIMA →" onPress={nextTurn} color={C.gold} style={{ width: '100%', marginTop: 20 }} />
          </View>
        )}


        
      </Animated.View>

      <ExitModal
        visible={showExit}
        onCancel={() => setShowExit(false)}
        onConfirm={() => { setShowExit(false); setPhase('setup'); onExit(); }}
      />
      {/* MODAL DE ERROR ESTILO CONFESIONARIO */}
<Modal visible={showError} transparent animationType="fade">
  <View style={s.modalOverlay}>
    <Animated.View style={s.errorCard}>
      <Text style={s.errorEmoji}>⛪</Text>
      <Text style={s.errorTitle}>¡SACRILEGIO!</Text>
      <Text style={s.errorText}>
        Hijo mío, el anonimato es un pecado mortal. {"\n\n"}
        <Text style={{color: C.gold, fontWeight: '800'}}>Identifica a todos los pecadores</Text> antes de entrar al confesionario... o arderás en la sobriedad.
      </Text>
      
      <TouchableOpacity 
        style={s.errorBtn} 
        onPress={() => setShowError(false)}
      >
        <Text style={s.errorBtnText}>PERDÓN, PADRE</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, width: '100%' },
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
  inputNumber: { color: C.gold, fontWeight: '900', fontSize: 16, marginRight: 15, width: 20 },
  nameInput: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
  footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, width: '100%' },
  spotlightSmall: { fontSize: 50, marginBottom: 10 },
  victimName: { color: C.gold, fontSize: 26, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  questionCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: C.gold + '33', width: '100%',
    marginVertical: 30, elevation: 6,
  },
  questionText: { color: C.text, fontSize: 18, lineHeight: 28, textAlign: 'center', fontWeight: '500' },
  choicesRow: { flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'center' },
  verdictTitle: { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  resultBox: {
    backgroundColor: C.card, borderRadius: 24, padding: 30,
    borderWidth: 2, width: '100%', alignItems: 'center',
  },
  resultText: { fontSize: 19, fontWeight: '900', textAlign: 'center', lineHeight: 28 },
// Estilos para el Modal de Error
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30
  },
  errorCard: {
    backgroundColor: C.card,
    borderRadius: 25,
    padding: 30,
    width: '100%',
    borderWidth: 2,
    borderColor: C.gold,
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorEmoji: { fontSize: 50, marginBottom: 15 },
  errorTitle: { 
    color: C.gold, 
    fontSize: 24, 
    fontWeight: '900', 
    letterSpacing: 3, 
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
    backgroundColor: C.gold,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  errorBtnText: { 
    color: C.bg, 
    fontWeight: '900', 
    fontSize: 14, 
    letterSpacing: 1 
  },

});