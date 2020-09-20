public with sharing class SnakeGameController {
    @AuraEnabled(cacheable=true)
    public static List<Score__c> getTopTenScoreList(){
        return [SELECT Id, Score__c, Player_Name__c, CreatedDate
                FROM Score__c
                WHERE CreatedByGuestUser__c = true
                AND Score__c > 0
                WITH SECURITY_ENFORCED
                ORDER BY Score__c DESC                
                LIMIT 10];
    }
}
