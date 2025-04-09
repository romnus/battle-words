import { LightningElement, api, wire } from "lwc";
import getClues from "@salesforce/apex/CrosswordController.getClues";

export default class CrosswordClueList extends LightningElement {
  @api crosswordId;

  acrossClues = [];
  downClues = [];

  _highlightedClueAnswerPairId;

  @api
  get highlightedClueAnswerPairId() {
    return this._highlightedClueAnswerPairId;
  }

  set highlightedClueAnswerPairId(value) {
    if (this.highlightedClueElement) {
      this.unhighlightClue();
    }

    this._highlightedClueAnswerPairId = value;

    if (this.highlightedClueElement) {
      this.highlightClue();
    }
  }

  get highlightedClueElement() {
    return this.template.querySelector(
      'div[data-id="' + this.highlightedClueAnswerPairId + '"]'
    );
  }

  renderedCallback() {
    if (this.highlightedClueElement) {
      this.highlightClue();
    }
  }

  @wire(getClues, { crosswordId: "$crosswordId" })
  wiredClues({ error, data }) {
    if (data) {
      let acrossClues = [];
      let downClues = [];

      for (const clue of data) {
        if (clue.Direction__c == "Across") {
          acrossClues.push(clue);
        } else {
          downClues.push(clue);
        }
      }

      this.acrossClues = acrossClues;
      this.downClues = downClues;

      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.acrossClues = undefined;
      this.downClues = undefined;
    }
  }

  handleClueClick(event) {
    const clueAnswerPairId = event.target.dataset.id;
    const direction = event.target.dataset.direction;

    this.dispatchEvent(
      new CustomEvent("clueclick", {
        detail: {
          id: clueAnswerPairId,
          direction: direction
        }
      })
    );

    this.highlightedClueAnswerPairId = clueAnswerPairId;
  }

  unhighlightClue() {
    this.highlightedClueElement.classList.remove("background-color-highlight");
  }

  highlightClue() {
    this.highlightedClueElement.classList.add("background-color-highlight");
  }

  handleOnKeyDown(event) {
    event.preventDefault();

    const direction = event.target.dataset.direction;

    if (event.key == "ArrowDown") {
      const nextClue = this.template.activeElement.nextElementSibling;

      if (nextClue) {
        nextClue.focus();
      } else {
        if (direction === "across") {
          const firstDownClue = this.template.querySelector(
            '.down-clues div[data-number="1"]'
          );

          firstDownClue.focus();
        } else {
          const firstAcrossClue = this.template.querySelector(
            '.across-clues div[data-number="1"]'
          );

          firstAcrossClue.focus();
        }
      }
    } else if (event.key == "ArrowUp") {
      const previousClue = this.template.activeElement.previousElementSibling;

      if (previousClue.classList.contains("clue")) {
        previousClue.focus();
      } else {
        if (direction === "across") {
          const lastDownClueNumber =
            this.downClues[this.downClues.length - 1].Number__c;

          const lastDownClue = this.template.querySelector(
            '.down-clues div[data-number="' + lastDownClueNumber + '"]'
          );

          lastDownClue.focus();
        } else {
          const lastAcrossClueNumber =
            this.acrossClues[this.acrossClues.length - 1].Number__c;

          const lastAcrossClue = this.template.querySelector(
            '.across-clues div[data-number="' + lastAcrossClueNumber + '"]'
          );

          lastAcrossClue.focus();
        }
      }
    }
  }
}
