import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Molecule } from '../../types/protein.types';
import { getMolecularFormula } from '../../utils/moleculeHelpers';

interface Props {
  visible: boolean;
  ligandId: string;
  molecule: Molecule | null;
  onClose: () => void;
  onShareFormat: (format: 'png' | 'jpeg') => void;
  onShareGif: () => void;
}

const ShareModal: React.FC<Props> = ({
  visible,
  ligandId,
  molecule,
  onClose,
  onShareFormat,
  onShareGif,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#111111', borderRadius: 16, borderWidth: 1, borderColor: '#333333', padding: 24, width: '100%' }}>

          {/* Header */}
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
            Share Molecule
          </Text>
          <Text style={{ color: '#999999', fontSize: 12, marginBottom: 20 }}>
            Choose export format
          </Text>

          {/* Molecule info preview */}
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#222222' }}>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, marginBottom: 6 }}>
              {ligandId}
            </Text>
            <Text style={{ color: '#999999', fontSize: 12, lineHeight: 20 }}>
              Formula: {molecule ? getMolecularFormula(molecule.atoms) : '—'}{'\n'}
              Atoms: {molecule?.atoms.length ?? 0}{'   '}Bonds: {molecule?.bonds.length ?? 0}
            </Text>
          </View>

          {/* Image format buttons */}
          <Text style={{ color: '#999999', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Image
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => onShareFormat('png')}
              style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#000000', fontWeight: '700', fontSize: 15 }}>PNG</Text>
              <Text style={{ color: '#555555', fontSize: 11, marginTop: 2 }}>Lossless</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onShareFormat('jpeg')}
              style={{ flex: 1, backgroundColor: '#1e90ff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>JPEG</Text>
              <Text style={{ color: '#aad4ff', fontSize: 11, marginTop: 2 }}>Smaller size</Text>
            </TouchableOpacity>
          </View>

          {/* GIF / Video button */}
          <Text style={{ color: '#999999', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Video
          </Text>
          <TouchableOpacity
            onPress={onShareGif}
            style={{ backgroundColor: '#1db954', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 20 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Animated GIF</Text>
            <Text style={{ color: '#a8e6c3', fontSize: 11, marginTop: 2 }}>50 frames · 5-sec loop · 10fps</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 12, alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#999999', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ShareModal;
