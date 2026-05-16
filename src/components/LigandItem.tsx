import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LigandItem as LigandItemType, RootStackParamList } from '../types/protein.types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  item: LigandItemType;
  onPress: (id: string) => void;
  searchQuery: string;
}

// 20 meaningful icons for molecules, physics, chemistry, interactions, 3D
const ICON_NAMES: Array<keyof typeof Ionicons.glyphMap> = [
  'flask-outline',       // 0 - chemistry lab
  'beaker-outline',      // 1 - chemical experiments
  'magnet-outline',      // 2 - magnetic interactions
  'snow-outline',
  'pulse-outline',       // 4 - biological activity
  'leaf-outline',        // 5 - biochemistry / natural
  'nuclear-outline',     // 3 - atomic / nuclear
  'bonfire-outline',    // 6 - molecular structure
  'shapes-outline',      // 12 - geometric shapes
  'analytics-outline',          // 7 - genetics / macromolecules
  'barcode-outline',     // 8 - data / coding
  'cube-outline',        // 9 - 3D shape
  'grid-outline',        // 11 - 3D grid / coordinates
  'bandage-outline',     // 14 - medical / pharmaceutical
  'disc-outline',        // 15 - circular / cyclic
  'infinite-outline',    // 18 - infinite interactions
  'star-outline',        // 19 - stellar / twinkling
  'speedometer-outline',
  'dice-outline',
  'prism-outline',
  'scan-outline',
  'planet-outline',
  'telescope-outline',
  'eye-outline',         // 16 - visualisation
  'calculator-outline',
  'egg-outline',
  'flower-outline',
  'hardware-chip-outline',
  'key-outline',
  'locate-outline',
  'paw-outline',
  'radio-outline',
  'rose-outline',
  'tennisball-outline',
  'wine-outline',
];

// Cycle through icons using the item's index (unique per item, no repeats until all 20 are used)
const getIconForLigand = (index: number): keyof typeof Ionicons.glyphMap => {
  const iconIndex = index % ICON_NAMES.length;
  return ICON_NAMES[iconIndex];
};

const HighlightedText: React.FC<{
  text: string;
  highlight: string;
}> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return (
      <Text className="text-accent font-bold text-base tracking-wider">
        {text}
      </Text>
    );
  }

  const upperText = text.toUpperCase();
  const upperHighlight = highlight.toUpperCase().trim();
  const index = upperText.indexOf(upperHighlight);

  if (index === -1) {
    return (
      <Text className="text-accent font-bold text-base tracking-wider">
        {text}
      </Text>
    );
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + upperHighlight.length);
  const after = text.slice(index + upperHighlight.length);

  return (
    <Text className="text-accent font-bold text-base tracking-wider">
      {before}
      <Text className="text-bg bg-accent">{match}</Text>
      {after}
    </Text>
  );
};

const LigandItemComponent: React.FC<Props> = ({ item, onPress, searchQuery }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const iconName = getIconForLigand(item.index);

  return (
    <View className="flex-row items-center mb-3">
      <TouchableOpacity
        className="flex-1 flex-row items-center bg-card border border-border rounded-xl px-4 py-2"
        onPress={() => onPress(item.id)}
        activeOpacity={0.6}
      >
        <View className="w-8 h-8 rounded-lg bg-bg items-center justify-center mr-3">
          <Ionicons name={iconName} size={16} color="#9CA3AF" />
        </View>
        <View className="flex-1">
          <HighlightedText text={item.id} highlight={searchQuery} />
          <Text className="text-muted text-xs mt-0.5 tracking-widest">
            ligand · rcsb pdb
          </Text>
        </View>
        {/* <TouchableOpacity
          className="mr-8 w-14 h-8  border border-border rounded items-center justify-center"
          onPress={() => navigation.navigate('TestingMoleculeList', { ligandId: item.id })}
          activeOpacity={0.7}
        >
          <Text className="text-accent text-[12px] font-bold px-1" numberOfLines={1} adjustsFontSizeToFit>List</Text>
        </TouchableOpacity> */}

        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />

      </TouchableOpacity>
    </View>
  );
};

export default React.memo(LigandItemComponent);