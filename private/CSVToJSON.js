function csvJSON (dataToConvert){

    var lines = dataToConvert.toString().split("\n");

    var result = [];

    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {

        var obj = {};
        var currentline = lines[i].split(","); //possibilità di scegliere separatore

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);

    }
    return result;
}

module.exports = { csvJSON: csvJSON };
