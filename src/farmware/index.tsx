import * as React from "react";
import { connect } from "react-redux";
import { Page, Col, Row } from "../ui/index";
import { FarmwarePanel } from "./farmware_panel";
import { mapStateToProps } from "./state_to_props";
import { Photos } from "./images/photos";
import { CameraCalibration } from "./camera_calibration/camera_calibration";
import { FarmwareProps } from "../devices/interfaces";
import { WeedDetector } from "./weed_detector/index";
import { envGet } from "./weed_detector/remote_env/selectors";

@connect(mapStateToProps)
export class FarmwarePage extends React.Component<FarmwareProps, {}> {
  render() {
    return <Page className="farmware">
      <Row>
        <Col xs={12} sm={7}>
          <Photos
            dispatch={this.props.dispatch}
            images={this.props.images}
            currentImage={this.props.currentImage}
          />
        </Col>
        <Col xs={12} sm={5}>
          <FarmwarePanel
            syncStatus={this.props.syncStatus}
            farmwares={this.props.farmwares}
            jobs={this.props.jobs}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={5}>
          <CameraCalibration
            dispatch={this.props.dispatch}
            onProcessPhoto={() => { }}
            currentImage={this.props.currentImage}
            images={this.props.images}
            env={this.props.env}
            iteration={envGet("CAMERA_CALIBRATION_iteration", this.props.env)}
            morph={envGet("CAMERA_CALIBRATION_morph", this.props.env)}
            blur={envGet("CAMERA_CALIBRATION_blur", this.props.env)}
            H_LO={envGet("CAMERA_CALIBRATION_H_LO", this.props.env)}
            S_LO={envGet("CAMERA_CALIBRATION_S_LO", this.props.env)}
            V_LO={envGet("CAMERA_CALIBRATION_V_LO", this.props.env)}
            H_HI={envGet("CAMERA_CALIBRATION_H_HI", this.props.env)}
            S_HI={envGet("CAMERA_CALIBRATION_S_HI", this.props.env)}
            V_HI={envGet("CAMERA_CALIBRATION_V_HI", this.props.env)}
          />
        </Col>
        <Col xs={12} sm={5} smOffset={1}>
          <WeedDetector {...this.props} />
        </Col>
      </Row>
    </Page>;
  }
}
