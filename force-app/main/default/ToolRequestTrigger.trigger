trigger ToolRequestTrigger on Tool_Request__c (after insert, after update) {

    Set<Id> studentIds = new Set<Id>();

    // Collect Student IDs safely
    for(Tool_Request__c req : Trigger.new){

        if(req.Student__c != null){

            studentIds.add(req.Student__c);

        }
    }


    // Query Student Emails safely
    Map<Id, Student__c> studentMap = new Map<Id, Student__c>();

    if(!studentIds.isEmpty()){

        studentMap = new Map<Id, Student__c>(

            [SELECT Id, Email__c
             FROM Student__c
             WHERE Id IN :studentIds]

        );
    }



    // AFTER INSERT → Email Lab Incharge
    if(Trigger.isAfter && Trigger.isInsert){

        for(Tool_Request__c req : Trigger.new){

            EmailUtility.sendEmail(

                'labincharge@gmail.com',

                'New Tool Request Created',

                'A new tool request has been submitted.'

            );

        }

    }



    // AFTER UPDATE → Status Change Email Automation
    if(Trigger.isAfter && Trigger.isUpdate){

        for(Tool_Request__c req : Trigger.new){

            Tool_Request__c oldReq = Trigger.oldMap.get(req.Id);

            Student__c student = studentMap.get(req.Student__c);



            // Lab Incharge Approved → Email HOD
            if(req.Status__c == 'Approved by Lab Incharge'
               && oldReq.Status__c != req.Status__c){

                EmailUtility.sendEmail(

                    'hod@gmail.com',

                    'Tool Request Approved by Lab Incharge',

                    'Please review the tool request.'

                );

            }



            // HOD Approved → Email Student
            if(req.Status__c == 'Approved by HOD'
               && oldReq.Status__c != req.Status__c
               && student != null
               && student.Email__c != null){

                EmailUtility.sendEmail(

                    student.Email__c,

                    'Tool Request Approved',

                    'Your tool request is approved by HOD.'

                );

            }



            // HOD Rejected → Email Student
            if(req.Status__c == 'Rejected by HOD'
               && oldReq.Status__c != req.Status__c
               && student != null
               && student.Email__c != null){

                EmailUtility.sendEmail(

                    student.Email__c,

                    'Tool Request Rejected',

                    'Your tool request is rejected by HOD.'

                );

            }

        }

    }

}