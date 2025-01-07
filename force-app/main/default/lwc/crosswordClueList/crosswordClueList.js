import { LightningElement, api } from "lwc";
import getClues from "@salesforce/apex/CrosswordController.getClues";

export default class CrosswordClueList extends LightningElement {
  @api recordId;

  acrossClues;
  downClues;

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
}
