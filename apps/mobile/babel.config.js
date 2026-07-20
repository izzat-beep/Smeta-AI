// Expo + NativeWind v4 babel sozlamasi.
// (Bu fayl CommonJS — apps/mobile/package.json'da "type":"module" YO'Q.)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-reanimated/plugin OXIRGI bo'lishi SHART (NativeWind css-interop
    // ham shu plaginga tayanadi). Reanimated yengil o'tishlar uchun ham ishlatiladi.
    plugins: ['react-native-reanimated/plugin'],
  };
};
