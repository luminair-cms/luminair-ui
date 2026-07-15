import { create } from 'zustand';

interface UIState {
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: 'light',
  toggleThemeMode: () =>
    set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
}));
export default useUIStore;
