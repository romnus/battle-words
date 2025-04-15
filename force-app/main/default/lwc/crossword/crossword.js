import { LightningElement, wire } from "lwc";
import { subscribe, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";
import getMostRecentAttempt from "@salesforce/apex/CrosswordController.getMostRecentAttempt";
import getMostRecentAttemptWithCrosswordId from "@salesforce/apex/CrosswordController.getMostRecentAttemptWithCrosswordId";

export default class Crossword extends LightningElement {
  attempt;

  subscription;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    this.subscribeToMessageChannel();

    getMostRecentAttempt().then((mostRecentAttempt) => {
      this.attempt = mostRecentAttempt;
    });
  }

  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      CROSSWORD_SELECTED_CHANNEL,
      (message) => this.handleCrosswordSelected(message)
    );
  }

  handleCrosswordSelected(message) {
    const crosswordGrid = this.template.querySelector("c-crossword-grid");

    crosswordGrid.saveFocusedSquareAndClueAnswerPair();

    getMostRecentAttemptWithCrosswordId({
      crosswordId: message.selectedCrosswordId
    }).then((mostRecentAttempt) => {
      this.attempt = mostRecentAttempt;
    });
  }
}
