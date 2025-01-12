import { LightningElement, api } from "lwc";

export default class CrosswordGridSquare extends LightningElement {
  @api answer;
  @api clueNumber;

  renderedCallback() {
    const backgroundColorClass =
      this.answer == "." ? "background-color-black" : "background-color-white";

    this.refs.crosswordSquare.classList.add(backgroundColorClass);
  }

  @api
  highlightAnswer() {
    this.refs.crosswordSquare.classList.add("background-color-highlight");
  }

  @api
  removeAnswerHighlight() {
    this.refs.crosswordSquare.classList.remove("background-color-highlight");
  }
}
