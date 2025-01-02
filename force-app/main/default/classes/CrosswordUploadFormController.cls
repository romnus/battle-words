public with sharing class CrosswordUploadFormController {
  private static final String ACROSS = 'ACROSS';
  private static final String DOWN = 'DOWN';
  private static final String NEWLINE = '\n';
  private static final String PERIOD = '.';

  private static final List<String> CLUE_ENDING_SQUARE_VALUES = new List<String>{
    PERIOD,
    NEWLINE
  };

  @AuraEnabled(cacheable=false)
  public static Id processCfpFileUpload(String uploadedCfpId) {
    Dom.XmlNode crossFire = getCrosswordAsXml(uploadedCfpId);

    Crossword__c crossword = upsertCrossword(crossFire);

    delete [
      SELECT Id
      FROM Crossword_Clue_Answer_Pair__c
      WHERE Crossword__c = :crossword.Id
    ];

    insertClueAnswerPairs(crossword, crossFire);

    return crossword.Id;
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

  private static Crossword__c upsertCrossword(Dom.XmlNode crossFire) {
    String title = crossFire.getChildElement('TITLE', null).getText();

    Crossword__c crossword = new Crossword__c();

    List<Crossword__c> crosswords = [
      SELECT Id, Name
      FROM Crossword__c
      WHERE Name = :title
    ];

    if (!crosswords.isEmpty()) {
      crossword = crosswords[0];
    }

    Integer gridSize = Integer.valueOf(
      crossFire.getChildElement('GRID', null).getAttributeValue('width', null)
    );

    crossword.Name = title;
    crossword.Size_Across__c = gridSize;
    crossword.Size_Top__c = gridSize;

    upsert crossword;

    return crossword;
  }

  private static void insertClueAnswerPairs(
    Crossword__c crossword,
    Dom.XmlNode crossFire
  ) {
    String answersWithBlackSquares = crossFire.getChildElement('GRID', null)
      .getText()
      .removeStart('\n');

    List<Dom.XmlNode> clueNodes = crossFire.getChildElement('WORDS', null)
      .getChildElements();

    List<Crossword_Clue_Answer_Pair__c> clueAnwerPairs = getAcrossClueAnswerPairs(
      answersWithBlackSquares,
      clueNodes,
      crossword
    );

    insert clueAnwerPairs;
  }

  private static List<Crossword_Clue_Answer_Pair__c> getAcrossClueAnswerPairs(
    String answersWithBlackSquares,
    List<Dom.XmlNode> clueNodes,
    Crossword__c crossword
  ) {
    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs = new List<Crossword_Clue_Answer_Pair__c>();

    Integer pointer = 0;
    Integer clueCounter = 0;

    Integer endOfGrid = answersWithBlackSquares.length() - 1;
    String direction = ACROSS;

    Integer distanceFromPreviousSquare = 1;

    Boolean isAnswerGridStillBeingProcessed = true;

    while (isAnswerGridStillBeingProcessed) {
      if (pointer == endOfGrid) {
        distanceFromPreviousSquare = 16;
        pointer = 0;
        direction = DOWN;
      }

      if (
        isSquareValueBeginningOfAnswer(
          answersWithBlackSquares,
          direction,
          pointer,
          distanceFromPreviousSquare
        )
      ) {
        Dom.XmlNode clueNode = clueNodes[clueCounter];

        Crossword_Clue_Answer_Pair__c clueAnswerPair = new Crossword_Clue_Answer_Pair__c();
        clueAnswerPair.Crossword__c = crossword.Id;
        clueAnswerPair.Clue__c = clueNode.getText();

        String answer = getAnswer(
          answersWithBlackSquares,
          pointer,
          distanceFromPreviousSquare
        );
        clueAnswerPair.Answer__c = answer;

        clueAnswerPair.Answer_ID__c = clueCounter;
        clueAnswerPair.Direction__c = direction;

        Integer location =
          pointer +
          1 -
          answersWithBlackSquares.substring(0, pointer).countMatches(NEWLINE);
        clueAnswerPair.Location__c = location;

        clueAnswerPairs.add(clueAnswerPair);

        clueCounter++;

        isAnswerGridStillBeingProcessed = clueCounter < clueNodes.size();
      }

      pointer++;
    }

    return clueAnswerPairs;
  }

  private static Boolean isSquareValueBeginningOfAnswer(
    String answersWithBlackSquares,
    String direction,
    Integer pointer,
    Integer distanceFromPreviousSquare
  ) {
    Boolean isSquareValueBeginningOfAnswer = false;

    Integer locationOfSquareValueBeforeCurrentSquareValue =
      pointer - distanceFromPreviousSquare;

    Boolean isSquareValueInFirstRowAndDirectionIsDown =
      direction == DOWN &&
      locationOfSquareValueBeforeCurrentSquareValue < 0;

    Boolean isFirstSquare = pointer == 0;

    String currentSquareValue = answersWithBlackSquares.substring(
      pointer,
      pointer + 1
    );

    if (!CLUE_ENDING_SQUARE_VALUES.contains(currentSquareValue)) {
      if (
        isSquareValueInFirstRowAndDirectionIsDown ||
        isFirstSquare ||
        CLUE_ENDING_SQUARE_VALUES.contains(
          answersWithBlackSquares.substring(
            locationOfSquareValueBeforeCurrentSquareValue,
            locationOfSquareValueBeforeCurrentSquareValue + 1
          )
        )
      ) {
        isSquareValueBeginningOfAnswer = true;
      }
    }

    return isSquareValueBeginningOfAnswer;
  }

  private static String getAnswer(
    String answersWithBlackSquares,
    Integer pointer,
    Integer distanceFromPreviousSquare
  ) {
    String answer = '';

    for (
      Integer i = pointer;
      i < answersWithBlackSquares.length();
      i += distanceFromPreviousSquare
    ) {
      String currentSquareValue = answersWithBlackSquares.substring(i, i + 1);

      if (!CLUE_ENDING_SQUARE_VALUES.contains(currentSquareValue)) {
        answer += currentSquareValue;
      } else if (
        CLUE_ENDING_SQUARE_VALUES.contains(currentSquareValue) &&
        !String.isBlank(answer)
      ) {
        break;
      }
    }

    return answer;
  }
}
