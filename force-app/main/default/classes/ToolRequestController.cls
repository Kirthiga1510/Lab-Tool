public without sharing class ToolRequestController {

    /* ── STUDENT REGISTRATION ───────────────────────────────────────────────*/
    @AuraEnabled
    public static Map<String, String> registerStudent(String name, String email, String course) {
        try {
            Student__c s = new Student__c(
                Name      = name,
                Email__c  = email,
                Course__c = course
            );
            insert s;

            Student__c stu = [
                SELECT Id, Application_Number__c
                FROM   Student__c
                WHERE  Id = :s.Id
                LIMIT  1
            ];

            return new Map<String, String>{
                'studentId'         => (String) stu.Id,
                'applicationNumber' => stu.Application_Number__c
            };
        } catch (Exception e) {
            throw new AuraHandledException('Registration failed: ' + e.getMessage());
        }
    }


    /* ── GET TOOLS ──────────────────────────────────────────────────────────*/
    @AuraEnabled(cacheable=true)
    public static List<Tool__c> getTools() {
        try {
            return [
                SELECT Id, Name, Quantity_Available__c
                FROM   Tool__c
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Failed to load tools: ' + e.getMessage());
        }
    }


    /* ── CREATE TOOL REQUEST ────────────────────────────────────────────────*/
    @AuraEnabled
    public static void createRequest(String appNumber, String toolId, Integer qty) {
        try {
            if (String.isBlank(appNumber)) {
                throw new AuraHandledException('Application number is required.');
            }
            if (String.isBlank(toolId)) {
                throw new AuraHandledException('Tool ID is required.');
            }
            if (qty == null || qty <= 0) {
                throw new AuraHandledException('Quantity must be greater than zero.');
            }

            List<Student__c> stuList = [
                SELECT Id, Email__c
                FROM   Student__c
                WHERE  Application_Number__c = :appNumber
                LIMIT  1
            ];

            if (stuList.isEmpty()) {
                throw new AuraHandledException('No student found for application number: ' + appNumber);
            }

            Student__c stu = stuList[0];

            List<Tool__c> toolList = [
                SELECT Id, Quantity_Available__c
                FROM   Tool__c
                WHERE  Id = :toolId
                LIMIT  1
            ];

            if (toolList.isEmpty()) {
                throw new AuraHandledException('Tool not found.');
            }

            Tool__c tool = toolList[0];

            if (tool.Quantity_Available__c == null || qty > tool.Quantity_Available__c) {
                throw new AuraHandledException('Quantity exceeds available stock.');
            }

            Tool_Request__c req = new Tool_Request__c(
                Student__c            = stu.Id,
                Student_Email__c      = stu.Email__c,
                Tool__c               = toolId,
                Quantity_Requested__c = qty,
                Requested_Date__c     = Date.today(),
                Status__c             = 'Pending Lab Incharge'
            );
            insert req;

            tool.Quantity_Available__c = tool.Quantity_Available__c - qty;
            update tool;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to create request: ' + e.getMessage());
        }
    }


    /* ── GET STUDENT REQUESTS ───────────────────────────────────────────────*/
    @AuraEnabled(cacheable=true)
    public static List<Tool_Request__c> getRequests(String appNumber) {
        try {
            if (String.isBlank(appNumber)) {
                return new List<Tool_Request__c>();
            }

            List<Student__c> stuList = [
                SELECT Id
                FROM   Student__c
                WHERE  Application_Number__c = :appNumber
                LIMIT  1
            ];

            if (stuList.isEmpty()) {
                return new List<Tool_Request__c>();
            }

            return [
                SELECT Id,
                       Name,
                       Quantity_Requested__c,
                       Requested_Date__c,
                       Status__c,
                       Tool__r.Name
                FROM   Tool_Request__c
                WHERE  Student__c = :stuList[0].Id
                ORDER BY CreatedDate DESC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Failed to load requests: ' + e.getMessage());
        }
    }


    /* ── SEARCH SUGGESTIONS ─────────────────────────────────────────────────*/
    @AuraEnabled(cacheable=true)
    public static List<Student__c> searchSuggestions(String keyword) {
        try {
            if (String.isBlank(keyword)) {
                return new List<Student__c>();
            }
            return [
                SELECT Id, Application_Number__c, Name
                FROM   Student__c
                WHERE  Application_Number__c LIKE :('%' + keyword + '%')
                LIMIT  5
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Search failed: ' + e.getMessage());
        }
    }


    /* ── UPDATE REQUEST STATUS ──────────────────────────────────────────────*/
    @AuraEnabled
    public static void updateStatus(Id requestId, String status) {
        try {
            Tool_Request__c req = new Tool_Request__c(
                Id        = requestId,
                status__c = status
            );
            update req;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}