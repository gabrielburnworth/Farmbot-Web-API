import { ResourceIndex } from "../../../resources/interfaces";
import {
  selectAllToolSlotPointers,
  selectAllActivePoints
} from "../../../resources/selectors";
import { betterCompact } from "../../../util";
import { PointerTypeName } from "../../../interfaces";
import { TaggedTool, TaggedPoint } from "farmbot";
import { DropDownItem } from "../../../ui/index";
import { Vector3 } from "farmbot/dist";
import { TOOL } from "./interfaces";
import * as _ from "lodash";
import { t } from "i18next";
import { capitalize } from "lodash";
import { joinKindAndId } from "../../../resources/reducer_support";

export function activeTools(resources: ResourceIndex) {
  const Tool: TaggedTool["kind"] = "Tool";
  const slots = selectAllToolSlotPointers(resources);

  const { byKindAndId, references } = resources;
  return betterCompact(slots
    .map(x => references[byKindAndId[joinKindAndId(Tool, x.body.tool_id)] || ""])
    .map(tool => (tool && tool.kind === "Tool") ? tool : undefined));
}

type DropdownHeadingId = PointerTypeName | typeof TOOL;

export const NAME_MAP: Record<DropdownHeadingId, string> = {
  "GenericPointer": "Map Points",
  "Plant": "Plants",
  "ToolSlot": "Tool Slots",
  "Tool": "Tools",
};

const HEADINGS: () => DropDownItem[] = () => [
  ...Object.keys(NAME_MAP)
    .filter(x => x !== "ToolSlot")
    .map((name: DropdownHeadingId) => {
      return ({
        label: t(NAME_MAP[name]),
        heading: true,
        value: 0,
        headingId: name
      });
    })
];

export function generateList(input: ResourceIndex,
  additionalItems: DropDownItem[]): DropDownItem[] {
  const SORT_KEY: keyof DropDownItem = "headingId";
  const points = selectAllActivePoints(input)
    .filter(x => (x.body.pointer_type !== "ToolSlot"));
  const toolDDI: DropDownItem[] =
    activeTools(input).map(tool => formatTools(tool));
  return _(points)
    .map(formatPoint)
    .concat(toolDDI)
    .filter(x => parseInt("" + x.value) > 0)
    .concat(HEADINGS())
    .sortBy(SORT_KEY)
    .reverse()
    .concat({ label: t("Other"), heading: true, value: 0, headingId: "Other" })
    .concat(additionalItems)
    .value();
}

export const formatPoint = (p: TaggedPoint): DropDownItem => {
  const { id, name, pointer_type, x, y, z } = p.body;
  return {
    label: dropDownName(name, { x, y, z }),
    value: "" + id,
    headingId: pointer_type
  };
};

const formatTools = (tool: TaggedTool): DropDownItem => {
  const { id, name } = tool.body;
  return {
    label: dropDownName((name || "untitled")),
    value: "" + id,
    headingId: TOOL
  };
};

/** Uniformly generate a label for things that have an X/Y/Z value. */
export function dropDownName(name: string, v?: Vector3) {
  let label = name || "untitled";
  if (v) { label += ` (${v.x}, ${v.y}, ${v.z})`; }
  return capitalize(label);
}
