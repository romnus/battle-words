import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";

import getCrosswordsWithAttemptAndFirstClueAnswerPair from "@salesforce/apex/CrosswordController.getCrosswordsWithAttemptAndFirstClueAnswerPair";
import getPlayer from "@salesforce/apex/CrosswordController.getPlayer";

import userId from "@salesforce/user/Id";
import { createRecord, updateRecord } from "lightning/uiRecordApi";

const columns = [
  { label: "Name", fieldName: "Name", sortable: true },
  { label: "Size", fieldName: "size", sortable: true, initialWidth: 70 },
  {
    label: "Release Date",
    fieldName: "Release_Date__c",
    type: "date",
    sortable: true,
    initialWidth: 137,
    typeAttributes: {
      year: "numeric",
      month: "short",
      day: "2-digit",
      weekday: "short"
    }
  },
  {
    label: "Percentage Complete",
    fieldName: "Percentage_Complete__c",
    type: "percent",
    sortable: true,
    initialWidth: 175
  }
];

export default class CrosswordSelector extends LightningElement {
  crosswordsWithAttempt;

  selectedRow = [];

  columns = columns;
  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    getCrosswordsWithAttemptAndFirstClueAnswerPair().then((crosswords) => {
      let crosswordsWithAttempt = [];

      crosswords.forEach((crossword) => {
        let crosswordWithAttempt = {
          crosswordId: crossword.Id,
          Name: crossword.Name,
          size: crossword.Size_Across__c + "x" + crossword.Size_Across__c,
          Release_Date__c: crossword.Release_Date__c
        };

        if (crossword.Crossword_Attempts__r) {
          crosswordWithAttempt.Percentage_Complete__c =
            crossword.Crossword_Attempts__r[0].Percentage_Complete__c / 100;
          crosswordWithAttempt.attempt = crossword.Crossword_Attempts__r[0];
        } else {
          const fields = {};
          fields["Crossword__c"] = crossword.Id;
          fields["Player__c"] = userId;
          fields["Minutes_Spent__c"] = 0;
          fields["Seconds_Spent__c"] = 0;
          fields["Percentage_Complete__c"] = 0;
          fields["Last_Active_Square__c"] = 1;
          fields["Last_Active_Clue_Answer_Pair_Id__c"] =
            crossword.Crossword_Clue_Answer_Pair__r[0].Id;

          const recordInput = { apiName: "Crossword_Attempt__c", fields };

          crosswordWithAttempt.Percentage_Complete__c = 0;
          crosswordWithAttempt.attempt = createRecord(recordInput);
        }

        crosswordsWithAttempt.push(crosswordWithAttempt);
      });

      this.crosswordsWithAttempt = crosswordsWithAttempt;

      getPlayer().then((player) => {
        if (player.Last_Played_Crossword_Id__c) {
          const lastPlayedCrosswordId = player.Last_Played_Crossword_Id__c;
          this.selectedRow = [lastPlayedCrosswordId];

          const lastPlayedCrosswordWithAttempt =
            this.crosswordsWithAttempt.find(
              (crossword) => crossword.crosswordId === lastPlayedCrosswordId
            );

          const payload = {
            crosswordWithAttempt: lastPlayedCrosswordWithAttempt
          };

          publish(this.messageContext, CROSSWORD_SELECTED_CHANNEL, payload);
        }
      });
    });
  }

  handleRowSelection(event) {
    const crosswordWithAttempt = event.detail.selectedRows[0];

    const payload = {
      crosswordWithAttempt: crosswordWithAttempt
    };

    publish(this.messageContext, CROSSWORD_SELECTED_CHANNEL, payload);

    const fields = {};
    fields["Id"] = userId;
    fields["Last_Played_Crossword_Id__c"] = crosswordWithAttempt.crosswordId;
    const recordInput = { fields };

    updateRecord(recordInput);
  }

  onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.crosswordsWithAttempt];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.crosswordsWithAttempt = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }
}
