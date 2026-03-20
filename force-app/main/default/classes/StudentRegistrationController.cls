public with sharing class StudentRegistrationController {

    @AuraEnabled
    public static String registerStudent(String name, String email, String course) {

        Student__c s = new Student__c(
            Name = name,
            Email__c = email,
            Course__c = course
        );

        insert s;

        // Return Auto Number
        return s.Application_Number__c;
    }
}