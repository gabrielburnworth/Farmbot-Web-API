import * as React from "react";
import { mount, shallow } from "enzyme";
import { ValueSelection } from "../value_selection";
import { ValueSelectionProps } from "../interfaces";
import {
  buildResourceIndex,
} from "../../../../__test_support__/resource_index_builder";
import {
  PLANT_STAGE_LIST,
} from "../../../../farm_designer/plants/edit_plant_status";
import { fakeTool } from "../../../../__test_support__/fake_state/resources";
import { resource_type, Resource } from "farmbot";

describe("<ValueSelection />", () => {
  const fakeProps = (): ValueSelectionProps => ({
    resource: { kind: "nothing", args: {} },
    field: undefined,
    value: undefined,
    resources: buildResourceIndex().index,
    update: jest.fn(),
    commitSelection: jest.fn(),
  });

  it("renders none value", () => {
    const p = fakeProps();
    p.field = undefined;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Select one");
  });

  it("renders custom meta value", () => {
    const p = fakeProps();
    p.field = "custom_field";
    p.value = "custom_value";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(0);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.find("input").props().value).toEqual("custom_value");
  });

  it("renders missing custom meta value", () => {
    const p = fakeProps();
    p.field = "custom_field";
    p.value = undefined;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(0);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.find("input").props().value).toEqual("");
  });

  it("changes custom meta value", () => {
    const p = fakeProps();
    p.field = "custom_field";
    p.value = "custom_value";
    const wrapper = mount(<ValueSelection {...p} />);
    const input = shallow(wrapper.find("input").getElement());
    input.simulate("change", { currentTarget: { value: "1" } });
    input.simulate("blur", { currentTarget: { value: "1" } });
    expect(p.update).toHaveBeenCalledWith({ value: "1" },
      expect.any(Function));
  });

  it("renders known plant value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Plant", resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = "planted";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(PLANT_STAGE_LIST());
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Planted");
  });

  it("renders plant value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Plant", resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = "other";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(PLANT_STAGE_LIST());
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("other");
  });

  it("renders known weed value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Weed", resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = "removed";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Removed", value: "removed" },
    ]);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Removed");
  });

  it("changes known weed value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Weed", resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = undefined;
    const wrapper = mount(<ValueSelection {...p} />);
    const select = shallow(<div>{wrapper.find("FBSelect").getElement()}</div>);
    select.find("FBSelect").simulate("change", {
      label: "", value: "removed"
    });
    expect(p.update).toHaveBeenCalledWith({ value: "removed" },
      expect.any(Function));
  });

  it("renders known point value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "GenericPointer", resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = "removed";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "Removed", value: "removed" },
    ]);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Removed");
  });

  it("renders other value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "resource",
      args: { resource_type: "Other" as resource_type, resource_id: 1 }
    };
    p.field = "plant_stage";
    p.value = "removed";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(PLANT_STAGE_LIST());
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Removed");
  });

  const TOOL_OPTIONS = [
    { label: "None", value: 0 },
    { label: "Trench Digging Tool", value: 14 },
    { label: "Berry Picking Tool", value: 15 },
  ];

  const DeviceResource: Resource = {
    kind: "resource",
    args: { resource_type: "Device", resource_id: 1 }
  };

  it("renders known tool value: not mounted", () => {
    const p = fakeProps();
    p.resource = DeviceResource;
    p.field = "mounted_tool_id";
    p.value = 0;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(TOOL_OPTIONS);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("None");
  });

  it("renders known tool value: mounted", () => {
    const p = fakeProps();
    p.resource = DeviceResource;
    p.field = "mounted_tool_id";
    p.value = 14;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(TOOL_OPTIONS);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Trench Digging Tool");
  });

  it("renders known tool value: unknown tool", () => {
    const p = fakeProps();
    p.resource = DeviceResource;
    p.field = "mounted_tool_id";
    p.value = 123;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(TOOL_OPTIONS);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Unknown tool");
  });

  it("renders known tool value: untitled tool", () => {
    const p = fakeProps();
    p.resource = DeviceResource;
    p.field = "mounted_tool_id";
    p.value = 1;
    const tool = fakeTool();
    tool.body.id = 1;
    tool.body.name = undefined;
    p.resources = buildResourceIndex([tool]).index;
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual([
      { label: "None", value: 0 },
      { label: "Untitled tool", value: 1 },
    ]);
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Untitled tool");
  });

  it("renders known identifier value", () => {
    const p = fakeProps();
    p.resource = {
      kind: "identifier", args: { label: "var" }
    };
    p.field = "plant_stage";
    p.value = "planted";
    const wrapper = mount(<ValueSelection {...p} />);
    expect(wrapper.find("FBSelect").length).toEqual(1);
    expect(wrapper.find("FBSelect").props().list).toEqual(PLANT_STAGE_LIST());
    expect(wrapper.text()).toContain("as");
    expect(wrapper.text()).toContain("Planted");
  });
});
