import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProtein } from '../hooks/useProtein';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/protein.types';

type Props = NativeStackScreenProps<RootStackParamList, 'TestingMoleculeList'>;

const TestingMoleculeListScreen: React.FC<Props> = ({ route }) => {
  const { ligandId } = route.params;
  const { colors } = useTheme();
  const { molecule, loadingState, error, isCached, fetchMolecule } = useProtein();

  useEffect(() => {
    fetchMolecule(ligandId);
  }, [ligandId]);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg">
      <View className="px-6 pt-4 pb-3 border-b border-border dark:border-border flex-row items-center">
        <View className="ml-6">
          <Text className="text-accent dark:text-accent font-black text-2xl  tracking-tight">
            {ligandId} Data
          </Text>
          <Text className="text-muted dark:text-muted text-xs tracking-widest uppercase">
            {isCached ? 'from cache' : 'from network'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={true}
      >
        {loadingState === 'loading' && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="text-muted dark:text-muted text-sm mt-4">
              Fetching {ligandId}.cif...
            </Text>
          </View>
        )}

        {loadingState === 'error' && (
          <View className="bg-danger/10 dark:bg-danger/10 border border-danger/20 dark:border-danger/20 rounded-xl p-4 mb-4">
            <Text className="text-danger dark:text-danger font-bold mb-1">Error</Text>
            <Text className="text-danger dark:text-danger/80 dark:text-danger/80 text-sm">{error}</Text>
            <TouchableOpacity
              className="mt-3 border border-danger/30 dark:border-danger/30 rounded-lg py-2 items-center"
              onPress={() => fetchMolecule(ligandId)}
              activeOpacity={0.7}
            >
              <Text className="text-danger dark:text-danger text-sm font-semibold">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loadingState === 'success' && molecule && (
          <>
            {/* Summary */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-card dark:bg-card border border-border dark:border-border rounded-xl p-4">
                <Text className="text-muted dark:text-muted text-xs uppercase tracking-widest mb-1">
                  Atoms
                </Text>
                <Text className="text-accent dark:text-accent font-black text-2xl">
                  {molecule.atoms.length}
                </Text>
              </View>
              <View className="flex-1 bg-card dark:bg-card border border-border dark:border-border rounded-xl p-4">
                <Text className="text-muted dark:text-muted text-xs uppercase tracking-widest mb-1">
                  Bonds
                </Text>
                <Text className="text-accent dark:text-accent font-black text-2xl">
                  {molecule.bonds.length}
                </Text>
              </View>
            </View>

            {/* Atom list */}
            <Text className="text-muted dark:text-muted text-xs tracking-[0.2em] uppercase mb-3">
              Atom Table
            </Text>
            {molecule.atoms.map((atom) => (
              <View
                key={atom.id}
                className="flex-row items-center bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 mb-2"
              >
                <View className="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/10 items-center justify-center mr-3">
                  <Text className="text-accent dark:text-accent font-black text-sm">
                    {atom.element}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-accent dark:text-accent text-sm font-semibold">
                    {atom.name}
                  </Text>
                  <Text className="text-muted dark:text-muted text-xs font-mono">
                    x:{atom.x.toFixed(3)} y:{atom.y.toFixed(3)} z:{atom.z.toFixed(3)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Bond list */}
            <Text className="text-muted dark:text-muted text-xs tracking-[0.2em] uppercase mt-4 mb-3">
              Bond Table
            </Text>
            {molecule.bonds.map((bond, i) => (
              <View
                key={i}
                className="flex-row items-center bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 mb-2"
              >
                {bond.order == 1 ? <Text className="text-accent dark:text-accent text-sm font-mono flex-1">
                    {bond.atomId1} —— {bond.atomId2}
                  </Text> : <Text className="text-accent dark:text-accent text-sm font-mono flex-1">
                    {bond.atomId1} ══ {bond.atomId2}
                  </Text>
                }
                <Text className="text-muted dark:text-muted text-xs">
                  order {bond.order}
                </Text>
              </View>
            ))}

            <View className="h-10" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TestingMoleculeListScreen;