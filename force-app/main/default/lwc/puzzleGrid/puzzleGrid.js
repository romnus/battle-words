import { LightningElement, api } from "lwc";

export default class PuzzleGrid extends LightningElement {
  @api recordId;
  @api attemptId;
}
