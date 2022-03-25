import { getVersionsAsync } from '../../../api/getVersions';
import { getBundledNativeModulesAsync } from '../../../start/doctor/dependencies/bundledNativeModules';
import {
  getOperationLog,
  getRemoteVersionsForSdkAsync,
  getVersionedPackagesAsync,
} from '../getVersionedPackages';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../api/getVersions', () => ({
  getVersionsAsync: jest.fn(),
}));

jest.mock('../../../start/doctor/dependencies/bundledNativeModules', () => ({
  getBundledNativeModulesAsync: jest.fn(),
}));

describe(getVersionedPackagesAsync, () => {
  it('should return versioned packages', async () => {
    asMock(getBundledNativeModulesAsync).mockResolvedValueOnce({});
    asMock(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);

    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons', 'react@next', 'expo-camera', 'uuid@^3.4.0'],
    });

    expect(packages).toEqual([
      // Custom
      '@expo/vector-icons@3.0.0',
      'react@facebook-react',
      // Passthrough
      'expo-camera',
      'uuid@^3.4.0',
    ]);

    expect(messages).toEqual(['2 SDK 1.0.0 compatible native modules', '2 other packages']);
  });
});

describe(getOperationLog, () => {
  it('crafts messages', () => {
    expect(
      getOperationLog({
        nativeModulesCount: 1,
        sdkVersion: '1.0.0',
        othersCount: 1,
      })
    ).toEqual(['1 SDK 1.0.0 compatible native module', '1 other package']);
  });
  it('crafts messages plural', () => {
    expect(
      getOperationLog({
        nativeModulesCount: 2,
        sdkVersion: '1.0.0',
        othersCount: 2,
      })
    ).toEqual(['2 SDK 1.0.0 compatible native modules', '2 other packages']);
  });
});

describe(getRemoteVersionsForSdkAsync, () => {
  it('returns an empty object when the SDK version is not supported', async () => {
    asMock(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {},
    } as any);

    expect(await getRemoteVersionsForSdkAsync('1.0.0')).toEqual({});
  });

  it('returns versions for SDK with Facebook overrides', async () => {
    asMock(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);

    expect(await getRemoteVersionsForSdkAsync('1.0.0')).toEqual({
      'expo-sms': 'default',
      react: 'facebook-react',
      'react-dom': 'facebook-react',
      'react-native': 'facebook-rn',
    });
  });
});
