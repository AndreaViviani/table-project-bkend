const express = require('express');
const router = express.Router();
const fs = require('fs');
const meteo = require("./meteoGetOneDayCitiesCSV");

/*Settiamo l'autorizzazione ad accedere dal mio dominio x il cors */
var cors = require('cors');

// use it before all route definitions
router.use(cors({origin: 'http://localhost:3006'}));

/* GET pagina iniziale. */
router.get('/', function(req, res, next) {
  let answer = '<html><body>' +
    '<p>Backend di prova per chiamare le API di ilMeteo.it e restituire i file.csv</p>' +
    '<a href="http://localhost:3000/meteo.html">Pagina iniziale</a>' +
    '</body></html>';
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(answer);
  res.end();
});

router.get('/:regione([A-Za-z]*)/:anno(\\d+)/:mese([A-Za-z]*)/:giorno(\\d+)', function(req, res, next) {
  const fileName = 'meteo/' + req.params.regione + '/' + req.params.anno + '/' + req.params.mese + '/' + req.params.giorno + '.csv';
  console.log('GET fileName: ' + fileName);
  fs.readFile(fileName, 'utf8', function(err, file) {
    if (err) {
      throw err;
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.writeHead(200, {'Content-Type': 'text/csv'});

    res.write(file);
    res.end();
    console.log(file);
  });
});

router.post('/', function(req, res, next) {
  let data = req.body.anno + '/' + req.body.mese + '/' + req.body.giorno; // 2020/Maggio/15
  meteo.setMeteo(req.body.regione, data, res);
});

module.exports = router;