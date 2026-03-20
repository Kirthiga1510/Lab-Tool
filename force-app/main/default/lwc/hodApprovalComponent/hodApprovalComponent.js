import { LightningElement, track, wire } from 'lwc';

import getLabApprovedRequests 
from '@salesforce/apex/HODApprovalController.getLabApprovedRequests';

import approveByHOD
from '@salesforce/apex/HODApprovalController.approveByHOD';

import rejectByHOD
from '@salesforce/apex/HODApprovalController.rejectByHOD';

export default class HodApprovalComponent
extends LightningElement {

@track requestList;



columns = [

{label:'Request Number', fieldName:'Name'},

{label:'Student', fieldName:'StudentName'},

{label:'Tool', fieldName:'ToolName'},

{label:'Quantity', fieldName:'Quantity__c'},

{label:'Status', fieldName:'Status__c'},

{
type:'button',
typeAttributes:{
label:'Approve',
name:'approve',
variant:'success'
}
},

{
type:'button',
typeAttributes:{
label:'Reject',
name:'reject',
variant:'destructive'
}
}

];



@wire(getLabApprovedRequests)
wiredRequests({data}){

if(data){

this.requestList = data.map(record=>{

return {

Id:record.Id,

Name:record.Name,

StudentName:record.Student__r.Name,

ToolName:record.Tool__r.Name,

Quantity__c:record.Quantity__c,

Status__c:record.Status__c

};

});

}

}



handleRowAction(event){

const action = event.detail.action.name;

const row = event.detail.row;



if(action === 'approve'){

approveByHOD({requestId:row.Id})

.then(()=>{

alert('Approved by HOD');

location.reload();

});

}



if(action === 'reject'){

rejectByHOD({requestId:row.Id})

.then(()=>{

alert('Rejected by HOD');

location.reload();

});

}

}

}