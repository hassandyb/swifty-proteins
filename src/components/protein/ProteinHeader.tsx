import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GifStatus, VisualizationMode } from '../../types/protein.types';
import { MeasurementMode } from '../MeasurementOverlay';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  ligandId: string;
  isCached: boolean;
  loadingState: string;
  measurementMode: MeasurementMode;
  isPinned: boolean;
  isSharing: boolean;
  gifStatus: GifStatus;
  onGoBack: () => void;
  onToggleMeasurementMode: (mode: MeasurementMode) => void;
  onTogglePin: () => void;
  onShare: () => void;
}

const ProteinHeader: React.FC<Props> = ({
  ligandId,
  isCached,
  loadingState,
  measurementMode,
  isPinned,
  isSharing,
  gifStatus,
  onGoBack,
  onToggleMeasurementMode,
  onTogglePin,
  onShare,
}) => {
  const { colors } = useTheme();

  return (
    <View className="px-6 pt-10 pb-4 border-b border-border flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity
          onPress={onGoBack}
          className="mr-4"
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 30 }}>←</Text>
        </TouchableOpacity>
        <View className="pl-2">
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: -0.5 }}>
            {ligandId}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
            {isCached ? 'from cache' : 'from network'}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className={`p-2 rounded-lg ${measurementMode === 'distance' ? 'bg-accent/20' : ''}`}
          activeOpacity={0.7}
          onPress={() => onToggleMeasurementMode('distance')}
          disabled={loadingState !== 'success'}
          accessibilityLabel="Measure distance between atoms"
        >
          <Ionicons name="resize-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-2 rounded-lg ${measurementMode === 'angle' ? 'bg-accent/20' : ''}`}
          activeOpacity={0.7}
          onPress={() => onToggleMeasurementMode('angle')}
          disabled={loadingState !== 'success'}
          accessibilityLabel="Measure angle between atoms"
        >
          <Ionicons name="triangle-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2"
          activeOpacity={0.7}
          onPress={onTogglePin}
          disabled={loadingState !== 'success'}
          accessibilityLabel={isPinned ? 'Unpin ligand' : 'Pin ligand'}
        >
          <Ionicons
            name={isPinned ? 'pin' : 'pin-outline'}
            size={24}
            color={colors.accent}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2"
          activeOpacity={0.7}
          onPress={onShare}
          disabled={isSharing || gifStatus !== 'idle' || loadingState !== 'success'}
          accessibilityLabel="Share 3D molecule visualization"
          accessibilityHint="Captures and shares a screenshot of the current 3D view"
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="share-outline" size={24} color={colors.accent} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProteinHeader;