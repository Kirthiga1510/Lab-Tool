import { LightningElement } from 'lwc';

export default class ToolPortalHome extends LightningElement {

    openStudent() {
        window.location.href = '/student-registration';
    }

    openToolRequest() {
        window.location.href = '/tool-request';
    }

}