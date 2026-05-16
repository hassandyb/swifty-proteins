import { useState } from 'react';
import { Atom } from '../types/protein.types';
import { MeasurementMode } from '../components/MeasurementOverlay';

export function useMeasurementMode(onClearSelection: () => void) {
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [measurementAtoms, setMeasurementAtoms] = useState<Atom[]>([]);

  const toggleMeasurementMode = (mode: MeasurementMode) => {
    setMeasurementMode(prev => {
      const next = prev === mode ? 'none' : mode;
      setMeasurementAtoms([]);
      if (next !== 'none') {
        onClearSelection();
      }
      return next;
    });
  };

  const clearMeasurement = () => {
    setMeasurementMode('none');
    setMeasurementAtoms([]);
  };

  return {
    measurementMode, setMeasurementMode,
    measurementAtoms, setMeasurementAtoms,
    toggleMeasurementMode,
    clearMeasurement,
  };
}
