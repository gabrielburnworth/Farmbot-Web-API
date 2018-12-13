import * as _ from "lodash";
import * as React from "react";
import { t } from "i18next";
import { Component } from "react";
import { StepParams } from "../interfaces";
import { MoveAbsState } from "../interfaces";
import {
  Tool,
  Coordinate,
  Point,
  Identifier,
  MoveAbsolute,
  TaggedTool,
  TaggedToolSlotPointer,
  ScopeDeclarationBodyItem
} from "farmbot";
import { Row, Col } from "../../ui/index";
import {
  isTaggedSequence,
} from "../../resources/tagged_resources";
import {
  findToolById,
  findSlotByToolId,
  findPointerByTypeAndId
} from "../../resources/selectors";
import { defensiveClone, betterMerge } from "../../util";
import { overwrite } from "../../api/crud";
import { Xyz } from "../../devices/interfaces";
import { InputBox } from "./tile_move_absolute/index";
import { ToolTips } from "../../constants";
import {
  StepWrapper,
  StepHeader,
  StepContent,
  StepWarning,
  conflictsString
} from "../step_ui/index";
import { StepInputBox } from "../inputs/step_input_box";
import {
  determineDropdown, determineLocation, determineEditable, findVariableByName
} from "../../resources/sequence_meta";
import { VariableForm } from "../locals_list";

interface Args {
  location: Tool | Coordinate | Point | Identifier;
  speed: number;
  offset: Coordinate;
}
type LocationArg = "location" | "offset";
type DataValue = Coordinate | Identifier | Point | Tool;

export class TileMoveAbsolute extends Component<StepParams, MoveAbsState> {
  get resources() { return this.props.resources; }
  get step() { return this.props.currentStep; }
  get tool(): TaggedTool | undefined {
    const l = this.args.location;
    if (l && l.kind === "tool" && l.args.tool_id) {
      return findToolById(this.resources, l.args.tool_id);
    }
  }
  get tool_id() { return this.tool && this.tool.body.id; }
  get slot(): TaggedToolSlotPointer | undefined {
    return (this.tool_id) ?
      findSlotByToolId(this.resources, this.tool_id) : undefined;
  }
  get args(): MoveAbsolute["args"] { return (this.step as MoveAbsolute).args; }

  getOffsetValue = (val: Xyz) => {
    return (this.args.offset.args[val] || 0).toString();
  }

  updateArgs = (update: Partial<Args>) => {
    const copy = defensiveClone(this.props.currentSequence).body;
    const step = (copy.body || [])[this.props.index] as MoveAbsolute;
    delete step.args.location.args;
    step.args = betterMerge(step.args, update);
    this.props.dispatch(overwrite(this.props.currentSequence, copy));
  }

  getAxisValue = (axis: Xyz): string => {
    let number: number | undefined;
    const l = this.args.location;
    switch (l.kind) {
      case "coordinate":
        number = l.args[axis];
        break;
      case "tool":
        number = (this.slot) ? this.slot.body[axis] : undefined;
        break;
      case "point":
        const { pointer_id } = l.args;
        number = findPointerByTypeAndId(this.resources, "Point", pointer_id)
          .body[axis];
        break;
      case "identifier":
        const { resources, currentSequence } = this.props;
        const v =
          findVariableByName(resources, currentSequence.uuid, l.args.label);
        if (v) {
          number = v.location[axis];
          break;
        }
    }
    return (number || 0).toString();
  }

