import { Validator, ValidatorResult } from 'jsonschema';
import { HardhatPluginError } from 'hardhat/plugins';
import { Deployment, GasReporterOutput, MethodDataItem } from '../../types';

const ReporterOutputSchema = {
  id: "hardhat.hhgr.output.json",
  type: "object",
  properties: {
    namespace: { type: "string" },
    toolchain: { type: "string" },
    version: { type: "string"},
    options: { type: "object"},
    "data": {
      type: "object",
      properties: {
        "methods": { type: "object"},
        "deployments": { type: "array", "items": { "type": "object"} }
      }
    }
  }
};

const MethodDataSchema = {
  id: "hardhat.hhgr.methods.json",
  type: "object",
  properties: {
    callData: { type: "array", "items": { "type": "number"} },
    gasData: { type: "array", "items": { "type": "number"} },
    numberOfCalls: { type: "number"},
    executionGasAverage: { type: "number"},
    calldataGasAverage: { type: "number"},
    min: { type: "number" },
    max: { type: "number" },
    cost: { type: "string" }
  }
};

const DeploymentDataSchema = {
  id: "hardhat.hhgr.deployments.json",
  type: "object",
  properties: {
    name: {type: "string"},
    callData: { type: "array", "items": { "type": "number"} },
    gasData: { type: "array", "items": { "type": "number"} },
    executionGasAverage: { type: "number"},
    calldataGasAverage: { type: "number"},
    min: { type: "number" },
    max: { type: "number" },
    cost: { type: "string" },
    percent: { type: "number"},
  }
}

export class HardhatGasReporterOutputValidator {
  public validator: Validator;

  constructor(){
    this.validator = new Validator();
    this.validator.addSchema(ReporterOutputSchema);
    this.validator.addSchema(MethodDataSchema);
    this.validator.addSchema(DeploymentDataSchema);
  }

  public validateOutputObject(output: GasReporterOutput, sourceFilePath: string){
    const result = this.validator.validate(output, ReporterOutputSchema);
    this._checkResult(result, sourceFilePath);
    return true;
  }

  public validateMethodDataItem(item: MethodDataItem, sourceFilePath: string){
    const result = this.validator.validate(item, MethodDataSchema);
    this._checkResult(result, sourceFilePath);
    return true;
  }

  public validateDeploymentDataItem(deployment: Deployment, sourceFilePath: string){
    const result = this.validator.validate(deployment, DeploymentDataSchema);
    this._checkResult(result, sourceFilePath);
    return true;
  }

  private _checkResult(result: ValidatorResult, sourceFilePath: string) {
    if (result.errors.length){
      const msg = `"${result.errors[0].property.replace('instance.', '')}"`;

      throw new HardhatPluginError(
        "hardhat-gas-reporter",
        `Unexpected JSON report format in ${sourceFilePath}. ` +
        `Reported JSON validation error was: ${msg}`
      );
    }
  }
}
