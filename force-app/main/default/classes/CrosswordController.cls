public with sharing class CrosswordController {
  private static final String BLACK_SQUARE_CHARACTER = '.';

  @AuraEnabled(cacheable=true)
  public static String getAnswerRowDtos(Id crosswordId) {
    List<Answer_Row__c> answerRows = [
      SELECT Answer_Row_Text__c, Answer_Row_Location__c
      FROM Answer_Row__c
      WHERE Crossword__c = :crosswordId
      ORDER BY Answer_Row_Location__c ASC
    ];

    List<AnswerRowDto> answerRowDtos = new List<AnswerRowDto>();

    for (Answer_Row__c answerRow : answerRows) {
      List<Square> squares = new List<Square>();

      String answerRowText = answerRow.Answer_Row_Text__c;

      for (
        Integer columnLocation = 0;
        columnLocation < answerRowText.length();
        columnLocation++
      ) {
        Integer characterCode = answerRowText.charAt(columnLocation);
        String currentCharacter = String.fromCharArray(
          new List<Integer>{ characterCode }
        );

        Square square = new Square();

        square.columnLocation = String.valueOf(columnLocation);
        square.squareText = currentCharacter;

        if (currentCharacter == BLACK_SQUARE_CHARACTER) {
          square.isBlackSquare = true;
        }

        squares.add(square);
      }

      AnswerRowDto answerRowDto = new AnswerRowDto();

      answerRowDto.rowLocation = Integer.valueOf(
        answerRow.Answer_Row_Location__c
      );
      answerRowDto.squares = squares;

      answerRowDtos.add(answerRowDto);
    }

    return JSON.serialize(answerRowDtos);
  }

  @TestVisible
  private class AnswerRowDto {
    @TestVisible
    Integer rowLocation { get; set; }

    @TestVisible
    List<Square> squares { get; set; }
  }

  private class Square {
    String columnLocation { get; set; }
    String squareText { get; set; }
    Boolean isBlackSquare { get; set; }
  }
}
