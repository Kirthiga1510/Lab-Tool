import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import Toast from 'lightning/toast';

import getTools      from '@salesforce/apex/ToolRequestController.getTools';
import createRequest from '@salesforce/apex/ToolRequestController.createRequest';
import getRequests   from '@salesforce/apex/ToolRequestController.getRequests';

export default class Toolrequest extends LightningElement {

    applicationNumber = '';
    studentId         = '';
    requestDate       = '';

    @track tools          = [];
    @track requestHistory = [];

    _wiredRequests;

    /* ── Read URL state ── */
    @wire(CurrentPageReference)
    handlePageRef(pageRef) {
        if (pageRef?.state) {
            this.applicationNumber = pageRef.state.applicationNumber || '';
            this.studentId         = pageRef.state.studentId         || '';
        }
    }

    connectedCallback() {
        const today      = new Date();
        this.requestDate = today.toISOString().split('T')[0];
    }

    /* ── Toast helper ── */
    showToast(label, message, variant = 'success') {
        Toast.show({ label, message, variant, mode: 'dismissible' }, this);
    }

    /* ── Load tools (cacheable wire) ── */
    @wire(getTools)
    wiredTools({ data, error }) {
        if (data) {
            this.tools = data.map(tool => ({
                id:       tool.Id,
                name:     tool.Name,
                available: tool.Quantity_Available__c,
                selected: false,
                quantity: ''
            }));
        } else if (error) {
            console.error('getTools error', error);
        }
    }

    /* ── Load request history (reactive on applicationNumber) ── */
    @wire(getRequests, { appNumber: '$applicationNumber' })
    loadRequests(result) {
        this._wiredRequests = result;
        const { data, error } = result;
        if (data) {
            this.requestHistory = data.map(row => ({
                ...row,
                ToolName: row.Tool__r ? row.Tool__r.Name : ''
            }));
        } else if (error) {
            console.error('getRequests error', error);
        }
    }

    get hasHistory() { return this.requestHistory && this.requestHistory.length > 0; }

    /* ── Select / deselect tool ── */
    handleToolSelect(event) {
        const id = event.target.dataset.id;
        this.tools = this.tools.map(t =>
            t.id === id ? { ...t, selected: event.target.checked, quantity: event.target.checked ? t.quantity : '' } : t
        );
    }

    /* ── Quantity change ── */
    handleQuantityChange(event) {
        const id   = event.target.dataset.id;
        const qty  = parseInt(event.target.value, 10);
        const tool = this.tools.find(t => t.id === id);

        if (isNaN(qty) || qty <= 0) {
            this.showToast('Invalid', 'Quantity must be greater than zero.', 'warning');
            event.target.value = '';
            return;
        }
        if (tool && qty > tool.available) {
            this.showToast('Exceeds stock', `Only ${tool.available} units available.`, 'warning');
            event.target.value = '';
            return;
        }
        this.tools = this.tools.map(t =>
            t.id === id ? { ...t, quantity: qty } : t
        );
    }

    /* ── Submit ── */
    handleSubmit() {
        if (!this.applicationNumber) {
            this.showToast('Error', 'Application number is missing.', 'error');
            return;
        }

        const selected = this.tools.filter(t => t.selected);

        if (selected.length === 0) {
            this.showToast('No tools selected', 'Please select at least one tool.', 'warning');
            return;
        }

        const invalid = selected.find(t => !t.quantity || t.quantity <= 0);
        if (invalid) {
            this.showToast('Missing quantity', `Please enter a quantity for "${invalid.name}".`, 'warning');
            return;
        }

        const allRequests = selected.map(tool =>
            createRequest({
                appNumber: this.applicationNumber,
                toolId:    tool.id,
                qty:       tool.quantity
            })
        );

        Promise.all(allRequests)
            .then(() => {
                this.showToast('Success', 'Tool request submitted successfully!', 'success');
                // Reset selections
                this.tools = this.tools.map(t => ({ ...t, selected: false, quantity: '' }));
                return refreshApex(this._wiredRequests);
            })
            .catch(error => {
                const msg = error?.body?.message || error?.message || 'Something went wrong.';
                this.showToast('Error', msg, 'error');
            });
    }
}