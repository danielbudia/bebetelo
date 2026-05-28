import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity,
    ScrollView, TextInput, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { C } from '../theme';
import { shuffle } from '../utils';
import { GameHeader, ExitModal, CountSelector, GlowButton } from '../components/UI';
import { PALABRAS_RIMA } from '../data';

const ACCENT = '#0091ff';

const SEMILLAS = shuffle([...PALABRAS_RIMA]);
let seedIdx = 0;
const getNextSeed = () => SEMILLAS[seedIdx++ % SEMILLAS.length];

// ─── Componente de los anillos del avatar ───────────────────────────────────
function AvatarRings({ name, accent }) {
    const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
    const avatarScale = useRef(new Animated.Value(0)).current;
    const nameAnim = useRef(new Animated.Value(0)).current;
    const nameX = useRef(new Animated.Value(-40)).current;

    useEffect(() => {
        // Avatar pop
        Animated.spring(avatarScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
        // Anillos en cascada
        rings.forEach((r, i) => {
            setTimeout(() => {
                Animated.timing(r, { toValue: 1, duration: 700, useNativeDriver: true }).start();
            }, i * 160);
        });
        // Nombre entra desde la izquierda
        setTimeout(() => {
            Animated.parallel([
                Animated.spring(nameAnim, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
                Animated.spring(nameX, { toValue: 0, tension: 70, friction: 7, useNativeDriver: true }),
            ]).start();
        }, 200);
    }, [name]);

    return (
        <View style={styles.avatarWrapper}>
            {/* Anillos que explotan */}
            {rings.map((r, i) => {
                const scale = r.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.2] });
                const opacity = r.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.6, 0] });
                return (
                    <Animated.View
                        key={i}
                        style={[styles.ring, { borderColor: accent, transform: [{ scale }], opacity }]}
                    />
                );
            })}
            {/* Avatar central */}
            <Animated.View style={[styles.avatarCircle, { borderColor: accent, backgroundColor: accent + '22', transform: [{ scale: avatarScale }] }]}>
                <Text style={[styles.avatarInitial, { color: accent }]}>{name.charAt(0).toUpperCase()}</Text>
            </Animated.View>
            {/* Nombre con slide */}
            <Animated.Text
                style={[styles.playerName, { opacity: nameAnim, transform: [{ translateX: nameX }] }]}
                numberOfLines={1}
            >
                {name.toUpperCase()}
            </Animated.Text>
            <Animated.Text style={[styles.playerSub, { opacity: nameAnim }]}>
                EMPIEZA RIMANDO
            </Animated.Text>
        </View>
    );
}

