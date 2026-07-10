module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.autoparts.delivery',
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription: 'نستخدم موقعك لعرض طلبات التوصيل القريبة وتتبع الرحلة أثناء العمل.',
      },
    },
    android: {
      ...config.android,
      package: 'com.autoparts.delivery',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      config: {
        ...config.android?.config,
        ...(googleMapsApiKey ? { googleMaps: { apiKey: googleMapsApiKey } } : {}),
      },
    },
    plugins: [
      ...(config.plugins || []),
      ['expo-location', { locationWhenInUsePermission: 'اسمح لتطبيق التوصيل باستخدام موقعك لعرض الطلبات القريبة.' }],
    ],
    extra: {
      ...config.extra,
      googleMapsConfigured: Boolean(googleMapsApiKey),
    },
  };
};
