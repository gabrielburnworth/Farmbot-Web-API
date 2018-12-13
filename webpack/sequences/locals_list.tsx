import * as React from "react";
import { Row, Col, FBSelect } from "../ui";
import { t } from "i18next";
import {
  generateList
} from "./step_tiles/tile_move_absolute/generate_list";
import { InputBox } from "./step_tiles/tile_move_absolute/input_box";
import {
  convertDDItoScopeDeclr, addOrEditDeclaration
} from "./step_tiles/tile_move_absolute/handle_select";
import {
  VariableFormProps, LocalsListProps, PARENT
} from "./locals_list_support";
import { defensiveClone, betterCompact } from "../util/util";
import {
  Xyz,
  TaggedSequence,
  ScopeDeclarationBodyItem,
  ParameterDeclaration,
} from "farmbot";
import { overwrite } from "../api/crud";
import {
  determineLocation, determineDropdown, determineEditable
} from "../resources/sequence_meta";

interface AxisEditProps {
  axis: Xyz;
  onChange: (sd: ScopeDeclarationBodyItem) => void;
  declaration: ScopeDeclarationBodyItem;
}

/** Uses locals, declaration label, axis change to update locals. */
export const manuallyEditAxis = (props: AxisEditProps) =>
  (e: React.SyntheticEvent<HTMLInputElement>) => {
    const { axis, onChange, declaration } = props;
    const num = parseFloat(e.currentTarget.value);
    if (declaration &&
      declaration.kind === "variable_declaration" &&
      declaration.args.data_value.kind === "coordinate") {
      declaration.args.data_value.args[axis] = num;
      !isNaN(num) && onChange(declaration);
    }
  };

/** When sequence.args.locals actually has variables, render this form.
 * Allows the user to chose the value of the `parent` variable, etc. */
export const VariableForm =
  (props: VariableFormProps) => {
    const { sequence, resources, onChange } = props;
    let { location, editable, celeryNode, dropdown } = props.variable;
    if (props.declarations) {
      const executeStepData = props.declarations
        .filter(v => v.args.label === celeryNode.args.label)[0];
      if (executeStepData) {
        celeryNode = executeStepData;
        location = determineLocation(resources, executeStepData);
        editable = determineEditable(executeStepData);
        dropdown = determineDropdown(executeStepData, resources);
      }
    }
    const isDisabled = !editable;
    const list = generateList(resources, [PARENT]);
    const label = celeryNode.args.label;
    const declaration = defensiveClone(celeryNode);
    const axisPartialProps = { onChange, decLabel: label, declaration };
    return <div className="variable-form">
      <Row>
        <Col xs={12}>
          <h5>{t("Import Coordinates From")}</h5>
          <FBSelect
            key={JSON.stringify(sequence)}
            allowEmpty={true}
            list={list}
            selectedItem={dropdown}
            onChange={ddi =>
              onChange(convertDDItoScopeDeclr(label)(ddi))} />
        </Col>
      </Row>
      <Row>
        <Col xs={props.width || 4}>
          <InputBox
            onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "x" })}
            disabled={isDisabled}
            name="location-x-variabledeclr"
            value={"" + location.x}>
            {t("X (mm)")}
          </InputBox>
        </Col>
        <Col xs={props.width || 4}>
          <InputBox
            onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "y" })}
            disabled={isDisabled}
            name="location-y-variabledeclr"
            value={"" + location.y}>
            {t("Y (mm)")}
          </InputBox>
        </Col>
        <Col xs={props.width || 4}>
          <InputBox
            onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "z" })}
            name="location-z-variabledeclr"
            disabled={isDisabled}
            value={"" + location.z}>
            {t("Z (mm)")}
          </InputBox>
        </Col>
      </Row>
    </div>;
  };

interface LocalListCbProps {
  dispatch: Function;
  sequence: TaggedSequence;
}

/** Overwrite sequence locals (scope declaration). */
export const localListCallback =
  ({ dispatch, sequence }: LocalListCbProps) =>
    (declarations: ScopeDeclarationBodyItem[]) =>
      (SDBI: ScopeDeclarationBodyItem) => {
        const clone = defensiveClone(sequence.body); // unfortunate
        clone.args.locals = addOrEditDeclaration(declarations)(SDBI);
        dispatch(overwrite(sequence, clone));
      };

export const isParameterDeclaration =
  (x: ScopeDeclarationBodyItem): x is ParameterDeclaration =>
    x.kind === "parameter_declaration";

/** List of local variable/parameter declarations for a sequence. If none are
 * found, shows nothing. */
export const LocalsList = (props: LocalsListProps) => {
  return <div className="locals-list">
    {betterCompact(Object.values(props.variableData))
      .filter(v => props.hideDefined ? isParameterDeclaration(v.celeryNode) : v)
      .map(val =>
        <VariableForm
          key={val.celeryNode.args.label}
          declarations={props.declarations}
          variable={val}
          sequence={props.sequence}
          resources={props.resources}
          onChange={props.onChange} />)}
  </div>;
};
