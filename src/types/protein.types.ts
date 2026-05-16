import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Protein: { ligandId: string };
  TestingMoleculeList: { ligandId: string };
  PinnedLigands: undefined;
};

// Keep combined for backwards compat in hooks that use useNavigation generically
export type RootStackParamList = AuthStackParamList & AppStackParamList;

export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface Bond {
  atomId1: string;
  atomId2: string;
  order: number;
}

export interface Molecule {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ParsedCif {
  molecule: Molecule;
  rawText: string;
}

export type VisualizationMode = 'ball-stick' | 'wireframe' | 'space-filling' | 'stick';
export type GifStatus = 'idle' | 'recording' | 'encoding';

export interface StoredUser {
  username: string;
  passwordHash: string;
  salt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

export interface LigandItem {
  id: string;
  index: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';