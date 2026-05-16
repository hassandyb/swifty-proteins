import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bond } from '../types/protein.types';

interface BondInfoOverlayProps {
  bond: Bond | null;
  length: number;
  onDismiss: () => void;
}

const orderLabel = (order: number): string => {
  if (order === 3) return 'Triple';
  if (order === 2) return 'Double';
  if (order === 1.5) return 'Aromatic';
  return 'Single';
};

const BondInfoOverlay: React.FC<BondInfoOverlayProps> = ({ bond, length, onDismiss }) => {
  if (!bond) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{orderLabel(bond.order)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Atom 1</Text>
            <Text style={styles.value} numberOfLines={1}>{bond.atomId1}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Atom 2</Text>
            <Text style={styles.value} numberOfLines={1}>{bond.atomId2}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Length</Text>
            <Text style={styles.value}>{length.toFixed(3)} Å</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  closeText: {
    color: '#888888',
    fontSize: 22,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 2,
  },
  field: {
    alignItems: 'center',
    minWidth: 44,
  },
  label: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '400',
    marginTop: 2,
  },
});

export default BondInfoOverlay;
