import { LightningElement, api, wire } from 'lwc';
import getStudentRequests from '@salesforce/apex/ToolRequestController.getRequests';

export default class ToolRequestService extends LightningElement {
    @api appNumber;

    @wire(getStudentRequests, { appNumber: '$appNumber' })
    wiredRequests({ data, error }) {
        if (data) {
            // Handle the data
            console.log('Requests data:', data);
        } else if (error) {
            console.error('Error fetching requests:', error);
        }
    }
}
