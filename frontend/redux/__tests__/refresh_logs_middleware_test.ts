jest.mock("../refresh_logs", () => ({ throttledLogRefresh: jest.fn() }));
import { refilterLogsMiddleware } from "../refilter_logs_middleware";
import { throttledLogRefresh } from "../refresh_logs";
import { Actions } from "../../constants";

describe("refilterLogsMiddleware.fn()", () => {
  it("dispatches when required", () => {
    const dispatch = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = refilterLogsMiddleware.fn({} as any)(dispatch);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn({ type: "any", payload: {} } as any);
    expect(throttledLogRefresh).not.toHaveBeenCalled();
    fn({ type: Actions.SAVE_RESOURCE_OK, payload: { kind: "WebAppConfig" } });
    expect(throttledLogRefresh).toHaveBeenCalled();
  });
});
