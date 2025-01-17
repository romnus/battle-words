import { LightningElement, api } from "lwc";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";

export default class CrosswordGrid extends LightningElement {
  @api recordId;

  gridRowDtos = [];
  oldAnswerIdentifier;
  oldFocusedSquareId;

  currentDirection = "across";

  connectedCallback() {
    getGridRowDtos({ crosswordId: this.recordId }).then((results) => {
      this.gridRowDtos = JSON.parse(results);
    });
  }

  @api
  highlightAnswer(clueAnswerPairId, direction) {
    const clueAnswerPairIdAttributeName =
      "data-clue-answer-pair-id-" + direction;

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
      clueAnswerPairId +
      '"]';

    this.template.querySelectorAll(answerIdentifier).forEach((square) => {
      square.highlightSquare();
    });

    this.oldAnswerIdentifier = answerIdentifier;
  }

  highlightAnswerOnSquareClick(event) {
    const focusedSquareId = event.detail.squareId;

    let cluePairAnswerIdToHighlight =
      this.currentDirection === "across"
        ? event.detail.acrossId
        : event.detail.downId;

    if (this.oldFocusedSquareId) {
      if (this.oldFocusedSquareId === focusedSquareId) {
        if (this.currentDirection === "across") {
          cluePairAnswerIdToHighlight = event.detail.downId;
          this.currentDirection = "down";
        } else {
          cluePairAnswerIdToHighlight = event.detail.acrossId;
          this.currentDirection = "across";
        }
      } else {
        let oldFocusedSquareIdentifier =
          'c-crossword-grid-square[data-square-id="' +
          this.oldFocusedSquareId +
          '"]';

        this.template
          .querySelector(oldFocusedSquareIdentifier)
          .removeSquareFocusHighlight();
      }
    }

    this.highlightAnswer(cluePairAnswerIdToHighlight, this.currentDirection);

    this.oldFocusedSquareId = focusedSquareId;
  }
}
