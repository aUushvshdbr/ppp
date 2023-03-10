import { Checkbox } from '../../shared/checkbox.js';
import { checkboxTemplate } from '../../shared/checkbox.js';
import { css } from '../../shared/element/styles/css.js';
import { display } from '../../shared/utilities/style/display.js';
import { bodyFont } from './design-tokens.js';
import { disabledCursor } from '../../shared/utilities/style/disabled.js';

// TODO - design tokens
export const checkboxStyles = (context, definition) =>
  css`
    ${display('inline-flex')}
    :host {
      align-items: center;
      outline: none;
      margin: calc(c * 1px) 0;
      user-select: none;
      cursor: pointer;
    }

    :host .checked-indicator path {
      fill: transparent;
    }

    :host([disabled]) {
      cursor: ${disabledCursor};
    }

    :host([disabled]) .checked-indicator path {
      stroke: rgb(249, 251, 250);
    }

    :host([disabled]) .control {
      border: 2px solid rgb(232, 237, 235);
      background-color: rgb(249, 251, 250);
    }

    :host([disabled][checked]) .control {
      background-color: rgb(232, 237, 235);
    }

    :host(:hover:not([disabled])) .control {
      box-shadow: rgb(232 237 235) 0 0 0 3px;
    }

    .control {
      position: relative;
      width: 14px;
      height: 14px;
      box-sizing: border-box;
      outline: none;
      cursor: inherit;
      border-radius: 3px;
      border: 2px solid rgb(61, 79, 88);
      overflow: hidden;
    }

    .label {
      margin-left: 10px;
      font-family: ${bodyFont};
      font-size: 14px;
      cursor: inherit;
      color: rgb(0, 30, 43);
    }

    .checked-indicator {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0;
      pointer-events: none;
    }

    :host([aria-checked='true']:not(.indeterminate):not([disabled])) .control {
      border: 2px solid rgb(1, 107, 248);
      background-color: rgb(1, 107, 248);
    }

    :host([aria-checked='true']:not(.indeterminate)) .checked-indicator,
    :host(.indeterminate) .indeterminate-indicator {
      opacity: 1;
    }
  `;

// noinspection JSUnusedGlobalSymbols
export default Checkbox.compose({
  template: checkboxTemplate,
  styles: checkboxStyles,
  checkedIndicator: `
        <svg part="checked-indicator" class="checked-indicator" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M2 5.5L4.12132 7.62132L8.36396 3.37868" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  indeterminateIndicator: `<div part="indeterminate-indicator" class="indeterminate-indicator"></div>`
});
