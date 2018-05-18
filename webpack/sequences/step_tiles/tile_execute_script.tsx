import * as React from "react";
import { StepParams } from "../interfaces";
import { t } from "i18next";
import { ToolTips } from "../../constants";
import { StepInputBox } from "../inputs/step_input_box";
import { StepWrapper, StepHeader, StepContent } from "../step_ui/index";
import { Row, Col, FBSelect, DropDownItem, BlurableInput } from "../../ui/index";
import { without, isNumber } from "lodash";
import { editStep } from "../../api/crud";
import { ExecuteScript, Pair } from "farmbot";

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

/** Replace Pair in body (for editStep) */
const executorReplace = (inputPair: Pair) => (s: ExecuteScript) => {
  const inputName = inputPair.args.label;
  s.body = s.body || [];
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

export function TileExecuteScript({
  dispatch, currentStep, index, currentSequence, farmwareInfo }: StepParams) {
  if (currentStep.kind === "execute_script") {

    /** List of installed Farmware, if bot is connected. */
    const farmwareList = () => {
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

    /** Selected Farmware is installed on connected bot. */
    const isInstalled = (): boolean => {
      const farmware = currentStep.args.label;
      return !!(farmwareInfo && farmwareInfo.farmwareNames.includes(farmware));
    };

    const selectedFarmware = () => {
      const farmware = currentStep.args.label;
      if (isInstalled()) {
        return { value: farmware, label: farmware };
      }
      return { label: "Manual Input", value: "" };
    };

    /** Change step Farmware name. */
    const updateStepFarmwareSelection = (item: DropDownItem) => {
      dispatch(editStep({
        sequence: currentSequence,
        step: currentStep,
        index: index,
        executor: (step: ExecuteScript) => {
          step.args.label = "" + item.value;
        }
      }));
    };

    /** A list of Farmware input pair names in the current step. */
    const inputNames: string[] = (currentStep.body || []).map(x => x.args.label);

    /** Check if the current step alread has a Farmware input. */
    const hasPair = (name: string): boolean => inputNames.includes(name);

    /** Replace the Farmware input pair if it exists, otherwise add it. */
    const addOrUpdatePair = (inputPair: Pair) => {
      const inputName = inputPair.args.label;
      dispatch(editStep({
        sequence: currentSequence,
        step: currentStep,
        index: index,
        executor: hasPair(inputName)
          ? executorReplace(inputPair)
          : executorAdd(inputPair)
      }));
    };

    /** Remove a Farmware input pair. */
    const removeStepPair = (inputName: string) => () => {
      dispatch(editStep({
        sequence: currentSequence,
        step: currentStep,
        index: index,
        executor: executorRemove(inputName)
      }));
    };

    /** Change a Farmware input pair value. */
    const changePairValue = (name: string, label: string) =>
      (e: React.SyntheticEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        const pair = createPair(name, label, value);
        addOrUpdatePair(pair);
      };

    /** Add a Farmware input pair. */
    const addPair = (name: string, label: string, value: string) => () => {
      const pair = createPair(name, label, value);
      addOrUpdatePair(pair);
    };

    /** List of requested inputs, if Farmware installed on a connected bot. */
    const currentFarmwareInputs = () => {
      const farmwareName = currentStep.args.label;
      return farmwareInfo && farmwareInfo.farmwareConfigs[farmwareName]
        ? farmwareInfo.farmwareConfigs[farmwareName]
          .map(config => config.name)
        : [];
    };

    /** Check if a pair is requested by the selected Farmware (if connected) */
    const isCurrentFarmwareInput = (inputName: string) =>
      currentFarmwareInputs().includes(inputName);

    /** Load default and editing/saved Farmware input pairs. */
    const farmwareInputs = () => {
      const inputs: {
        [x: string]: { label: string, value: string, default: boolean }
      } = {};

      // Load default input data for farmware
      const farmwareName = currentStep.args.label;
      if (farmwareInfo && farmwareInfo.farmwareConfigs[farmwareName]) {
        farmwareInfo.farmwareConfigs[farmwareName]
          .map(config => {
            inputs[config.name] = {
              label: config.label, value: config.value, default: true
            };
          });
      }

      // Load input data in sequence step
      (currentStep.body || []).map(pair => {
        inputs[pair.args.label] = {
          label: "" + pair.comment, value: "" + pair.args.value, default: false
        };
      });

      return inputs;
    };

    const className = "execute-script-step";
    return <StepWrapper>
      <StepHeader
        className={className}
        helpText={ToolTips.EXECUTE_SCRIPT}
        currentSequence={currentSequence}
        currentStep={currentStep}
        dispatch={dispatch}
        index={index} />
      <StepContent className={className}>
        <Row>
          <Col xs={12}>
            <label>{t("Package Name")}</label>
            <FBSelect
              key={selectedFarmware().label}
              list={farmwareList()}
              selectedItem={selectedFarmware()}
              onChange={updateStepFarmwareSelection}
              allowEmpty={true}
              customNullLabel={"Manual Input"} />
            {!isInstalled() &&
              <div>
                <label>{t("Manual input")}</label>
                <StepInputBox dispatch={dispatch}
                  index={index}
                  step={currentStep}
                  sequence={currentSequence}
                  field="label" />
              </div>}
            {Object.entries(farmwareInputs()).length > 0 &&
              <div className="farmmware-step-input-fields">
                <label>
                  {t("Inputs")}
                </label>
                {Object.entries(farmwareInputs()).map(([name, config], i) => {
                  const outdated = isInstalled() && !isCurrentFarmwareInput(name);
                  return <fieldset key={i + name}
                    title={outdated
                      ? t("Input is not needed for this Farmware.")
                      : ""}>
                    <label style={outdated ? { color: "gray" } : {}}>
                      {config.label}
                    </label>
                    <BlurableInput
                      value={config.value}
                      onCommit={changePairValue(name, config.label)}
                      disabled={outdated} />
                    {config.default
                      ? <button
                        className={"fb-button green"}
                        onClick={addPair(name, config.label, config.value)}>
                        <i className="fa fa-check"></i>
                        *
                      </button>
                      : <button
                        className={"fb-button red"}
                        onClick={removeStepPair(name)}>
                        <i className="fa fa-times"></i>
                      </button>}
                  </fieldset>;
                })}
              </div>}
          </Col>
        </Row>
      </StepContent>
    </StepWrapper>;
  } else {
    return <p> ERROR </p>;
  }
}
