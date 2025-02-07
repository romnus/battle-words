import { LightningElement, api, wire } from "lwc";
import { createRecord } from "lightning/uiRecordApi";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";
import userId from "@salesforce/user/Id";

export default class CrosswordGrid extends LightningElement {
  @api recordId;
  @api attemptId;
  @api isPlayable;

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
    if (!this.attemptId) {
      const fields = {};
      fields["Crossword__c"] = this.recordId;
      fields["Player__c"] = userId;
      fields["Minutes_Spent__c"] = 0;
      fields["Seconds_Spent__c"] = 0;
      fields["Percentage_Complete__c"] = 0;
      fields["Last_Active_Square__c"] = 1;

      const recordInput = { apiName: "Crossword_Attempt__c", fields };
      createRecord(recordInput);
    }
  }

  @wire(getGridRowDtos, { crosswordId: "$recordId" })
  wiredGridRowDtos({ error, data }) {
    if (data) {
      this.gridRowDtos = JSON.parse(data);
    } else if (error) {
      this.error = error;
      this.gridRowDtos = undefined;
    }
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
