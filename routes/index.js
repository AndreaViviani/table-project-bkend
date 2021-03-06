const express = require('express');
const router = express.Router();
const fs = require('fs');
const csvJSON = require("./../private/CSVToJSON");
const ssvJSON = require("./../private/SSVToJSON");
const getDistance = require("./../private/getDistance");
const axios = require('axios').default;

/*Settiamo l'autorizzazione ad accedere dal mio dominio x il cors */
var cors = require('cors');
const getDistanceFromLatLonInKm = require('./../private/getDistance');
router.use(cors({ origin: 'http://localhost:3000' }));



//get covid data x regione x un giorno
router.get(`/covid/:regione/:year/:month/:day`, (req, res, next) => {
  console.log(req.params);
  const fileName = `./public/covid-data/dpc-covid19-ita-province-${req.params.year}${req.params.month}${req.params.day}.csv`;
  console.log(fileName);
  fs.readFile(fileName, "utf-8", function (err, data) {
    if (err) {
      console.log(err);
      res.send({ error: err })
    } else {
      console.log(data);
      const jsonData = csvJSON.csvJSON(data);
      const dataToSend = [];
      for (el of jsonData) {
        if (el.denominazione_regione === req.params.regione) {
          dataToSend.push(el)
        }
      }
      res.send({ error: false, data: dataToSend });
    }
  })
})

//get covid data x regione x un giorno
router.get(`/meteo/:regione/:year/:month/:day`, (req, res, next) => {
  let month = "";
  switch (req.params.month) {
    case "01":
      month = "Gennaio";
      break;
    case "02":
      month = "Febbraio";
      break;
    case "03":
      month = "Marzo";
      break;
    case "04":
      month = "Aprile";
      break;
    case "05":
      month = "Maggio";
      break;
    case "06":
      month = "Giugno";
      break;
    case "07":
      month = "Luglio";
      break;
    case "08":
      month = "Agosto";
      break;
    case "09":
      month = "Settembre";
      break;
    case "10":
      month = "Ottobre";
      break;
    case "11":
      month = "Novembre";
      break;
    case "12":
      month = "Dicembre";
      break;
  }
  const date = `${req.params.year}/${month}/${req.params.day}`
  const urlRoot = "https://www.ilmeteo.it/portale/archivio-meteo/";
  const dataToSend = [];
  fs.readFile(`./public/province/${req.params.regione}.txt`, (err, data) => {
    if (err) {
      res.send({ error: err })
    } else {
      const comuniStr = data.toString();
      const comuni = comuniStr.split('\n');
      for (let i = 0; i < comuni.length; i++) {
        const comune = comuni[i];
        const url = `${urlRoot}${comune}/${date}?format=csv`;
        axios.get(url)
          .then((resp) => {
            if (resp.headers['content-type'] === 'text/csv') {
              console.log(ssvJSON.ssvJSON(resp.data)[0]);
              dataToSend.push(ssvJSON.ssvJSON(resp.data)[0]);
              if (i === comuni.length - 1) {
                console.log(dataToSend);
                res.send({ error: false, data: dataToSend });
              }
            }
          })
          .catch((err) => {
            res.send({ error: err })
          })
      }
    }
  })
})


// faccio la get che mi da il meteo per un dato giorno per una data provincia (per unire le tabelle)
router.get('/meteo/single-line/:provincia([A-Za-z]*)/:year(\\d+)/:month(\\d+)/:day(\\d+)', function (req, res, next) {
  const urlRoot = "https://www.ilmeteo.it/portale/archivio-meteo/";
  let month = "";
  console.log('ricevuto')
  console.log(req.params.provincia);
  switch (req.params.month) {
    case "01":
      month = "Gennaio";
      break;
    case "02":
      month = "Febbraio";
      break;
    case "03":
      month = "Marzo";
      break;
    case "04":
      month = "Aprile";
      break;
    case "05":
      month = "Maggio";
      break;
    case "06":
      month = "Giugno";
      break;
    case "07":
      month = "Luglio";
      break;
    case "08":
      month = "Agosto";
      break;
    case "09":
      month = "Settembre";
      break;
    case "10":
      month = "Ottobre";
      break;
    case "11":
      month = "Novembre";
      break;
    case "12":
      month = "Dicembre";
      break;
  }
  const date = `${req.params.year}/${month}/${req.params.day}`
  const url = `${urlRoot}${req.params.provincia}/${date}?format=csv`;
  axios.get(url)
    .then((resp) => {
      if (resp.headers['content-type'] === 'text/csv') {
        res.send(ssvJSON.ssvJSON(resp.data)[0]);
      } else {
        res.send({})
      }
    })
    .catch((err) => {
      res.send(err);
    })
})

//post per salvare i dati
router.post("/save/:title", function (req, res, next) {
  const dataToSave = req.body.data;
  const toSaveName = req.params.title;
  console.log("richiesta arrivata");
  console.log(dataToSave);
  if (fs.existsSync(`./public/saved-files/${toSaveName}.json`)) {
    res.send({ nameIsTaken: true, success: false })
  } else {
    fs.appendFile(`./public/saved-files/${toSaveName}.json`, JSON.stringify(dataToSave), (err) => {
      if (err) {
        res.send(err);
        console.log(err);
      } else {
        res.send({ nameIsTaken: false, success: true })
      }
    })
  }
})

