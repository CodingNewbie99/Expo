# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixes `parseEvent` to allow numeric characters as part of the `eventName` since the name can be alphanumeric. ([#8516](https://github.com/expo/expo/pull/8516) by [@thorbenprimke](https://github.com/thorbenprimke))

## 2.4.0 — 2020-05-27

### 🎉 New features

- Add `setDebugModeEnabled` for enabling DebugView on the Expo client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

- Fix no events recorded on the Expo client when running on certain Android devices. ([#7679](https://github.com/expo/expo/pull/7679) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix `setAnalyticsCollectionEnabled` throwing an error.
- Fixes & improvements to the pure JS analytics client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed logEvent in `expo-firebase-analytics` for Android. logEvent's optional properties parameter was causing a NPE on Android when not provided. ([#7897](https://github.com/expo/expo/pull/7897) by [@thorbenprimke](https://github.com/thorbenprimke))
