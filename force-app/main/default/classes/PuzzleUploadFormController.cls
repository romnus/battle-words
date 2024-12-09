public with sharing class PuzzleUploadFormController {
  @AuraEnabled(cacheable=false)
  public static Id processCfpFileUpload(String uploadedCfpId) {
    Dom.XmlNode crossFire = getPuzzleAsXml(uploadedCfpId);

    String grid = crossFire.getChildElement('GRID', null).getText();
    grid = grid.removeStart('\n');

    String title = crossFire.getChildElement('TITLE', null).getText();

    Puzzle__c puzzle = upsertPuzzle(grid, title);

    delete [SELECT Id FROM Answer_Row__c WHERE Puzzle__c = :puzzle.Id];

    List<Answer_Row__c> answerRowRecords = insertAnswerRowRecords(
      grid,
      puzzle.Id
    );

    insertClueAnswerPairs(crossFire, answerRowRecords);

    return puzzle.Id;
  }

  private static Dom.XmlNode getPuzzleAsXml(String uploadedCfpId) {
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

  private static Puzzle__c upsertPuzzle(String grid, String title) {
    Puzzle__c puzzle = new Puzzle__c();

    List<Puzzle__c> puzzles = [
      SELECT Id, Name
      FROM Puzzle__c
      WHERE Name = :title
    ];

    if (!puzzles.isEmpty()) {
      puzzle = puzzles[0];
    }

    puzzle.Name = title;
    puzzle.Size_Across__c = grid.indexOf('\n');
    puzzle.Size_Top__c = grid.countMatches('\n');

    upsert puzzle;

    return puzzle;
  }

  private static List<Answer_Row__c> insertAnswerRowRecords(
    String grid,
    Id puzzleId
  ) {
    List<String> answerRows = grid.split('\n');

    List<Answer_Row__c> answerRowRecords = new List<Answer_Row__c>();

    Integer answerRowLocation = 1;

    for (String answerRow : answerRows) {
      List<String> answers = answerRow.split('\\.');

      Answer_Row__c answerRowRecord = new Answer_Row__c();
      answerRowRecord.Puzzle__c = puzzleId;
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

    List<Clue_Answer_Pair__c> clueAnswerPairs = new List<Clue_Answer_Pair__c>();

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
        Clue_Answer_Pair__c clueAnswerPair = new Clue_Answer_Pair__c();

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
