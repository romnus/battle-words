import { LightningElement, api } from "lwc";
import getClues from "@salesforce/apex/CrosswordController.getClues";

export default class CrosswordClueList extends LightningElement {
  @api recordId;

  acrossClues = [];
  downClues = [];
  oldHighlightedClueAnswerPairId;

  connectedCallback() {
    getClues({ crosswordId: this.recordId }).then((clues) => {
      let acrossClues = [];
      let downClues = [];

      for (const clue of clues) {
        if (clue.Direction__c == "Across") {
          acrossClues.push(clue);
        } else {
          downClues.push(clue);
        }
      }

      this.acrossClues = acrossClues;
      this.downClues = downClues;
    });
  }

  handleClueClick(event) {
    if (this.oldHighlightedClueAnswerPairId) {
      let clueElement = this.template.querySelector(
        'div[data-id="' + this.oldHighlightedClueAnswerPairId + '"]'
      );

      clueElement.classList.remove("background-color-highlight");
    }

    const clueAnswerPairId = event.target.dataset.id;
    const direction = event.target.dataset.direction;

    let clueElement = this.template.querySelector(
      'div[data-id="' + clueAnswerPairId + '"]'
    );

    clueElement.classList.add("background-color-highlight");

    this.dispatchEvent(
      new CustomEvent("clueclick", {
        detail: {
          id: clueAnswerPairId,
          direction: direction
        }
      })
    );

    this.oldHighlightedClueAnswerPairId = clueAnswerPairId;
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
