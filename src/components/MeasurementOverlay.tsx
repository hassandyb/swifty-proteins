import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Atom } from '../types/protein.types';

export type MeasurementMode = 'none' | 'distance' | 'angle';

interface Props {
  mode: MeasurementMode;
  atoms: Atom[];
  onClear: () => void;
}

// Distance between two atoms (Ångströms — same unit as CIF coordinates)
const calcDistance = (a: Atom, b: Atom): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Angle at atom B in the triplet A-B-C (degrees)
const calcAngle = (a: Atom, b: Atom, c: Atom): number => {
  const bax = a.x - b.x, bay = a.y - b.y, baz = a.z - b.z;
  const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
  const dot = bax * bcx + bay * bcy + baz * bcz;
  const magBA = Math.sqrt(bax ** 2 + bay ** 2 + baz ** 2);
  const magBC = Math.sqrt(bcx ** 2 + bcy ** 2 + bcz ** 2);
  const cosTheta = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cosTheta) * (180 / Math.PI);
};

const MeasurementOverlay: React.FC<Props> = ({ mode, atoms, onClear }) => {
  if (mode === 'none') return null;

  const isDistance = mode === 'distance';
  const needed = isDistance ? 2 : 3;
  const ready = atoms.length >= needed;

  const renderPrompt = () => {
    if (isDistance) {
      if (atoms.length === 0) return 'Tap first atom';
      if (atoms.length === 1) return `${atoms[0].id} → tap second atom`;
    } else {
      if (atoms.length === 0) return 'Tap first atom (A)';
      if (atoms.length === 1) return `${atoms[0].id} → tap second atom (vertex)`;
      if (atoms.length === 2) return `${atoms[0].id}–${atoms[1].id} → tap third atom (C)`;
    }
    return null;
  };

  const renderResult = () => {
    if (isDistance && atoms.length >= 2) {
      const d = calcDistance(atoms[0], atoms[1]);
      return (
        <View style={styles.row}>
          <View style={styles.atomTag}>
            <Text style={styles.tagText}>{atoms[0].id}</Text>
          </View>
          <Text style={styles.arrow}>↔</Text>
          <View style={styles.atomTag}>
            <Text style={styles.tagText}>{atoms[1].id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{d.toFixed(3)} Å</Text>
          </View>
        </View>
      );
    }
    if (!isDistance && atoms.length >= 3) {
      const angle = calcAngle(atoms[0], atoms[1], atoms[2]);
      return (
        <View style={styles.row}>
          <View style={styles.atomTag}>
            <Text style={styles.tagText}>{atoms[0].id}</Text>
          </View>
          <Text style={styles.arrow}>–</Text>
          <View style={[styles.atomTag, styles.atomTagVertex]}>
            <Text style={styles.tagText}>{atoms[1].id}</Text>
          </View>
          <Text style={styles.arrow}>–</Text>
          <View style={styles.atomTag}>
            <Text style={styles.tagText}>{atoms[2].id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.label}>Angle</Text>
            <Text style={styles.value}>{angle.toFixed(1)}°</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClear}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <View style={styles.modeLabel}>
          <Text style={styles.modeLabelText}>
            {isDistance ? '↔ Distance' : '∠ Angle'}
          </Text>
        </View>

        {ready ? renderResult() : (
          <Text style={styles.prompt}>{renderPrompt()}</Text>
        )}
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
    gap: 8,
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
  modeLabel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaaaaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prompt: {
    fontSize: 13,
    color: '#cccccc',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  atomTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  atomTagVertex: {
    backgroundColor: 'rgba(255, 200, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.4)',
  },
  tagText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 14,
    color: '#666666',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 4,
  },
  field: {
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
});

export default MeasurementOverlay;
