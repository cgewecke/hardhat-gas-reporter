[![npm version](https://badge.fury.io/js/hardhat-gas-reporter.svg)](https://badge.fury.io/js/hardhat-gas-reporter)
![Build Status](https://github.com/cgewecke/hardhat-gas-reporter/actions/workflows/ci.yml/badge.svg?branch=master)
[![buidler](https://hardhat.org/buidler-plugin-badge.svg?1)](https://github.com/cgewecke/hardhat-gas-reporter)


# hardhat-gas-reporter

**Gas Usage Analytics for Hardhat**

- Get gas metrics for method calls and deployments on L1 and L2 by running your test suite.
- Get national currency costs of deploying and using your contract system.
- Output data in multiple formats including text, markdown, reStructuredText and JSON.

### Example report

![Screen Shot 2024-04-02 at 6 04 53 PM](https://github.com/cgewecke/hardhat-gas-reporter/assets/7332026/9f1eadb0-f47b-45fe-bfdb-57d4d2f07042)

+ See [markdown format example][10]

## Installation

```
npm install --save-dev hardhat-gas-reporter
```

Add the following to your hardhat.config.ts:
```ts
import "hardhat-gas-reporter"
```

## Configuration
Configuration is optional.
```js
// Example
const config: HardhatUserConfig = {
  gasReporter: {
    currency: 'EUR',
    L1: "polygon",
    coinmarketcap: "abc123...",
  }
}
```

## Usage

This plugin overrides the built-in `test` task. Gas reports are generated by default with:
```
npx hardhat test
```

**:bulb:  Turning the plugin on/off**

The `enabled` option lets you toggle gas reporting on and off using shell environment variables.
Tests run faster when the gas reporter is off because fewer calls are made to the client to read data.

```ts
const config: HardhatUserConfig = {
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  }
}
```

**:mag: Caveats about Accuracy**:
+ Gas readings for `pure` and `view` methods are **only a lower bound** of their real world cost. Actual gas usage will depend on the way the methods are called and the storage/memory state of the EVM at the moment of invocation. For more information on this see the excellent summary at [wolfio/evm/gas][1]
+ L1 gas readings for Arbitrum & OPStack chains are approximations - some variance is expected.
  + Optimism estimates should be within 1% of observed usage on [optimistic-etherscan][100].
  + Arbitrum estimates should be within 10% of observed usage on [arbiscan][111]
+ The Hardhat client implements the Ethereum Foundation EVM. To get accurate measurements for other EVM-based chains you may need to run your tests against development clients developed specifically for those networks.


## Options

+ Option setups for common and advanced use cases can be seen in the [Config Examples][2] docs.
+ Get a [free tier Coinmarketcap API key][3] if you want price data

| Options                         |    Type    |   Default  | Description                                                                                                                                                                                                                                                         |
| :------------------------------ | :--------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| currency                        |  _string_  |    `USD`   | National currency to represent gas costs in. Exchange rates are loaded at runtime from the `coinmarketcap` api. Available currency codes can be found [here][5]                                                                                                     |
| coinmarketcap                   |  _string_  |      -     | [API key][3] to use when fetching live token price data                                                                                                                                                                                                             |
| enabled                         |   _bool_   |   `true`   | Produce gas reports with `hardhat test`                                                                                                                                                                                                                             |
| excludeAutoGeneratedGetters     |   _bool_   |   `false`  | Exclude solc generated public state vars when reporting gas for pure and view methods. (Incurs a performance penalty on test startup when `true`) ⚠️ SLOW ⚠️                                                                                                        |
| excludeContracts                | _string[]_ |    `[]`    | Names of contracts to exclude from report. Ex: `["MyContract"]`                                                                                                                                                                                                     |
| includeIntrinsicGas             |   _bool_   |   `true`   | Include standard 21_000 + calldata bytes overhead in method gas usage data. (Setting to `false` can be useful for modelling contract infra that will never be called by an EOA)                                                                                     |
| L1                              |  _string_  | `ethereum` | Auto-configure reporter to emulate an L1 network.  (See [supported networks][6])                                                                                                                                                                                    |
| L2                              |  _string_  |      -     | Auto-configure reporter to emulate an L2 network (See [supported networks][6])                                                                                                                                                                                      |
| L1Etherscan                     |  _string_  |      -     | [API key][4] to use when fetching live gasPrice and baseFee data from an L1 network. (Optional, see [Supported Networks][6])                                                                                                                                        |
| L2Etherscan                     |  _string_  |      -     | [API key][4] to use when fetching live gasPrice and blobBaseFee data from an L2 network (Optional, see [Supported Networks][6])                                                                                                                                     |
| offline                         |   _bool_   |   `false`  | Turn off remote calls to fetch data                                                                                                                                                                                                                                 |
| optimismHardfork                |  _string_  |  `ecotone` | Optimism hardfork to emulate L1 & L2 gas costs for.                                                                                                                                                                                                                 |
| proxyResolver                   |   _Class_  |      -     | User-defined class which helps reporter identify contract targets of proxied calls. (See [Advanced Usage][7])                                                                                                                                                       |
| remoteContracts                 |   _Array_  |      -     | List of forked-network deployed contracts to track execution costs for.(See [Advanced Usage][8])                                                                                                                                                                    |
| reportPureAndViewMethods        |   _bool_   |   `false`  | Track gas usage for methods invoked via `eth_call`. (Incurs a performance penalty that can be significant for large test suites)                                                                                                                                    |
| trackGasDeltas                  |   _bool_   |   `false`  | Track and report changes in gas usage versus previous test run. (Useful for gas golfing)                                                                                                                                                                            |
| :high_brightness:   **DISPLAY** |            |            |                                                                                                                                                                                                                                                                     |
| currencyDisplayPrecision        |  _number_  |     `2`    | Decimal precision to show nation state currency costs in                                                                                                                                                                                                            |
| darkMode                        |   _bool_   |   `false`  | Use colors better for dark backgrounds when printing to stdout                                                                                                                                                                                                      |
| forceTerminalOutput             |   _bool_   |   `false`  | Write to terminal even when saving output to file                                                                                                                                                                                                                   |
| forceTerminalOutputFormat       |  _string_  |      -     | Table format to output forced terminal output in ("legacy" / "terminal" / "markdown")                                                                                                                                                                               |
| noColors                        |   _bool_   |   `false`  | Omit terminal color in output                                                                                                                                                                                                                                       |
| reportFormat                    |  _string_  | `terminal` | Report formats ("legacy" / "terminal" / "markdown")                                                                                                                                                                                                                 |
| showMethodSig                   |   _bool_   |   `false`  | Display the complete function signature of methods. (Useful if you have overloaded methods)                                                                                                                                                                         |
| showUncalledMethods             |   _bool_   |   `false`  | List all methods and deployments, even if no transactions were recorded for them                                                                                                                                                                                    |
| suppressTerminalOutput          |   _bool_   |   `false`  | Skip writing the table to stdout. (Useful if you only want to write JSON to file)                                                                                                                                                                                   |
| :floppy_disk:   **OUTPUT**      |            |            |                                                                                                                                                                                                                                                                     |
| includeBytecodeInJSON           |   _bool_   |    false   | Include bytecode and deployedBytecode blobs in JSON output                                                                                                                                                                                                          |
| outputFile                      |  _string_  |      -     | Relative path to a file to output text table to (instead of stdout)                                                                                                                                                                                                 |
| outputJSONFile                  |  _string_  |      -     | Relative path to a file to output gas data in JSON format to. (See [Advanced Usage][9])                                                                                                                                                                             |
| outputJSON                      |   _bool_   |   `false`  | Write options, methods, deployment data in JSON format to file. (See [Advanced Usage][9])                                                                                                                                                                           |
| rst                             |   _bool_   |   `false`  | Output with a reStructured text code-block directive. (Useful if you want to include report in ReadTheDocs or Sphinx docs)                                                                                                                                          |
| rstTitle                        |  _string_  |      -     | Title for reStructured text header                                                                                                                                                                                                                                  |
| :mag:    **LOW-LEVEL CONFIG**   |            |            |                                                                                                                                                                                                                                                                     |
| gasPrice                        |  _number_  |      -     | Gwei price per gas unit (Ex: `25`). By default, this is fetched from live network when `coinmarketcap` option is defined                                                                                                                                            |
| baseFee                         |  _number_  |      -     | Gwei base fee per gas unit used to calculate L1 calldata costs for L2 transactions (Ex: `25`). By default, this is fetched from live network when `L2` & `coinmarketcap` options are defined                                                                        |
| baseFeePerByte                  |  _number_  |      -     | Gwei fee per byte used to calculate L1 calldata costs for Arbitrum transactions (Ex: `25`). See [arbitrum gas estimation docs for details][112]. By default, this is fetched from live network when `L2` is set to 'arbitrum' & `coinmarketcap` options are defined |
| blobBaseFee                     |  _number_  |      -     | Gwei blob base fee per gas unit used to calculate post-EIP-7516 L1 calldata costs for L2 transactions (Ex: `25`). By default, this is fetched from live network when `L2` & `coinmarketcap` options are defined                                                     |
| blobBaseFeeApi                  |  _string_  |      -     | URL to fetch live *execution* network blob base fee from. (By default, this is auto-configured based on the `L1` or `L2` setting)                                                                                                                                   |
| gasPriceApi                     |  _string_  |      -     | URL to fetch live *execution* network gas price from. (By default, this is auto-configured based on the `L1` or `L2` setting)                                                                                                                                       |
| getBlockApi                     |  _string_  |      -     | URL to fetch L1 block header from when simulating L2. (By default, this is auto-configured based on the `L2` setting)                                                                                                                                               |
| opStackBaseFeeScalar            |  _number_  |      -     | Scalar applied to L1 base fee when calculating L1 data cost (see [Advanced Usage][12])                                                                                                                                                                              |
| opStackBlobBaseFeeScalar        |  _number_  |      -     | Scalar applied to L1 blob base fee when calculating L1 data cost (see [Advanced Usage][12])                                                                                                                                                                         |
| token                           |  _string_  |      -     | Network token gas fees are denominated in (ex:"ETH"). (By default, this is auto-configured based on the `L1` or `L2` setting)                                                                                                                                       |
| tokenPrice                      |  _string_  |      -     | Network token price per nation state currency unit. (To denominate costs *in network token* set this to `"1"`)                                                                                                                                                      |


## Utility Tasks

The plugin also provides additional utility commands for managing gas reporter output

### hhgas:merge

Merges several JSON formatted gas reports into a single object. This is useful if you're post-processing the data and running your tests in a parallelized CI environment.

**Usage**
```bash
npx hardhat hhgas:merge "gasReporterOutput-*.json"
```

## Supported Networks

API keys for the networks this plugin auto-configures via the `L1` and `L2` options are available from the links below. In many cases these aren't equired - you'll only need to set them if you start seeing rate-limit warnings.

**L2**

+ [arbitrum][113] (live `baseFeePerByte` prices require an API key)
+ [base][110] (live `blobBaseFee` prices require an API key)
+ [optimism][109] (live `blobBaseFee` prices require an API key)

**L1**

+ [ethereum][101]
+ [polygon][102]
+ [binance][103]
+ [fantom][104]
+ [moonbeam][105]
+ [moonriver][106]
+ [gnosis][107]
+ [avalanche][108]

## Funding

You can support hardhat-gas-reporter via [DRIPS][11], a public goods protocol that helps you direct funding to packages in your dependency tree.


[1]: https://github.com/wolflo/evm-opcodes/blob/main/gas.md#appendix---dynamic-gas-costs
[2]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#config-examples
[3]: https://coinmarketcap.com/api/pricing/
[4]: https://docs.etherscan.io/getting-started/viewing-api-usage-statistics
[5]: https://coinmarketcap.com/api/documentation/v1/#section/Standards-and-Conventions
[6]: https://github.com/cgewecke/hardhat-gas-reporter?tab=readme-ov-file#supported-networks
[7]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#proxy-resolvers
[8]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#remote-contracts
[9]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#json-output
[10]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#markdown-format-example
[11]: https://www.drips.network/app/projects/github/cgewecke/hardhat-gas-reporter
[12]: https://github.com/cgewecke/hardhat-gas-reporter/blob/master/docs/advanced.md#op-stack-l1-data-costs
[100]: https://optimistic.etherscan.io
[101]: https://docs.etherscan.io/getting-started/viewing-api-usage-statistics
[102]: https://docs.polygonscan.com/getting-started/viewing-api-usage-statistics
[103]: https://docs.bscscan.com/getting-started/viewing-api-usage-statistics
[104]: https://docs.ftmscan.com/getting-started/viewing-api-usage-statistics
[105]: https://docs.moonscan.io/getting-started/viewing-api-usage-statistics
[106]: https://docs.moonscan.io/v/moonriver
[107]: https://docs.gnosisscan.io/getting-started/viewing-api-usage-statistics
[108]: https://snowtrace.io/
[109]: https://docs.optimism.etherscan.io/getting-started/viewing-api-usage-statistics
[110]: https://docs.basescan.org/getting-started/viewing-api-usage-statistics
[111]: https://arbiscan.io/
[112]: https://docs.arbitrum.io/build-decentralized-apps/how-to-estimate-gas#an-example-of-how-to-apply-this-formula-in-your-code
[113]: https://docs.arbiscan.io/getting-started/viewing-api-usage-statistics

