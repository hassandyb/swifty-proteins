import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProtein } from '../hooks/useProtein';
import { RootStackParamList, Atom, VisualizationMode } from '../types/protein.types';
import MoleculeView, { MoleculeViewHandle } from '../components/MoleculeView';
import AtomInfoOverlay from '../components/AtomInfoOverlay';
import BondInfoOverlay from '../components/BondInfoOverlay';
import MeasurementOverlay from '../components/MeasurementOverlay';
import ProteinHeader from '../components/protein/ProteinHeader';
import VisualizationModeBar from '../components/protein/VisualizationModeBar';
import GifStatusOverlay from '../components/protein/GifStatusOverlay';
import ShareModal from '../components/protein/ShareModal';
import { useSelectionState } from '../hooks/useSelectionState';
import { useMeasurementMode } from '../hooks/useMeasurementMode';
import { usePinnedStatus } from '../hooks/usePinnedStatus';
import { useShareExport } from '../hooks/useShareExport';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Protein'>;

const ProteinScreen: React.FC<Props> = ({ route, navigation }) => {
  const { ligandId } = route.params;
  const { molecule, loadingState, error, isCached, fetchMolecule } = useProtein();
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('ball-stick');
  const [showAtomLabels, setShowAtomLabels] = useState(false);
  const moleculeViewRef = useRef<MoleculeViewHandle>(null);
  const { colors, isDark } = useTheme();
  useWindowDimensions();
useFocusEffect(
  useCallback(() => {
    // screen gained focus — nothing to do
    return () => {
      // screen lost focus (navigating away) — the moleculeViewRef
      // cleanup in MoleculeView's useEffect handles the rest
    };
  }, [])
);
  const {
    selectedAtom, setSelectedAtom,
    selectedBond, setSelectedBond,
    selectedElement, setSelectedElement,
    handleAtomDeselect,
    handleBondSelect,
    handleBondDeselect,
  } = useSelectionState();

  const {
    measurementMode,
    measurementAtoms, setMeasurementAtoms,
    toggleMeasurementMode,
    clearMeasurement,
  } = useMeasurementMode(handleAtomDeselect);

  const { isPinned, handleTogglePin } = usePinnedStatus(ligandId);

  const {
    isSharing,
    showShareModal, setShowShareModal,
    gifStatus, gifFrameCount,
    handleShare, handleShareWithFormat, handleShareGif,
  } = useShareExport(moleculeViewRef, ligandId, molecule);

  useEffect(() => {
    fetchMolecule(ligandId);
  }, [ligandId, fetchMolecule]);

  useEffect(() => {
    if (loadingState === 'error' && error) {
      Alert.alert('Error Loading Molecule', error, [
        { text: 'Retry', onPress: () => fetchMolecule(ligandId) },
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]);
    }
  }, [loadingState, error, ligandId, fetchMolecule, navigation]);

  const handleAtomSelect = (atom: Atom) => {
    if (measurementMode !== 'none') {
      const limit = measurementMode === 'distance' ? 2 : 3;
      setMeasurementAtoms(prev => {
        const next = prev.length >= limit ? [atom] : [...prev, atom];
        return next;
      });
      return;
    }
    setSelectedAtom(atom);
    setSelectedElement(atom.element);
    setSelectedBond(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProteinHeader
        ligandId={ligandId}
        isCached={isCached}
        loadingState={loadingState}
        measurementMode={measurementMode}
        isPinned={isPinned}
        isSharing={isSharing}
        gifStatus={gifStatus}
        onGoBack={() => navigation.goBack()}
        onToggleMeasurementMode={toggleMeasurementMode}
        onTogglePin={handleTogglePin}
        onShare={handleShare}
      />

      {(loadingState === 'loading' || loadingState === 'parsing') && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text className="text-muted dark:text-muted text-sm mt-4">
            {loadingState === 'parsing' ? 'Parsing molecule...' : 'Loading molecule...'}
          </Text>
        </View>
      )}

      {loadingState === 'success' && molecule && (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <VisualizationModeBar
            visualizationMode={visualizationMode}
            showAtomLabels={showAtomLabels}
            onModeChange={setVisualizationMode}
            onToggleLabels={() => setShowAtomLabels(!showAtomLabels)}
          />

          <MoleculeView
            ref={moleculeViewRef}
            molecule={molecule}
            visualizationMode={visualizationMode}
            showAtomLabels={showAtomLabels}
            selectedElement={selectedElement}
            onAtomSelect={handleAtomSelect}
            onAtomDeselect={handleAtomDeselect}
            onBondSelect={handleBondSelect}
            backgroundColor={colors.bg}
          />

          <AtomInfoOverlay
            atom={selectedAtom}
            onDismiss={() => handleAtomDeselect()}
          />

          <BondInfoOverlay
            bond={selectedBond?.bond ?? null}
            length={selectedBond?.length ?? 0}
            onDismiss={handleBondDeselect}
          />

          <MeasurementOverlay
            mode={measurementMode}
            atoms={measurementAtoms}
            onClear={clearMeasurement}
          />

          <GifStatusOverlay gifStatus={gifStatus} gifFrameCount={gifFrameCount} />
        </View>
      )}

      {loadingState === 'error' && !error?.includes('404') && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-danger dark:text-danger text-center">{error || 'Unknown error'}</Text>
          <TouchableOpacity
            className="mt-4 border border-danger px-4 py-2 rounded-lg"
            onPress={() => fetchMolecule(ligandId)}
          >
            <Text className="text-danger">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ShareModal
        visible={showShareModal}
        ligandId={ligandId}
        molecule={molecule}
        onClose={() => setShowShareModal(false)}
        onShareFormat={handleShareWithFormat}
        onShareGif={handleShareGif}
      />
    </SafeAreaView>
  );
};

export default ProteinScreen;