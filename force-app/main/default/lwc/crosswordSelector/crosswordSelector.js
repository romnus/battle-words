import { LightningElement, wire } from "lwc";
import getCrosswords from "@salesforce/apex/CrosswordController.getCrosswords";

const columns = [
  { label: "Name", fieldName: "Name", sortable: true },
  { label: "Size", fieldName: "size", sortable: true },
  { label: "Release Date", fieldName: "Release_Date__c", sortable: true },
  {
    label: "Percentage Complete",
    fieldName: "Percentage_Complete__c",
    type: "percent",
    sortable: true
  }
];

export default class CrosswordSelector extends LightningElement {
  crosswords;
  error;

  columns = columns;
  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  @wire(getCrosswords)
  wiredCrosswords({ error, data }) {
    if (data) {
      let crosswords = [];

      data.forEach((crossword) => {
        let newCrossword = {
          id: crossword.Id,
          Name: crossword.Name,
          size: crossword.Size_Across__c + "x" + crossword.Size_Across__c,
          Release_Date__c: crossword.Release_Date__c
        };

        newCrossword.Percentage_Complete__c = crossword.Crossword_Attempts__r
          ? crossword.Crossword_Attempts__r[0].Percentage_Complete__c
          : 0;

        crosswords.push(newCrossword);
      });

      this.crosswords = crosswords;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.crosswords = undefined;
    }
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
