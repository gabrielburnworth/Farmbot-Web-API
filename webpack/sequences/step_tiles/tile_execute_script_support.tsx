import * as React from "react";
import { FarmwareInfo } from "../interfaces";
import { t } from "i18next";
import { DropDownItem, BlurableInput, Help } from "../../ui/index";
import { without, isNumber } from "lodash";
import { ExecuteScript, Pair, FarmwareConfig } from "farmbot";
import { getConfigEnvName } from "../../farmware/farmware_forms";
import { ToolTips } from "../../constants";

/** Create a Farmware input pair to include in the step body. */
const createPair = (name: string, label: string, value: string): Pair => ({
  kind: "pair",
  args: { label: name, value },
  comment: label
});

/** Add Pair to body (for editStep) */
const executorAdd = (inputPair: Pair) => (s: ExecuteScript) => {
  s.body = s.body || [];
  s.body.push(inputPair);
};

/** Add all pairs to body (for editStep) */
const executorAddAll = (fwName: string, configs: FarmwareConfig[]) =>
  (s: ExecuteScript) => {
    configs.map(config => {
      const name = getConfigEnvName(fwName, config.name);
      const pair = createPair(name, config.label, config.value);
      s.body = s.body || [];
      s.body.push(pair);
    });
  };

/** Remove all pairs from body (for editStep) */
const executorRemoveAll = (s: ExecuteScript) => {
  s.body = [];
};

/** Replace Pair in body (for editStep) */
const executorReplace = (inputPair: Pair) => (s: ExecuteScript) => {
  const inputName = inputPair.args.label;
  s.body = s.body || [];
  // Find index of inputPair in step body
  const inputIndex = without(s.body.map((pair, idx) => {
    if (pair.args.label == inputName) { return idx; }
  }), undefined)[0];
  if (isNumber(inputIndex)) {
    s.body[inputIndex] = inputPair;
  }
};

/** Remove pair in body (for editStep) */
const executorRemove = (inputName: string) => (s: ExecuteScript) => {
  s.body = (s.body || []).filter(x => x.args.label !== inputName);
};

/** Replace the Farmware input pair if it exists, otherwise add it. */
const addOrUpdatePair =
  (inputPair: Pair, step: ExecuteScript, stepUpdate: Function) => {
    // A list of Farmware input pair names in the current step.
    const inputNames: string[] = (step.body || []).map(x => x.args.label);
    // Check if the current step alread has a Farmware input.
    const hasPair = (name: string): boolean => inputNames.includes(name);
    const inputName = inputPair.args.label;
    const executor = hasPair(inputName)
      ? executorReplace(inputPair)
      : executorAdd(inputPair);
    stepUpdate(executor);
  };

/** List of requested inputs, if Farmware installed on a connected bot. */
const currentFarmwareInputs =
  (fwName: string, configs: FarmwareConfig[]): string[] => {
    return configs.map(config => getConfigEnvName(fwName, config.name));
  };

/** Check if a pair is requested by the selected Farmware (if connected) */
const isCurrentFarmwareInput = (configEnvNames: string[], inputName: string) =>
  configEnvNames.includes(inputName);

/** Load default and editing/saved Farmware input pairs. */
const farmwareInputs =
  (fwName: string, configs: FarmwareConfig[], currentStep: ExecuteScript) => {
    const inputs:
      { [x: string]: { label: string, value: string } }
      = {};

    // Load default input data for farmware
    configs
      .map(config => {
        inputs[getConfigEnvName(fwName, config.name)] = {
          label: config.label,
          value: config.value
        };
      });

    // Load input data in sequence step
    (currentStep.body || []).map(pair => {
      inputs[pair.args.label] = {
        label: "" + pair.comment,
        value: "" + pair.args.value
      };
    });

    return inputs;
  };

/** List of installed Farmware, if bot is connected (for DropDown). */
export const farmwareList =
  (farmwareInfo: FarmwareInfo | undefined): DropDownItem[] => {
    if (farmwareInfo) {
      const {
        farmwareNames, showFirstPartyFarmware, firstPartyFarmwareNames
      } = farmwareInfo;
      return farmwareNames
        .filter(x => (firstPartyFarmwareNames && !showFirstPartyFarmware)
          ? !firstPartyFarmwareNames.includes(x) : x)
        .map(name => ({ value: name, label: name }));
    }
    return [];
  };

