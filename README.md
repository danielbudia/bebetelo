# BEBETELO — React Native (Expo)

App de juegos de beber para grupos. Convierte el HTML/JS original a React Native con Expo.

## Estructura

```
bebetelo/
├── App.js                    ← navegación raíz
├── app.json                  ← config Expo
├── package.json
├── babel.config.js
└── src/
    ├── theme.js              ← colores, tokens de diseño
    ├── data.js               ← todo el contenido (categorías, preguntas, retos, frases)
    ├── utils.js              ← shuffle, pick, clamp
    ├── components/
    │   └── UI.js             ← GlowButton, ActionButton, GameHeader, CountSelector, PlayingCard, ExitModal
    └── screens/
        ├── SplashScreen.js   ← carga animada con vaso
        ├── MenuScreen.js     ← grid de juegos con entrada escalonada
        ├── RulesScreen.js    ← normas + overlay de carga al entrar al juego
        ├── BombaScreen.js
        ├── MayorMenorScreen.js
        ├── CaballosScreen.js
        ├── ConfesionarioScreen.js
        ├── DosMentirasScreen.js
        ├── RompehielosScreen.js
        └── YoNuncaScreen.js
```

## Arrancar en local

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar Expo
npx expo start

# 3. Escanear QR con la app Expo Go (iOS/Android)
#    o pulsar 'a' para Android emulator, 'i' para iOS simulator
```

## Para publicar en stores

### Expo Application Services (recomendado)
```bash
npm install -g eas-cli
eas login
eas build --platform ios      # build para App Store
eas build --platform android  # build para Play Store
```

### Requisitos previos
- Cuenta de Apple Developer (99€/año) para iOS
- Cuenta de Google Play (25€ pago único) para Android
- `eas.json` configurado con tus credenciales

## Notas de la conversión

- **Sin Tailwind**: React Native no admite Tailwind real. Se usa `StyleSheet` con los
  mismos valores del `:root` CSS original (`theme.js`).
- **Sin Web Audio API**: los sonidos del tick de la bomba se eliminaron porque RN
  necesita `expo-av` como dependencia extra. Puedes añadirlo fácilmente:
  ```bash
  npx expo install expo-av
  ```
  Y en BombaScreen.js importar `Audio` de `expo-av`.
- **Vibración**: usa `Vibration` de react-native (funciona en Android; iOS solo vibra
  si no está en modo silencio).
- **Animaciones**: todas con `Animated` API nativa (`useNativeDriver: true` donde es
  posible) para 60fps sin jank.

## Bugs corregidos del original

1. `startCaballos()` estaba definido dos veces en el JS — eliminado duplicado.
2. `checkFences()` también estaba duplicado con lógicas contradictorias — unificado.
3. `judgeVerdict()` duplicada — se quedó con la versión correcta.
4. El estado de `fencePassed` en Caballos ahora es inmutable (setState) en vez de
   mutar un array directamente.
5. El deck de Mayor/Menor se baraja correctamente al agotarse.
