import ExpoModulesCore

public class ExpoModuleTemplateModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoModuleTemplate")
    
    function("someGreatMethodAsync") { (options: [String: String]) in
      print("Hello 👋")
    }
    
    viewManager {
      view {
        ModuleTemplateView()
      }

      prop("someGreatProp") { (view: ModuleTemplateView, prop: Int) in
        print("prop")
      }
    }
  }
}
