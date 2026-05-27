import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { C } from './src/theme';

// Pantallas base
import SplashScreen      from './src/screens/SplashScreen';
import MenuScreen        from './src/screens/MenuScreen';
import RulesScreen       from './src/screens/RulesScreen';

// Juegos originales
import BombaScreen       from './src/screens/BombaScreen';
import MayorMenorScreen  from './src/screens/MayorMenorScreen';
import CaballosScreen    from './src/screens/CaballosScreen';
import ConfesionarioScreen from './src/screens/ConfesionarioScreen';
import DosMentirasScreen from './src/screens/DosMentirasScreen';
import RompehielosScreen from './src/screens/RompehielosScreen';
import YoNuncaScreen     from './src/screens/YoNuncaScreen';

// NUEVOS JUEGOS (Importados con el nombre exacto de tu captura)
import SabioOEbrioScreen from './src/screens/SabioOEbrioScreen';
import LudopatiaScreen   from './src/screens/LudopatiaScreen';
import MimicaScreen      from './src/screens/MimicaScreen';
import RimaBebeScreen    from './src/screens/RimaBebeScreen';

// Claves EXACTAMENTE iguales a tu data.js
const GAME_SCREENS = {
  bomba:         BombaScreen,
  mayormenor:    MayorMenorScreen,
  caballos:      CaballosScreen,
  confesionario: ConfesionarioScreen,
  dosmentiras:   DosMentirasScreen,
  rompehielos:   RompehielosScreen,
  yonunca:       YoNuncaScreen,
  
  // Aquí hacemos la "magia" conectando el nombre de tu data.js con tu archivo real:
  sabiooebrio:   SabioOEbrioScreen, // data.js dice 'sabiooebrio'
  subasta:       LudopatiaScreen,   // data.js dice 'subasta' pero el archivo es LudopatiaScreen
  mimica:        MimicaScreen,      // data.js dice 'mimica'
  poetaRetrete:  RimaBebeScreen,    // data.js dice 'poetaRetrete' pero el archivo es RimaBebeScreen
};

export default function App() {
  const [route, setRoute]   = useState('splash');
  const [gameKey, setGameKey] = useState(null);

  const goMenu    = () => {
    setRoute('menu');
    setGameKey(null);
  };

  const goRules   = (key) => { 
    setGameKey(key); 
    setRoute('rules'); 
  };

  const goGame    = (key) => { 
    setGameKey(key); 
    setRoute('game'); 
  };

  const goBack    = () => setRoute('menu');

  // Seleccionamos el componente dinámicamente
  const CurrentGame = gameKey ? GAME_SCREENS[gameKey] : null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {route === 'splash' && <SplashScreen onReady={goMenu} />}
        
        {route === 'menu' && <MenuScreen onSelect={goRules} />}
        
        {route === 'rules' && gameKey && (
          <RulesScreen
            gameKey={gameKey}
            onBack={goBack}
            onStart={(key) => goGame(key)}
          />
        )}

        {route === 'game' && CurrentGame ? (
          <CurrentGame onExit={goMenu} />
        ) : null}

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
});