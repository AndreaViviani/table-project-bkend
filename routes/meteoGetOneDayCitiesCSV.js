const https = require("https");
const fs = require('fs');
// const url = "http://www.ilmeteo.it/portale/archivio-meteo/Milano/2020/Maggio/14?format=csv"
const urlRoot = "https://www.ilmeteo.it/portale/archivio-meteo/";

function setMeteo(regione, giorno, response) {
  console.log(regione + ' giorno: ' + giorno)
  let comuni = [];
  let comune = '';
  let datiMeteoRicevuti = '';
  let completed_requests = 0;
  const fileName = 'meteo/' + regione + '/' + giorno + '.csv';
  console.log('POST fileName: ' + fileName);

  fs.readFile('ilMeteoLombardia.txt', function (err, data) {
    if (err) throw err;
    let str = data.toString();
    comuni = str.split('\n');
    // console.log(comuni);

    let header = "LOCALITA,DATA,TMEDIA °C,TMIN °C,TMAX °C,PUNTORUGIADA °C,UMIDITA %,VISIBILITA km,VENTOMEDIA km/h,VENTOMAX km/h,RAFFICA km/h,PRESSIONESLM mb,PRESSIONEMEDIA mb,PIOGGIA mm,FENOMENI";
    fs.writeFile(fileName, header, function (err) {
      if (err) throw err;
      console.log('Header saved!');
    });


    for (i in comuni) {
      comune = comuni[i];
      let url = urlRoot + comune + '/' + giorno + '?format=csv';
      console.log("url: " + url);
      https.get(url, function (res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
          if (res.headers['content-type'] == 'text/csv') {
            let meteoData = chunk.split('\r\n')[1].split(';');
            let fenomeni = meteoData[meteoData.length - 1].slice(0, meteoData[meteoData.length - 1].lastIndexOf(" ")) + '"';
            meteoData[meteoData.length - 1] = fenomeni;
            let csvLine = meteoData.toString().replace(/"/g, "");
            datiMeteoRicevuti += '\u000D\u000A' + csvLine;
            console.log("csvLine: " + csvLine);
          }
        });
        res.on("end", () => {
          completed_requests++;
          if (completed_requests == comuni.length) {
            console.log('All download done');
            // All download done, process responses array
            fs.appendFile(fileName, datiMeteoRicevuti, function (err) {
              if (err) throw err;
              // console.log('responses:\n' + datiMeteoRicevuti);
              // res.setHeader('Content-Type', 'text/csv');
              response.setHeader('Location', fileName);
              response.writeHead(201);
              response.end();
            });
          }
        });
      });
    }

  });
}

module.exports = { setMeteo: setMeteo };
