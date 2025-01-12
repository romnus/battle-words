import { LightningElement, api } from "lwc";
import getGridRowDtos from "@salesforce/apex/CrosswordController.getGridRowDtos";

export default class CrosswordGrid extends LightningElement {
  @api recordId;

  gridRowDtos = [];
  oldAnswerIdentifier;

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
          square.removeAnswerHighlight();
        });
    }

    let answerIdentifier =
      "c-crossword-grid-square[" +
      clueAnswerPairIdAttributeName +
      '="' +
      clueAnswerPairId +
      '"]';

    this.template.querySelectorAll(answerIdentifier).forEach((square) => {
      square.highlightAnswer();
    });

    this.oldAnswerIdentifier = answerIdentifier;
  }
}
