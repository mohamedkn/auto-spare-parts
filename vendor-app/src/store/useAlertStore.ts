import { create } from 'zustand';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface AlertState {
  isVisible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  showAlert: (title, message, buttons) => set({ isVisible: true, title, message, buttons }),
  hideAlert: () => set({ isVisible: false }),
}));