router.put("/save/:filename", function (req, res, next) {
  const dataToSave = req.body.data;
  const toSaveName = req.params.filename;
  console.log("richiesta arrivata");
  console.log(JSON.stringify(dataToSave));
  fs.writeFile(`./public/saved-files/${toSaveName}.json`, JSON.stringify(dataToSave), (err) => {
    if (err) {
      res.send(err);
      console.log(err);
    } else {
      res.send({ nameIsTaken: true, success: true })
    }
  })
})

//get per i dati salvati
router.get("/save/:filename", (req, res, next) => {
  const fileName = `./public/saved-files/${req.params.filename}.json`;
  fs.readFile(fileName, "utf-8", (err, data) => {
    if (err) {
      res.send({ error: err });
    } else {
      console.log(data);
      res.send({ error: false, data: JSON.parse(data) });
    }
  })
})


// get alternatives for an empty row
router.get("/get-options/meteo/:provincia([A-Za-z]*)/:year(\\d+)/:month(\\d+)/:day(\\d+)", (req, res, next) => {

  let regione = "";
  const provincia = req.params.provincia;
  let month = "";
  switch (req.params.month) {
    case "01":
      month = "Gennaio";
      break;
    case "02":
      month = "Febbraio";
      break;
    case "03":
      month = "Marzo";
      break;
    case "04":
      month = "Aprile";
      break;
    case "05":
      month = "Maggio";
      break;
    case "06":
      month = "Giugno";
      break;
    case "07":
      month = "Luglio";
      break;
    case "08":
      month = "Agosto";
      break;
    case "09":
      month = "Settembre";
      break;
    case "10":
      month = "Ottobre";
      break;
    case "11":
      month = "Novembre";
      break;
    case "12":
      month = "Dicembre";
      break;
  }
  const date = `${req.params.year}/${month}/${req.params.day}`
  const sameRegionMunic = [];
  let inRangeCities = [];
  const provinceCoords = {};
  let citiesToSend = [];
  let range = 30;
  // questa servir?? per ordinare le citt?? da mandare
  function compare(a, b) {
    if (a.dist < b.dist) {
      return -1;
    }
    if (a.dist > b.dist) {
      return 1;
    }
    return 0;
  }
  // e questa per mettere le citt?? in range in un array

  fs.readFile("./public/all-cities/italy_munic.json", (err, data) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    const allMunic = JSON.parse(data);
    for (const munic of allMunic) {
      if (munic.comune === provincia) {
        regione = munic.regione;
        break;
      }
    }

    if (regione === "") {
      res.send({ error: "no cities found" });
      return;
    }

    for (const munic of allMunic) {
      if (munic.regione === regione) {
        sameRegionMunic.push({ comune: munic.comune });
      }
    }


    fs.readFile("./public/all-cities/italy_geo.json", (err, data) => {
      if (err) {
        res.send({ error: err });
        return;
      }
      const allGeo = JSON.parse(data);
      for (const city of sameRegionMunic) {
        for (const geo of allGeo) {
          if (city.comune === geo.comune) {
            if (city.comune === provincia) {
              city["lat"] = geo.lat;
              city["lng"] = geo.lng;
              provinceCoords.lng = geo.lng;
              provinceCoords.lat = geo.lat;
            } else {
              city["lat"] = geo.lat;
              city["lng"] = geo.lng;
            }
          }
        }
      }


      for (const city of sameRegionMunic) {
        //aggiungo ad ogni elemento anche la distanza
        city["dist"] = getDistanceFromLatLonInKm(provinceCoords.lat, provinceCoords.lng, city.lat, city.lng);
        if (city.dist < range) {
          inRangeCities.push(city);
        }
      }
      let resCounter = 0;



      // setTimeout to prevent waiting forever from meteo.it
      setTimeout(()=>{
        if(!res.headersSent) {
          res.send({error: 'Time out: our server did not received response on time'});
        }
        
      }, 20000)

      for (let i = 0; i < inRangeCities.length; i++) {
        const urlRoot = "https://www.ilmeteo.it/portale/archivio-meteo/";
        axios.get(`${urlRoot}${inRangeCities[i].comune}/${date}?format=csv`)
          .then((resp) => {
            if (resp.headers['content-type'] === 'text/csv') {

              //controllo che siano dati validi (a volte meteo.it manda dati vuoti)
              const meteoJson = ssvJSON.ssvJSON(resp.data)[0];
              const meteoKeys = Object.keys(meteoJson);
              let areDataOk = false;
              // se almeno un campo ?? valido inserisco altrimenti no
              for (const key of meteoKeys) {
                if (meteoJson[key]) {
                  areDataOk = true;
                }
              }
              if (areDataOk) {
                citiesToSend.push(inRangeCities[i]);
              }

            }
            resCounter = resCounter + 1;
            //controllo se ha finito e mando
            if (resCounter === (inRangeCities.length - 1) && citiesToSend.length > 0) {
              console.log(citiesToSend.sort(compare).slice(0, 5));
              res.send(citiesToSend.sort(compare).slice(0, 5));
              return;
            } else if (resCounter === (inRangeCities.length - 1) && citiesToSend.length === 0) {
              console.log('no matching value');
              res.send({ error: 'no matching value' });
              return;
            }
          })
          .catch((err) => {
            console.log({ error: err });
          })
      }


    })
  })
})

module.exports = router;
