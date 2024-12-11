import { LightningElement, api } from "lwc";

export default class PuzzleGridSquare extends LightningElement {
  @api answer;
  @api isBlackSquare;
  @api showAnswer = false;
  @api response;
  displayText;

  connectedCallback() {
    this.displayText = this.showAnswer ? this.answer : this.response;
  }
}
