import { LightningElement, api } from "lwc";

export default class Crossword extends LightningElement {
  @api recordId;
  @api attemptId;
}
