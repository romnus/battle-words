import { LightningElement, api } from "lwc";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";

export default class CrosswordGrid extends LightningElement {
  @api recordId;

  gridRowDtos = [];
  oldAnswerIdentifier;
  oldFocusedSquareId;

  highlightedClueAnswerPairId;
  currentDirection = "across";

  connectedCallback() {
    getGridRowDtos({ crosswordId: this.recordId }).then((results) => {
      this.gridRowDtos = JSON.parse(results);
    });
  }

  handleSquareClick(event) {
    const focusedSquareId = event.detail.squareId;
    const acrossId = event.detail.acrossId;
    const downId = event.detail.downId;

    this.highlightedClueAnswerPairId =
      this.currentDirection === "across" ? acrossId : downId;

    if (this.oldFocusedSquareId) {
      if (this.oldFocusedSquareId === focusedSquareId) {
        this.toggleHighlightedClueAnswerPairIdAndDirection(acrossId, downId);
      } else {
        this.removeSquareFocusHighlight(focusedSquareId);
      }
    }

    this.oldFocusedSquareId = focusedSquareId;

    this.highlightAnswer();

    this.highlightClueOnSquareClick();
  }

  toggleHighlightedClueAnswerPairIdAndDirection(acrossId, downId) {
    if (this.currentDirection === "across") {
      this.highlightedClueAnswerPairId = downId;
      this.currentDirection = "down";
    } else {
      this.highlightedClueAnswerPairId = acrossId;
      this.currentDirection = "across";
    }
  }

  removeSquareFocusHighlight(focusedSquareId) {
    let oldFocusedSquareIdentifier =
      'c-crossword-grid-square[data-square-id="' +
      this.oldFocusedSquareId +
      '"]';

    this.template
      .querySelector(oldFocusedSquareIdentifier)
      .removeSquareFocusHighlight();
  }

  @api
  highlightAnswer() {
    const clueAnswerPairIdAttributeName =
      "data-clue-answer-pair-id-" + this.currentDirection;

    if (this.oldAnswerIdentifier) {
      this.template
        .querySelectorAll(this.oldAnswerIdentifier)
        .forEach((square) => {
          square.removeSquareHighlight();
        });
    }

    let answerIdentifier =
      "c-crossword-grid-square[" +
      clueAnswerPairIdAttributeName +
      '="' +
      this.highlightedClueAnswerPairId +
      '"]';

    this.template.querySelectorAll(answerIdentifier).forEach((square) => {
      square.highlightSquare();
    });

    this.oldAnswerIdentifier = answerIdentifier;
  }

  highlightClueOnSquareClick() {
    this.dispatchEvent(
      new CustomEvent("squareclick", {
        detail: {
          id: this.highlightedClueAnswerPairId
        }
      })
    );
  }
}
