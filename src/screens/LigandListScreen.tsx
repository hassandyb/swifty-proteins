import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLigands } from '../hooks/useLigands';
import LigandItemComponent from '../components/LigandItem';
import { RootStackParamList, LigandItem } from '../types/protein.types';
import { isValidLigandId } from '../utils/moleculeHelpers';
import { Ionicons } from '@expo/vector-icons';


type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ITEM_HEIGHT = 72;

const LigandListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const {
    filteredLigands,
    searchQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
    totalCount,
    filteredCount,
  } = useLigands();

  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const handleSelect = useCallback(
    (id: string) => {
      const sanitized = id.toUpperCase().trim();
      console.log(`[LigandListScreen] handleSelect: ${id} -> ${sanitized}, valid: ${isValidLigandId(sanitized)}`);
      if (!isValidLigandId(sanitized)) return;
      navigation.navigate('Protein', { ligandId: sanitized });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LigandItem>) => (
      <LigandItemComponent
        item={item}
        onPress={handleSelect}
        searchQuery={searchQuery}
      />
    ),
    [handleSelect, searchQuery]
  );

  const keyExtractor = useCallback((item: LigandItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<LigandItem> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const ListEmpty = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted dark:text-muted text-4xl mb-3">⊘</Text>
        <Text className="text-accent dark:text-accent font-bold text-base">No ligands found</Text>
        <Text className="text-muted dark:text-muted text-sm mt-1 text-center px-8">
          No results. Try a different identifier.
        </Text>
      </View>
    ),
    []
  );

  const ListHeader = useCallback(
    () => (
      <View className="mb-4">
        <Text className="text-muted dark:text-muted text-xs tracking-[0.2em] uppercase mb-1">
          {isSearching
            ? 'Searching...'
            : `${filteredCount} of ${totalCount} ligands`}
        </Text>
      </View>
    ),
    [filteredCount, totalCount, isSearching]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg">
      <View className="px-6 pt-4 pb-3 border-b border-border dark:border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-accent dark:text-accent font-black text-2xl tracking-tight">
              Ligands
            </Text>
            <Text className="text-muted dark:text-muted text-xs tracking-widest uppercase mt-0.5">
              protein data bank
            </Text>
          </View>
          {/* Pin icon removed – now accessible from Settings */}
        </View>

        <View
          className={`flex-row items-center bg-card dark:bg-card border my-5 rounded-xl px-4 ${
            isFocused ? 'border-accent dark:border-accent' : 'border-border dark:border-border'
          }`}
        >
          <Text className="text-muted dark:text-muted text-sm mr-2">
                      <Ionicons name="search" size={16} color="#9CA3AF" />

          </Text>
          <TextInput
            ref={searchRef}
            className="flex-1 py-3 text-accent dark:text-accent text-sm"
            placeholder="search ligands..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="var(--color-accent)" className="pl-3" />
          )}
          {!isSearching && (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.6}>
              <Text className="text-accent dark:text-accent text-lg ml-2">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredLigands}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{
          paddingHorizontal: 30,
          paddingLeft: 18,
          paddingRight: 18,
          paddingTop: 16,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
};

export default LigandListScreen;