export interface FarmwareInputsProps {
  farmwareName: string;
  currentStep: ExecuteScript;
  farmwareInstalled: boolean;
  defaultConfigs: FarmwareConfig[];
  updateStep: Function;
}

export function FarmwareInputs(props: FarmwareInputsProps) {
  const {
    farmwareName, currentStep, farmwareInstalled, defaultConfigs, updateStep
  } = props;

  /** Add a Farmware input pair. */
  const addStepPair = (inputPair: Pair) => () => {
    addOrUpdatePair(inputPair, currentStep, updateStep);
  };

  /** Remove a Farmware input pair. */
  const removeStepPair = (inputName: string) => () => {
    updateStep(executorRemove(inputName));
  };

  /** Add default input pairs. */
  const addAllDefaultPairs = () => {
    updateStep(executorAddAll(farmwareName, defaultConfigs));
  };

  /** Remove all input pairs. */
  const removeAllPairs = () => {
    updateStep(executorRemoveAll);
  };

  /** Change a Farmware input pair value. */
  const changePairValue = (name: string, label: string) =>
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      const pair = createPair(name, label, value);
      addOrUpdatePair(pair, currentStep, updateStep);
    };

  /** Reset Farmware input pair value to default. */
  const resetPairValue = (name: string, label: string) =>
    () => {
      const value = defaultValues()[name];
      const pair = createPair(name, label, value);
      addOrUpdatePair(pair, currentStep, updateStep);
    };

  /** Load default values from Farmware manifest. */
  const defaultValues = () => {
    const defaults: { [x: string]: string } = {};
    defaultConfigs.map(config => {
      defaults[getConfigEnvName(farmwareName, config.name)] =
        config.value.toString();
    });
    return defaults;
  };

  const isDefault = (name: string, value: string) =>
    defaultValues()[name] === value;
  const inputsInBody = (currentStep.body || []).map(x => x.args.label);
  const configEnvNames = currentFarmwareInputs(farmwareName, defaultConfigs);
  const areAllPresent = configEnvNames.every(x => inputsInBody.includes(x));
  const farmwareInputEntries =
    Object.entries(farmwareInputs(farmwareName, defaultConfigs, currentStep));
  const partial = inputsInBody.length > 0 && !areAllPresent ? "partial" : "";

  return farmwareInputEntries.length > 0 ?
    <div className="farmmware-step-input-fields">
      <div className="checkbox-row">
        <div className={`fb-checkbox ${partial}`}>
          <input type="checkbox"
            checked={areAllPresent}
            onChange={areAllPresent ? removeAllPairs : addAllDefaultPairs} />
        </div>
        <label>{t("Parameters")}</label>
        <Help text={ToolTips.FARMWARE_CONFIGS} />
      </div>
      {farmwareInputEntries.map(([name, config], i) => {
        const pair = createPair(name, config.label, config.value);
        const outdated = farmwareInstalled &&
          !isCurrentFarmwareInput(configEnvNames, name);
        return <fieldset key={i + name}
          title={outdated ? t("Input is not needed for this Farmware.") : ""}>
          <div className="checkbox-row">
            <div className="fb-checkbox">
              <input type="checkbox"
                checked={inputsInBody.includes(name)}
                onChange={inputsInBody.includes(name)
                  ? removeStepPair(name)
                  : addStepPair(pair)} />
            </div>
            <label style={outdated ? { color: "gray" } : {}}>
              {config.label}
            </label>
          </div>
          <div className="farmware-input-group">
            {inputsInBody.includes(name) &&
              <BlurableInput
                value={config.value}
                onCommit={changePairValue(name, config.label)}
                disabled={outdated} />}
            {!isDefault(name, config.value) &&
              <i className="fa fa-times-circle"
                onClick={resetPairValue(name, config.label)} />}
          </div>
        </fieldset>;
      })}
    </div> : <div />;
}
