import { Validator, ValidatorResult } from 'jsonschema';
import { HardhatPluginError } from 'hardhat/plugins';
import { EOL } from 'os';
import { Deployment, GasReporterOutput, MethodDataItem } from '../../types';

const ReporterOutputSchema = {
  id: "hardhat.hhgr.output.json",
  type: "object",
  properties: {
    namespace: { type: "string" },
    toolchain: { type: "string" },
    version: { type: "string"},
    options: { type: "object"},
    data: {
      type: "object",
      properties: {
        "methods": { type: "object"},
        "deployments": { type: "array", "items": { "type": "object"} }
      },
      required: ["methods", "deployments"]
    }
  },
  required: ["toolchain", "data", "options"]
};

const MethodDataSchema = {
  id: "hardhat.hhgr.methods.json",
  type: "object",
  properties: {
    callData: { type: "array", "items": { "type": "number"}, "required": true },
    gasData: { type: "array", "items": { "type": "number"}, "required": true },
    numberOfCalls: { type: "number", "required": true},
  }
};

const DeploymentDataSchema = {
  id: "hardhat.hhgr.deployments.json",
  type: "object",
  properties: {
    name: {type: "string", "required": true},
    callData: { type: "array", "items": { "type": "number"}, "required": true },
    gasData: { type: "array", "items": { "type": "number"}, "required": true },
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
      let errors = "";
      for (const err of result.errors) {
        errors += err.stack.replace("instance.", "") + EOL;
      };

      throw new HardhatPluginError(
        "hardhat-gas-reporter",
        `Unexpected JSON report format in ${sourceFilePath}. ` +
        `Reported JSON validation error was: ${  EOL 
        }${errors}`
      );
    }
  }
}
