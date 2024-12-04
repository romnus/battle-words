rowAmount = 21
rowCounter = 1

while rowCounter <= rowAmount:
    columnCounter = 1
    columnAmount = 21
    f = open("X" + str(rowCounter) + "_" + str(columnCounter) + "__c.field-meta.xml", "w")
    f.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
"<CustomField xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n" +
    "\t<fullName>X" + str(rowCounter) + "_" + str(columnCounter) + "__c</fullName>\n" +
    "\t<externalId>false</externalId>\n" +
    "\t<label>" + str(rowCounter) + "-" + str(columnCounter) + "</label>\n" +
    "\t<length>255</length>\n" +
    "\t<required>false</required>\n" +
    "\t<trackTrending>false</trackTrending>\n" +
    "\t<type>Text</type>\n" +
    "\t<unique>false</unique>\n" +
"</CustomField>")
    f.close()
    while columnCounter <= columnAmount:
        f = open("X" + str(rowCounter) + "_" + str(columnCounter) + "__c.field-meta.xml", "w")
        f.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
    "<CustomField xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n" +
        "\t<fullName>X" + str(rowCounter) + "_" + str(columnCounter) + "__c</fullName>\n" +
        "\t<externalId>false</externalId>\n" +
        "\t<label>" + str(rowCounter) + "-" + str(columnCounter) + "</label>\n" +
        "\t<length>255</length>\n" +
        "\t<required>false</required>\n" +
        "\t<trackTrending>false</trackTrending>\n" +
        "\t<type>Text</type>\n" +
        "\t<unique>false</unique>\n" +
    "</CustomField>")
        f.close()
        columnCounter +=1
    rowCounter += 1