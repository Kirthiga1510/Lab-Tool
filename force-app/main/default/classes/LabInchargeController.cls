public with sharing class LabInchargeController {

    @AuraEnabled(cacheable=true)
    public static List<Tool_Request__c> getPendingRequests(){

        return [
            SELECT Id,
                   Name,
                   Student__r.Name,
                   Student__r.Application_Number__c,
                   Tool__r.Name,
                   Quantity_Requested__c,
                   Status__c,
                   Requested_Date__c
            FROM Tool_Request__c
            WHERE Status__c = 'Pending'
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static void approveRequest(Id requestId){

        Tool_Request__c req = [
            SELECT Id, Status__c
            FROM Tool_Request__c
            WHERE Id = :requestId
        ];

        req.Status__c = 'Pending HOD';

        update req;
    }

    @AuraEnabled
    public static void rejectRequest(Id requestId){

        Tool_Request__c req = [
            SELECT Id, Status__c
            FROM Tool_Request__c
            WHERE Id = :requestId
        ];

        req.Status__c = 'Rejected';

        update req;
    }

}