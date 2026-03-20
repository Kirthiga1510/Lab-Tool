import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import Toast from 'lightning/toast';

import getTools     from '@salesforce/apex/ToolRequestController.getTools';
import createRequest from '@salesforce/apex/ToolRequestController.createRequest';
import getRequests  from '@salesforce/apex/ToolRequestController.getRequests';

export default class Toolrequest extends LightningElement {

    applicationNumber;
    requestDate;

    @track tools         = [];
    @track requestHistory = [];

    _wiredRequests; // store wired result for refreshApex

    columns = [
        { label: 'Request Number', fieldName: 'Name' },
        { label: 'Tool',           fieldName: 'ToolName' },
        { label: 'Quantity',       fieldName: 'Quantity_Requested__c' },
        { label: 'Date',           fieldName: 'Requested_Date__c' },
        { label: 'Status',         fieldName: 'Status__c' }  
    ];

    /* ── Read applicationNumber from URL state (LWR) ── */
    @wire(CurrentPageReference)
    handlePageRef(pageRef) {
        if (pageRef && pageRef.state) {
            this.applicationNumber = pageRef.state.applicationNumber || null;
        }
    }

    connectedCallback() {
        const today      = new Date();
        this.requestDate = today.toISOString().split('T')[0];
    }

    /* ── Load tools ── */
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

    /* ── Load request history ── */
    @wire(getRequests, { appNumber: '$applicationNumber' })
    loadRequests(result) {
        this._wiredRequests = result;        // keep reference for refreshApex
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

    /* ── Select / deselect tool ── */
    handleToolSelect(event) {
        const id = event.target.dataset.id;
        this.tools = this.tools.map(tool =>
            tool.id === id ? { ...tool, selected: event.target.checked } : tool
        );
    }

    /* ── Quantity change ── */
    handleQuantityChange(event) {
        const id  = event.target.dataset.id;
        const qty = parseInt(event.target.value, 10);
        const tool = this.tools.find(t => t.id === id);

        if (isNaN(qty) || qty <= 0) {
            Toast.show({ label: 'Invalid', message: 'Quantity must be greater than zero.', variant: 'warning' });
            event.target.value = '';
            return;
        }
        if (qty > tool.available) {
            Toast.show({ label: 'Exceeds stock', message: `Only ${tool.available} units available.`, variant: 'warning' });
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
            Toast.show({ label: 'Error', message: 'Application number is missing. Please navigate from the registration page.', variant: 'error' });
            return;
        }

        const selected = this.tools.filter(t => t.selected);

        if (selected.length === 0) {
            Toast.show({ label: 'No tools selected', message: 'Please select at least one tool.', variant: 'warning' });
            return;
        }

        // Validate quantities before sending
        const invalid = selected.find(t => !t.quantity || t.quantity <= 0);
        if (invalid) {
            Toast.show({ label: 'Missing quantity', message: `Please enter a quantity for "${invalid.name}".`, variant: 'warning' });
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
                Toast.show({ label: 'Success', message: 'Tool request submitted successfully!', variant: 'success' });

                // Deselect all tools and clear quantities
                this.tools = this.tools.map(t => ({ ...t, selected: false, quantity: '' }));

                // Refresh the wired history (no page reload needed)
                return refreshApex(this._wiredRequests);
            })
            .catch(error => {
                const msg = error?.body?.message || error?.message || 'Something went wrong.';
                Toast.show({ label: 'Error', message: msg, variant: 'error' });
            });
    }
}