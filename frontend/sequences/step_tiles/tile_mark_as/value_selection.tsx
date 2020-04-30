import * as React from "react";
import { t } from "../../../i18next_wrapper";
import { FBSelect, BlurableInput } from "../../../ui";
import { isUndefined } from "lodash";
import { ValueSelectionProps, GetSelectedValueProps } from "./interfaces";
import { Identifier, Resource } from "farmbot";
import { DropDownItem } from "../../../ui";
import { ResourceIndex } from "../../../resources/interfaces";
import { selectAllTools, maybeFindToolById } from "../../../resources/selectors";
import {
  PLANT_STAGE_LIST, PLANT_STAGE_DDI_LOOKUP,
} from "../../../farm_designer/plants/edit_plant_status";
import { isCustomMetaField, KnownField, knownField } from "./field_selection";

export const ValueSelection = (props: ValueSelectionProps) =>
  <div className={"update-resource-step-value"}>
    <label>{t("as")}</label>
    {isCustomMetaField(props.field)
      ? <CustomMetaValue {...props} />
      : <KnownValue {...props} />}
  </div>;

const KnownValue = (props: ValueSelectionProps) =>
  <FBSelect
    extraClass={isUndefined(props.field) ? "disabled" : ""}
    list={props.resource.kind == "nothing"
      ? []
      : valuesList(props.resource, props.resources)}
    onChange={ddi => {
      props.update({ value: ddi.value },
        props.commitSelection);
    }}
    selectedItem={getSelectedValue({
      resourceIndex: props.resources,
      resource: props.resource,
      field: knownField(props.field),
      value: props.value,
    })} />;

const CustomMetaValue = (props: ValueSelectionProps) =>
  <div className="custom-meta-field">
    <BlurableInput type="text" name="value"
      value={isUndefined(props.value) ? "" : "" + props.value}
      onCommit={e => {
        props.update({ value: e.currentTarget.value },
          props.commitSelection);
      }} />
  </div>;

const valuesList = (
  resource: Resource | Identifier,
  resources: ResourceIndex): DropDownItem[] => {
  const stepResourceType =
    resource.kind == "identifier" ? undefined : resource.args.resource_type;
  switch (stepResourceType) {
    case "Device": return [
      { label: t("None"), value: 0 },
      ...selectAllTools(resources).filter(x => !!x.body.id)
        .map(x => ({ toolName: x.body.name, toolId: x.body.id }))
        .map(({ toolName, toolId }:
          { toolName: string | undefined, toolId: number }) =>
          ({ label: toolName || t("Untitled tool"), value: toolId })),
    ];
    case "GenericPointer": return [{ label: t("Removed"), value: "removed" }];
    case "Weed": return [{ label: t("Removed"), value: "removed" }];
    case "Plant":
    default: return PLANT_STAGE_LIST();
  }
};

const getSelectedValue = (props: GetSelectedValueProps): DropDownItem => {
  if (isUndefined(props.field) || isUndefined(props.value)
    || props.resource.kind == "nothing") {
    return { label: t("Select one"), value: "" };
  }
  switch (props.field) {
    case KnownField.mounted_tool_id:
      const toolId = parseInt("" + props.value);
      if (toolId == 0) { return { label: t("None"), value: 0 }; }
      const tool = maybeFindToolById(props.resourceIndex, toolId);
      if (!tool) { return { label: t("Unknown tool"), value: toolId }; }
      return {
        label: tool.body.name || t("Untitled tool"),
        value: toolId
      };
    case KnownField.plant_stage:
      return PLANT_STAGE_DDI_LOOKUP()["" + props.value]
        || { label: "" + props.value, value: "" + props.value };
  }
};
