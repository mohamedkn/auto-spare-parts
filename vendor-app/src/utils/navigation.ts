import { router } from 'expo-router';

export const goBackOrHome = () => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/(tabs)');
};
