[![npm version](https://badge.fury.io/js/hardhat-gas-reporter.svg)](https://badge.fury.io/js/hardhat-gas-reporter)
[![Build Status]((https://github.com/cgewecke/hardhat-gas-reporter/actions/workflows/ci.yml/badge.svg?branch=master))
[![buidler](https://hardhat.org/buidler-plugin-badge.svg?1)](https://github.com/cgewecke/hardhat-gas-reporter)


# hardhat-gas-reporter

**Gas Usage Analysis for Hardhat**

- Profile gas costs with your test suite.
- Get metrics for method calls and deployments on L1 and L2.
- Get national currency costs of deploying and using your contract system

### Example report

![Screen Shot 2019-06-23 at 2 10 19 PM](https://user-images.githubusercontent.com/7332026/59982003-c30a4380-95c0-11e9-9d93-e3af979df227.png)

## Installation

Add the following to your hardhat.config.ts:
```ts
import "hardhat-gas-reporter"
```

## Configuration
Configuration is optional.
```js
// Example: hardhat.config.ts
const config: HardhatUserConfig = {
  gasReporter: {
    currency: 'EUR',
    L1: "polygon",
    coinmarketcap: "abc123...",
    etherscan: "ABC123...",
  }
}
```

## Usage

This plugin overrides the built-in `test` task. Gas reports are generated by default with:
```
npx hardhat test
```

**:bulb:  Turning the plugin on/off**

The options include an `enabled` key that lets you toggle gas reporting on and off using shell
environment variables. Tests run faster when the gas reporter is turned off because fewer
calls are made to the client to read data.
Example:

```ts
// hardhat.config.ts
const config: HardhatUserConfig = {
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  }
}
```

*NB*: If you're using a hardhat template project and not getting a gas report, look at your `hardhat.config.ts` and see how the authors' have configured the reporter - many of them use an ENV variable toggle by default.

**:bulb: Caveats about Accuracy**:
+ The hardhat client implements the Ethereum Foundation EVM. To get accurate measurements for other EVM-based chains you may need to run your tests against development clients developed specifically for those networks.
+ Gas usage readings for `pure` and `view` method calls are **only a lower bound** of their real world cost (which will be 100's to 1000's of gas higher). Actual gas usage depends on the way the methods are called and the storage/memory state of the EVM at the moment of invocation. For more information on this see the excellent summary at [wolfio/evm/gas][1]
+ L2 calldata gas usage readings for Optimism (e.g. `L1GasUsed`) are approximations - typically within 1% of observed usage on optimistic-scan. A small amount of variance is expected.

### Options

+ Common config setups for various use cases can be seen in the [Example Configs docs][2].
+ Get a [free tier Coinmarketcap API key][3]
+ Get a [free tier Etherscan API key][4] (NB: these are network specific)

| Options                         |    Type    |   Default  | Description                                                                                                                                                                                                     |
| :------------------------------ | :--------: | :--------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| currency                        |  _string_  |    `USD`   | National currency to represent gas costs in. Exchange rates are loaded at runtime from the `coinmarketcap` api. Available currency codes can be found [here][5]                                                 |
| coinmarketcap                   |  _string_  |      -     | [API key][55] to use when fetching live token price data                                                                                                                                                        |
| enabled                         |   _bool_   |   `true`   | Generate gas reports for the hardhat `test` command                                                                                                                                                             |
| etherscan                       |  _string_  |      -     | [API key][4] to use when fetching live gasPrice, baseFee, and blobBaseFee data                                                                                                                                  |
| excludeAutoGeneratedGetters     |   _bool_   |   `false`  | Exclude solc generated public state vars when reporting gas for pure and view methods. (Incurs a small performance penalty on test startup when `true`)                                                         |
| excludeContracts                | _string[]_ |    `[]`    | Contracts or folders to exclude from report. Ex: `['MyContract.sol', 'MyFolder/']`(Paths are relative to hardhat's `paths.sources` setting - usually `contracts`).                                              |
| includeIntrinsicGas             |   _bool_   |   `true`   | Include standard 21_000 + calldata bytes fees in method gas usage data. (Setting to false can be useful for modelling contract infra that will never be called by an EOA)                                       |
| L1                              |  _string_  | `ethereum` | Auto-configure reporter to emulate specified L1 network.  See [supported networks][6]                                                                                                                           |
| L2                              |  _string_  |      -     | Auto-configure reporter to emulate specified L2 network (See [supported networks][6]                                                                                                                            |
| offline                         |   _bool_   |   `false`  | Never make a remote call to fetch data                                                                                                                                                                          |
| optimismHardfork                |  _string_  |  `bedrock` | Optimism hardfork to emulate L1 & L2 gas costs for.                                                                                                                                                             |
| proxyResolver                   |   _Class_  |      -     | User-defined class which helps reporter identify contract targets of proxied calls. (See [Advanced Usage][7])                                                                                                   |
| remoteContracts                 |   _Array_  |      -     | List of forked-network deployed contracts to track execution costs for.(See [Advanced Usage][8])                                                                                                                |
| reportPureAndViewMethods        |   _bool_   |   `false`  | Track gas usage for methods invoked via `eth_call`. (Incurs a performance penalty that can be significant for large test suites)                                                                                |
| :high_brightness:   **DISPLAY** |            |            |                                                                                                                                                                                                                 |
| currencyDisplayPrecision        |  _number_  |     `2`    | Decimal precision to show nation state currency costs in                                                                                                                                                        |
| darkMode                        |   _bool_   |   `false`  | Use colors better for dark backgrounds when printing to stdout                                                                                                                                                  |
| forceTerminalOutput             |   _bool_   |   `false`  | Write to terminal even when saving output to file                                                                                                                                                               |
| forceTerminalOutputFormat       |  _string_  |      -     | Table format to output forced terminal output in ('legacy' / 'terminal' / 'markdown')                                                                                                                           |
| noColors                        |   _bool_   |   `false`  | Omit terminal color in output                                                                                                                                                                                   |
| reportFormat                    |  _string_  | `terminal` | Report formats ("legacy" / "terminal" / "markdown")                                                                                                                                                             |
| showMethodSig                   |   _bool_   |   `false`  | Display the complete function signature of methods. (Useful if you have overloaded methods)                                                                                                                     |
| showUncalledMethods             |   _bool_   |   `false`  | List all methods and deployments, even if no transactions were recorded for them                                                                                                                                |
| suppressTerminalOutput          |   _bool_   |   `false`  | Skip writing the table to std out. (Useful if you only want to write JSON to file)                                                                                                                              |
| :floppy_disk:   **OUTPUT**      |            |            |                                                                                                                                                                                                                 |
| outputFile                      |  _string_  |      -     | Relative path to a file to output terminal table to (instead of stdout)                                                                                                                                         |
| outputJSONFile                  |  _string_  |      -     | Relative path to a file to output gas data in JSON format to. (See [Advanced Usage][9])                                                                                                                         |
| outputJSON                      |   _bool_   |   `false`  | Write options, methods, deployment data in JSON format to file. (See [Advanced Usage][9])                                                                                                                       |
| rst                             |   _bool_   |   `false`  | Output with a reStructured text code-block directive. (Useful if you want to include report in ReadTheDocs or Sphinx docs)                                                                                      |
| rstTitle                        |  _string_  |      -     | Title for reStructured text header                                                                                                                                                                              |
| :mag:    **LOW-LEVEL CONFIG**   |            |            |                                                                                                                                                                                                                 |
| gasPrice                        |  _number_  |      -     | Gwei price per gas unit (Ex: `25`). By default, this is fetched from live network when `coinmarketcap` option is defined                                                                                        |
| baseFee                         |  _number_  |      -     | Gwei base fee per gas unit used to calculate L1 calldata costs for L2 transactions (Ex: `25`). By default, this is fetched from live network when `L2` & `coinmarketcap` options are defined                    |
| blobBaseFee                     |  _number_  |      -     | Gwei blob base fee per gas unit used to calculate post EIP-7516 L1 calldata costs for L2 transactions (Ex: `25`). By default, this is fetched from live network when `L2` & `coinmarketcap` options are defined |
| gasPriceApi                     |  _string_  |      -     | URL to fetch live *execution* network gas price from. (By default, this is auto-configured based on the `L1` or `L2` setting)                                                                                   |
| getBlockApi                     |  _string_  |      -     | URL to fetch L1 block header from when simulating L2. (By default, this is auto-configured based on the `L2` setting)                                                                                           |
| token                           |  _string_  |      -     | Network token gas fees are denominated in (ex:"ETH"). (By default, this is auto-configured based on the `L1` or `L2` setting)                                                                                   |
| tokenPrice                      |  _string_  |      -     | Network token price per nation state currency unit. (To denominate costs *in network token* set this to `"1"`)                                                                                                  |


[1]: https://github.com/wolflo/evm-opcodes/blob/main/gas.md#appendix---dynamic-gas-costs
[2]: [TODO: example configs]
[3]: https://coinmarketcap.com/api/pricing/
[4]: https://docs.etherscan.io/getting-started/viewing-api-usage-statistics
[5]: https://coinmarketcap.com/api/documentation/v1/#section/Standards-and-Conventions
[6]: [TODO: supported networks]
[7]: [TODO: Advanced Usage: proxy resolver]
[8]: [TODO: Advanced Usage: remote contracts]
(9): [TODO: Advanced Usage: JSON output]


These APIs have [rate limits](https://docs.etherscan.io/support/rate-limits). Depending on the usage, it might require an [API Key](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics).

> NB: Any gas price API call which returns a JSON-RPC response formatted like this is supported: `{"jsonrpc":"2.0","id":73,"result":"0x6fc23ac00"}`.


## Parallelization

This plugin also adds a Hardhat Task for merging several `gasReporterOutput.json` files, which are generated by [eth-gas-reporter](https://github.com/cgewecke/eth-gas-reporter) when [running your tests with in parallelized jobs in CI](https://github.com/cgewecke/eth-gas-reporter/blob/master/docs/gasReporterOutput.md).

To use the task you just have to give it the filepaths or a glob pattern pointing to all of the reports:
```bash
npx hardhat gas-reporter:merge 'gasReporterOutput-*.json'
```
