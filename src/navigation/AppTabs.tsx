// src/navigation/AppTabs.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LigandListScreen from '../screens/LigandListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { AppTabParamList } from '../types/protein.types';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<AppTabParamList>();

const AppTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const tabBarStyle = {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 2,
    height: 70 + insets.bottom,
    paddingTop: 12,
  } as const;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={LigandListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Ligands',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;