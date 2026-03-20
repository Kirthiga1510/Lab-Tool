import { LightningElement, track } from 'lwc';

export default class MainContainer extends LightningElement {

    @track appNumber;

    handleStudent(event){

        this.appNumber = event.detail;

    }

}