import * as React from "react";
import { Row, Col } from "../../../ui/index";
import { t } from "i18next";
import { Content } from "../../../constants";
import { factoryReset, updateConfig } from "../../actions";
import { ToggleButton } from "../../../controls/toggle_button";
import { BotConfigInputBox } from "../bot_config_input_box";
import { FactoryResetRowProps } from "./interfaces";
import { ColWidth } from "../farmbot_os_settings";
import { info } from "farmbot-toastr";

export function FactoryResetRow(props: FactoryResetRowProps) {
  const { dispatch, sourceFbosConfig } = props;
  const disableFactoryReset = sourceFbosConfig("disable_factory_reset");
  const maybeDisableTimer = disableFactoryReset.value ? { color: "grey" } : {};

  const resetFbosConfigs = () => {
    if (confirm(`Are you sure you want to reset all FarmBot OS settings?`)) {
      info("", "Resetting Settings", "blue");
      dispatch(updateConfig({
        auto_sync: false,
        beta_opt_in: false,
        disable_factory_reset: false,
        firmware_input_log: false,
        firmware_output_log: false,
        sequence_body_log: true,
        sequence_complete_log: true,
        sequence_init_log: true,
        network_not_found_timer: 1,
        // tslint:disable-next-line:no-any
        os_auto_update: false as any,
        // tslint:disable-next-line:no-any
        arduino_debug_messages: false as any
      }));
    }
  };

  return <div>
    <Row>
      <Col xs={ColWidth.label}>
        <label>
          {t("Factory Reset")}
        </label>
      </Col>
      <Col xs={ColWidth.description}>
        <p>
          {t(Content.FACTORY_RESET_WARNING)}
        </p>
      </Col>
      <Col xs={ColWidth.button}>
        <button
          className="fb-button red"
          type="button"
          onClick={factoryReset}>
          {t("FACTORY RESET")}
        </button>
      </Col>
    </Row>
    <Row>
      <Col xs={ColWidth.label}>
        <label>
          {t("Automatic Factory Reset")}
        </label>
      </Col>
      <Col xs={ColWidth.description}>
        <p>
          {t(Content.AUTO_FACTORY_RESET)}
        </p>
      </Col>
      <Col xs={ColWidth.button}>
        <ToggleButton
          toggleValue={!disableFactoryReset.value}
          dim={!disableFactoryReset.consistent}
          toggleAction={() => {
            dispatch(updateConfig({
              disable_factory_reset: !disableFactoryReset.value
            }));
          }} />
      </Col>
    </Row>
    <Row>
      <Col xs={ColWidth.label}>
        <label style={maybeDisableTimer}>
          {t("Connection Attempt Period")}
        </label>
      </Col>
      <Col xs={ColWidth.description}>
        <p style={maybeDisableTimer}>
          {t(Content.AUTO_FACTORY_RESET_PERIOD)}
        </p>
      </Col>
      <Col xs={ColWidth.button}>
        <BotConfigInputBox
          setting="network_not_found_timer"
          dispatch={dispatch}
          disabled={!!disableFactoryReset.value}
          sourceFbosConfig={sourceFbosConfig} />
      </Col>
    </Row>
    <Row>
      <Col xs={ColWidth.label}>
        <label>
          {t("Reset FarmBot OS settings")}
        </label>
      </Col>
      <Col xs={ColWidth.description}>
        <p>
          {t(Content.RESET_FBOS_CONFIG)}
        </p>
      </Col>
      <Col xs={ColWidth.button}>
        <button
          className="fb-button red"
          type="button"
          onClick={resetFbosConfigs}>
          {t("RESET SETTINGS")}
        </button>
      </Col>
    </Row>
  </div >;
}
