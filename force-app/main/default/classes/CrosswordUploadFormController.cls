public with sharing class CrosswordUploadFormController {
  @AuraEnabled(cacheable=false)
  public static Id processCfpFileUpload(String uploadedCfpId) {
    Dom.XmlNode crossFire = getCrosswordAsXml(uploadedCfpId);

    String grid = crossFire.getChildElement('GRID', null).getText();
    grid = grid.removeStart('\n');

    String title = crossFire.getChildElement('TITLE', null).getText();

    Crossword__c crossword = upsertCrossword(grid, title);

    delete [SELECT Id FROM Answer_Row__c WHERE Crossword__c = :crossword.Id];

    List<Answer_Row__c> answerRowRecords = insertAnswerRowRecords(
      grid,
      crossword.Id
    );

    insertClueAnswerPairs(crossFire, answerRowRecords);

    return '';
  }

  private static Dom.XmlNode getCrosswordAsXml(String uploadedCfpId) {
    ContentVersion cfpFile = [
      SELECT VersionData
      FROM ContentVersion
      WHERE ContentDocumentId = :uploadedCfpId AND IsLatest = TRUE
    ];

    String data = cfpFile.VersionData.toString();

    Dom.Document domDocument = new Dom.Document();
    domDocument.load(data);

    Dom.XmlNode crossFire = domDocument.getRootElement();

    return crossFire;
  }

  private static Crossword__c upsertCrossword(String grid, String title) {
    Crossword__c crossword = new Crossword__c();

    List<Crossword__c> crosswords = [
      SELECT Id, Name
      FROM Crossword__c
      WHERE Name = :title
    ];

    if (!crosswords.isEmpty()) {
      crossword = crosswords[0];
    }

    crossword.Name = title;
    crossword.Size_Across__c = grid.indexOf('\n');
    crossword.Size_Top__c = grid.countMatches('\n');

    upsert crossword;

    return crossword;
  }

  private static List<Answer_Row__c> insertAnswerRowRecords(
    String grid,
    Id crosswordId
  ) {
    List<String> answerRows = grid.split('\n');

    List<Answer_Row__c> answerRowRecords = new List<Answer_Row__c>();

    Integer answerRowLocation = 1;

    for (String answerRow : answerRows) {
      List<String> answers = answerRow.split('\\.');

      Answer_Row__c answerRowRecord = new Answer_Row__c();
      answerRowRecord.Crossword__c = crosswordId;
      answerRowRecord.Answer_Row_Text__c = answerRow;
      answerRowRecord.Answer_Row_Location__c = answerRowLocation;

      answerRowRecords.add(answerRowRecord);

      answerRowLocation++;
    }

    insert answerRowRecords;

    return answerRowRecords;
  }

  private static void insertClueAnswerPairs(
    Dom.XmlNode crossFire,
    List<Answer_Row__c> answerRowRecords
  ) {
    List<Dom.XmlNode> clueNodes = crossFire.getChildElement('WORDS', null)
      .getChildElements();

    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs = new List<Crossword_Clue_Answer_Pair__c>();

    Integer answerId = 0;

    for (Answer_Row__c answerRowRecord : answerRowRecords) {
      List<String> answersWithBlanks = answerRowRecord.Answer_Row_Text__c.split(
        '\\.'
      );

      List<String> answers = new List<String>();

      for (String answer : answersWithBlanks) {
        if (!String.isBlank(answer)) {
          answers.add(answer);
        }
      }

      for (String answer : answers) {
        Crossword_Clue_Answer_Pair__c clueAnswerPair = new Crossword_Clue_Answer_Pair__c();

        Dom.XmlNode clueNode = clueNodes[answerId];

        clueAnswerPair.Answer_Row__c = answerRowRecord.Id;
        clueAnswerPair.Clue__c = clueNode.getText();
        clueAnswerPair.Answer__c = answer;
        clueAnswerPair.Direction__c = clueNode.getAttributeValue('dir', null);
        clueAnswerPair.Answer_ID__c = answerId;

        answerId++;

        clueAnswerPairs.add(clueAnswerPair);
      }
    }

    insert clueAnswerPairs;
  }
}
