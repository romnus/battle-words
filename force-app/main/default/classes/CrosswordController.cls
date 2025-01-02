public with sharing class CrosswordController {
  private static final String BLACK_SQUARE_CHARACTER = '.';
  private static final String ACROSS = 'ACROSS';

  @AuraEnabled(cacheable=true)
  public static String getGridRowDtos(Id crosswordId) {
    List<Crossword_Clue_Answer_Pair__c> clueAnswerPairs = [
      SELECT
        Answer__c,
        Location__c,
        Crossword__r.Size_Top__c,
        Crossword__r.Size_Across__c
      FROM Crossword_Clue_Answer_Pair__c
      WHERE Crossword__c = :crosswordId AND Direction__c = :ACROSS
      ORDER BY Answer_ID__c ASC
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
      square.squareId = i + 1;
      square.squareValue = BLACK_SQUARE_CHARACTER;

      squares.add(square);
    }

    for (Crossword_Clue_Answer_Pair__c clueAnswerPair : clueAnswerPairs) {
      String answer = clueAnswerPair.Answer__c;

      Integer startingSquareLocation = Integer.valueOf(
        clueAnswerPair.Location__c
      );

      Square startingSquare = squares.get(startingSquareLocation);

      for (
        Integer characterCounter = 0;
        characterCounter < answer.length();
        characterCounter++
      ) {
        String squareValue = answer.substring(
          characterCounter,
          characterCounter + 1
        );

        Integer squareId = startingSquareLocation + characterCounter;

        Square currentSquare = squares.get(squareId - 1);

        currentSquare.squareValue = squareValue;
      }
    }

    List<GridRowDto> gridRowDtos = new List<GridRowDto>();
    gridRowDtos.add(new GridRowDto(0));

    for (Square square : squares) {
      gridRowDtos[gridRowDtos.size() - 1].squares.add(square);

      if (
        Math.mod(square.squareId, sizeAcross) == 0 &&
        gridRowDtos.size() != sizeTop
      ) {
        gridRowDtos.add(new GridRowDto(gridRowDtos.size()));
      }
    }

    return JSON.serialize(gridRowDtos);
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
    Integer squareId { get; set; }
    String squareValue { get; set; }
  }
}
