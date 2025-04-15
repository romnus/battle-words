import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import CROSSWORD_SELECTED_CHANNEL from "@salesforce/messageChannel/Crossword_Selected__c";
import getCrosswordsWithAttempt from "@salesforce/apex/CrosswordController.getCrosswordsWithAttempt";
import getMostRecentAttempt from "@salesforce/apex/CrosswordController.getMostRecentAttempt";

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

  renderedCallback() {
    if (this.crosswordsWithAttempt && this.selectedRow.length === 0) {
      getMostRecentAttempt().then((mostRecentAttempt) => {
        this.selectedRow = [mostRecentAttempt.Crossword__c];
      });
    }
  }

  @wire(getCrosswordsWithAttempt)
  wiredCrosswordsWithAttempt({ error, data }) {
    if (data) {
      let crosswordsWithAttempt = [];

      data.forEach((crossword) => {
        let crosswordWithAttempt = {
          crosswordId: crossword.Id,
          Name: crossword.Name,
          size: crossword.Size_Across__c + "x" + crossword.Size_Across__c,
          Release_Date__c: crossword.Release_Date__c
        };

        if (crossword.Crossword_Attempts__r) {
          crosswordWithAttempt.Percentage_Complete__c =
            crossword.Crossword_Attempts__r[0].Percentage_Complete__c / 100;
        } else {
          crosswordWithAttempt.Percentage_Complete__c = 0;
        }

        crosswordsWithAttempt.push(crosswordWithAttempt);
      });

      this.crosswordsWithAttempt = crosswordsWithAttempt;
    }
  }

  handleRowSelection(event) {
    const crosswordId = event.detail.selectedRows[0].crosswordId;

    const payload = {
      selectedCrosswordId: crosswordId
    };

    publish(this.messageContext, CROSSWORD_SELECTED_CHANNEL, payload);
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
