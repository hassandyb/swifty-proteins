import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Atom } from '../types/protein.types';
import { getCPKColor } from '../utils/cpkColors';
import { useTheme } from '../context/ThemeContext';

interface AtomInfoOverlayProps {
  atom: Atom | null;
  onDismiss: () => void;
}

const AtomInfoOverlay: React.FC<AtomInfoOverlayProps> = ({ atom, onDismiss }) => {
  const { colors } = useTheme();
  if (!atom) return null;

  return (
    <View className="absolute bottom-6 left-4 right-4" pointerEvents="box-none">
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          paddingRight: 36,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={onDismiss}
          style={{ position: 'absolute', top: 8, right: 10 }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={{ color: colors.muted, fontSize: 22, lineHeight: 22 }}>×</Text>
        </TouchableOpacity>

        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#fff',
              backgroundColor: getCPKColor(atom.element),
            }}
          />
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{atom.element}</Text>

          <View style={{ width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 2 }} />

          <View className="items-center" style={{ minWidth: 36 }}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.muted }}>
              ID
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.text }} numberOfLines={1}>
              {atom.id}
            </Text>
          </View>

          <View style={{ width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 2 }} />

          <View className="items-center" style={{ minWidth: 36 }}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.muted }}>
              X
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.text }}>{atom.x.toFixed(1)}</Text>
          </View>
          <View className="items-center" style={{ minWidth: 36 }}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.muted }}>
              Y
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.text }}>{atom.y.toFixed(1)}</Text>
          </View>
          <View className="items-center" style={{ minWidth: 36 }}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.muted }}>
              Z
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.text }}>{atom.z.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AtomInfoOverlay;