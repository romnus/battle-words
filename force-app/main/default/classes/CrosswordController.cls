public with sharing class CrosswordController {
  private static final String ACROSS = 'ACROSS';

  @AuraEnabled(cacheable=true)
  public static String getGridRowDtos(Id crosswordId) {
    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs = [
      SELECT
        Id,
        Answer__c,
        Location__c,
        Number__c,
        Direction__c,
        Crossword__r.Size_Top__c,
        Crossword__r.Size_Across__c
      FROM Crossword_Clue_Answer_Pair__c
      WHERE Crossword__c = :crosswordId
      ORDER BY Number__c ASC
    ];

    Integer sizeTop = Integer.valueOf(
      clueAnswerPairs[0].Crossword__r.Size_Top__c
    );
    Integer sizeAcross = Integer.valueOf(
      clueAnswerPairs[0].Crossword__r.Size_Across__c
    );

    List<Square> squares = getSquares(sizeTop, sizeAcross);

    squares = setAnswerSquares(squares, clueAnswerPairs, sizeTop);

    String gridRowsAsJSON = makeGridRowsAsJSON(squares, sizeAcross, sizeTop);

    return gridRowsAsJSON;
  }

  @AuraEnabled(cacheable=true)
  public static List<Crossword__c> getCrosswordsWithAttemptAndFirstClueAnswerPair() {
    return [
      SELECT
        Id,
        Name,
        Size_Across__c,
        Size_Top__c,
        Release_Date__c,
        (
          SELECT
            Id,
            Percentage_Complete__c,
            Last_Active_Clue_Answer_Pair_Id__c,
            Last_Active_Square__c
          FROM Crossword_Attempts__r
          WHERE Player__c = :UserInfo.getUserId()
          LIMIT 1
        ),
        (
          SELECT Id
          FROM Crossword_Clue_Answer_Pair__r
          WHERE Direction__c = :ACROSS AND Number__c = 1
          LIMIT 1
        )
      FROM Crossword__c
      ORDER BY Release_Date__c DESC
    ];
  }

  @AuraEnabled(cacheable=true)
  public static User getPlayer() {
    return [
      SELECT Last_Played_Crossword_Id__c
      FROM User
      WHERE Id = :UserInfo.getUserId()
    ];
  }

  private static List<Square> getSquares(Integer sizeTop, Integer sizeAcross) {
    List<Square> squares = new List<Square>();

    for (Integer i = 0; i < sizeTop * sizeAcross; i++) {
      Square square = new Square();
      square.id = i + 1;

      squares.add(square);
    }

    return squares;
  }

  private static List<Square> setAnswerSquares(
    List<Square> squares,
    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs,
    Integer sizeTop
  ) {
    for (Crossword_Clue_Answer_Pair__c clueAnswerPair : clueAnswerPairs) {
      Integer startingSquareLocation = Integer.valueOf(
        clueAnswerPair.Location__c - 1
      );

      Square startingSquare = squares.get(startingSquareLocation);
      startingSquare.clueNumber = Integer.valueOf(clueAnswerPair.Number__c);

      String answer = clueAnswerPair.Answer__c;

      for (
        Integer characterCounter = 0;
        characterCounter < answer.length();
        characterCounter++
      ) {
        if (clueAnswerPair.Direction__c == ACROSS) {
          Integer id = startingSquareLocation + characterCounter;

          Square currentSquare = squares.get(id);

          String value = answer.substring(
            characterCounter,
            characterCounter + 1
          );

          currentSquare.value = value;
          currentSquare.clueAnswerPairIdAcross = clueAnswerPair.Id;
        } else {
          Integer id = startingSquareLocation + characterCounter * sizeTop;

          Square currentSquare = squares.get(id);

          currentSquare.clueAnswerPairIdDown = clueAnswerPair.Id;
        }
      }
    }

    return squares;
  }

  private static String makeGridRowsAsJSON(
    List<Square> squares,
    Integer sizeAcross,
    Integer sizeTop
  ) {
    List<GridRowDto> gridRowDtos = new List<GridRowDto>();
    gridRowDtos.add(new GridRowDto(0));

    for (Square square : squares) {
      gridRowDtos[gridRowDtos.size() - 1].squares.add(square);

      if (
        Math.mod(square.id, sizeAcross) == 0 &&
        gridRowDtos.size() != sizeTop
      ) {
        Integer rowLocation = gridRowDtos.size();

        gridRowDtos.add(new GridRowDto(rowLocation));
      }
    }

    return JSON.serialize(gridRowDtos);
  }

  @AuraEnabled(cacheable=true)
  public static List<Crossword_Clue_Answer_Pair__c> getClues(Id crosswordId) {
    List<Crossword_Clue_Answer_Pair__c> clues = [
      SELECT Id, Clue__c, Number__c, Direction__c
      FROM Crossword_Clue_Answer_Pair__c
      WHERE Crossword__c = :crosswordId
      ORDER BY Direction__c ASC, Number__c ASC
    ];

    return clues;
  }

  @TestVisible
  private class GridRowDto {
    @TestVisible
    Integer rowLocation { get; set; }

    @TestVisible
    List<Square> squares { get; set; }

    public GridRowDto(Integer rowLocation) {
      this.rowLocation = rowLocation;
      this.squares = new List<Square>();
    }
  }

  private class Square {
    Integer id { get; set; }
    String value { get; set; }
    Integer clueNumber { get; set; }
    Id clueAnswerPairIdAcross { get; set; }
    Id clueAnswerPairIdDown { get; set; }
  }
}
