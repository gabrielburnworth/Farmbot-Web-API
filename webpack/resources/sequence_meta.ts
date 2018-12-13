import { VariableNameSet, ResourceIndex } from "./interfaces";
import {
  ScopeDeclarationBodyItem,
  TaggedSequence,
  Vector3,
} from "farmbot";
import { DropDownItem } from "../ui";
import { findPointerByTypeAndId } from "./selectors";
import { findSlotByToolId, findToolById } from "./selectors_by_id";
import { capitalize } from "lodash";
import {
  formatPoint
} from "../sequences/step_tiles/tile_move_absolute/generate_list";
import {
  LocationData
} from "../sequences/step_tiles/tile_move_absolute/interfaces";
import {
  EMPTY_COORD
} from "../sequences/step_tiles/tile_move_absolute/handle_select";

export interface SequenceMeta {
  celeryNode: ScopeDeclarationBodyItem;
  dropdown: DropDownItem;
  location: Vector3;
  editable: boolean;
  variableValue: LocationData;
}

type R =
  (acc: VariableNameSet, item: ScopeDeclarationBodyItem) => VariableNameSet;
type VLT =
  (_ri: ResourceIndex, tr: TaggedSequence) => VariableNameSet;
const vec = (x: number, y: number, z: number): Vector3 => ({ x, y, z });
const vec000: Vector3 = vec(0, 0, 0);

/** Converts a "scope declaration body item" (AKA a CeleryScript variable) into
 * a 3 dimensional location vector. If unable a vector cannot be determined,
 * (0, 0, 0) is returned. */
export const determineLocation =
  (index: ResourceIndex, node: ScopeDeclarationBodyItem): Vector3 => {
    if (node.kind == "parameter_declaration") {
      // The location of parameter_declarations can't be known until runtime
      return vec000;
    }

    const variableContents = node.args.data_value;
    switch (variableContents.kind) {
      case "coordinate": return variableContents.args;
      case "point":
        const { pointer_type, pointer_id } = variableContents.args;
        return findPointerByTypeAndId(index, pointer_type, pointer_id).body;
      case "tool":
        const ts = findSlotByToolId(index, variableContents.args.tool_id);
        return ts ? ts.body : vec000;
    }
    return vec000;
  };

/** Given a CeleryScript variable declaration and a resource index
 * Returns a DropDownItem representation of said variable. */
export const determineDropdown =
  (n: ScopeDeclarationBodyItem, i: ResourceIndex): DropDownItem => {
    if (n.kind === "parameter_declaration") {
      return { label: capitalize(n.args.label), value: "?" };
    }

    const { data_value } = n.args;
    switch (data_value.kind) {
      case "coordinate":
        const { x, y, z } = data_value.args;
        return { label: `Coordinate (${x}, ${y}, ${z})`, value: "?" };
      case "identifier":
        return { label: capitalize(data_value.args.label), value: "?" };
      case "point":
        const { pointer_id, pointer_type } = data_value.args;
        const pointer =
          findPointerByTypeAndId(i, pointer_type, pointer_id);
        return formatPoint(pointer);
      case "tool":
        const toolName =
          findToolById(i, data_value.args.tool_id).body.name || "Untitled tool";
        return { label: toolName, value: "X" };
    }
    throw new Error("WARNING: Unknown, possibly new data_value.kind?");
  };

/** Can this CeleryScript variable be edited? Should we gray out the form? */
export const determineEditable = (node: ScopeDeclarationBodyItem): boolean => {
  return node.kind == "variable_declaration" &&
    node.args.data_value.kind == "coordinate";
};

/** Resolve the value of a variable. If not possible, return empty coord. */
const determineVariableValue =
  (_node: ScopeDeclarationBodyItem, _i: ResourceIndex): LocationData => {
    return _node.kind === "parameter_declaration" ?
      EMPTY_COORD : _node.args.data_value;
  };

/** Creates the sequence meta data lookup table for an entire ResourceIndex.
 * Used to overwrite the entire index on any data change. */
export const createSequenceMeta: VLT = (index, resource) => {
  const collection = resource.body.args.locals.body || [];
  const reducer: R = (acc, celeryNode) => {
    const location = determineLocation(index, celeryNode);
    return ({
      ...acc,
      [celeryNode.args.label]: {
        celeryNode, location,
        editable: determineEditable(celeryNode),
        dropdown: determineDropdown(celeryNode, index),
        variableValue: determineVariableValue(celeryNode, index),
      }
    });
  };
  return collection.reduce(reducer, {});
};

/** Search a sequence's scope declaration for a particular variable by name. */
export const findVariableByName =
  (i: ResourceIndex, uuid: string, label: string): SequenceMeta | undefined => {
    return (i.sequenceMetas[uuid] || {})[label];
  };
