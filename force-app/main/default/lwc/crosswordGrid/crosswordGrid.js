import { LightningElement, api, wire } from "lwc";
import { updateRecord } from "lightning/uiRecordApi";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";
import saveGuesses from "@salesforce/apex/CrosswordController.saveGuesses";

export default class CrosswordGrid extends LightningElement {
  gridRowDtos = [];
  isPlayable;

  _attempt;

  focusedSquareId;
  highlightedClueAnswerPairId;

  currentDirection = "across";

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

  @api
  get attempt() {
    return this._attempt;
  }

  set attempt(value) {
    this._attempt = value;

    this.isPlayable = this._attempt.Percentage_Complete__c === 1 ? false : true;

    if (this.isPlayable) {
      this.highlightedClueAnswerPairId =
        this._attempt.Last_Active_Clue_Answer_Pair_Id__c;

      this.focusedSquareId = this._attempt.Last_Active_Square__c;

      this.currentDirection =
        this._attempt.Last_Active_Clue_Answer_Pair_Id__r.Direction__c;
    }
  }

  @wire(getGridRowDtos, { attempt: "$attempt" })
  wiredGridRowDtos({ error, data }) {
    if (data) {
      this.gridRowDtos = JSON.parse(data);
    } else if (error) {
      this.error = error;
      this.gridRowDtos = undefined;
    }
  }

  renderedCallback() {
    const clueList = this.template.querySelector("c-crossword-clue-list");

    if (clueList) {
      clueList.highlightedClueAnswerPairId = this.highlightedClueAnswerPairId;
    }

    if (this.isPlayable) {
      if (this.focusedSquareId) {
        this.highlightFocusSquare();
      }

      if (this.highlightedClueAnswerPairId) {
        this.highlightAnswer();
      }
    }
  }

  @api
  async saveFocusedSquareAndClueAnswerPair() {
    const fields = {};
    fields["Id"] = this.attempt.Id;
    fields["Last_Active_Clue_Answer_Pair_Id__c"] =
      this.highlightedClueAnswerPairId;
    fields["Last_Active_Square__c"] = this.focusedSquareId;
    const recordInput = { fields };
    updateRecord(recordInput);
  }

  @api
  async saveGuesses() {
    const guesses = [];

    this.template
      .querySelectorAll("c-crossword-grid-square")
      .forEach((square) => {
        if (square.wasGuessChanged) {
          let guess = {};

          guess.Id = square.guessId;
          guess.Square_Id__c = square.squareId;
          guess.Attempt__c = this.attempt.Id;
          guess.Input__c = square.guess;

          guesses.push(guess);
        }
      });

    if (guesses.length !== 0) {
      await saveGuesses({ guesses: guesses });
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

    if (highlightedSquares) {
      highlightedSquares.forEach((square) => {
        square.highlightSquare();
      });
    }
  }

  highlightFocusSquare() {
    let newFocusedSquareIdentifier =
      'c-crossword-grid-square[data-square-id="' + this.focusedSquareId + '"]';

    let focusedSquare = this.template.querySelector(newFocusedSquareIdentifier);

    if (focusedSquare) {
      focusedSquare.addSquareFocusHighlight();
    }
  }
}
