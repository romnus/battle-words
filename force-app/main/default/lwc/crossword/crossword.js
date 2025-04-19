import { LightningElement, wire } from "lwc";
import { subscribe, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";
import getMostRecentAttempt from "@salesforce/apex/CrosswordController.getMostRecentAttempt";
import getMostRecentAttemptWithCrosswordId from "@salesforce/apex/CrosswordController.getMostRecentAttemptWithCrosswordId";
import createAttemptForMostRecentlyCreatedCrossword from "@salesforce/apex/CrosswordController.createAttemptForMostRecentlyCreatedCrossword";
import createAttemptForCrossword from "@salesforce/apex/CrosswordController.createAttemptForCrossword";

export default class Crossword extends LightningElement {
  attempt;

  subscription;

  showSpinner;

  @wire(MessageContext)
  messageContext;

  async connectedCallback() {
    this.subscribeToMessageChannel();
    window.addEventListener("beforeunload", this.handleBeforeUnload.bind(this));

    const mostRecentAttempt = await getMostRecentAttempt();

    if (mostRecentAttempt.length === 0) {
      const newAttempt = await createAttemptForMostRecentlyCreatedCrossword();
      this.attempt = newAttempt[0];
    } else {
      this.attempt = mostRecentAttempt[0];
    }
  }

  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      CROSSWORD_SELECTED_CHANNEL,
      (message) => this.handleCrosswordSelected(message)
    );
  }

  async handleCrosswordSelected(message) {
    const crosswordGrid = this.template.querySelector("c-crossword-grid");

    crosswordGrid.saveFocusedSquareAndClueAnswerPair();
    crosswordGrid.saveGuesses();

    const mostRecentAttempt = await getMostRecentAttemptWithCrosswordId({
      crosswordId: message.selectedCrosswordId
    });

    if (mostRecentAttempt.length === 0) {
      const newAttempt = await createAttemptForCrossword({
        crosswordId: message.selectedCrosswordId
      });
      this.attempt = newAttempt[0];
    } else {
      this.attempt = mostRecentAttempt[0];
    }
  }

  handleBeforeUnload() {
    const crosswordGrid = this.template.querySelector("c-crossword-grid");

    crosswordGrid.saveFocusedSquareAndClueAnswerPair();
    crosswordGrid.saveGuesses();

    this.showSpinner = true; // show spinner so that unload DML calls are executed
  }
}
