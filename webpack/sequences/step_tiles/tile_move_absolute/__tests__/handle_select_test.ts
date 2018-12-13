import { convertDDItoScopeDeclr } from "../handle_select";
import { ScopeDeclarationBodyItem } from "farmbot";

describe("convertDDItoScopeDeclr()", () => {
  it("returns location data: point", () => {
    const ddi =
      ({ headingId: "GenericPointer", label: "Point 1 (10, 20, 30)", value: 2 });
    const variable = convertDDItoScopeDeclr("parent")(ddi);
    if (variable && variable.kind === "variable_declaration") {
      expect(variable.args.data_value).toEqual({
        kind: "point",
        args: {
          pointer_id: 2,
          pointer_type: "GenericPointer"
        }
      });
    } else {
      fail("No");
    }
  });

  it("returns location data: tool", () => {
    const ddi = { headingId: "Tool", label: "Generic Tool", value: 1 };
    const variable = convertDDItoScopeDeclr("parent")(ddi);
    if (variable && variable.kind === "variable_declaration") {
      expect(variable.args.data_value)
        .toEqual({ kind: "tool", args: { tool_id: 1 } });
    } else {
      fail("Nope");
    }
  });

  it("returns location data: default", () => {
    const variable = convertDDItoScopeDeclr("parent")({
      label: "None",
      value: "",
      isNull: true
    });
    if (variable && variable.kind == "variable_declaration") {
      expect(variable.args.data_value)
        .toEqual({ kind: "coordinate", args: { x: 0, y: 0, z: 0 } });
      return;
    }
    fail("No");
  });

  it("returns location data: parameter_declaration", () => {
    const ddi = ({ headingId: "parameter", label: "Parent", value: "parent" });
    const variable = convertDDItoScopeDeclr("parent")(ddi);
    const expected: ScopeDeclarationBodyItem = {
      "kind": "parameter_declaration",
      "args": { "data_type": "point", "label": "parent" }
    };
    expect(variable).toEqual(expected);
  });
});
