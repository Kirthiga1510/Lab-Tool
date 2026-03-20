public class EmailUtility {

    public static void sendApprovalEmail(Id requestId){

        Tool_Request__c req = [
            SELECT Student__r.Email__c,
                   Tool__r.Name,
                   Quantity_Requested__c
            FROM Tool_Request__c
            WHERE Id = :requestId
        ];

        Messaging.SingleEmailMessage mail =
            new Messaging.SingleEmailMessage();

        mail.setToAddresses(
            new String[]{req.Student__r.Email__c}
        );

        mail.setSubject('Tool Request Approved');

        mail.setPlainTextBody(
            'Your tool request has been approved.\n\n' +
            'Tool: ' + req.Tool__r.Name + '\n' +
            'Quantity: ' + req.Quantity_Requested__c
        );

        Messaging.sendEmail(new Messaging.SingleEmailMessage[]{mail});

    }

}