import { LightningElement, wire, api } from "lwc";
import getAnswerRowDtos from "@salesforce/apex/CrosswordController.getAnswerRowDtos";
import { getRecord } from "lightning/uiRecordApi";
import SIZE_ACROSS from "@salesforce/schema/Crossword__c.Size_Across__c";
import SIZE_TOP from "@salesforce/schema/Crossword__c.Size_Top__c";

export default class CrosswordGrid extends LightningElement {
  @api recordId;
  @api attemptId;
  @api showSolvedCrossword;

  answerRowDtos;

  @wire(getRecord, { recordId: "$recordId", fields: [SIZE_ACROSS, SIZE_TOP] })
  crossword;

  connectedCallback() {
    getAnswerRowDtos({ crosswordId: this.recordId }).then((results) => {
      this.answerRowDtos = JSON.parse(results);
    });
  }
}
