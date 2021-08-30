// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryAdapter.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <EXManifests/EXManifestsRawManifest.h>

@interface EXScopedModuleRegistryAdapter : EXModuleRegistryAdapter

- (EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(EXManifestsRawManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
