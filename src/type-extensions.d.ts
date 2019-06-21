import "@nomiclabs/buidler/types";
import { ExampleBuidlerRuntimeEnvironmentField } from "./ExampleBuidlerRuntimeEnvironmentField";

// This file is used to extend Buidler's types. Most plugins contain a
// src/type-extensions.d.ts, so we recommend to keep this name.

declare module "@nomiclabs/buidler/types" {
  // This is an example of an extension to the Buidler Runtime Environment.
  // This new field will be available in tasks' actions, scripts, and tests.
  export interface BuidlerRuntimeEnvironment {
    example: ExampleBuidlerRuntimeEnvironmentField;
  }

  // This is an example of an extension to one of the Buidler config values.
  export interface ProjectPaths {
    newPath?: string;
  }
}
