/** Given a drop down item and a ResourceIndex,
 * figures out the corresponding Tool | Coordinate | Point */
import { DropDownItem } from "../../../ui/index";
import {
  ParameterDeclaration,
  Coordinate,
  ScopeDeclaration,
  ScopeDeclarationBodyItem,
  VariableDeclaration,
  Dictionary,
  Identifier,
  Point,
  Tool
} from "farmbot";

export const EMPTY_COORD: Coordinate =
  ({ kind: "coordinate", args: { x: 0, y: 0, z: 0 } });

type DataValue = Coordinate | Identifier | Point | Tool;
const createVariableDeclaration =
  (label: string, data_value: DataValue): VariableDeclaration =>
    ({
      kind: "variable_declaration",
      args: { label, data_value }
    });

const toolVar = (value: string | number) =>
  (label: string): VariableDeclaration =>
    createVariableDeclaration(label, {
      kind: "tool",
      args: { tool_id: parseInt("" + value) }
    });

const pointVar = (
  pointer_type: "Plant" | "GenericPointer",
  value: string | number
) => (label: string): VariableDeclaration =>
    createVariableDeclaration(label, {
      kind: "point",
      args: { pointer_type, pointer_id: parseInt("" + value) }
    });

const manualEntry = (label: string): VariableDeclaration =>
  createVariableDeclaration(label, {
    kind: "coordinate", args: { x: 0, y: 0, z: 0 }
  });

/** data type  */
export const newParameter =
  (label: string, data_type?: "point"): ParameterDeclaration => ({
    kind: "parameter_declaration",
    args: { label, data_type: data_type || "point" }
  });

const newDeclarationCreator = (input: DropDownItem):
  (label: string) => ScopeDeclarationBodyItem | undefined => {
  if (input.isNull) { return manualEntry; } // Caller decides X/Y/Z
  switch (input.headingId) {
    case "Plant":
    case "GenericPointer": return pointVar(input.headingId, input.value);
    case "Tool": return toolVar(input.value);
    case "parameter": return newParameter; // Caller decides X/Y/Z
    case "Other": return manualEntry;
  }
  return () => undefined;
};

const createNewDeclaration = (input: DropDownItem) => (label: string):
  ScopeDeclarationBodyItem | undefined =>
  newDeclarationCreator(input)(label);

/** Add or replace declaration based on dropdown selection. */
export const convertDDItoScopeDeclr = (label: string) =>
  (input: DropDownItem): ScopeDeclarationBodyItem | undefined => {
    return createNewDeclaration(input)(label);
  };

/** Add a new declaration or replace an existing one with the same label. */
export const addOrEditDeclaration = (declarations: ScopeDeclarationBodyItem[]) =>
  (updatedItem: ScopeDeclarationBodyItem | undefined): ScopeDeclaration => {
    const items = reduceScopeDeclaration(declarations);
    if (updatedItem) { items[updatedItem.args.label] = updatedItem; }
    const newLocals: ScopeDeclaration = {
      kind: "scope_declaration",
      args: {},
      body: Object.values(items)
    };
    return newLocals;
  };

const reduceScopeDeclaration = (declarations: ScopeDeclarationBodyItem[]):
  Dictionary<ScopeDeclarationBodyItem> => {
  const items: Dictionary<ScopeDeclarationBodyItem> = {};
  declarations.map(d => items[d.args.label] = d);
  return items;
};
