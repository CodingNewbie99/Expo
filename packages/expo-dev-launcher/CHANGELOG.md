# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed the application hanging on the splash screen on iOS. ([#12971](https://github.com/expo/expo/pull/12971) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

## 0.3.3 — 2021-05-13

### 🐛 Bug fixes

- Fix flash of dev launcher screen during launch and incorrect dev menu shown on the 1st launch. ([#12765](https://github.com/expo/expo/pull/12765) by [@fson](https://github.com/fson))

## 0.3.2 — 2021-05-12

### 🎉 New features

- [plugin] Prevent plugin from running multiple times in a single process. ([#12715](https://github.com/expo/expo/pull/12715) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Added AppDelegate tests. ([#12651](https://github.com/expo/expo/pull/12651) by [@EvanBacon](https://github.com/EvanBacon))
- Added the ability to open managed apps inside the dev-launcher. ([#12698](https://github.com/expo/expo/pull/12698) by [@lukmccall](https://github.com/lukmccall))
- Included `expo-dev-launcher` in `expo-dev-client` package, an easier way to install it. ([#12765](https://github.com/expo/expo/pull/12765) by [@fson](https://github.com/fson))
- Added better URL validation. ([#12799](https://github.com/expo/expo/pull/12799) by [@lukmccall](https://github.com/lukmccall))
- Added better error handling. ([#12848](https://github.com/expo/expo/pull/12848) and [#12800](https://github.com/expo/expo/pull/12800) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed not finding the `Expo Go` on Android 11+ when the user tries to scan the QR code. ([#12328](https://github.com/expo/expo/pull/12328) by [@lukmccall](https://github.com/lukmccall))
- Account for rubocop formatting in plugin. ([#12480](https://github.com/expo/expo/pull/12480) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bundled images. ([#12668](https://github.com/expo/expo/pull/12668) by [@fson](https://github.com/fson))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- [plugin] Fix config plugin not including `expo-dev-launcher` in `Podfile`. ([#12828](https://github.com/expo/expo/pull/12828) by [@fson](https://github.com/fson))
- Fix incorrect color of safe area view on iOS. ([#12851](https://github.com/expo/expo/pull/12851) by [@lukmccall](https://github.com/lukmccall))
- Fixed application crashing with the `VerifyError` exception on Android. ([#12855](https://github.com/expo/expo/pull/12855) by [@lukmccall](https://github.com/lukmccall))
- Fixed XCode warnings. ([#12798](https://github.com/expo/expo/pull/12798) by [@lukmccall](https://github.com/lukmccall))

## 0.3.1 — 2021-04-09

### 🐛 Bug fixes

- Fix misspellings in READMEs. ([#12346](https://github.com/expo/expo/pull/12346) by [@wschurman](https://github.com/wschurman))

## 0.3.0 — 2021-03-24

### 🎉 New features

- Rewrote UI and added a dark theme support. ([#12236](https://github.com/expo/expo/pull/12236) by [@lukmccall](https://github.com/lukmccall))
- Fetched the development session if the user is logged into his Expo account. ([#12236](https://github.com/expo/expo/pull/12236) by [@lukmccall](https://github.com/lukmccall))
