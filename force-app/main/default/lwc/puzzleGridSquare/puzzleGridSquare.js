import { LightningElement, api } from "lwc";

export default class PuzzleGridSquare extends LightningElement {
  @api answer;
  @api isBlackSquare;
  @api showAnswer;
}
