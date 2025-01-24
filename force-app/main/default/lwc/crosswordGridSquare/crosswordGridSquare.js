import { LightningElement, api } from "lwc";

export default class CrosswordGridSquare extends LightningElement {
  @api squareId;
  @api answer;
  @api clueNumber;
  @api clueAnswerPairIdAcross;
  @api clueAnswerPairIdDown;

  get isBlackSquare() {
    return this.answer == ".";
  }

  renderedCallback() {
    const backgroundColorClass = this.isBlackSquare
      ? "background-color-black"
      : "background-color-white";

    this.refs.crosswordSquare.classList.add(backgroundColorClass);
  }

  @api
  highlightSquare() {
    this.refs.crosswordSquare.classList.add("background-color-highlight");
  }

  @api
  removeSquareHighlight() {
    this.refs.crosswordSquare.classList.remove("background-color-highlight");
  }

  @api
  addSquareFocusHighlight() {
    this.refs.crosswordSquare.classList.add("background-color-focus-highlight");
  }

  @api
  removeSquareFocusHighlight() {
    this.refs.crosswordSquare.classList.remove(
      "background-color-focus-highlight"
    );
  }

  handleSquareClick(event) {
    if (!this.isBlackSquare) {
      this.refs.crosswordSquare.classList.add(
        "background-color-focus-highlight"
      );

      this.dispatchEvent(
        new CustomEvent("squareclick", {
          detail: {
            squareId: this.squareId,
            acrossId: this.clueAnswerPairIdAcross,
            downId: this.clueAnswerPairIdDown
          }
        })
      );
    }
  }
}
