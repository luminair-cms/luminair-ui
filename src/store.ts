import { create } from 'zustand';

interface UIState {
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: 'light', // Standard light theme default as requested
  toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
}));