// ─── Pantalla de juego activo con animación al cambiar ──────────────────────
function ActiveGameScreen({ word, playerName, accent, onFail, onNext, onClose }) {
    const slideAnim = useRef(new Animated.Value(60)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const animateIn = () => {
        slideAnim.setValue(60);
        fadeAnim.setValue(0);
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => { animateIn(); }, [word]);

    return (
        <Animated.View style={[styles.activeScreen, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            {/* Palabra */}
            <View style={[styles.gameWordBox, { borderColor: accent }]}>
                <Text style={[styles.gameWordLabel, { color: accent }]}>RIMAR CON...</Text>
                <Text style={styles.gameWordText}>{word.toUpperCase()}</Text>
            </View>

            {/* Jugador activo */}
            <View style={styles.turnRow}>
                <View style={[styles.turnDot, { borderColor: accent, backgroundColor: accent + '18' }]}>
                    <Text style={[styles.turnDotText, { color: accent }]}>{playerName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.turnInfo}>
                    <Text style={styles.turnLbl}>EMPIEZA</Text>
                    <Text style={styles.turnNm} numberOfLines={1}>{playerName}</Text>
                </View>
            </View>

            {/* Botón beber */}
            <TouchableOpacity style={styles.failBtn} onPress={onFail} activeOpacity={0.85}>
                <Text style={styles.failBtnText}>❌  ¡ALGUIEN HA BEBIDO!</Text>
            </TouchableOpacity>
            
          
           

            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
                <Text style={styles.closeModalText}>Cerrar ronda</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── SCREEN PRINCIPAL ────────────────────────────────────────────────────────
export default function RimaBebeScreen({ onExit = () => { } }) {
    const [phase, setPhase] = useState('setup');
    const [numPlayers, setNumPlayers] = useState(4);
    const [players, setPlayers] = useState([]);

    const [turnIdx, setTurnIdx] = useState(0);
    const [seedWord, setSeedWord] = useState('');

    // 'word' | 'player' | 'active'
    const [modalPhase, setModalPhase] = useState('word');
    const [showWordModal, setShowWordModal] = useState(false);
    const [showExit, setShowExit] = useState(false);
    const [showError, setShowError] = useState(false);

    const entryAnim = useRef(new Animated.Value(0)).current;
    const headerY = useRef(new Animated.Value(0)).current;

    // Animaciones del modal por fase
    const wordScale = useRef(new Animated.Value(0)).current;
    const wordOpacity = useRef(new Animated.Value(0)).current;
    const revealBtnY = useRef(new Animated.Value(30)).current;

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

    // Animar entrada de la palabra cuando se abre el modal
    useEffect(() => {
        if (showWordModal && modalPhase === 'word') {
            wordScale.setValue(0.3);
            wordOpacity.setValue(0);
            revealBtnY.setValue(30);
            Animated.parallel([
                Animated.spring(wordScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
                Animated.timing(wordOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(revealBtnY, { toValue: 0, duration: 400, delay: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [showWordModal, modalPhase]);

    const handleNameChange = (text, index) => {
        const arr = [...players]; arr[index] = text; setPlayers(arr);
    };

    const startGame = () => {
        if (players.some(n => n.trim() === '')) { setShowError(true); return; }
        setPlayers(players.map(n => n.trim()));
        setTurnIdx(0);
        setSeedWord(getNextSeed());
        setPhase('ready');
    };

    const openGameModal = () => {
        setModalPhase('word');
        setShowWordModal(true);
    };

    // Al beber: nueva palabra, siguiente jugador, volver a fase 'word'
    const onFail = () => {
        setTurnIdx(prev => (prev + 1) % players.length);
        setSeedWord(getNextSeed());
        setModalPhase('word');
    };

    // Nueva palabra sin cambiar jugador (o cambia también, decide tú)
    const onNextWord = () => {
        setTurnIdx(prev => (prev + 1) % players.length);
        setSeedWord(getNextSeed());
        // Nos quedamos en 'active', la animación del word la dispara el useEffect de ActiveGameScreen
    };

    const hY = headerY.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
            <Animated.View style={{ transform: [{ translateY: hY }], opacity: entryAnim }}>
                <GameHeader title="Poeta de Retrete" color={ACCENT} onExit={() => setShowExit(true)} />
            </Animated.View>

            <Animated.View style={[styles.body, { opacity: entryAnim }]}>

                {/* ─── SETUP ─── */}
                {phase === 'setup' && (
                    <View style={styles.setupContainer}>
                        <Text style={styles.setupTitle}>¿QUIÉNES RIMAN?</Text>
                        <View style={styles.selectorBox}>
                            <CountSelector value={numPlayers} onChange={setNumPlayers} min={2} max={10} color={ACCENT} />
                        </View>
                        <ScrollView style={styles.namesScroll} showsVerticalScrollIndicator={false}>
                            {players.map((name, i) => (
                                <View key={i} style={styles.inputRow}>
                                    <Text style={[styles.inputNumber, { color: ACCENT }]}>{i + 1}</Text>
                                    <TextInput
                                        style={styles.nameInput}
                                        placeholder="Nombre del poeta..."
                                        placeholderTextColor="#444"
                                        value={name}
                                        onChangeText={t => handleNameChange(t, i)}
                                        maxLength={12}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.footerBtn}>
                            <GlowButton label="ENTRAR AL CONCURSO" onPress={startGame} color={ACCENT} />
                        </View>
                    </View>
                )}

                {/* ─── READY ─── */}
                {phase === 'ready' && (
                    <View style={styles.centeredContainer}>
                        <View style={styles.readyTitleBlock}>
                            <Text style={styles.readyEyebrow}>AFINAD LAS GARGANTAS</Text>
                            <Text style={styles.readyTitle}>LISTOS PARA RIMAR</Text>
                        </View>
                        <View style={styles.rulesCard}>
                            <Text style={styles.rulesEmoji}>📖</Text>
                            <Text style={[styles.rulesTitle, { color: ACCENT }]}>CÓMO SE JUEGA</Text>
                            <Text style={styles.rulesText}>
                                Dejad el móvil en el centro de la mesa.{'\n\n'}
                                Saldrá una palabra y un jugador inicial. Desde ese jugador y <Text style={{ fontWeight: 'bold', color: '#fff' }}>hacia la derecha</Text>, tenéis que decir en voz alta una palabra que rime.{'\n\n'}
                                El primero que tarde mucho, repita o diga una inventada...
                                 {'\n'}<Text style={{ color: ACCENT, fontWeight: '900' }}>¡BEBE Y PULSA EL BOTÓN!</Text>
                                {'\n'}Pulsa "¡ALGUIEN HA BEBIDO!" para generar una nueva palabra
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.discoverBtn, { backgroundColor: ACCENT }]} onPress={openGameModal} activeOpacity={0.85}>
                            <Text style={styles.discoverBtnEmoji}>🎤</Text>
                            <Text style={styles.discoverBtnText}>¡DAME UNA PALABRA!</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            {/* ════════════════════════════════════════════
                MODAL — 3 FASES
            ════════════════════════════════════════════ */}
            <Modal visible={showWordModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.gameModalCard, { borderColor: ACCENT }]}>

                        {/* ── FASE 1: LA PALABRA ── */}
                        {modalPhase === 'word' && (
                            <>
                                <Text style={styles.seedTopLabel}>LA PALABRA ES...</Text>

                                <Animated.View style={[
                                    styles.seedBox,
                                    { borderColor: ACCENT, transform: [{ scale: wordScale }], opacity: wordOpacity }
                                ]}>
                                    <Text style={styles.seedWord}>{seedWord.toUpperCase()}</Text>
                                    <Text style={[styles.seedSub, { color: ACCENT }]}>POETA DE RETRETE</Text>
                                </Animated.View>

                                <Animated.View style={{ width: '100%', transform: [{ translateY: revealBtnY }], opacity: wordOpacity }}>
                                    <TouchableOpacity
                                        style={[styles.revealBtn, { backgroundColor: ACCENT }]}
                                        onPress={() => setModalPhase('player')}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.revealBtnText}>REVELAR POETA  ›</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </>
                        )}

                        {/* ── FASE 2: EL JUGADOR ── */}
                        {modalPhase === 'player' && (
                            <>
                                <Text style={styles.seedTopLabel}>LE TOCA A...</Text>
                                <AvatarRings name={players[turnIdx] || '?'} accent={ACCENT} />
                                <TouchableOpacity
                                    style={[styles.revealBtn, { backgroundColor: ACCENT, marginTop: 28 }]}
                                    onPress={() => setModalPhase('active')}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.revealBtnText}>¡EMPEZAR RONDA!  ›</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── FASE 3: JUEGO ACTIVO ── */}
                        {modalPhase === 'active' && (
                            <ActiveGameScreen
                                word={seedWord}
                                playerName={players[turnIdx] || '?'}
                                accent={ACCENT}
                                onFail={onFail}
                                onNext={onNextWord}
                                onClose={() => { setShowWordModal(false); setModalPhase('word'); }}
                            />
                        )}

                    </View>
                </View>
            </Modal>

            {/* ─── Error Modal ─── */}
            <Modal visible={showError} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.errorCard, { borderColor: ACCENT }]}>
                        <Text style={styles.errorEmoji}>🎤😶</Text>
                        <Text style={[styles.errorTitle, { color: ACCENT }]}>¡MICRÓFONOS SIN VOZ!</Text>
                        <Text style={styles.errorText}>
                            Hay poetas sin nombre y eso es muy poco poético.{'\n\n'}
                            <Text style={{ color: ACCENT, fontWeight: '800' }}>Bautiza a todos los rimadores</Text>
                            {' '}antes de que empiece el slam de retrete.
                        </Text>
                        <TouchableOpacity style={[styles.errorBtn, { backgroundColor: ACCENT }]} onPress={() => setShowError(false)}>
                            <Text style={styles.errorBtnText}>¡A PONERLES NOMBRE!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ExitModal
                visible={showExit}
                onCancel={() => setShowExit(false)}
                onConfirm={() => { setShowExit(false); onExit(); }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    body: { flex: 1, width: '100%' },

    // Setup
    setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    setupTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: 20 },
    selectorBox: { marginBottom: 30, alignItems: 'center' },
    namesScroll: { flex: 1, marginBottom: 100 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222', paddingHorizontal: 15, height: 55 },
    inputNumber: { fontWeight: '900', fontSize: 16, marginRight: 15 },
    nameInput: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
    footerBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },

    // Ready
    centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 30 },
    readyTitleBlock: { alignItems: 'center', gap: 5 },
    readyEyebrow: { color: '#555', fontSize: 12, fontWeight: '900', letterSpacing: 4 },
    readyTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
    rulesCard: { backgroundColor: '#0e0e0e', borderRadius: 24, borderWidth: 1, borderColor: '#222', padding: 24, alignItems: 'center', width: '100%' },
    rulesEmoji: { fontSize: 30, marginBottom: 10 },
    rulesTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
    rulesText: { color: '#aaa', fontSize: 15, lineHeight: 24, textAlign: 'center' },
    discoverBtn: { width: '100%', flexDirection: 'row', borderRadius: 20, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 5 },
    discoverBtnEmoji: { fontSize: 24 },
    discoverBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    // Modal base
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    gameModalCard: { backgroundColor: '#111', borderRadius: 30, padding: 28, width: '100%', borderWidth: 2, alignItems: 'center', overflow: 'hidden' },

    // Fase 1 — Palabra
    seedTopLabel: { color: '#555', fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 20 },
    seedBox: { width: '100%', backgroundColor: '#000', borderRadius: 24, borderWidth: 2, paddingVertical: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    seedWord: { fontSize: 35, fontWeight: '900', textAlign: 'center', letterSpacing: 2, color: '#fff', textShadowColor: ACCENT, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
    seedSub: { fontSize: 10, fontWeight: '800', letterSpacing: 4, marginTop: 8 },
    revealBtn: { width: '100%', borderRadius: 18, paddingVertical: 20, alignItems: 'center' },
    revealBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    // Fase 2 — Jugador
    avatarWrapper: { alignItems: 'center', width: '100%', paddingVertical: 12 },
    ring: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 38, fontWeight: '900' },
    playerName: { fontSize: 25, fontWeight: '900', color: '#fff', letterSpacing: 1, textAlign: 'center', marginTop: 20 },
    playerSub: { color: '#444', fontSize: 11, fontWeight: '800', letterSpacing: 4, marginTop: 6 },

    // Fase 3 — Activo
    activeScreen: { width: '100%', alignItems: 'center', gap: 14 },
    gameWordBox: { width: '100%', backgroundColor: '#000', borderRadius: 20, borderWidth: 2, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center' },
    gameWordLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
    gameWordText: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 2, textShadowColor: ACCENT, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
    turnRow: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 16, borderWidth: 1, borderColor: '#222', padding: 14, gap: 14 },
    turnDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    turnDotText: { fontSize: 16, fontWeight: '900' },
    turnInfo: { flex: 1 },
    turnLbl: { color: '#444', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
    turnNm: { color: '#fff', fontSize: 18, fontWeight: '900' },
    failBtn: { width: '100%', backgroundColor: '#1a0000', borderWidth: 2, borderColor: '#ff4d4d', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    failBtnText: { color: '#ff4d4d', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    nextWordBtn: { width: '100%', backgroundColor: '#0d1f33', borderWidth: 2, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    nextWordBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    closeModalBtn: { paddingVertical: 10 },
    closeModalText: { color: '#444', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },

    // Error modal
    errorCard: { backgroundColor: '#111', borderRadius: 30, padding: 30, width: '100%', borderWidth: 2, alignItems: 'center' },
    errorEmoji: { fontSize: 50, marginBottom: 15 },
    errorTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
    errorText: { color: '#bbb', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    errorBtn: { paddingVertical: 15, borderRadius: 15, width: '100%', alignItems: 'center' },
    errorBtnText: { color: '#fff', fontWeight: '900' },
});