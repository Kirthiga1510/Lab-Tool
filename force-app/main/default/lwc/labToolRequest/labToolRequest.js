import { LightningElement } from 'lwc';

import createRequest
from '@salesforce/apex/labToolRequestController.createRequest';

export default class LabToolRequest extends LightningElement {

studentId;
toolId;
quantity;

handleStudent(event){
this.studentId = event.target.value;
}

handleTool(event){
this.toolId = event.target.value;
}

handleQuantity(event){
this.quantity = event.target.value;
}

createRequest(){

createRequest({

studentId: this.studentId,
toolId: this.toolId,
quantity: this.quantity

})

.then(()=>{
alert("Request submitted successfully");
})

.catch(error=>{
console.error(error);
});

}

}