import './global.css';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootWrapper() {
  const { colors, isDark } = useTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [resady, setResady] = useState(false);

  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animation immediately
    Animated.sequence([
      // Icon + title bounce in
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fades in slightly after
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Load fonts + enforce 2 second minimum (requirement)
    async function prepare() {
      try {
        await Promise.all([
          Font.loadAsync({ ...Ionicons.font }),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
      } catch (e) {
        console.warn('Preparation error:', e);
      } finally {
        // Fade out the custom splash before revealing the app
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(async () => {
          await SplashScreen.hideAsync();
          setReady(true);
        });
      }
    }

    prepare();
  }, []);

  if (!ready) {
    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
        }}
      >
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Image
            source={require('./assets/splash-icon-light.png')}
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
          />

          <Text
            style={{
              color: '#ffffff',
              fontSize: 30,
              fontWeight: '700',
              letterSpacing: 1,
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            Swifty Protein
          </Text>

          <Animated.Text
            style={{
              color: '#666666',
              fontSize: 13,
              letterSpacing: 3,
              marginTop: 8,
              textAlign: 'center',
              textTransform: 'uppercase',
              opacity: subtitleOpacity,
            }}
          >
            Molecular Visualizer
          </Animated.Text>
        </Animated.View>

        {/* Bottom tagline */}
        <Animated.Text
          style={{
            position: 'absolute',
            bottom: 60,
            color: '#333333',
            fontSize: 12,
            letterSpacing: 1,
            opacity: subtitleOpacity,
          }}
        >
          Powered by RCSB Protein Data Bank
        </Animated.Text>
      </Animated.View>
    );
  }

return (
  <ThemeProvider>
    <AuthProvider>
      <RootWrapper />
    </AuthProvider>
  </ThemeProvider>
);
}