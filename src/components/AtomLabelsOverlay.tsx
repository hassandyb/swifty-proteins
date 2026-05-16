import React from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Molecule } from '../types/protein.types';

interface Props {
  molecule: Molecule | null;
  labelAnimatedPositions: React.MutableRefObject<Map<string, { x: Animated.Value; y: Animated.Value }>>;
  show: boolean;
}

const AtomLabelsOverlay: React.FC<Props> = ({ molecule, labelAnimatedPositions, show }) => {
  if (!show || !molecule) return null;
  return (
    <>
      {molecule.atoms.map(atom => {
        const lv = labelAnimatedPositions.current.get(atom.id);
        if (!lv) return null;
        return (
          <Animated.View
            key={atom.id}
            pointerEvents="none"
            style={[styles.labelContainer, { transform: [{ translateX: lv.x }, { translateY: lv.y }] }]}
          >
            <Text style={styles.labelText}>{atom.element}</Text>
          </Animated.View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
});

export default AtomLabelsOverlay;
