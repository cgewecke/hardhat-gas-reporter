import { extendEnvironment } from "@nomiclabs/buidler/config";
import { lazyObject } from "@nomiclabs/buidler/plugins";

import { ExampleBuidlerRuntimeEnvironmentField } from "./ExampleBuidlerRuntimeEnvironmentField";

// Everything in a plugin must happen inside an exported function
export default function() {
  extendEnvironment(env => {
    // We add a field to the Buidler Runtime Environment here.
    // We use lazyObject to avoid initializing things until they are actually
    // needed.
    //env.example = lazyObject(() => new ExampleBuidlerRuntimeEnvironmentField());
  });
}
