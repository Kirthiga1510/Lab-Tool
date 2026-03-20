import { LightningElement, track } from 'lwc';
import getPendingRequests from '@salesforce/apex/LabInchargeController.getPendingRequests';
import approveRequest from '@salesforce/apex/LabInchargeController.approveRequest';
import rejectRequest from '@salesforce/apex/LabInchargeController.rejectRequest';

export default class LabInchargeApproval extends LightningElement {

    @track requests = [];

    connectedCallback(){

        this.loadRequests();

    }

    loadRequests(){

        getPendingRequests()
        .then(result=>{
            this.requests = result;
        });

    }

    approve(event){

        const reqId = event.target.dataset.id;

        approveRequest({requestId:reqId})
        .then(()=>{

            alert("Request Approved");

            this.loadRequests();

        });

    }

    reject(event){

        const reqId = event.target.dataset.id;

        rejectRequest({requestId:reqId})
        .then(()=>{

            alert("Request Rejected");

            this.loadRequests();

        });

    }

}