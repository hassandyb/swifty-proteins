import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, AppStackParamList } from '../types/protein.types';
import { authService } from '../auth/authService';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ProteinScreen from '../screens/ProteinScreen';
import TestingMoleculeListScreen from '../screens/TestingMoleculeListScreen';
import PinnedLigandsScreen from '../screens/PinnedLigandsScreen';
import AppTabs from './AppTabs';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const { colors } = useTheme();
  const { isAuthenticated, signOut } = useAuthContext();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const returningFromBackground =
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active';

      if (returningFromBackground && !authService.isBiometricPromptActive) {
        // Await logout so SecureStore is cleared BEFORE Login screen appears
        await authService.logout();
        signOut();
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [signOut]);

  if (!isAuthenticated) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <AppStack.Screen
        name="AppTabs"
        component={AppTabs}
      />
      <AppStack.Screen
        name="Protein"
        component={ProteinScreen}
        options={{
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <AppStack.Screen
        name="TestingMoleculeList"
        component={TestingMoleculeListScreen}
        options={{
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <AppStack.Screen
        name="PinnedLigands"
        component={PinnedLigandsScreen}
        options={{
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </AppStack.Navigator>
  );
};

export default AppNavigator;