  updateInputValue = (axis: Xyz, place: LocationArg) =>
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const num = parseFloat(e.currentTarget.value);
      const update = { [place]: { args: { [axis]: num } } };
      this.updateArgs(_.merge({}, this.args, update));
    }

  get settingConflicts(): Record<Xyz, boolean> {
    const conflicts = { x: false, y: false, z: false };
    if (this.props.hardwareFlags) {
      const {
        stopAtHome, stopAtMax, negativeOnly, axisLength
      } = this.props.hardwareFlags;
      const axes: Xyz[] = ["x", "y", "z"];
      axes.map((axis: Xyz) => {
        const coord = parseFloat(this.getAxisValue(axis));
        const offset = parseFloat(this.getOffsetValue(axis));
        const sum = coord + offset;
        if (stopAtHome[axis]) {
          conflicts[axis] = negativeOnly[axis] ? sum > 0 : sum < 0;
        }
        if (stopAtMax[axis] && axisLength[axis] !== 0) {
          conflicts[axis] = conflicts[axis] || (negativeOnly[axis]
            ? sum < -axisLength[axis]
            : sum > axisLength[axis]);
        }
      });
    }
    return conflicts;
  }

  get settingConflictWarning() {
    return "Movement out of bounds for: "
      + conflictsString(this.settingConflicts);
  }

  altHandleSelect = (SDBI: ScopeDeclarationBodyItem) => {
    const getLocation = (): DataValue => {
      switch (SDBI.kind) {
        case "variable_declaration":
          return SDBI.args.data_value;
        case "parameter_declaration":
          return { kind: "identifier", args: SDBI.args };
      }
    };
    const location = getLocation();
    this.updateArgs({ location });
  }

  get celeryNode(): ScopeDeclarationBodyItem {
    switch (this.args.location.kind) {
      case "identifier": return {
        kind: "parameter_declaration",
        args: { label: this.args.location.args.label, data_type: "point" }
      };
      default:
        return {
          kind: "variable_declaration",
          args: { label: "", data_value: this.args.location }
        };
    }
  }

  render() {
    const { currentStep, dispatch, index, currentSequence } = this.props;
    if (currentSequence && !isTaggedSequence(currentSequence)) {
      throw new Error("WHOOPS!");
    }

    const className = "move-absolute-step";
    return <StepWrapper>
      <StepHeader
        className={className}
        helpText={ToolTips.MOVE_ABSOLUTE}
        currentSequence={currentSequence}
        currentStep={currentStep}
        dispatch={dispatch}
        index={index}
        confirmStepDeletion={this.props.confirmStepDeletion}>
        {_.some(this.settingConflicts) &&
          <StepWarning
            warning={this.settingConflictWarning}
            conflicts={this.settingConflicts} />}
      </StepHeader>
      <StepContent className={className}>
        <VariableForm
          variable={{
            celeryNode: this.celeryNode,
            data_value: this.celeryNode,
            dropdown: determineDropdown(this.celeryNode, this.resources),
            location: determineLocation(this.resources, this.celeryNode),
            editable: determineEditable(this.celeryNode),
            variableValue: this.args.location,
          }}
          sequence={currentSequence}
          resources={this.resources}
          onChange={this.altHandleSelect}
          width={3} />
        <Row>
          <Col xs={3}>
            <InputBox
              onCommit={this.updateInputValue("x", "offset")}
              name="offset-x"
              value={this.getOffsetValue("x")}>
              {t("X-Offset")}
            </InputBox>
          </Col>
          <Col xs={3}>
            <InputBox
              onCommit={this.updateInputValue("y", "offset")}
              name="offset-y"
              value={this.getOffsetValue("y")}>
              {t("Y-Offset")}
            </InputBox>
          </Col>
          <Col xs={3}>
            <InputBox
              onCommit={this.updateInputValue("z", "offset")}
              name="offset-z"
              value={this.getOffsetValue("z")}>
              {t("Z-Offset")}
            </InputBox>
          </Col>
          <Col xs={3}>
            <label>
              {t("Speed (%)")}
            </label>
            <StepInputBox
              field={"speed"}
              step={this.step}
              index={index}
              dispatch={this.props.dispatch}
              sequence={this.props.currentSequence} />
          </Col>
        </Row>
      </StepContent>
    </StepWrapper>;
  }
}
