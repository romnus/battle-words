import { LightningElement, wire, api } from "lwc";
import getAnswerRowDtos from "@salesforce/apex/PuzzleController.getAnswerRowDtos";
import { getRecord } from "lightning/uiRecordApi";
import SIZE_ACROSS from "@salesforce/schema/Puzzle__c.Size_Across__c";
import SIZE_TOP from "@salesforce/schema/Puzzle__c.Size_Top__c";

export default class PuzzleGrid extends LightningElement {
  @api recordId;
  @api attemptId;
  @api showSolvedPuzzle;

  answerRowDtos;

  @wire(getRecord, { recordId: "$recordId", fields: [SIZE_ACROSS, SIZE_TOP] })
  puzzle;

  connectedCallback() {
    getAnswerRowDtos({ puzzleId: this.recordId }).then((results) => {
      this.answerRowDtos = JSON.parse(results);
    });
  }
}
