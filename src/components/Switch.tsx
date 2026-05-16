import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface IOSSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  style?: object;
  trackOnColor?: string;
  trackOffColor?: string;
}

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4; // 20px

export function IOSSwitch({
  value,
  onValueChange,
  style,
  trackOnColor = '#34C759',
  trackOffColor = 'rgba(120,120,128,0.32)',
}: IOSSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? THUMB_TRAVEL : 0)).current;
  const trackColor = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? THUMB_TRAVEL : 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 20,
      }),
      Animated.timing(trackColor, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const interpolatedTrack = trackColor.interpolate({
    inputRange: [0, 1],
    outputRange: [trackOffColor, trackOnColor],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[{ marginLeft: 12 }, style]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.track, { backgroundColor: interpolatedTrack }]}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});