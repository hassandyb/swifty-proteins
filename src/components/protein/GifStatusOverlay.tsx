import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GifStatus } from '../../types/protein.types';

interface Props {
  gifStatus: GifStatus;
  gifFrameCount: number;
}

const GifStatusOverlay: React.FC<Props> = ({ gifStatus, gifFrameCount }) => {
  if (gifStatus === 'idle') return null;
  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.82)',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', marginTop: 16 }}>
        {gifStatus === 'recording'
          ? `Recording... ${gifFrameCount}/50`
          : 'Encoding GIF...'}
      </Text>
      <Text style={{ color: '#999999', fontSize: 12, marginTop: 4 }}>
        {gifStatus === 'recording'
          ? 'Molecule is auto-rotating'
          : 'Please wait a moment'}
      </Text>
    </View>
  );
};

export default GifStatusOverlay;
