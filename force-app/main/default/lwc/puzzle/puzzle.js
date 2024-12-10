import { LightningElement } from "lwc";

export default class Puzzle extends LightningElement {
  @api puzzleId;
  @api attemptId;
}
