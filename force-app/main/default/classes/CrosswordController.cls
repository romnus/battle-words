public with sharing class CrosswordController {
  private static final String ACROSS = 'ACROSS';

  @AuraEnabled(cacheable=true)
  public static String getGridRowDtos(Crossword_Attempt__c attempt) {
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
      WHERE Crossword__c = :attempt.Crossword__c
      ORDER BY Number__c ASC
    ];

    Integer sizeTop = Integer.valueOf(
      clueAnswerPairs[0].Crossword__r.Size_Top__c
    );
    Integer sizeAcross = Integer.valueOf(
      clueAnswerPairs[0].Crossword__r.Size_Across__c
    );

    List<Crossword_Guess__c> guesses = [
      SELECT Id, Input__c, Square_Id__c
      FROM Crossword_Guess__c
      WHERE Attempt__c = :attempt.Id
    ];

    Map<Integer, Crossword_Guess__c> guessBySquareId = getGuessBySquareId(
      guesses
    );

    Map<Integer, Square> squareBySquareId = getSquareBySquareId(
      attempt.Crossword__c,
      sizeTop,
      sizeAcross
    );

    squareBySquareId = setAnswerSquares(
      squareBySquareId,
      clueAnswerPairs,
      sizeTop,
      guessBySquareId
    );

    String gridRowsAsJSON = makeGridRowsAsJSON(
      squareBySquareId.values(),
      sizeAcross,
      sizeTop
    );

    return gridRowsAsJSON;
  }

  @AuraEnabled(cacheable=false)
  public static List<Crossword_Attempt__c> getMostRecentAttempt() {
    return [
      SELECT
        Id,
        Percentage_Complete__c,
        Last_Active_Clue_Answer_Pair_Id__c,
        Last_Active_Square__c,
        Last_Active_Clue_Answer_Pair_Id__r.Direction__c,
        Crossword__c,
        Crossword__r.Name
      FROM Crossword_Attempt__c
      WHERE CreatedById = :UserInfo.getUserId()
      ORDER BY LastModifiedDate DESC
      LIMIT 1
    ];
  }
  @AuraEnabled(cacheable=true)
  public static Crossword__c getMostRecentlyCreatedCrossword() {
    return [
      SELECT
        Id,
        (
          SELECT Id
          FROM Crossword_Clue_Answer_Pair__r
          WHERE Direction__c = :ACROSS AND Number__c = 1
          LIMIT 1
        )
      FROM Crossword__c
      ORDER BY CreatedDate DESC
      LIMIT 1
    ];
  }

  @AuraEnabled(cacheable=false)
  public static List<Crossword_Attempt__c> createAttemptForMostRecentlyCreatedCrossword() {
    Crossword__c crossword = getMostRecentlyCreatedCrossword();

    return createAttempt(crossword);
  }

  @AuraEnabled(cacheable=false)
  public static List<Crossword_Attempt__c> createAttemptForCrossword(
    Id crosswordId
  ) {
    Crossword__c crossword = [
      SELECT
        Id,
        (
          SELECT Id
          FROM Crossword_Clue_Answer_Pair__r
          WHERE Direction__c = :ACROSS AND Number__c = 1
          LIMIT 1
        )
      FROM Crossword__c
      WHERE Id = :crosswordId
    ];

    return createAttempt(crossword);
  }

  private static List<Crossword_Attempt__c> createAttempt(
    Crossword__c crossword
  ) {
    Crossword_Attempt__c attempt = new Crossword_Attempt__c();

    attempt.Crossword__c = crossword.Id;
    attempt.Minutes_Spent__c = 0;
    attempt.Seconds_Spent__c = 0;
    attempt.Percentage_Complete__c = 0;
    attempt.Last_Active_Square__c = 0;
    attempt.Last_Active_Clue_Answer_Pair_Id__c = crossword.Crossword_Clue_Answer_Pair__r[0]
      .Id;

    insert attempt;

    return getMostRecentAttemptWithCrosswordId(crossword.Id);
  }

  @AuraEnabled(cacheable=false)
  public static List<Crossword_Attempt__c> getMostRecentAttemptWithCrosswordId(
    Id crosswordId
  ) {
    return [
      SELECT
        Id,
        Percentage_Complete__c,
        Last_Active_Clue_Answer_Pair_Id__c,
        Last_Active_Clue_Answer_Pair_Id__r.Direction__c,
        Last_Active_Square__c,
        Crossword__c,
        Crossword__r.Name
      FROM Crossword_Attempt__c
      WHERE CreatedById = :UserInfo.getUserId() AND Crossword__c = :crosswordId
      LIMIT 1
    ];
  }

  @AuraEnabled(cacheable=true)
  public static List<Crossword__c> getCrosswordsWithAttempt() {
    return [
      SELECT
        Id,
        Name,
        Size_Across__c,
        Size_Top__c,
        Release_Date__c,
        (
          SELECT Percentage_Complete__c
          FROM Crossword_Attempts__r
          WHERE CreatedById = :UserInfo.getUserId()
          LIMIT 1
        )
      FROM Crossword__c
      ORDER BY Release_Date__c DESC
    ];
  }

  private static Map<Integer, Square> getSquareBySquareId(
    Id crosswordId,
    Integer sizeTop,
    Integer sizeAcross
  ) {
    Map<Integer, Square> squareBySquareId = new Map<Integer, Square>();

    for (Integer i = 0; i < sizeTop * sizeAcross; i++) {
      Integer squareId = i + 1;

      Square square = new Square();
      square.key = crosswordId + String.valueOf(i);
      square.squareId = squareId;

      squareBySquareId.put(squareId, square);
    }

    return squareBySquareId;
  }

  private static Map<Integer, Crossword_Guess__c> getGuessBySquareId(
    List<Crossword_Guess__c> guesses
  ) {
    Map<Integer, Crossword_Guess__c> guessBySquareId = new Map<Integer, Crossword_Guess__c>();

    for (Crossword_Guess__c guess : guesses) {
      guessBySquareId.put(Integer.valueOf(guess.Square_Id__c), guess);
    }

    return guessBySquareId;
  }

  private static Map<Integer, Square> setAnswerSquares(
    Map<Integer, Square> squareBySquareId,
    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs,
    Integer sizeTop,
    Map<Integer, Crossword_Guess__c> guessBySquareId
  ) {
    for (Crossword_Clue_Answer_Pair__c clueAnswerPair : clueAnswerPairs) {
      Integer startingSquareLocation = Integer.valueOf(
        clueAnswerPair.Location__c
      );

      Square startingSquare = squareBySquareId.get(startingSquareLocation);
      startingSquare.clueNumber = Integer.valueOf(clueAnswerPair.Number__c);

      String answer = clueAnswerPair.Answer__c;

      for (
        Integer characterCounter = 0;
        characterCounter < answer.length();
        characterCounter++
      ) {
        if (clueAnswerPair.Direction__c == ACROSS) {
          Integer squareId = startingSquareLocation + characterCounter;

          Square currentSquare = squareBySquareId.get(squareId);

          String squareAnswer = answer.substring(
            characterCounter,
            characterCounter + 1
          );

          currentSquare.squareAnswer = squareAnswer;

          Crossword_Guess__c guess = guessBySquareId.get(squareId);

          if (guess != null) {
            currentSquare.guessId = guess.Id;
            currentSquare.guess = guess.Input__c;
          }

          currentSquare.clueAnswerPairIdAcross = clueAnswerPair.Id;
        } else {
          Integer squareId =
            startingSquareLocation + characterCounter * sizeTop;

          Square currentSquare = squareBySquareId.get(squareId);

          currentSquare.clueAnswerPairIdDown = clueAnswerPair.Id;
        }
      }
    }

    return squareBySquareId;
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
        Math.mod(square.squareId, sizeAcross) == 0 &&
        gridRowDtos.size() != sizeTop
      ) {
        Integer rowLocation = gridRowDtos.size();

        gridRowDtos.add(new GridRowDto(rowLocation));
      }
    }

    return JSON.serialize(gridRowDtos);
  }

  @AuraEnabled(cacheable=false)
  public static void saveGuesses(List<Crossword_Guess__c> guesses) {
    upsert guesses;
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
    String key { get; set; }
    Integer squareId { get; set; }
    String squareAnswer { get; set; }
    String guess { get; set; }
    Id guessId { get; set; }
    Integer clueNumber { get; set; }
    Id clueAnswerPairIdAcross { get; set; }
    Id clueAnswerPairIdDown { get; set; }
  }
}
