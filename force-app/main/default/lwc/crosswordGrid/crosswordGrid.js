import { LightningElement, api } from "lwc";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";

export default class CrosswordGrid extends LightningElement {
  @api recordId;

  gridRowDtos = [];

  get highlightedAnswerIdentifier() {
    const clueAnswerPairIdAttributeName =
      "data-clue-answer-pair-id-" + this.currentDirection;

    return (
      "c-crossword-grid-square[" +
      clueAnswerPairIdAttributeName +
      '="' +
      this.highlightedClueAnswerPairId +
      '"]'
    );
  }

  focusedSquareId;

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

    if (this.highlightedClueAnswerPairId) {
      this.unhighlightAnswer();
    }

    this.highlightedClueAnswerPairId =
      this.currentDirection === "across" ? acrossId : downId;

    if (this.focusedSquareId) {
      if (this.focusedSquareId === focusedSquareId) {
        this.toggleHighlightedClueAnswerPairIdAndDirection(acrossId, downId);
      } else {
        this.removeSquareFocusHighlight();
      }
    }

    this.focusedSquareId = focusedSquareId;

    this.highlightAnswer();

    this.template.querySelector(
      "c-crossword-clue-list"
    ).highlightedClueAnswerPairId = this.highlightedClueAnswerPairId;
  }

  handleClueClick(event) {
    if (this.highlightedClueAnswerPairId) {
      this.unhighlightAnswer();
    }

    this.highlightedClueAnswerPairId = event.detail.id;
    this.currentDirection = event.detail.direction;

    if (this.focusedSquareId) {
      this.removeSquareFocusHighlight();
    }

    this.highlightAnswer();

    this.highlightFocusSquare();
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

  removeSquareFocusHighlight() {
    let oldFocusedSquareIdentifier =
      'c-crossword-grid-square[data-square-id="' + this.focusedSquareId + '"]';

    this.template
      .querySelector(oldFocusedSquareIdentifier)
      .removeSquareFocusHighlight();
  }

  unhighlightAnswer() {
    this.template
      .querySelectorAll(this.highlightedAnswerIdentifier)
      .forEach((square) => {
        square.removeSquareHighlight();
      });
  }

  highlightAnswer() {
    let highlightedSquares = this.template.querySelectorAll(
      this.highlightedAnswerIdentifier
    );

    highlightedSquares.forEach((square) => {
      square.highlightSquare();
    });
  }

  highlightFocusSquare() {
    let focusedSquare = this.template.querySelector(
      this.highlightedAnswerIdentifier
    );

    focusedSquare.addSquareFocusHighlight();

    this.focusedSquareId = focusedSquare.squareId;
  }
}
