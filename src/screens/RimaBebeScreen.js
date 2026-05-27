import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity, Vibration,
    ScrollView, TextInput, Platform, KeyboardAvoidingView, Modal, Easing,
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, CountSelector, GlowButton, ActionButton } from '../components/UI';
import { PALABRAS_RIMA } from '../data';

// --- CONFIGURACIÓN DE TEMA: POETA DE RETRETE ---
const ACCENT = '#0091ff'; // El azul de GAME_COLORS.poetaRetrete
const TIMER_TOTAL = 3;

const SEMILLAS = shuffle([...PALABRAS_RIMA]);
let seedIdx = 0;
const getNextSeed = () => SEMILLAS[seedIdx++ % SEMILLAS.length];

// ─── LiquidTimer (Círculo de tiempo consistente con el resto de la app) ───
const LiquidTimer = ({ fillRatio, timeLeft }) => {
    const SIZE = 120;
    const liquidColor = fillRatio > 0.6 ? ACCENT : fillRatio > 0.3 ? C.orange : C.red;
    const levelAnim = useRef(new Animated.Value(fillRatio)).current;

    useEffect(() => {
        Animated.spring(levelAnim, { toValue: fillRatio, friction: 12, useNativeDriver: false }).start();
    }, [fillRatio]);

    const liquidH = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SIZE] });

    return (
        <View style={[s.timerCircle, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: liquidColor + '44' }]}>
            <Animated.View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: liquidH, backgroundColor: liquidColor + '40'
            }} />
            <Text style={s.timerNum}>{timeLeft}</Text>
        </View>
    );
};

