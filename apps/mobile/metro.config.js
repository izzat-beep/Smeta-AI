// Metro — NativeWind + monorepo (mustaqil paket, lekin packages/shared'ni
// kuzatadi). apps/mobile root workspace'ga qo'shilmagani uchun watchFolders
// bilan repo ildizini qo'shamiz (kelajakda @smeta/shared runtime importi uchun).
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
];
// @smeta/shared runtime qiymatlarini ulash uchun (tiplar tsconfig paths orqali).
config.resolver.extraNodeModules = {
  '@smeta/shared': path.resolve(repoRoot, 'packages/shared/src'),
};

module.exports = withNativeWind(config, { input: './global.css' });
