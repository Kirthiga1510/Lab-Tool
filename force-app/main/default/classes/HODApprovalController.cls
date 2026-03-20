public with sharing class HODApprovalController {

    @AuraEnabled(cacheable=true)
    public static List<Tool_Request__c> getLabApprovedRequests(){

        return [

            SELECT Id,
                   Name,
                   Student__r.Name,
                   Student__r.Email__c,
                   Tool__r.Name,
                   Status__c,
                   Requested_Date__c

            FROM Tool_Request__c

            WHERE Status__c = 'Approved by Lab Incharge'

            ORDER BY CreatedDate DESC
        ];
    }


    @AuraEnabled
    public static void approveByHOD(Id requestId){

        Tool_Request__c req =
        [SELECT Id, Student__r.Email__c
         FROM Tool_Request__c
         WHERE Id = :requestId];

        req.Status__c = 'Approved by HOD';

        update req;

        sendEmail(req.Student__r.Email__c,
                  'Approved by HOD');
    }


    @AuraEnabled
    public static void rejectByHOD(Id requestId){

        Tool_Request__c req =
        [SELECT Id, Student__r.Email__c
         FROM Tool_Request__c
         WHERE Id = :requestId];

        req.Status__c = 'Rejected by HOD';

        update req;

        sendEmail(req.Student__r.Email__c,
                  'Rejected by HOD');
    }



    public static void sendEmail(String email,
                                 String status){

        Messaging.SingleEmailMessage mail =
        new Messaging.SingleEmailMessage();

        mail.setToAddresses(new String[]{email});

        mail.setSubject('Tool Request Status');

        mail.setPlainTextBody(
            'Your Tool Request is ' + status
        );

        Messaging.sendEmail(
            new Messaging.SingleEmailMessage[]{mail}
        );
    }

}