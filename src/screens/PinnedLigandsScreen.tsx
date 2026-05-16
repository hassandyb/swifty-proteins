import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as pinnedService from '../services/pinnedService';
import { RootStackParamList, LigandItem } from '../types/protein.types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PinnedLigands'>;

const PinnedLigandsScreen: React.FC<Props> = ({ navigation }) => {
  const [pinnedItems, setPinnedItems] = useState<LigandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadPinned();
    }, [])
  );

  const loadPinned = async () => {
    try {
      setIsLoading(true);
      const pinned = await pinnedService.getPinnedLigandsAsync();
      const ligandItems: LigandItem[] = pinned.map((p, index) => ({
        id: p.ligandId,
        index,
      }));
      setPinnedItems(ligandItems);
    } catch (error) {
      console.error('Error loading pinned ligands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLigand = (ligandId: string) => {
    navigation.navigate('Protein', { ligandId });
  };

  const handleUnpin = async (ligandId: string) => {
    try {
      await pinnedService.unpinLigandAsync(ligandId);
      await loadPinned();
    } catch (error) {
      console.error('Error unpinning ligand:', error);
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LigandItem>) => (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={() => handleSelectLigand(item.id)}
          style={{ flex: 1 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>
            {item.id}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Pinned
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleUnpin(item.id)}
          style={{ padding: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.muted} />
        </TouchableOpacity>
      </View>
    ),
    [colors, handleSelectLigand, handleUnpin]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 16 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.text, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: -0.5 }}>
            Pinned Ligands
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
            {pinnedItems.length} saved
          </Text>
        </View>
      </View>

      {/* Content */}
      {pinnedItems.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="pin-outline" size={40} color={colors.muted} />
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>
            No pinned ligands
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            Pin your favorite molecules to access them quickly
          </Text>
        </View>
      ) : (
        <FlatList
          data={pinnedItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeAreaView>
  );
};

export default PinnedLigandsScreen;