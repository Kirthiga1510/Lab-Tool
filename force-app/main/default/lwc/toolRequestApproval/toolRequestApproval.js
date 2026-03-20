import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { CurrentPageReference } from 'lightning/navigation';

import processLabInchargeAction from '@salesforce/apex/ToolRequestApprovalController.processLabInchargeAction';
import processHODAction from '@salesforce/apex/ToolRequestApprovalController.processHODAction';
import getCurrentUserId from '@salesforce/apex/ToolRequestApprovalController.getCurrentUserId';

import STATUS_FIELD from '@salesforce/schema/Tool_Request__c.status__c';
import NAME_FIELD from '@salesforce/schema/Tool_Request__c.Name';

// Allowed user IDs
const LAB_INCHARGE_ID = '005g50000031UrxAAE';
const HOD_ID = '005g5000002wbYPAAY';

const FIELDS = [STATUS_FIELD, NAME_FIELD];

export default class ToolRequestApproval extends NavigationMixin(LightningElement) {

    @api recordId;

    @track isModalOpen = false;
    @track isLoading = false;
    @track alertMessage = '';
    @track alertClass = 'slds-notify slds-notify_alert slds-alert_warning slds-m-bottom_small';
    @track alertIcon = 'utility:warning';
    @track modalMessage = '';
    @track modalMessageClass = 'slds-notify slds-notify_alert slds-alert_warning';
    @track modalMessageIcon = 'utility:warning';

    currentUserId = '';
    wiredRecordResult;

    // Wire record data
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord(result) {
        this.wiredRecordResult = result;
        if (result.error) {
            this.showToast('Error', 'Failed to load record.', 'error');
        }
    }

    // Get current user on component load
    connectedCallback() {
        getCurrentUserId()
            .then(userId => {
                this.currentUserId = userId;
            })
            .catch(error => {
                console.error('Error fetching user ID:', error);
            });
    }

    // --- Computed Properties ---

    get currentStatus() {
        return getFieldValue(this.wiredRecordResult && this.wiredRecordResult.data, STATUS_FIELD) || 'Loading...';
    }

    get recordName() {
        return getFieldValue(this.wiredRecordResult && this.wiredRecordResult.data, NAME_FIELD) || '';
    }

    get showButton() {
        const status = this.currentStatus;
        return status === 'Pending Lab Incharge' || status === 'Lab Incharge Approved';
    }

    get modalTitle() {
        const status = this.currentStatus;
        if (status === 'Pending Lab Incharge') return 'Lab Incharge Approval';
        if (status === 'Lab Incharge Approved') return 'HOD Approval';
        return 'Process Approval';
    }

    get showLabInchargeActions() {
        return this.currentStatus === 'Pending Lab Incharge';
    }

    get showHODActions() {
        return this.currentStatus === 'Lab Incharge Approved';
    }

    // --- Validation Methods ---

    validateUser() {
        const status = this.currentStatus;

        // HOD: only allowed on Lab Incharge Approved
        if (status === 'Lab Incharge Approved' || status === 'Pending Lab Incharge') {
            return { valid: true };
        }
        else {
            return { valid: false, message: `You can only perform this action when status is Pending Lab Incharge or Lab Incharge Approved. Current status: ${status}` };
        }

        
    }

    // --- Button Click Handler ---

    handleButtonClick() {
        this.alertMessage = '';
        this.modalMessage = '';

        const validation = this.validateUser();
        if (!validation.valid) {
            this.alertMessage = validation.message;
            this.alertClass = 'slds-notify slds-notify_alert slds-alert_error slds-m-bottom_small';
            this.alertIcon = 'utility:error';
            return;
        }

        this.openActionModal();
    }

    openActionModal() {
        this.isModalOpen = true;
        this.modalMessage = '';
    }

    closeModal() {
        this.isModalOpen = false;
        this.isLoading = false;
        this.modalMessage = '';
    }

    // --- Lab Incharge Actions ---

    handleLabApprove() {
        this.processAction('labIncharge', 'Lab Incharge Approved');
    }

    handleLabReject() {
        this.processAction('labIncharge', 'Rejected');
    }

    // --- HOD Actions ---

    handleHODApprove() {
        this.processAction('hod', 'Approved');
    }

    handleHODReject() {
        this.processAction('hod', 'Rejected');
    }

    // --- Core Action Processor ---

    processAction(role, action) {
        this.isLoading = true;
        this.modalMessage = '';

        const apexMethod = role === 'labIncharge' ? processLabInchargeAction : processHODAction;

        apexMethod({ recordId: this.recordId, action: action })
            .then(result => {
                this.isLoading = false;

                if (result && result.isSuccess) {
                    this.modalMessage = result.message || 'Action processed successfully.';
                    this.modalMessageClass = 'slds-notify slds-notify_alert slds-alert_success';
                    this.modalMessageIcon = 'utility:success';

                    this.showToast('Success', result.message || 'Status updated successfully.', 'success');

                    // Refresh the record data so the button re-evaluates
                    refreshApex(this.wiredRecordResult).then(() => {
                        // Close modal after a short delay
                        setTimeout(() => {
                            this.closeModal();
                        }, 1500);
                    });

                } else {
                    this.modalMessage = (result && result.message) ? result.message : 'An unexpected error occurred.';
                    this.modalMessageClass = 'slds-notify slds-notify_alert slds-alert_error';
                    this.modalMessageIcon = 'utility:error';
                }
            })
            .catch(error => {
                this.isLoading = false;
                const errMsg = (error.body && error.body.message) ? error.body.message : 'An unexpected error occurred.';
                this.modalMessage = errMsg;
                this.modalMessageClass = 'slds-notify slds-notify_alert slds-alert_error';
                this.modalMessageIcon = 'utility:error';
                this.showToast('Error', errMsg, 'error');
            });
    }

    // --- Toast Utility ---

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}