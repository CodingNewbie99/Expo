import fs from 'fs';
import glob from 'glob';
import path from 'path';

import {
  BuildManifest,
  ExportedMetadata,
  ExportedMetadataAsset,
  FullAssetDump,
  FullAssetDumpEntry,
  Platform,
} from './types';
import { CommandError } from '../utils/errors';

const debug = require('debug')('expo:verify-native-assets') as typeof console.log;

/**
 * Finds any assets that will be missing from an app given a build and an exported update bundle.
 *
 * @param buildPath Path to an EAS or local build containing an expo-updates embedded manifest (app.manifest)
 * @param exportPath Path to a directory produced by the command `npx expo export --dump-assetmap`
 * @param platform Either `android` or `ios`
 * @param projectRoot The project root path
 * @returns An array containing any assets that are found in the Metro asset dump, but not included in either app.manifest or the exported bundle
 */
export function getMissingAssets(
  buildPath: string,
  exportPath: string,
  platform: Platform,
  projectRoot: string
) {
  const buildManifestHashSet = getBuildManifestHashSet(
    getBuildManifest(buildPath, platform, projectRoot)
  );

  const fullAssetMap = getFullAssetDump(exportPath);
  const fullAssetSet = getFullAssetDumpHashSet(getFullAssetDump(exportPath));

  const exportedAssetSet = getExportedMetadataHashSet(getExportedMetadata(exportPath), platform);

  debug(`Assets in build: ${JSON.stringify([...buildManifestHashSet], null, 2)}`);
  debug(`Assets in exported bundle: ${JSON.stringify([...exportedAssetSet], null, 2)}`);
  debug(`All assets resolved by Metro: ${JSON.stringify([...fullAssetSet], null, 2)}`);

  const buildAssetsPlusExportedAssets = new Set(buildManifestHashSet);
  exportedAssetSet.forEach((hash) => buildAssetsPlusExportedAssets.add(hash));

  const missingAssets: FullAssetDumpEntry[] = [];

  fullAssetSet.forEach((hash) => {
    if (!buildAssetsPlusExportedAssets.has(hash)) {
      const asset = fullAssetMap.get(hash);
      console.warn(`  Missing asset: hash = ${hash}, file = ${asset?.files[0] ?? ''}`);
      asset && missingAssets.push(asset);
    }
  });

  return missingAssets;
}

/**
 * Reads and returns the embedded manifest (app.manifest) for a build.
 *
 * @param buildPath Path to the build folder
 * @param platform Either 'android' or 'ios'
 * @param projectRoot The project root path
 * @returns the JSON structure of the manifest
 */
export function getBuildManifest(buildPath: string, platform: Platform, projectRoot: string) {
  let realBuildPath = buildPath;
  if (buildPath === projectRoot) {
    switch (platform) {
      case 'android':
        realBuildPath = path.resolve(projectRoot, 'android', 'app', 'build');
        break;
      default:
        realBuildPath = path.resolve(projectRoot, 'ios', 'build');
        break;
    }
    realBuildPath = path.resolve(projectRoot, platform);
  }
  const buildManifestPaths = glob.sync(`${realBuildPath}/**/app.manifest`);
  if (buildManifestPaths.length === 0) {
    throw new CommandError(`No app.manifest found in build path`);
  }
  const buildManifestPath = buildManifestPaths[0];
  debug(`Build manifest found at ${buildManifestPath}`);
  const buildManifestString = fs.readFileSync(buildManifestPaths[0], { encoding: 'utf-8' });
  const buildManifest: BuildManifest = JSON.parse(buildManifestString);
  return buildManifest;
}

/**
 * Extracts the set of asset hashes from a build manifest.
 *
 * @param buildManifest The build manifest
 * @returns The set of asset hashes contained in the build manifest
 */
export function getBuildManifestHashSet(buildManifest: BuildManifest) {
  return new Set((buildManifest.assets ?? []).map((asset) => asset.packagerHash));
}

/**
 * Reads and extracts the asset dump for an exported bundle.
 *
 * @param exportPath The path to the exported bundle containing an asset dump.
 * @returns The asset dump as an object.
 */
export function getFullAssetDump(exportPath: string) {
  const assetMapPath = path.resolve(exportPath, 'assetmap.json');
  if (!fs.existsSync(assetMapPath)) {
    throw new CommandError(
      `The export bundle chosen does not contain assetmap.json. Please generate the bundle with "npx expo export --dump-assetmap"`
    );
  }
  const assetMapString = fs.readFileSync(assetMapPath, { encoding: 'utf-8' });
  const assetMap: FullAssetDump = new Map(Object.entries(JSON.parse(assetMapString)));
  return assetMap;
}

/**
 * Extracts the set of asset hashes from an asset dump.
 *
 * @param assetDump
 * @returns The set of asset hashes in the asset dump
 */
export function getFullAssetDumpHashSet(assetDump: FullAssetDump) {
  const assetSet = new Set<string>();
  assetDump.forEach((_asset, hash) => {
    assetSet.add(hash);
  });
  return assetSet;
}

/**
 * Reads and extracts the metadata from an exported bundle.
 *
 * @param exportPath Path to the exported bundle.
 * @returns The metadata of the bundle.
 */
export function getExportedMetadata(exportPath: string) {
  const metadataPath = path.resolve(exportPath, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new CommandError(
      `The export bundle chosen does not contain metadata.json. Please generate the bundle with "npx expo export --dump-assetmap"`
    );
  }
  const metadataString = fs.readFileSync(metadataPath, { encoding: 'utf-8' });
  const metadata: ExportedMetadata = JSON.parse(metadataString);
  return metadata;
}

/**
 * Extracts the set of asset hashes from an exported bundle's metadata for a given platform.
 *
 * @param metadata The metadata from the exported bundle
 * @param platform Either 'android' or 'ios'
 * @returns the set of asset hashes
 */
export function getExportedMetadataHashSet(metadata: ExportedMetadata, platform: Platform) {
  const fileMetadata =
    platform === 'android' ? metadata.fileMetadata.android : metadata.fileMetadata.ios;
  if (!fileMetadata) {
    throw new CommandError(`Exported bundle was not exported for platform ${platform}`);
  }
  const assets: ExportedMetadataAsset[] = fileMetadata?.assets ?? [];
  const assetSet = new Set<string>();
  assets.forEach((asset) => {
    assetSet.add(asset.path.substring(7, asset.path.length));
  });
  return assetSet;
}
