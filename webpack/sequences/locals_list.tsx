import * as React from "react";
import { Row, Col, FBSelect } from "../ui";
import { t } from "i18next";
import {
  generateList
} from "./step_tiles/tile_move_absolute/generate_list";
import { InputBox } from "./step_tiles/tile_move_absolute/input_box";
import {
  convertDDItoScopeDeclr, addOrEditDeclaration, EMPTY_COORD
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
  determineLocation, determineDropdown, determineEditable, SequenceMeta
} from "../resources/sequence_meta";
import { ResourceIndex } from "../resources/interfaces";

/** For VariableForm coordinate input boxes.  */
interface AxisEditProps {
  axis: Xyz;
  onChange: (sd: ScopeDeclarationBodyItem) => void;
  declaration: ScopeDeclarationBodyItem;
}

/** Update a VariableDeclaration coordinate. */
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

/** If a declaration with a matching label exists in local `declarations`
 * (step body, etc.), use it instead of the one in scope declarations.
 */
const maybeUseStepData = ({ resources, declarations, variable }: {
  resources: ResourceIndex,
  declarations: ScopeDeclarationBodyItem[] | undefined,
  variable: SequenceMeta
}): SequenceMeta => {
  if (declarations) {
    const executeStepData = declarations
      .filter(v => v.args.label === variable.celeryNode.args.label)[0];
    if (executeStepData) {
      return {
        celeryNode: executeStepData,
        location: determineLocation(resources, executeStepData),
        editable: determineEditable(executeStepData),
        dropdown: determineDropdown(executeStepData, resources),
        variableValue: variable.celeryNode.kind === "parameter_declaration"
          ? EMPTY_COORD : variable.celeryNode.args.data_value,
      };
    }
  }
  return variable;
};

/** Form with an "import from" dropdown and coordinate display/input boxes.
 *  Can be used to set a specific value, import a value, or declare a variable.
 */
export const VariableForm =
  (props: VariableFormProps) => {
    const { sequence, resources, onChange, declarations, variable } = props;
    const { celeryNode, editable, dropdown, location } =
      maybeUseStepData({ resources, declarations, variable });
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
      .map(variable =>
        <VariableForm
          key={variable.celeryNode.args.label}
          declarations={props.declarations}
          variable={variable}
          sequence={props.sequence}
          resources={props.resources}
          onChange={props.onChange} />)}
  </div>;
};
