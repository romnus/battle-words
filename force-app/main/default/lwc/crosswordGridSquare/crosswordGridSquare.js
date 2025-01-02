import { LightningElement, api } from "lwc";

export default class CrosswordGridSquare extends LightningElement {
  @api answer;

  BLACK_SQUARE_CHARACTER = ".";

  get isBlackSquare() {
    return this.answer == this.BLACK_SQUARE_CHARACTER ? true : false;
  }

  cssClass = "crossword-square ";

  connectedCallback() {
    this.backgroundColorClass = this.isBlackSquare
      ? "background-color-black"
      : "background-color-white";

    this.cssClass += this.backgroundColorClass;
  }
}
