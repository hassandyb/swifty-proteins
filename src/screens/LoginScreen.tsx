import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput as TextInputType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { AuthStackParamList } from '../types/protein.types';
import { authStyles } from '../styles/auth.styles';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// navigation prop kept for potential future use (deep links etc)
// but auth flow is driven by AuthContext, not navigation.reset()
const LoginScreen: React.FC<Props> = () => {
  const { colors } = useTheme();
  const { signIn } = useAuthContext();

  const {
    mode,
    username,
    password,
    confirmPassword,
    isLoading,
    error,
    showBiometricButton,
    setMode,
    setUsername,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    handleBiometric,
  } = useAuth();

  const passwordRef = useRef<TextInputType>(null);
  const confirmRef = useRef<TextInputType>(null);

  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      signIn(); // AuthContext re-renders AppNavigator → authenticated stack mounts
    }
  };

  const onBiometric = async () => {
    const { success, error: bioError } = await handleBiometric();
    if (!success) {
      Alert.alert('Authentication failed', bioError || 'Please try again.');
      return;
    }
    signIn();
  };

  return (
    <SafeAreaView className={authStyles.container}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className={authStyles.content}>
            <Text className={authStyles.bgWatermark} accessibilityElementsHidden>
              SP
            </Text>
            <View className={authStyles.header}>
              <Text className={authStyles.title}>
                swifty<Text className={authStyles.title}>.</Text>
              </Text>
              <Text className={authStyles.title}>protein</Text>
              <Text className={authStyles.subtitle}>molecular visualizer</Text>
            </View>

            <View className={authStyles.toggleContainer}>
              <TouchableOpacity
                className={`${authStyles.toggleBtn} ${mode === 'login' ? authStyles.toggleBtnActive : authStyles.toggleBtnInactive}`}
                onPress={() => setMode('login')}
                activeOpacity={0.8}
              >
                <Text className={mode === 'login' ? authStyles.toggleTextActive : authStyles.toggleTextInactive}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`${authStyles.toggleBtn} ${mode === 'register' ? authStyles.toggleBtnActive : authStyles.toggleBtnInactive}`}
                onPress={() => setMode('register')}
                activeOpacity={0.8}
              >
                <Text className={mode === 'register' ? authStyles.toggleTextActive : authStyles.toggleTextInactive}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <View className={authStyles.errorSlot}>
              {error ? (
                <View className={authStyles.errorContainer}>
                  <Text className={authStyles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            <View className={authStyles.inputsWrapper}>
              <View className="mb-3">
                <Text className={authStyles.inputLabel}>Username</Text>
                <TextInput
                  className={authStyles.inputField}
                  placeholder="enter username.."
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <View className="mb-3">
                <Text className={authStyles.inputLabel}>Password</Text>
                <TextInput
                  ref={passwordRef}
                  className={authStyles.inputField}
                  placeholder="enter password.."
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType={mode === 'register' ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (mode === 'register') confirmRef.current?.focus();
                    else onSubmit();
                  }}
                />
              </View>

              {mode === 'register' && (
                <View className="mb-3">
                  <Text className={authStyles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    ref={confirmRef}
                    className={authStyles.inputField}
                    placeholder="confirm password..."
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                </View>
              )}
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                className={`${authStyles.submitBtn} ${isLoading ? 'opacity-60' : ''}`}
                onPress={onSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text className={authStyles.submitText}>
                    {mode === 'login' ? 'Login' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              {showBiometricButton && mode === 'login' && (
                <TouchableOpacity
                  className={`${authStyles.biometricBtn} ${isLoading ? 'opacity-50' : ''}`}
                  onPress={onBiometric}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  accessibilityLabel="Login with biometrics"
                  accessibilityRole="button"
                >
                  <Ionicons name='finger-print' size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {showBiometricButton && mode === 'login' && (
              <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 10, letterSpacing: 0.5 }}>
                tap ⊙ to sign in with biometrics
              </Text>
            )}

            <Text className={authStyles.footer}>
              credentials stored securely on device
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;