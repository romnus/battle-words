public with sharing class CrosswordController {
  private static final String BLACK_SQUARE_CHARACTER = '.';
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

    List<Square> squares = new List<Square>();

    for (Integer i = 0; i < sizeTop * sizeAcross; i++) {
      Square square = new Square();
      square.id = i + 1;
      square.value = BLACK_SQUARE_CHARACTER;

      squares.add(square);
    }

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

    List<GridRowDto> gridRowDtos = new List<GridRowDto>();
    gridRowDtos.add(new GridRowDto(0));

    for (Square square : squares) {
      gridRowDtos[gridRowDtos.size() - 1].squares.add(square);

      if (
        Math.mod(square.id, sizeAcross) == 0 &&
        gridRowDtos.size() != sizeTop
      ) {
        gridRowDtos.add(new GridRowDto(gridRowDtos.size()));
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
