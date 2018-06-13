import * as React from "react";
import { Col, BlurableInput } from "../ui/index";
import { t } from "i18next";
import { FarmwareManifest, Pair, FarmwareConfig } from "farmbot";
import { betterCompact } from "../util";
import { getDevice } from "../device";
import * as _ from "lodash";
import { Farmwares } from "./interfaces";

interface FarmwareFormsProps {
  farmwares: Farmwares;
  user_env: Record<string, string | undefined>;
}

interface FarmwareFormProps {
  farmware: FarmwareManifest;
  user_env: Record<string, string | undefined>;
}

/** Namespace a Farmware config with the Farmware name. */
export function getConfigEnvName(farmwareName: string, configName: string) {
  return `${_.snakeCase(farmwareName)}_${configName}`;
}

/** Farmware description and version info for help text contents. */
export function farmwareHelpText(farmware: FarmwareManifest | undefined): string {
  if (farmware) {
    const description = farmware.meta.description;
    const versionString = " (version: " + farmware.meta.version + ")";
    return description + versionString;
  }
  return "";
}

/** Return a div that includes all Farmware input fields. */
function ConfigFields(props: {
  farmware: FarmwareManifest,
  commit: (key: string) => (e: React.SyntheticEvent<HTMLInputElement>) => void,
  getValue: (farmwareName: string, currentConfig: FarmwareConfig) => string
}): JSX.Element {
  const { farmware, commit, getValue } = props;
  return <div>
    {farmware.config.map(config => {
      const configEnvName =
        getConfigEnvName(farmware.name, config.name);
      return <div key={config.name} id={config.name}>
        <label>{config.label}</label>
        <BlurableInput type="text"
          onCommit={commit(configEnvName)}
          value={getValue(farmware.name, config)} />
      </div>;
    })}
  </div>;
}

/** Render a form with Farmware input fields. */
export function FarmwareForm(props: FarmwareFormProps): JSX.Element {

  /** Set a Farmware input value on FBOS. */
  function inputChange(key: string) {
    return (e: React.SyntheticEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      getDevice().setUserEnv({ [key]: value }).catch(() => { });
    };
  }

  /** Get a Farmware input value from FBOS. */
  function getValue(farmwareName: string, currentConfig: FarmwareConfig) {
    return (user_env[getConfigEnvName(farmwareName, currentConfig.name)]
      || _.toString(currentConfig.value));
  }

  /** Execute a Farmware using the provided inputs. */
  function run(farmwareName: string, config: FarmwareConfig[]) {
    const pairs = config.map<Pair>((x) => {
      const label = getConfigEnvName(farmwareName, x.name);
      const value = getValue(farmwareName, x);
      return { kind: "pair", args: { value, label } };
    });
    getDevice().execScript(farmwareName, pairs).catch(() => { });
  }

  const { farmware, user_env } = props;
  return <Col key={farmware.name}>
    <div className={_.kebabCase(farmware.name)}>
      <button
        className="fb-button green farmware-button"
        onClick={() => run(farmware.name, farmware.config)}>
        {t("Run")}
      </button>
      <ConfigFields
        farmware={farmware}
        commit={inputChange}
        getValue={getValue} />
    </div>
  </Col>;
}

/** Determine if a Farmware has requested inputs. */
export function needsFarmwareForm(farmware: FarmwareManifest): Boolean {
  const needsWidget = farmware.config && farmware.config.length > 0;
  return needsWidget;
}

/** Display all Farmware Forms. */
export function FarmwareForms(props: FarmwareFormsProps): JSX.Element {
  const { farmwares, user_env } = props;
  const farmwareData = betterCompact(Object
    .keys(farmwares)
    .map(x => farmwares[x]))
    .map(x => { if (needsFarmwareForm(x)) { return x; } });
  return <div id="farmware-forms">
    {farmwareData.map((farmware, i) => {
      return farmware
        ? <FarmwareForm
          farmware={farmware}
          user_env={user_env} />
        : <div key={i} />;
    })}
  </div>;
}
