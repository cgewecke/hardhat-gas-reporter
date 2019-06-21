# buidler-example-plugin

_A one line description of the plugin_

[Buidler](http://getbuidler.com) plugin example.

## What

_A longer, one paragraph, description of the plugin_

This plugin is just an example. It was created to teach how to build plugins and
doesn't do much appart from that.

## Installation

_A step-by-step guide on how to install the plugin_

```bash
npm install @nomiclabs/buidler-example-plugin any-peer-dep
```

And add the following statement to your `buidler.config.js`:

```js
usePlugin("@nomiclabs/buidler-example-plugin");
```

## Required plugins

_A list of all the plugins that are required by this one_

- [@nomiclabs/buidler-web3](https://github.com/nomiclabs/buidler/tree/master/packages/buidler-web3)

## Tasks

_A description of each task added by this plugin. It it just overrides internal
tasks, this may no be needed_

This plugin creates no additional tasks.

## Environment extensions

_A description of each extension to the Buidler Runtime Environment_

This plugin extends the Buidler Runtime Environment by adding an `example` field
whose type is `ExampleBuidlerRuntimeEnvironmentField`.

## Configuration

_A description of each extension to the BuidlerConfig or to its fields_

This plugin extends the `BuidlerConfig`'s `ProjectPaths` object with an optional
`newPath` field.

This is an example of how to set it:

```js
module.exports = {
  paths: {
    newPath: "./new-path"
  }
};
```

## Usage

_A description on how to use this plugin, for example, how to run its tasks_

There are no additional steps you need to take for this plugin to work.

Install it and access ethers through the Buidler Runtime Environment anywhere
you need it (tasks, scripts, tests, etc).

## TypeScript support

_This section is needed if you are extending types in your plugin_

You need to add this to your `tsconfig.json`'s `files` array:
`"node_modules/@nomiclabs/buidler-example-plugin/src/type-extensions.d.ts"`
