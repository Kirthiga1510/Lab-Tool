import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import Toast from 'lightning/toast';
import getRequests  from '@salesforce/apex/ToolRequestController.getRequests';
import updateStatus from '@salesforce/apex/ToolRequestController.updateStatus';

export default class MyRequests extends LightningElement {

    @track requests     = [];
    @track isLoading    = true;

    applicationNumber = '';
    studentName       = '';
    isGuest           = true;   // default: no actions shown
    loggedInUser      = '';

    get hasRequests()  { return this.requests && this.requests.length > 0; }
    get showActions()  { return !this.isGuest; }

    /* ── Toast helper ── */
    showToast(label, message, variant = 'success') {
        Toast.show({ label, message, variant, mode: 'dismissible' }, this);
    }

    /* ── Read URL state ── */
    @wire(CurrentPageReference)
    setPageRef(pageRef) {
        if (pageRef?.state) {
            this.applicationNumber = pageRef.state.applicationNumber || '';
            this.studentName       = pageRef.state.studentName       || pageRef.state.studentId || '';
            this.isGuest           = pageRef.state.isGuest === 'true';
            this.loggedInUser      = pageRef.state.loggedInUser      || '';

            if (this.applicationNumber) {
                this.loadRequests();
            } else {
                this.isLoading = false;
            }
        }
    }

    /* ── Load requests ── */
    loadRequests() {
        this.isLoading = true;
        getRequests({ appNumber: this.applicationNumber })
            .then(result => {
                this.requests  = result.map(req => this.mapRequest(req));
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Load error:', error);
                this.showToast('Error', 'Failed to load requests.', 'error');
                this.isLoading = false;
            });
    }

    mapRequest(req) {
        const status = req.status__c || '';
        return {
            ...req,
            toolName      : req.Tool__r ? req.Tool__r.Name : 'N/A',
            statusClass   : this.getStatusClass(status),
            statusDisplay : status,
            isApproved    : status === 'Approved',
            isRejected    : status === 'Rejected',
            isPending     : status !== 'Approved' && status !== 'Rejected'
        };
    }

    /* ── Actions ── */
    handleApprove(event) { this.changeStatus(event.currentTarget.dataset.id, 'Approved'); }
    handleReject(event)  { this.changeStatus(event.currentTarget.dataset.id, 'Rejected'); }

    changeStatus(requestId, newStatus) {
        updateStatus({ requestId, status: newStatus })
            .then(() => {
                this.showToast('Success', `Request ${newStatus} successfully.`, 'success');
                this.loadRequests();
            })
            .catch(error => {
                const msg = error?.body?.message || error?.message || JSON.stringify(error);
                this.showToast('Error', `Update failed: ${msg}`, 'error');
            });
    }

    getStatusClass(status) {
        if (!status) return 'badge';
        if (status.includes('Approved')) return 'badge badge-approved';
        if (status.includes('Rejected')) return 'badge badge-rejected';
        return 'badge badge-pending';
    }
}