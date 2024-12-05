import { LightningElement } from 'lwc';
import processCfpFileUpload from '@salesforce/apex/PuzzleUploadFormController.processCfpFileUpload';

export default class PuzzleUploadForm extends LightningElement {

    handleUploadFinished(event) {
        const uploadedCfpId = event.detail.files[0].documentId;

        processCfpFileUpload({uploadedCfpId: uploadedCfpId}).then(result => {
            console.log(result);
        })
    }    
}