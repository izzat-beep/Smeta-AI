// Expo + NativeWind v4 babel sozlamasi.
// (Bu fayl CommonJS — apps/mobile/package.json'da "type":"module" YO'Q.)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
