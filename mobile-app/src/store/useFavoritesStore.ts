import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorId?: string;
}

interface FavoritesState {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (product) =>
        set((state) => {
          if (!state.favorites.find((p) => p.id === product.id)) {
            return { favorites: [...state.favorites, product] };
          }
          return state;
        }),
      removeFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.filter((p) => p.id !== productId),
        })),
      isFavorite: (productId) => {
        return get().favorites.some((p) => p.id === productId);
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
