import { LightningElement, api, wire } from "lwc";
import { subscribe, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";

export default class Crossword extends LightningElement {
  crosswordWithAttempt;

  subscription;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    this.subscribeToMessageChannel();
  }

  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      CROSSWORD_SELECTED_CHANNEL,
      (message) => this.handleCrosswordSelected(message)
    );
  }

  handleCrosswordSelected(message) {
    this.crosswordWithAttempt = message.crosswordWithAttempt;
  }
}
