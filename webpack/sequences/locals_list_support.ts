import { TaggedSequence, ScopeDeclarationBodyItem } from "farmbot";
import { ResourceIndex, VariableNameSet } from "../resources/interfaces";
import { SequenceMeta } from "../resources/sequence_meta";

type OnChange = (sd: ScopeDeclarationBodyItem | undefined) => void;

export interface LocalsListProps {
  variableData: VariableNameSet;
  sequence: TaggedSequence;
  resources: ResourceIndex;
  dispatch: Function;
  onChange: OnChange;
  hideDefined?: boolean;
  declarations?: ScopeDeclarationBodyItem[];
}

export interface VariableFormProps {
  declarations?: ScopeDeclarationBodyItem[];
  variable: SequenceMeta;
  sequence: TaggedSequence;
  resources: ResourceIndex;
  onChange: OnChange;
  width?: number;
}

export const PARENT =
  ({ value: "parent", label: "Parent", headingId: "parameter" });
