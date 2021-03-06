import { Callback } from "i18next";
import _React, { createElement } from "react";
import { render } from "react-dom";
import { PasswordReset } from "./password_reset";
import { bail } from "../util";

export const MISSING_DIV = "Add a div with id `root` to the page first.";

// eslint-disable-next-line @typescript-eslint/require-await
export const onInit: Callback = async () => {
  const node = document.createElement("DIV");
  node.id = "root";
  document.body.appendChild(node);

  const reactElem = createElement(PasswordReset, {});
  const domElem = document.getElementById("root");

  return (domElem) ? render(reactElem, domElem) : bail(MISSING_DIV);
};
