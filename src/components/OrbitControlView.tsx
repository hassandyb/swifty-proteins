/**
 * OrbitControlView - React Native wrapper for OrbitControls
 * Handles touch gestures and delegates to OrbitControls
 */

import React, { useRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { OrbitControls } from '../utils/OrbitControls';
import { usePanResponder } from '../hooks/usePanResponder';

interface OrbitControlViewProps {
  children: React.ReactNode;
  onControls?: (controls: OrbitControls) => void;
  onSingleTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
}

interface OrbitControlViewRef {
  getControls(): OrbitControls | null;
}

const OrbitControlView = React.forwardRef<OrbitControlViewRef, OrbitControlViewProps>(
  ({ children, onControls, onSingleTap, onDoubleTap }, ref) => {
    const controlsRef = useRef<OrbitControls | null>(null);
    const onSingleTapRef = useRef(onSingleTap);
    const onDoubleTapRef = useRef(onDoubleTap);

    // Always keep the latest callback refs
    React.useEffect(() => {
      onSingleTapRef.current = onSingleTap;
    }, [onSingleTap]);

    React.useEffect(() => {
      onDoubleTapRef.current = onDoubleTap;
    }, [onDoubleTap]);

    const { panHandlers, initPanResponder } = usePanResponder(controlsRef, onSingleTapRef, onDoubleTapRef);

    // Expose controls via ref
    useImperativeHandle(
      ref,
      () => ({
        getControls: () => controlsRef.current,
        setControls: (controls: OrbitControls) => {
          controlsRef.current = controls;
          initPanResponder();
          onControls?.(controls);
        },
      }),
      [initPanResponder, onControls]
    );

    // Store reference for external use
    React.useEffect(() => {
      if (controlsRef.current) {
        initPanResponder();
      }
    }, [initPanResponder]);

    return (
      <View
        style={{ flex: 1 }}
        {...panHandlers}
      >
        {children}
      </View>
    );
  }
);

OrbitControlView.displayName = 'OrbitControlView';

export default OrbitControlView;
