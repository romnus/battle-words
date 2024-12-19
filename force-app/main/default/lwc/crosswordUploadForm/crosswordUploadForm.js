import { LightningElement, api } from "lwc";
import processCfpFileUpload from "@salesforce/apex/CrosswordUploadFormController.processCfpFileUpload";
import { NavigationMixin } from "lightning/navigation";

export default class CrosswordUploadForm extends NavigationMixin(
  LightningElement
) {
  crosswordId;
  wasNewCrosswordUploaded = false;

  handleUploadFinished(event) {
    const uploadedCfpId = event.detail.files[0].documentId;

    processCfpFileUpload({ uploadedCfpId: uploadedCfpId }).then((result) => {
      this.crosswordId = result;
      this.wasNewCrosswordUploaded = true;
    });
  }

  handleOpenCrosswordRecord(event) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: this.crosswordId,
        actionName: "view"
      }
    });
  }
}
