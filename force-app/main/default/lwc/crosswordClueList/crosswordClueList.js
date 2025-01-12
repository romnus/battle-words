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
}