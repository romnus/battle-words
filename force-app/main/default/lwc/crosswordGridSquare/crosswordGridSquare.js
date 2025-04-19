import { LightningElement, api } from "lwc";

export default class CrosswordGridSquare extends LightningElement {
  @api squareId;
  @api squareAnswer;
  @api clueNumber;
  @api clueAnswerPairIdAcross;
  @api clueAnswerPairIdDown;
  @api isPlayable;

  oldGuess;
  @api guess;
  @api guessId;

  @api
  get wasGuessChanged() {
    return this.guess !== this.oldGuess;
  }

  get isBlackSquare() {
    return this.squareAnswer === null;
  }

  connectedCallback() {
    this.oldGuess = this.guess;
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

  handleGuess(event) {
    const guess = event.key.toUpperCase();

    const guessIsLetter = /^[a-zA-Z]$/;

    if (guessIsLetter.test(event.key)) {
      this.guess = guess;
    }
  }
}
