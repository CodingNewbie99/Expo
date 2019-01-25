import { UnavailabilityError } from 'expo-errors';
import * as FileSystem from '../FileSystem';
import ExponentFileSystem from '../ExponentFileSystem';

import { mockPlatformWeb, mockProperty, unmockAllProperties } from '../../test/mocking';

async function executeUnavailableMethod(method, name) {
  try {
    await method();
    expect(name).toBe('a failing method');
  } catch (error) {
    expect(error instanceof UnavailabilityError).toBeTruthy();
  }
}

describe('FileSystem', () => {
  describe('Constants', () => {
    it('documentDirectory', () => expect(FileSystem.documentDirectory).toBeDefined());
    it('cacheDirectory', () => expect(FileSystem.cacheDirectory).toBeDefined());
    it('bundledAssets', () => expect(FileSystem.bundledAssets).toBeDefined());
    it('bundleDirectory', () => expect(FileSystem.bundleDirectory).toBeDefined());
  });

  describe('Methods', () => {
    const URI = '/';
    it('downloadAsync', () => {
      const props: any = ['foo', 'bar', {}];
      FileSystem.downloadAsync(props[0], props[1], props[2]);
      expect(ExponentFileSystem.downloadAsync).toHaveBeenCalledWith(...props);
    });

    it('getInfoAsync', async () => {
      await FileSystem.getInfoAsync(URI);
    });
    it('readAsStringAsync', async () => {
      await FileSystem.readAsStringAsync(URI);
    });
    it('writeAsStringAsync', async () => {
      await FileSystem.writeAsStringAsync(URI, 'bar');
    });
    it('deleteAsync', async () => {
      await FileSystem.deleteAsync(URI);
    });
    it('moveAsync', async () => {
      await FileSystem.moveAsync(URI, URI + '/');
    });
    it('copyAsync', async () => {
      await FileSystem.copyAsync(URI, URI + '/');
    });
    it('makeDirectoryAsync', async () => {
      await FileSystem.makeDirectoryAsync(URI);
    });
    it('readDirectoryAsync', async () => {
      await FileSystem.readDirectoryAsync(URI);
    });
    // it ('downloadAsync', async () => {
    // await FileSystem.downloadAsync();
    // });
  });
});

function applyMocks() {
  mockPlatformWeb();
  [
    'getInfoAsync',
    'readAsStringAsync',
    'writeAsStringAsync',
    'deleteAsync',
    'moveAsync',
    'copyAsync',
    'makeDirectoryAsync',
    'readDirectoryAsync',
    'downloadAsync',
  ].forEach(methodName => {
    mockProperty(ExponentFileSystem, methodName, null);
  });
}
export function describeUnsupportedPlatforms(message, tests) {
  describe(`🕸  ${message}`, () => {
    beforeEach(applyMocks);
    mockPlatformWeb();
    tests();
    afterAll(unmockAllProperties);
  });
}

// getInfoAsync;
// readAsStringAsync;
// writeAsStringAsync;
// deleteAsync;
// moveAsync;
// copyAsync;
// makeDirectoryAsync;
// readDirectoryAsync;
// downloadAsync;
