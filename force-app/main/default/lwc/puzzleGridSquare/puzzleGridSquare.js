import { LightningElement, api } from "lwc";

export default class PuzzleGridSquare extends LightningElement {
  @api answer;
  @api isBlackSquare;
  @api showAnswer = false;
  @api response;

  displayText;
  cssClass = "puzzle-square ";

  connectedCallback() {
    this.displayText = this.showAnswer ? this.answer : this.response;
    this.backgroundColorClass = this.isBlackSquare
      ? "background-color-black"
      : "background-color-white";

    this.cssClass += this.backgroundColorClass;
  }
}
