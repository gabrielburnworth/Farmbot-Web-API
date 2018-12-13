import { localListCallback, manuallyEditAxis } from "../locals_list";
import { fakeSequence } from "../../__test_support__/fake_state/resources";
import { DeepPartial } from "redux";

describe("localListCallback", () => {
  it("handles a new local declaration", () => {
    const sequence = fakeSequence();
    const dispatch = jest.fn();
    const cb = localListCallback({ sequence, dispatch });
    cb([
      {
        kind: "parameter_declaration",
        args: { label: "parent", data_type: "coordinate" }
      },
      {
        kind: "variable_declaration",
        args: {
          label: "foo",
          data_value: { kind: "coordinate", args: { x: 0, y: 0, z: 0 } }
        }
      }
    ])({
      kind: "variable_declaration",
      args: {
        label: "foo",
        data_value: { kind: "coordinate", args: { x: 1, y: 2, z: 3 } }
      }
    });
    const action = expect.objectContaining({ type: "OVERWRITE_RESOURCE" });
    expect(dispatch)
      .toHaveBeenCalledWith(action);
    expect(dispatch)
      .toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({ uuid: sequence.uuid })
      }));
  });
});

describe("manuallyEditAxis", () => {
  it("triggers a callback that edits an axis", () => {
    const sequence = fakeSequence();
    sequence.body.args.locals = {
      kind: "scope_declaration",
      args: {},
      body: [
        {
          kind: "variable_declaration",
          args: {
            label: "parent",
            data_value: { kind: "coordinate", args: { x: 10, y: 20, z: 30 } }
          }
        }
      ]
    };
    const axis = "x";
    const onChange = jest.fn();
    const cb = manuallyEditAxis({
      axis, onChange, declaration: (sequence.body.args.locals.body || [])[0]
    });
    type DomEvent = React.SyntheticEvent<HTMLInputElement>;
    const e: DeepPartial<DomEvent> = { currentTarget: { value: "1.23" } };
    cb(e as DomEvent);
    const expected = {
      kind: "variable_declaration",
      args: {
        label: "parent",
        data_value: {
          kind: "coordinate",
          args: {
            x: 1.23,
            y: 20,
            z: 30
          }
        }
      }
    };
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
