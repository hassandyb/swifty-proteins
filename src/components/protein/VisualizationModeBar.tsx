import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VisualizationMode } from '../../types/protein.types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  visualizationMode: VisualizationMode;
  showAtomLabels: boolean;
  onModeChange: (mode: VisualizationMode) => void;
  onToggleLabels: () => void;
}

const MODES: VisualizationMode[] = ['ball-stick', 'stick', 'space-filling', 'wireframe'];

const VisualizationModeBar: React.FC<Props> = ({
  visualizationMode,
  showAtomLabels,
  onModeChange,
  onToggleLabels,
}) => {
  const { colors } = useTheme();

  // Helper to get display name
  const getModeName = (mode: VisualizationMode): string => {
    switch (mode) {
      case 'ball-stick': return 'Ball';
      case 'space-filling': return 'Space';
      default: return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  };

  return (
    <View className="bg-bg border-b border-border px-4 py-2">
      {/* Row 1: Visualization mode buttons with wrap */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => onModeChange(mode)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              backgroundColor: visualizationMode === mode ? colors.accent : colors.card,
              borderColor: visualizationMode === mode ? colors.accent : colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: visualizationMode === mode ? colors.bg : colors.muted,
              }}
            >
              {getModeName(mode)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Row 2: Labels toggle – original distinct style */}
      <TouchableOpacity
        onPress={onToggleLabels}
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 6,
          backgroundColor: showAtomLabels ? colors.accent : 'transparent',
          borderWidth: 1,
          borderColor: showAtomLabels ? colors.accent : colors.border,
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: showAtomLabels ? colors.bg : colors.muted,
          }}
        >
          Labels
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VisualizationModeBar;