import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthContext } from '../context/AuthContext';
import { authService } from '../auth/authService';
import { useTheme } from '../context/ThemeContext';
import * as pinnedService from '../services/pinnedService';
import { AppStackParamList } from '../types/protein.types';
import { IOSSwitch } from '../components/Switch';


type NavProp = NativeStackNavigationProp<AppStackParamList>;
interface RowProps {
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const SettingsRow: React.FC<RowProps> = ({ label, sublabel, right, onPress }) => {
  const { colors } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2, letterSpacing: 0.3 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right && <View>{right}</View>}
      {onPress && !right && <Text style={{ color: colors.muted, fontSize: 16 }}>›</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const SectionLabel: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        color: colors.muted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 24,
        marginLeft: 4,
      }}
    >
      {title}
    </Text>
  );
};

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { setThemeMode, colors, isDark } = useTheme();
  const { signOut } = useAuthContext();

  const [username, setUsername] = useState<string | null>(null);
  const [deviceHasBiometrics, setDeviceHasBiometrics] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinnedCount, setPinnedCount] = useState(0);

  // Load user and biometrics once on mount
  useEffect(() => {
    const load = async () => {
      const [sessionUser, deviceOk] = await Promise.all([
        authService.getSessionUser(),
        authService.isBiometricAvailable(),
      ]);
      setUsername(sessionUser);
      setDeviceHasBiometrics(deviceOk);
      if (sessionUser && deviceOk) {
        const enabled = await authService.isBiometricEnabledForUser(sessionUser);
        setBiometricEnabled(enabled);
      }
    };
    load();
  }, []);

  // Refresh pinned count every time screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadPinnedCount = async () => {
        const pinned = await pinnedService.getPinnedLigandsAsync();
        setPinnedCount(pinned.length);
      };
      loadPinnedCount();
    }, [])
  );

  const handleBiometricToggle = useCallback(
    async (newValue: boolean) => {
      if (!username) return;
      setError(null);

      if (!newValue) {
        await authService.setBiometricEnabled(username, false);
        setBiometricEnabled(false);
        return;
      }

      setBiometricLoading(true);
      try {
        const result = await authService.authenticateWithBiometrics();
        if (result.success) {
          await authService.setBiometricEnabled(username, true);
          setBiometricEnabled(true);
          Alert.alert(
            'Biometrics enabled',
            'You can now use your fingerprint or Face ID to log in next time.',
            [{ text: 'Got it' }]
          );
        } else {
          setBiometricEnabled(false);
          setError(result.error ?? 'Biometric verification failed. Try again.');
        }
      } catch {
        setBiometricEnabled(false);
        setError('Biometric authentication unavailable on this device.');
      } finally {
        setBiometricLoading(false);
      }
    },
    [username]
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authService.logout();
              signOut(); // declarative — Login stack mounts immediately
            } catch {
              setIsLoggingOut(false);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [signOut]);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 20, marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>
            Settings
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            swifty protein
          </Text>
        </View>



        {/* Account */}
        <SectionLabel title="Account" />
        <SettingsRow
          label="Logged in as"
          sublabel={username ?? '—'}
          right={null}
        />

        {/* Appearance */}
        <SectionLabel title="Appearance" />
        <SettingsRow
          label="Theme Mode"
          right={
             <TouchableOpacity
              onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? colors.border : colors.text,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: isDark ? colors.text : colors.bg, fontSize: 12, fontWeight: '800' }}>
                {isDark ? '◐ DARK' : '✷ LIGHT'}
              </Text>
            </TouchableOpacity>

          }
        />

        {/* Security */}
        {deviceHasBiometrics && (
          <>
            <SectionLabel title="Security" />
            {error ? (
              <View
                style={{
                  backgroundColor: `${colors.danger}25`,
                  borderWidth: 1,
                  borderColor: `${colors.danger}40`,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: colors.danger, fontSize: 12, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            ) : null}
            <SettingsRow
              label="Login with Biometrics"
              sublabel={
                biometricEnabled
                  ? 'Active — fingerprint button shown at login'
                  : 'Enable to use fingerprint at next login'
              }
              right={
                biometricLoading ? (
                  <ActivityIndicator color={colors.accent} style={{ marginLeft: 12 }} />
                ) : (
                  <IOSSwitch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    style={{ marginLeft: 12 }}
                  />
                )
              }
            />
          </>
        )}

        {/* Pinned Ligands - moved to settings */}
        <SectionLabel title="Pinned Ligands" />
        <SettingsRow
          label="View pinned ligands"
          sublabel={`${pinnedCount} molecule${pinnedCount !== 1 ? 's' : ''} pinned`}
          onPress={() => navigation.navigate('PinnedLigands')}
        />

        {/* Session */}
        <SectionLabel title="Session" />
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
          style={{
            backgroundColor: `${colors.danger}25`,
            borderWidth: 1,
            borderColor: `${colors.danger}40`,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isLoggingOut ? 0.5 : 1,
          }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>
              Log out
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 32, letterSpacing: 1 }}>
          credentials stored securely · swifty protein v1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;