export default function RimaBebeScreen({ onExit = () => { } }) {
    const [phase, setPhase] = useState('setup');
    const [numPlayers, setNumPlayers] = useState(4);
    const [players, setPlayers] = useState([]);
    const [turnIdx, setTurnIdx] = useState(0);
    const [seedWord, setSeedWord] = useState('');
    const [rhymeHistory, setRhymeHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
    const [fillRatio, setFillRatio] = useState(1);
    const [loser, setLoser] = useState(null);
    const [showExit, setShowExit] = useState(false);
    const [showError, setShowError] = useState(false);

    const entryAnim = useRef(new Animated.Value(0)).current;
    const headerY = useRef(new Animated.Value(0)).current;
    const revealAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);
    const timeRef = useRef(TIMER_TOTAL);

    useEffect(() => {
        setPlayers(prev => {
            const arr = [...prev];
            if (arr.length < numPlayers) {
                for (let i = arr.length; i < numPlayers; i++) arr.push('');
            } else return arr.slice(0, numPlayers);
            return arr;
        });
    }, [numPlayers]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(entryAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(headerY, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => () => clearInterval(timerRef.current), []);

    const handleNameChange = (text, index) => {
        const arr = [...players]; arr[index] = text; setPlayers(arr);
    };

    const startGame = () => {
        if (players.some(n => n.trim() === '')) { setShowError(true); return; }
        setPlayers(players.map(n => n.trim()));
        const seed = getNextSeed();
        setSeedWord(seed);
        setRhymeHistory([seed]);
        setTurnIdx(0);
        startTimer(0);
        setPhase('game');
    };

    const startTimer = (currentTurn) => {
        clearInterval(timerRef.current);
        timeRef.current = TIMER_TOTAL;
        setTimeLeft(TIMER_TOTAL);
        setFillRatio(1);
        timerRef.current = setInterval(() => {
            timeRef.current -= 1;
            const rem = timeRef.current;
            setTimeLeft(rem);
            setFillRatio(rem / TIMER_TOTAL);
            if (rem <= 0) { clearInterval(timerRef.current); playerLoses(currentTurn); }
        }, 1000);
    };

    const playerLoses = useCallback((idx) => {
        clearInterval(timerRef.current);
        setLoser(idx);
        revealAnim.setValue(0);
        Animated.spring(revealAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
        Vibration.vibrate(400);
        setPhase('result');
    }, []);

    const judgeValid = () => {
        const next = (turnIdx + 1) % players.length;
        setTurnIdx(next);
        startTimer(next);
    };

    const judgeInvalid = () => { playerLoses(turnIdx); };

    const nextRound = () => {
        const seed = getNextSeed();
        setSeedWord(seed);
        setRhymeHistory([seed]);
        setLoser(null);
        const next = (turnIdx + 1) % players.length;
        setTurnIdx(next);
        startTimer(next);
        setPhase('game');
    };

    const hY = headerY.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
            <Animated.View style={{ transform: [{ translateY: hY }], opacity: entryAnim }}>
                <GameHeader title="Poeta de Retrete" color={ACCENT} onExit={() => setShowExit(true)} />
            </Animated.View>

            <Animated.View style={[s.body, { opacity: entryAnim }]}>

                {/* SETUP */}
                {phase === 'setup' && (
                    <View style={s.setupContainer}>
                        <Text style={s.setupTitle}>¿QUIÉNES RIMAN?</Text>
                        <View style={s.selectorBox}>
                            <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={10} color={ACCENT} />
                        </View>
                        <ScrollView style={s.namesScroll} showsVerticalScrollIndicator={false}>
                            {players.map((name, i) => (
                                <View key={i} style={s.inputRow}>
                                    <Text style={[s.inputNumber, { color: ACCENT }]}>{i + 1}</Text>
                                    <TextInput style={s.nameInput} placeholder="Nombre del poeta..." placeholderTextColor="#444" value={name} onChangeText={t => handleNameChange(t, i)} maxLength={12} />
                                </View>
                            ))}
                            <View style={s.rulesBox}>
                                <Text style={s.ruleItem}>🎤  Sale una palabra semilla</Text>
                                <Text style={s.ruleItem}>⏱  Tienes 3 segundos para rimar</Text>
                                <Text style={s.ruleItem}>🚫  Prohibido repetir rimas</Text>
                            </View>
                        </ScrollView>
                        <View style={s.footerBtn}>
                            <GlowButton label="SOLTAR VERSOS" onPress={startGame} color={ACCENT} />
                        </View>
                    </View>
                )}

                {/* GAME */}
                {phase === 'game' && (
                    <View style={s.gameContainer}>
                        <View style={[s.turnBadge, { borderColor: ACCENT + '33' }]}>
                            <Text style={s.turnLabel}>RIMA</Text>
                            <Text style={[s.turnName, { color: ACCENT }]}>{players[turnIdx]}</Text>
                        </View>
                        <View style={[s.seedCard, { borderColor: ACCENT + '66', shadowColor: ACCENT }]}>
                            <Text style={s.seedLabel}>RIMA CON</Text>
                            <Text style={[s.seedWord, { color: ACCENT }]}>{seedWord}</Text>
                        </View>

                        <LiquidTimer fillRatio={fillRatio} timeLeft={timeLeft} />

                        <View style={s.historyBox}>
                            <Text style={s.historyLabel}>RIMAS DICHAS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {rhymeHistory.map((w, i) => (
                                    <View key={i} style={[s.rhymeChip, i === 0 && { borderColor: ACCENT + '44' }]}>
                                        <Text style={[s.rhymeWord, i === 0 && { color: ACCENT }]}>{w}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={s.judgeBox}>
                            <Text style={s.judgeTitle}>¿HA SIDO VÁLIDA?</Text>
                            <View style={s.actionRow}>
                                <ActionButton label="VÁLIDA" onPress={judgeValid} color={C.green} />
                                <ActionButton label="FALLO" onPress={judgeInvalid} color={C.red} />
                            </View>
                        </View>
                    </View>
                )}

                {/* RESULT */}
                {phase === 'result' && (
                    <View style={s.gameContainer}>
                        <Animated.View style={[s.verdictBox, { borderColor: C.red + '55', transform: [{ scale: revealAnim }] }]}>
                            <Text style={s.verdictEmoji}>✏️❌</Text>
                            <Text style={[s.verdictText, { color: C.red }]}>
                                {`¡POETA FALLIDO!\n`}
                                <Text style={{ color: '#fff' }}>{players[loser]}</Text>
                                {`\nbebe 2 tragos`}
                            </Text>
                        </Animated.View>
                        <GlowButton label="SIGUIENTE RONDA" onPress={nextRound} color={ACCENT} />
                    </View>
                )}

            </Animated.View>

            <ExitModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); onExit(); }} />

             <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.errorCard, { borderColor: ACCENT }]}>
            <Text style={s.errorEmoji}>🎤😶</Text>
            <Text style={[s.errorTitle, { color: ACCENT }]}>¡MICRÓFONOS SIN VOZ!</Text>
            <Text style={s.errorText}>
              Hay poetas sin nombre y eso es muy poco poético.{'\n\n'}
              <Text style={{ color: ACCENT, fontWeight: '800' }}>Bautiza a todos los rimadores</Text>
              {' '}antes de que empiece el slam de retrete.
            </Text>
            <TouchableOpacity
              style={[s.errorBtn, { backgroundColor: ACCENT }]}
              onPress={() => setShowError(false)}
            >
              <Text style={s.errorBtnText}>¡A PONERLES NOMBRE!</Text>
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
    setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    setupTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: 20 },
    selectorBox: { marginBottom: 30, alignItems: 'center' },
    namesScroll: { flex: 1, marginBottom: 100 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
        borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222',
        paddingHorizontal: 15, height: 55,
    },
    inputNumber: { fontWeight: '900', fontSize: 16, marginRight: 15 },
    nameInput: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
    footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
    rulesBox: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 14, gap: 7, marginTop: 10 },
    ruleItem: { color: C.dim, fontSize: 12, fontWeight: '600' },
    gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 22 },
    turnBadge: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 14, alignItems: 'center', width: '100%', borderWidth: 1 },
    turnLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
    turnName: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
    seedCard: { width: '100%', backgroundColor: '#0c0c0c', borderRadius: 22, borderWidth: 2, alignItems: 'center', padding: 20, elevation: 10, shadowRadius: 15, shadowOpacity: 0.3 },
    seedLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
    seedWord: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
    timerCircle: { backgroundColor: '#080808', borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    timerNum: { fontSize: 42, fontWeight: '900', color: '#fff' },
    historyBox: { width: '100%', gap: 8 },
    historyLabel: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    rhymeChip: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
    rhymeWord: { color: C.text, fontSize: 14, fontWeight: '700' },
    judgeBox: { width: '100%', alignItems: 'center', gap: 10 },
    judgeTitle: { color: C.dim, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
    actionRow: { flexDirection: 'row', gap: 14 },
    verdictBox: { backgroundColor: '#0c0c0c', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', borderWidth: 2 },
    verdictEmoji: { fontSize: 40, marginBottom: 10 },
    verdictText: { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    errorCard: { backgroundColor: '#111', borderRadius: 30, padding: 30, width: '100%', borderWidth: 2, alignItems: 'center' },
    errorEmoji: { fontSize: 50, marginBottom: 15 },
    errorTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
    errorText: { color: '#bbb', textAlign: 'center', marginBottom: 25 },
    errorBtn: { paddingVertical: 15, borderRadius: 15, width: '100%', alignItems: 'center' },
    errorBtnText: { color: '#FFF', fontWeight: '900' },
});