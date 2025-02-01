import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";

import getCrosswords from "@salesforce/apex/CrosswordController.getCrosswords";
import getPlayer from "@salesforce/apex/CrosswordController.getPlayer";

import userId from "@salesforce/user/Id";
import { updateRecord } from "lightning/uiRecordApi";

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
  crosswords;
  error;

  selectedRow = [];

  columns = columns;
  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  @wire(MessageContext)
  messageContext;

  @wire(getCrosswords)
  wiredCrosswords({ error, data }) {
    if (data) {
      let crosswords = [];

      data.forEach((crossword) => {
        let newCrossword = {
          crosswordId: crossword.Id,
          Name: crossword.Name,
          size: crossword.Size_Across__c + "x" + crossword.Size_Across__c,
          Release_Date__c: crossword.Release_Date__c
        };

        if (crossword.Crossword_Attempts__r) {
          newCrossword.Percentage_Complete__c =
            crossword.Crossword_Attempts__r[0].Percentage_Complete__c / 100;
          newCrossword.attemptId = crossword.Crossword_Attempts__r[0].Id;
        }

        crosswords.push(newCrossword);
      });

      this.crosswords = crosswords;
      this.error = undefined;

      getPlayer().then((player) => {
        if (player.Last_Played_Crossword_Id__c) {
          const lastPlayedCrosswordId = player.Last_Played_Crossword_Id__c;
          this.selectedRow = [lastPlayedCrosswordId];

          const lastPlayedCrossword = this.crosswords.find(
            (crossword) => crossword.crosswordId === lastPlayedCrosswordId
          );

          const payload = {
            name: lastPlayedCrossword.Name,
            crosswordId: lastPlayedCrosswordId,
            attemptId: lastPlayedCrossword.attemptId,
            isPlayable:
              lastPlayedCrossword.Percentage_Complete__c === 1 ? false : true
          };

          publish(this.messageContext, CROSSWORD_SELECTED_CHANNEL, payload);
        }
      });
    } else if (error) {
      this.error = error;
      this.crosswords = undefined;
    }
  }

  handleRowSelection(event) {
    const name = event.detail.selectedRows[0].Name;
    const crosswordId = event.detail.selectedRows[0].crosswordId;
    const attemptId = event.detail.selectedRows[0].attemptId;
    const isPlayable =
      event.detail.selectedRows[0].Percentage_Complete__c === 1 ? false : true;

    const payload = {
      name: name,
      crosswordId: crosswordId,
      attemptId: attemptId,
      isPlayable: isPlayable
    };

    publish(this.messageContext, CROSSWORD_SELECTED_CHANNEL, payload);

    const fields = {};
    fields["Id"] = userId;
    fields["Last_Played_Crossword_Id__c"] = crosswordId;
    const recordInput = { fields };

    updateRecord(recordInput);
  }

  onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.crosswords];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.crosswords = cloneData;
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
