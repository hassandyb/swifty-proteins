import { useRef, useState, useCallback } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';
import { OrbitControls } from '../utils/OrbitControls';

export function usePanResponder(
  controlsRef: React.MutableRefObject<OrbitControls | null>,
  onSingleTapRef: React.MutableRefObject<((x: number, y: number) => void) | undefined>,
  onDoubleTapRef: React.MutableRefObject<((x: number, y: number) => void) | undefined>,
) {
  const panResponderRef = useRef<any | null>(null);
  const activeTouchesRef = useRef<Map<number, Touch>>(new Map());
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [panHandlers, setPanHandlers] = useState<any>({});

  const initPanResponder = useCallback(() => {
    if (panResponderRef.current) {
      return;
    }

    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches;
        if (!controlsRef.current) return;

        if (touches.length === 1) {
          touchStartRef.current = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
            time: Date.now()
          };
        } else {
          touchStartRef.current = null;
        }

        // Convert React Native touches to Touch-like objects
        const touchArray = Array.from(touches).map((touch: any) => ({
          clientX: touch.pageX,
          clientY: touch.pageY,
          identifier: touch.identifier,
        })) as Touch[];

        // Store active touches
        touchArray.forEach((t, idx) => {
          activeTouchesRef.current.set(idx, t as any);
        });

        controlsRef.current.onTouchStart(touchArray);
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches;
        if (!controlsRef.current) return;

        // Constantly track if finger deviates from initial tap to reject as a pan
        if (touchStartRef.current && touches.length === 1) {
          const dx = Math.abs(evt.nativeEvent.locationX - touchStartRef.current.x);
          const dy = Math.abs(evt.nativeEvent.locationY - touchStartRef.current.y);
          if (dx >= 10 || dy >= 10) {
            touchStartRef.current = null;
          }
        } else if (touches.length > 1) {
          touchStartRef.current = null; // 2 fingers = Zooming/Panning, not tapping
        }

        const touchArray = Array.from(touches).map((touch: any) => ({
          clientX: touch.pageX,
          clientY: touch.pageY,
          identifier: touch.identifier,
        })) as Touch[];

        controlsRef.current.onTouchMove(touchArray);
      },

      onPanResponderRelease: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches;
        if (!controlsRef.current) return;

        const touchArray = Array.from(touches).map((touch: any) => ({
          clientX: touch.pageX,
          clientY: touch.pageY,
          identifier: touch.identifier,
        })) as Touch[];

        controlsRef.current.onTouchEnd(touchArray);

        // Verify it's still a valid tap (no excessive movement happened) and trigger
        if (touchStartRef.current && touches.length === 0) {
          const timeDiff = Date.now() - touchStartRef.current.time;

          if (timeDiff < 250) {
            const tapX = touchStartRef.current.x;
            const tapY = touchStartRef.current.y;
            const now = Date.now();

            // Check for double-tap
            if (lastTapRef.current) {
              const dt = now - lastTapRef.current.time;
              const dx = Math.abs(tapX - lastTapRef.current.x);
              const dy = Math.abs(tapY - lastTapRef.current.y);
              if (dt < 300 && dx < 30 && dy < 30) {
                onDoubleTapRef.current?.(tapX, tapY);
                lastTapRef.current = null;
                touchStartRef.current = null;
                activeTouchesRef.current.clear();
                return;
              }
            }

            lastTapRef.current = { x: tapX, y: tapY, time: now };
            onSingleTapRef.current?.(tapX, tapY);
          }
        }

        touchStartRef.current = null;
        activeTouchesRef.current.clear();
      },

      onPanResponderTerminate: () => {
        touchStartRef.current = null;
        activeTouchesRef.current.clear();
      },
    });

    setPanHandlers(panResponderRef.current.panHandlers);
  }, []);

  return { panHandlers, initPanResponder };
}
