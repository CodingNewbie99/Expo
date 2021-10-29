// Copyright 2021-present 650 Industries. (AKA Expo) All rights reserved.

import ExpoModulesCore

public class SystemUIModule: Module {
  public static func definition() -> ModuleDefinition {
    name("ExpoSystemUI")

    method("getBackgroundColorAsync") { (module) -> String? in
      var color: String? = nil
      EXUtilities.performSynchronously {
        if let backgroundColor = module.appContext?.utilities?.currentViewController()?.view.backgroundColor?.cgColor {
          color = EXUtilities.hexString(with: backgroundColor)
        }
      }
      return color
    }

    method("setBackgroundColorAsync") { (module, color: Int) in
      EXUtilities.performSynchronously {
        module.appContext?.utilities?.currentViewController()?.view.backgroundColor = EXUtilities.uiColor(color)
      }
    }
  }
}
