import { ExpoConfig } from '@expo/config-types';

import { updateAndroidProguardRules, withAndroidFlipper } from '../android';

type ExpoConfigWithMods = ExpoConfig & {
  mods?: Record<'ios' | 'android', Record<string, unknown[]>>;
};

describe(updateAndroidProguardRules, () => {
  it('should append new rules', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    expect(results).toContain(rules);
  });

  it('should append new rules twice', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const rules2 = '-keep public class MyClass';
    let results = updateAndroidProguardRules(contents, rules, 'append');
    results = updateAndroidProguardRules(results, rules2, 'append');
    expect(results).toContain(rules);
    expect(results).toContain(rules2);
  });

  it('should purge previous rules for overwrite mode', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const rules2 = '-keep public class MyClass';
    let results = updateAndroidProguardRules(contents, rules, 'append');
    results = updateAndroidProguardRules(results, rules2, 'overwrite');
    expect(results).not.toContain(rules);
    expect(results).toContain(rules2);
  });

  it('should leave the contents untouched when new rules is null', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    const updatedRules = updateAndroidProguardRules(results, null, 'append');
    expect(updatedRules).toEqual(results);
  });

  it('should leave the contents untouched when mode is `append` and rules is empty string', () => {
    const contents = '# original rules\n';
    const results = updateAndroidProguardRules(contents, '', 'append');
    expect(results).toEqual(contents);
  });

  it('should purge the sectioned contents when mode is `overwrite` and rules is empty string', () => {
    const contents = `\
# original rules

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
-printmapping mapping.txt
# @generated end expo-build-properties`;
    const results = updateAndroidProguardRules(contents, '', 'overwrite');
    expect(results).toEqual('# original rules\n');
  });

  it('demonstrate the updated contents', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    expect(results).toMatchInlineSnapshot(`
      "# original rules

      # @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
      -printmapping mapping.txt
      # @generated end expo-build-properties"
    `);
  });
});

describe(withAndroidFlipper, () => {
  it('should do nothing by default or if set to enabled', async () => {
    const expoConfig: ExpoConfig = {
      name: 'withAndroidFlipper',
      slug: 'withAndroidFlipper',
    };

    withAndroidFlipper(expoConfig, {});
    expect((expoConfig as ExpoConfigWithMods)?.mods?.android).toBeUndefined();

    withAndroidFlipper(expoConfig, {
      android: {
        flipper: true,
      },
    });
    expect((expoConfig as ExpoConfigWithMods)?.mods?.android).toBeUndefined();
  });

  it('should update the flipper version if requested', async () => {
    const expoConfig: ExpoConfig = {
      name: 'withAndroidFlipper',
      slug: 'withAndroidFlipper',
    };
    const pluginConfig = {
      android: {
        flipper: '0.999.0',
      },
    };
    withAndroidFlipper(expoConfig, pluginConfig);
    expect((expoConfig as ExpoConfigWithMods)?.mods?.android?.gradleProperties).toBeInstanceOf(
      Function
    );
  });
});
