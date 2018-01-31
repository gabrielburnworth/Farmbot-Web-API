const mockDevice = {
  updateConfig: jest.fn(() => { return Promise.resolve(); }),
};
jest.mock("../../../../device", () => ({
  getDevice: () => (mockDevice)
}));

import * as React from "react";
import { PowerAndReset } from "../power_and_reset";
import { mount } from "enzyme";
import { PowerAndResetProps } from "../interfaces";
import { bot } from "../../../../__test_support__/fake_state/bot";
import { panelState } from "../../../../__test_support__/control_panel_state";
import { fakeState } from "../../../../__test_support__/fake_state";

describe("<PowerAndReset/>", () => {
  beforeEach(function () {
    jest.clearAllMocks();
  });

  const fakeProps = (): PowerAndResetProps => {
    return {
      controlPanelState: panelState(),
      dispatch: jest.fn(x => x(jest.fn(), fakeState)),
      sourceFbosConfig: (x) => {
        return { value: bot.hardware.configuration[x], consistent: true };
      }
    };
  };

  it("open", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    ["Power and Reset", "Restart", "Shutdown", "Factory Reset",
      "Automatic Factory Reset", "Connection Attempt Period"]
      .map(string => expect(wrapper.text().toLowerCase())
        .toContain(string.toLowerCase()));
  });

  it("closed", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = false;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.text().toLowerCase())
      .toContain("Power and Reset".toLowerCase());
    expect(wrapper.text().toLowerCase())
      .not.toContain("Factory Reset".toLowerCase());
  });

  it("timer input disabled", () => {
    bot.hardware.configuration.disable_factory_reset = true;
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.find("input").last().props().disabled).toBeTruthy();
    const label = wrapper.find("label").at(4);
    expect(label.text()).toEqual("Connection Attempt Period");
    expect(label.props().style).toEqual({ color: "grey" });
  });

  it("toggles auto reset", () => {
    bot.hardware.configuration.disable_factory_reset = false;
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    wrapper.find("button").at(3).simulate("click");
    expect(mockDevice.updateConfig)
      .toHaveBeenCalledWith({ disable_factory_reset: true });
  });

  it("resets FbosConfig", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    const button = wrapper.find("button").at(4);
    expect(button.text()).toEqual("RESET SETTINGS");
    button.simulate("click");
    expect(mockDevice.updateConfig).not.toHaveBeenCalled();
    window.confirm = () => true;
    button.simulate("click");
    expect(mockDevice.updateConfig).toHaveBeenCalled();
  });
});
