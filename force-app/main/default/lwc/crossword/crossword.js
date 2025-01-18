import { LightningElement, api } from "lwc";

export default class Crossword extends LightningElement {
  @api recordId;
  @api attemptId;

  handleClueClick(event) {
    const clueAnswerPairId = event.detail.id;
    const direction = event.detail.direction;

    this.template
      .querySelector("c-crossword-grid")
      .highlightAnswerOnClueClick(clueAnswerPairId, direction);
  }

  handleSquareClick(event) {
    const clueAnswerPairId = event.detail.id;

    this.template
      .querySelector("c-crossword-clue-list")
      .highlightClue(clueAnswerPairId);
  }
}
