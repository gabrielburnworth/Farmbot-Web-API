import * as React from "react";
import { t } from "i18next";
import { Link } from "react-router";
import { urlFriendly, betterCompact } from "../util";
import { Actions } from "../constants";
import { Farmwares } from "./interfaces";
import { getDevice } from "../device";
import { commandErr } from "../devices/actions";
import { FarmwareConfigMenu } from "./farmware_panel";
import { toggleWebAppBool } from "../config_storage/actions";
import { BooleanConfigKey } from "../config_storage/web_app_configs";
import { every } from "lodash";
import { Popover, Position } from "@blueprintjs/core";

/** Farmware list links: selected or unselected. */
const farmwareListItem = (dispatch: Function, current: string | undefined) =>
  (farmwareName: string) => {
    const click = () => dispatch({
      type: Actions.SELECT_FARMWARE,
      payload: farmwareName
    });
    const selected = (farmwareName == current)
      || (!current && farmwareName == "Photos")
      ? "selected" : "";
    return <Link
      to={`/app/farmware/${urlFriendly(farmwareName)}`}
      key={farmwareName}
      onClick={click}>
      <div className={`farmware-list-items ${selected}`} >
        <p>{farmwareName}</p>
      </div>
    </Link>;
  };

interface FarmwareListProps {
  current: string | undefined;
  dispatch: Function;
  farmwares: Farmwares;
  showFirstParty: boolean;
  firstPartyFarmwareNames: string[];
}

interface FarmwareListState {
  packageUrl: string;
}

export class FarmwareList
  extends React.Component<FarmwareListProps, FarmwareListState> {
  state: FarmwareListState = { packageUrl: "" };

  install = () => {
    if (this.state.packageUrl) {
      getDevice()
        .installFarmware(this.state.packageUrl)
        .then(() => this.setState({ packageUrl: "" }))
        .catch(commandErr("Farmware installation"));
    } else {
      alert(t("Enter a URL"));
    }
  }

  firstPartyFarmwaresPresent = (firstPartyList: string[] | undefined) => {
    const fws = this.props.farmwares;
    const farmwareList = betterCompact(Object.keys(fws)
      .map(x => fws[x]).map(x => x && x.name));
    const allPresent = every(
      firstPartyList, (value) => farmwareList.includes(value));
    return allPresent;
  }

  /** Toggle a boolean WebAppConfig. */
  doToggle = (key: BooleanConfigKey) =>
    this.props.dispatch(toggleWebAppBool(key));

  render() {
    const { current, dispatch, farmwares, showFirstParty, firstPartyFarmwareNames
    } = this.props;
    const listed1stPartyNames = firstPartyFarmwareNames
      .filter(x => ["take-photo", "camera-calibration", "plant-detection"]
        .includes(x));
    const farmwareNames = betterCompact(Object
      .keys(farmwares)
      .map(x => farmwares[x]))
      .filter(x => (firstPartyFarmwareNames && !showFirstParty)
        ? !firstPartyFarmwareNames.includes(x.name) : x)
      .map(fw => fw.name);

    return <div>
      <div className="farmware-settings-menu">
        <Popover position={Position.BOTTOM_RIGHT}>
          <i className="fa fa-gear" />
          <FarmwareConfigMenu
            show={this.props.showFirstParty}
            onToggle={() => this.doToggle("show_first_party_farmware")}
            firstPartyFwsInstalled={
              this.firstPartyFarmwaresPresent(
                this.props.firstPartyFarmwareNames)} />
        </Popover>
      </div>
      {[t("Photos"), t("Camera Calibration"), t("Weed Detector")]
        .map(farmwareListItem(dispatch, current))}
      <hr />
      <label>
        {t("My Farmware")}
      </label>
      {farmwareNames
        .filter(x => (firstPartyFarmwareNames && !showFirstParty)
          ? !firstPartyFarmwareNames.includes(x)
          : !listed1stPartyNames.includes(x))
        .map(farmwareListItem(dispatch, current))}
      <hr />
      <label>
        {t("Install new Farmware")}
      </label>
      <fieldset>
        <input type="url"
          placeholder={"https://...."}
          value={this.state.packageUrl || ""}
          onChange={e => this.setState({ packageUrl: e.currentTarget.value })} />
        <button
          className="fb-button green"
          onClick={this.install}>
          {t("Install")}
        </button>
      </fieldset>
    </div>;
  }
}
