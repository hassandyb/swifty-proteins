import { useState, RefObject } from 'react';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { Molecule, GifStatus } from '../types/protein.types';
import { MoleculeViewHandle } from '../components/MoleculeView';
import { getMolecularFormula } from '../utils/moleculeHelpers';
import { encodeGifFromFrames } from '../utils/gifEncoder';

export function useShareExport(
  moleculeViewRef: RefObject<MoleculeViewHandle | null>,
  ligandId: string,
  molecule: Molecule | null,
) {
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [gifStatus, setGifStatus] = useState<GifStatus>('idle');
  const [gifFrameCount, setGifFrameCount] = useState(0);

  const handleShare = () => setShowShareModal(true);

  const handleShareWithFormat = async (format: 'png' | 'jpeg') => {
    setShowShareModal(false);
    try {
      setIsSharing(true);

      if (!moleculeViewRef.current) {
        Alert.alert('Error', 'Unable to capture screenshot');
        return;
      }

      const snapshot = await moleculeViewRef.current.takeSnapshotAsync({
        format,
        quality: format === 'jpeg' ? 0.92 : 1,
      });
      if (!snapshot) {
        Alert.alert('Error', 'Failed to capture screenshot');
        return;
      }

      const rawUri = typeof snapshot === 'string' ? snapshot : (snapshot as any).uri;
      if (!rawUri) {
        Alert.alert('Error', 'Failed to get screenshot URI');
        return;
      }

      // Re-encode to the requested format so the shared file is truly PNG or JPEG
      const context = ImageManipulator.ImageManipulator.manipulate(rawUri);
      const imageRef = await context.renderAsync();
      const result = await imageRef.saveAsync({
        format: format === 'png'
          ? ImageManipulator.SaveFormat.PNG
          : ImageManipulator.SaveFormat.JPEG,
        compress: format === 'jpeg' ? 0.92 : 1,
      });
      const destUri = result.uri;

      const formula = molecule ? getMolecularFormula(molecule.atoms) : 'Unknown';
      const shareTitle = `${ligandId} — 3D Molecular Structure`;
      const shareMessage =
        `🔬 ${ligandId} — 3D Molecular Structure\n\n` +
        `Formula: ${formula}\n` +
        `Atoms: ${molecule?.atoms.length ?? 0}   Bonds: ${molecule?.bonds.length ?? 0}\n\n` +
        `Visualized with SwiftyProtein`;

      await Sharing.shareAsync(destUri, {
        mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        dialogTitle: shareTitle,
        ...(shareMessage && { message: shareMessage }),
      } as any);
    } catch (err: any) {
      Alert.alert('Share Failed', err?.message || 'Unable to share screenshot');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareGif = async () => {
    setShowShareModal(false);
    if (!moleculeViewRef.current) return;

    const FRAME_COUNT = 50;
    const FRAME_INTERVAL = 200; // ms between frames → ~10s capture

    try {
      setGifStatus('recording');
      setGifFrameCount(0);

      const { frames, width: fw, height: fh } = await moleculeViewRef.current.captureFramesForGif(
        FRAME_COUNT,
        FRAME_INTERVAL,
        (captured) => setGifFrameCount(captured)
      );

      setGifStatus('encoding');

      const gifBytes = await encodeGifFromFrames(frames, fw, fh, 10);

      const file = new File(Paths.cache, `${ligandId}_rotation.gif`);
      if (file.exists) file.delete();
      file.write(gifBytes);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/gif',
        dialogTitle: `${ligandId} — 3D Rotation`,
      });
    } catch (err: any) {
      Alert.alert('GIF Export Failed', err?.message || 'Unable to create GIF');
    } finally {
      setGifStatus('idle');
      setGifFrameCount(0);
    }
  };

  return {
    isSharing,
    showShareModal, setShowShareModal,
    gifStatus,
    gifFrameCount,
    handleShare,
    handleShareWithFormat,
    handleShareGif,
  };
}
