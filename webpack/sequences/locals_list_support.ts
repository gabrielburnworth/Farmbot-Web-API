import { TaggedSequence, ScopeDeclarationBodyItem } from "farmbot";
import { ResourceIndex, VariableNameSet } from "../resources/interfaces";
import { SequenceMeta } from "../resources/sequence_meta";
import { ShouldDisplay } from "../devices/interfaces";

type OnChange = (sd: ScopeDeclarationBodyItem | undefined) => void;

export interface LocalsListProps {
  variableData: VariableNameSet;
  sequence: TaggedSequence;
  resources: ResourceIndex;
  dispatch: Function;
  shouldDisplay: ShouldDisplay;
  /** Update stored data based on the declaration provided. */
  onChange: OnChange;
  /** Hide already bound variables (forms other than the sequence header). */
  hideDefined?: boolean;
  /** Use when a local set of declarations exists; i.e., execute step body. */
  declarations?: ScopeDeclarationBodyItem[];
  /** Use a variable decl. containing an identifier instead of a param decl. */
  useIdentifier?: boolean;
}

export interface LocationFormProps {
  declarations?: ScopeDeclarationBodyItem[];
  variable: SequenceMeta;
  sequence: TaggedSequence;
  resources: ResourceIndex;
  shouldDisplay: ShouldDisplay;
  /** Update stored data based on the declaration provided. */
  onChange: OnChange;
  /** Coordinate input box width. */
  width?: number;
  /**
   * Set to false to show the variable name along with its type.
   * Useful for disambiguation when dealing with multiple variables.
   */
  hideVariableLabel?: boolean;
  /** Use a variable decl. containing an identifier instead of a param decl. */
  useIdentifier?: boolean;
}

export const PARENT =
  ({ value: "parent", label: "Parent", headingId: "parameter" });
