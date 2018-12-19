import * as React from "react";
import { Row, Col, FBSelect } from "../ui";
import { t } from "i18next";
import {
  generateList
} from "./step_tiles/tile_move_absolute/generate_list";
import { InputBox } from "./step_tiles/tile_move_absolute/input_box";
import {
  convertDDItoDeclaration, addOrEditDeclaration
} from "./step_tiles/tile_move_absolute/handle_select";
import {
  LocationFormProps, LocalsListProps, PARENT
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
  determineVector, determineDropdown, determineEditable, SequenceMeta
} from "../resources/sequence_meta";
import { ResourceIndex, UUID } from "../resources/interfaces";
import { Feature } from "../devices/interfaces";

/** For LocationForm coordinate input boxes.  */
export interface AxisEditProps {
  axis: Xyz;
  onChange: (sd: ScopeDeclarationBodyItem) => void;
  declaration: ScopeDeclarationBodyItem;
}

/** Update a VariableDeclaration coordinate. */
export const manuallyEditAxis = (props: AxisEditProps) =>
  (e: React.SyntheticEvent<HTMLInputElement>) => {
    const { axis, onChange, declaration } = props;
    const num = parseFloat(e.currentTarget.value);
    if (declaration.kind === "variable_declaration" &&
      declaration.args.data_value.kind === "coordinate") {
      declaration.args.data_value.args[axis] = num;
      !isNaN(num) && onChange(declaration);
    }
  };

/**
 * If a declaration with a matching label exists in local `declarations`
 * (step body, etc.), use it instead of the one in scope declarations.
 */
const maybeUseStepData = ({ resources, declarations, variable, uuid }: {
  resources: ResourceIndex,
  declarations: ScopeDeclarationBodyItem[] | undefined,
  variable: SequenceMeta,
  uuid: UUID,
}): SequenceMeta => {
  if (declarations) {
    const executeStepData = declarations
      .filter(v => v.args.label === variable.celeryNode.args.label)[0];
    if (executeStepData) {
      return {
        celeryNode: executeStepData,
        vector: determineVector(executeStepData, resources, uuid),
        dropdown: determineDropdown(executeStepData, resources),
      };
    }
  }
  return variable;
};

/**
 * Form with an "import from" dropdown and coordinate display/input boxes.
 * Can be used to set a specific value, import a value, or declare a variable.
 */
export const LocationForm =
  (props: LocationFormProps) => {
    const {
      sequence, resources, onChange, declarations, variable,
      hideVariableLabel, useIdentifier
    } = props;
    const { uuid } = props.sequence;
    const { celeryNode, dropdown, vector } =
      maybeUseStepData({ resources, declarations, variable, uuid });
    /** For disabling coordinate input boxes when using external data. */
    const isDisabled = !determineEditable(celeryNode);
    const variableListItems =
      props.shouldDisplay(Feature.variables) ? [PARENT] : [];
    const list = generateList(resources, variableListItems);
    /** Variable name. */
    const { label } = celeryNode.args;
    const declaration = defensiveClone(celeryNode);
    const axisPartialProps = { onChange, declaration };
    const formTitle = hideVariableLabel
      ? t("Location")
      : `${label} (${t("Location")})`;
    return <div className="location-form">
      <Row>
        <Col xs={12}>
          <label>{formTitle}</label>
          <FBSelect
            key={JSON.stringify(sequence)}
            allowEmpty={true}
            list={list}
            selectedItem={dropdown}
            customNullLabel={t("Coordinate")}
            onChange={ddi =>
              onChange(convertDDItoDeclaration({ label, useIdentifier })(ddi))} />
        </Col>
      </Row>
      {vector &&
        <Row>
          <Col xs={props.width || 4}>
            <InputBox
              onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "x" })}
              disabled={isDisabled}
              name="location-x"
              value={"" + vector.x}>
              {t("X (mm)")}
            </InputBox>
          </Col>
          <Col xs={props.width || 4}>
            <InputBox
              onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "y" })}
              disabled={isDisabled}
              name="location-y"
              value={"" + vector.y}>
              {t("Y (mm)")}
            </InputBox>
          </Col>
          <Col xs={props.width || 4}>
            <InputBox
              onCommit={manuallyEditAxis({ ...axisPartialProps, axis: "z" })}
              name="location-z"
              disabled={isDisabled}
              value={"" + vector.z}>
              {t("Z (mm)")}
            </InputBox>
          </Col>
        </Row>}
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
      (declaration: ScopeDeclarationBodyItem) => {
        const clone = defensiveClone(sequence.body); // unfortunate
        clone.args.locals = addOrEditDeclaration(declarations)(declaration);
        dispatch(overwrite(sequence, clone));
      };

export const isParameterDeclaration =
  (x: ScopeDeclarationBodyItem): x is ParameterDeclaration =>
    x.kind === "parameter_declaration";

/**
 * List of local variable/parameter declarations for a sequence.
 * If none are found, shows nothing.
 */
export const LocalsList = (props: LocalsListProps) => {
  return <div className="locals-list">
    {betterCompact(Object.values(props.variableData))
      .filter(v => props.hideDefined ? isParameterDeclaration(v.celeryNode) : v)
      .map(variable =>
        <LocationForm
          key={variable.celeryNode.args.label}
          declarations={props.declarations}
          variable={variable}
          sequence={props.sequence}
          resources={props.resources}
          shouldDisplay={props.shouldDisplay}
          hideVariableLabel={Object.values(props.variableData).length < 2}
          useIdentifier={props.useIdentifier}
          onChange={props.onChange} />)}
  </div>;
};
