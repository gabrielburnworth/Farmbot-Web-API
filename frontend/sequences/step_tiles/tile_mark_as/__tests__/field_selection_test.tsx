import * as React from "react";
import { mount, shallow } from "enzyme";
import { FieldSelection, isCustomMetaField } from "../field_selection";
import { FieldSelectionProps } from "../interfaces";
import {
  buildResourceIndex,
} from "../../../../__test_support__/resource_index_builder";

describe("<FieldSelection />", () => {
  const fakeProps = (): FieldSelectionProps => ({
    resource: { kind: "nothing", args: {} },
    field: undefined,
    resources: buildResourceIndex().index,
    update: jest.fn(),
  });

  it("renders disabled none field", () => {
    const p = fakeProps();
    p.field = undefined;
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Select one");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });

  it("renders none field", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Plant", resource_id: 1 }
    };
    p.field = undefined;
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Plant stage", value: "plant_stage" },
      { label: "Custom Meta Field", value: "" },
    ]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Select one");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });

  it("renders custom meta field", () => {
    const p = fakeProps();
    p.field = "custom";
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(0);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.find("input").props().value).toEqual("custom");
    expect(wrapper.find(".fa-times").length).toEqual(1);
  });

  it("changes custom meta field", () => {
    const p = fakeProps();
    p.field = "custom_field";
    const wrapper = mount(<FieldSelection {...p} />);
    const input = shallow(wrapper.find("input").getElement());
    input.simulate("change", { currentTarget: { value: "1" } });
    input.simulate("blur", { currentTarget: { value: "1" } });
    expect(p.update).toHaveBeenCalledWith({ field: "1" });
  });

  it("clears custom meta field", () => {
    const p = fakeProps();
    p.field = "custom_field";
    const wrapper = mount(<FieldSelection {...p} />);
    wrapper.find(".fa-times").simulate("click");
    expect(p.update).toHaveBeenCalledWith({
      field: undefined, value: undefined
    });
  });

  it("renders field list for identifier", () => {
    const p = fakeProps();
    p.resource = { kind: "identifier", args: { label: "var" } };
    p.field = "plant_stage";
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Status", value: "plant_stage" },
      { label: "Custom Meta Field", value: "" },
    ]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Status");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });

  it("renders known weed field", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Weed", resource_id: 1 }
    };
    p.field = "plant_stage";
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Weed status", value: "plant_stage" },
      { label: "Custom Meta Field", value: "" },
    ]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Weed status");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });

  it("renders known point field", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "GenericPointer", resource_id: 3 }
    };
    p.field = "plant_stage";
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Status", value: "plant_stage" },
      { label: "Custom Meta Field", value: "" },
    ]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Status");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });

  it("changes known weed field", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Weed", resource_id: 1 }
    };
    p.field = undefined;
    const wrapper = mount(<FieldSelection {...p} />);
    const select = shallow(<div>{wrapper.find("FBSelect").getElement()}</div>);
    select.find("FBSelect").simulate("change", {
      label: "", value: "plant_stage"
    });
    expect(p.update).toHaveBeenCalledWith({ field: "plant_stage" });
  });

  it("renders known device field", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Device", resource_id: 1 }
    };
    p.field = "mounted_tool_id";
    const wrapper = mount(<FieldSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Mounted Tool", value: "mounted_tool_id" },
      { label: "Custom Meta Field", value: "" },
    ]);
    expect(wrapper.text()).toContain("field");
    expect(wrapper.text()).toContain("Mounted Tool");
    expect(wrapper.find(".fa-times").length).toEqual(0);
  });
});

describe("isCustomMetaField()", () => {
  it("is custom meta field", () => {
    expect(isCustomMetaField("")).toBeTruthy();
    expect(isCustomMetaField("custom")).toBeTruthy();
  });

  it("is not custom meta field", () => {
    expect(isCustomMetaField(undefined)).toBeFalsy();
    expect(isCustomMetaField("plant_stage")).toBeFalsy();
    expect(isCustomMetaField("mounted_tool_id")).toBeFalsy();
  });
});
