import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import glob from 'glob-promise';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { getPackageViewAsync } from '../Npm';
import { transformFileAsync } from '../Transforms';
import { installAsync as workspaceInstallAsync } from '../Workspace';

export default (program: Command) => {
  program
    .command('setup-react-native-nightly')
    .description('Setup expo/expo monorepo to install react-native nightly build for testing')
    .asyncAction(main);
};

async function main() {
  const nightlyVersion = (await getPackageViewAsync('react-native'))?.['dist-tags'].nightly;
  if (!nightlyVersion) {
    throw new Error('Unable to get react-native nightly version.');
  }

  logger.info('Adding pinned packages:');
  const pinnedPackages = {
    'react-native': nightlyVersion,
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  await updateReactNativePackageAsync();

  await patchReanimatedAsync(nightlyVersion);

  await removeKotlinAndroidExtensionAsync();

  logger.info('Setting up Expo modules files');
  await updateExpoModulesAsync();

  logger.info('Setting up project files for bare-expo.');
  await updateBareExpoAsync(nightlyVersion);
}

async function addPinnedPackagesAsync(packages: Record<string, string>) {
  const workspacePackageJsonPath = path.join(EXPO_DIR, 'package.json');
  const json = await JsonFile.readAsync(workspacePackageJsonPath);
  json.resolutions ||= {};
  for (const [name, version] of Object.entries(packages)) {
    logger.log('  ', `${name}@${version}`);
    json.resolutions[name] = version;
  }
  await JsonFile.writeAsync(workspacePackageJsonPath, json);
}

async function updateReactNativePackageAsync() {
  // Workaround for react-native-gradle-plugin
  const gradlePluginRoot = path.join(EXPO_DIR, 'node_modules', 'react-native-gradle-plugin');
  await transformFileAsync(
    path.join(gradlePluginRoot, 'src/main/kotlin/com/facebook/react/ReactExtension.kt'),
    [
      {
        find: 'internal val reactNativeDir:',
        replaceWith: 'val reactNativeDir:',
      },
    ]
  );

  const reactNativeRoot = path.join(EXPO_DIR, 'node_modules', 'react-native');
  // Workaround duplicated libc++_shared.so from linked fbjni
  await transformFileAsync(path.join(reactNativeRoot, 'ReactAndroid', 'build.gradle'), [
    {
      find: /^(\s*packagingOptions \{)$/gm,
      replaceWith: '$1\n        pickFirst("**/libc++_shared.so")',
    },
  ]);
}

async function patchReanimatedAsync(nightlyVersion: string) {
  const root = path.join(EXPO_DIR, 'node_modules', 'react-native-reanimated');

  await transformFileAsync(path.join(root, 'scripts', 'reanimated_utils.rb'), [
    // Add REACT_NATIVE_OVERRIDE_VERSION support
    {
      find: `result[:react_native_version] = react_native_json['version']`,
      replaceWith: `result[:react_native_version] = ENV["REACT_NATIVE_OVERRIDE_VERSION"] ? ENV["REACT_NATIVE_OVERRIDE_VERSION"] : react_native_json['version']`,
    },
    {
      find: `result[:react_native_minor_version] = react_native_json['version'].split('.')[1].to_i`,
      replaceWith: `result[:react_native_minor_version] = result[:react_native_version].split('.')[1].to_i`,
    },
  ]);
  await transformFileAsync(path.join(root, 'android', 'build.gradle'), [
    // Add REACT_NATIVE_OVERRIDE_VERSION support
    {
      find: `def REACT_NATIVE_VERSION = reactProperties.getProperty("VERSION_NAME")`,
      replaceWith: `def REACT_NATIVE_VERSION = System.getenv("REACT_NATIVE_OVERRIDE_VERSION") ?: reactProperties.getProperty("VERSION_NAME")`,
    },
    // Workaround $minor is undefined
    {
      find: /\$minor/g,
      replaceWith: '$rnMinorVersion',
    },
    // BUILD_FROM_SOURCE
    {
      find: /^(boolean BUILD_FROM_SOURCE)\s*=.*/gm,
      replaceWith: '$1 = true',
    },
    // duplicated class from jni, because ReactAndroid now uses fbjni rather than fbjni-java-only
    {
      find: 'implementation "com.facebook.fbjni:fbjni-java-only:',
      replaceWith: 'compileOnly "com.facebook.fbjni:fbjni:',
    },
    {
      // no-op tasks
      find: /\b(task (prepareHermes).*\{)$/gm,
      replaceWith: `$1\n    return`,
    },
    {
      // download nightly react-native aar
      find: /^(task unpackReactNativeAAR \{[\s\S]*?^\})/gm,
      replaceWith: `
def reactNativeIsNightly = reactProperties.getProperty("VERSION_NAME").startsWith("0.0.0-")

def downloadReactNativeNightlyAAR = { buildType, version, downloadFile ->
  def classifier = buildType == 'Debug' ? 'debug' : 'release'
  download.run {
    src("https://oss.sonatype.org/service/local/artifact/maven/redirect?r=snapshots&g=com.facebook.react&a=react-native&c=\${classifier}&e=aar&v=\${version}-SNAPSHOT")
    onlyIfNewer(true)
    overwrite(false)
    dest(downloadFile)
  }
}

task unpackReactNativeAAR {
  def buildType = resolveBuildType()
  def rnAAR
  if (reactNativeIsNightly) {
    def downloadFile = file("\${downloadsDir}/react-native-nightly.aar")
    downloadReactNativeNightlyAAR(buildType, reactProperties.getProperty("VERSION_NAME"), downloadFile)
    rnAAR = downloadFile
  } else {
    def rnAarMatcher = "**/react-native/**/*\${buildType}.aar"
    if (REACT_NATIVE_MINOR_VERSION < 69) {
      rnAarMatcher = "**/**/*.aar"
    }
    rnAAR = fileTree("$reactNativeRootDir/android").matching({ it.include rnAarMatcher }).singleFile
  }
  def file = rnAAR.absoluteFile
  def packageName = file.name.tokenize('-')[0]
  copy {
    from zipTree(file)
    into "$reactNativeRootDir/ReactAndroid/src/main/jni/first-party/$packageName/"
    include "jni/**/*.so"
  }
}
      `,
    },
    {
      // add prefab support, setup task dependencies and hermes-engine dependencies
      transform: (text: string) =>
        text +
        '\n\n' +
        `android {\n` +
        `  buildFeatures {\n` +
        `    prefab true\n` +
        `  }\n` +
        `}\n` +
        `\n` +
        `dependencies {\n` +
        `  compileOnly "com.facebook.react:hermes-engine:${nightlyVersion}-SNAPSHOT"` +
        `}\n`,
    },
  ]);

  await transformFileAsync(path.join(root, 'android', 'CMakeLists.txt'), [
    {
      // Remove this after reanimated support react-native 0.71
      find: /(\s*"\$\{REACT_NATIVE_DIR\}\/ReactAndroid\/src\/main\/jni")/g,
      replaceWith: '$1\n        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"',
    },
    {
      // find hermes from prefab
      find: /(string\(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_HERMES=1"\))/g,
      replaceWith: `find_package(hermes-engine REQUIRED CONFIG)\n    $1`,
    },
    {
      // find hermes from prefab
      find: /"\$\{BUILD_DIR\}\/.+\/libhermes\.so"/g,
      replaceWith: `hermes-engine::libhermes`,
    },
  ]);

  // Workaround for UIImplementationProvider breaking change, that would break reanimated layout animation somehow
  await transformFileAsync(
    path.join(
      root,
      'android/src/main/java/com/swmansion/reanimated/layoutReanimation/ReanimatedUIManager.java'
    ),
    [
      {
        find: /^class ReaUiImplementationProvider extends UIImplementationProvider \{[\s\S]*?^\}/gm,
        replaceWith: '',
      },
      {
        find: `new ReaUiImplementationProvider(),`,
        replaceWith: '',
      },
    ]
  );
}

/**
 * Remove deprecated kotlin-android-extensions
 * TODO: remove this after detox updated and #19732 landed
 */
async function removeKotlinAndroidExtensionAsync() {
  const gradleFiles = [
    'node_modules/detox/android/detox/build.gradle',
    'packages/expo-eas-client/android/build.gradle',
    'packages/expo-module-template/android/build.gradle',
    'packages/expo-structured-headers/android/build.gradle',
    'packages/expo-updates-interface/android/build.gradle',
  ];

  await Promise.all(
    gradleFiles.map((file) =>
      transformFileAsync(file, [
        {
          find: /apply plugin: ['"]kotlin-android-extensions['"]/g,
          replaceWith: '',
        },
      ])
    )
  );
}

async function updateExpoModulesAsync() {
  const gradleFiles = await glob('packages/**/build.gradle', { cwd: EXPO_DIR });
  await Promise.all(
    gradleFiles.map((file) =>
      transformFileAsync(file, [
        {
          find: /\b(com.facebook.fbjni:fbjni):0\.2\.2/g,
          replaceWith: '$1:0.3.0',
        },
      ])
    )
  );
}

async function updateBareExpoAsync(nightlyVersion: string) {
  const root = path.join(EXPO_DIR, 'apps', 'bare-expo');
  await transformFileAsync(path.join(root, 'android', 'build.gradle'), [
    {
      find: 'resolutionStrategy.force "com.facebook.react:react-native:${reactNativeVersion}"',
      replaceWith: `resolutionStrategy.force "com.facebook.react:react-native:${nightlyVersion}-SNAPSHOT"`,
    },
  ]);

  await transformFileAsync(path.join(root, 'ios', 'BareExpo', 'AppDelegate.mm'), [
    {
      // Remove this when we upgrade bare-expo to 0.71
      find: `  RCTAppSetupPrepareApp(application);`,
      replaceWith: `
#if RCT_NEW_ARCH_ENABLED
  RCTAppSetupPrepareApp(application, YES);
#else
  RCTAppSetupPrepareApp(application, NO);
#endif
`,
    },
  ]);
}
