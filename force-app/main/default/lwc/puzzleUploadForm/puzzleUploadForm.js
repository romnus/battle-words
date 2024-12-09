import { LightningElement } from "lwc";
import processCfpFileUpload from "@salesforce/apex/PuzzleUploadFormController.processCfpFileUpload";
import { NavigationMixin } from "lightning/navigation";

export default class PuzzleUploadForm extends NavigationMixin(
  LightningElement
) {
  puzzleId;
  wasNewPuzzleUploaded = false;

  handleUploadFinished(event) {
    const uploadedCfpId = event.detail.files[0].documentId;

    processCfpFileUpload({ uploadedCfpId: uploadedCfpId }).then((result) => {
      this.puzzleId = result;
      this.wasNewPuzzleUploaded = true;
    });
  }

  handleOpenPuzzleRecord(event) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: this.puzzleId,
        actionName: "view"
      }
    });
  }
}
