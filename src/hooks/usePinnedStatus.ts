import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as pinnedService from '../services/pinnedService';

export function usePinnedStatus(ligandId: string) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    pinnedService.isPinnedAsync(ligandId).then(setIsPinned);
  }, [ligandId]);

  const handleTogglePin = async () => {
    try {
      if (isPinned) {
        await pinnedService.unpinLigandAsync(ligandId);
        setIsPinned(false);
        Alert.alert('Unpinned', `${ligandId} removed from pinned ligands`);
      } else {
        await pinnedService.pinLigandAsync(ligandId);
        setIsPinned(true);
        Alert.alert('Pinned', `${ligandId} added to pinned ligands`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update pinned status');
    }
  };

  return { isPinned, handleTogglePin };
}
