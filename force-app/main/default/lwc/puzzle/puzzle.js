import { LightningElement, api } from "lwc";

export default class Puzzle extends LightningElement {
  @api puzzleId;
  @api attemptId;
}
