const express = require('express');
const router = express.Router();
const fs = require('fs');
const csvJSON = require("./../private/CSVToJSON");
const ssvJSON = require("./../private/SSVToJSON");
const axios = require('axios').default;

/*Settiamo l'autorizzazione ad accedere dal mio dominio x il cors */
var cors = require('cors');
router.use(cors({origin: 'http://localhost:3000'}));



//get covid data x regione x un giorno
router.get(`/covid/:regione/:year/:month/:day`, (req, res, next)=>{
  console.log(req.params);
  const fileName = `./public/covid-data/dpc-covid19-ita-province-${req.params.year}${req.params.month}${req.params.day}.csv`;
  console.log(fileName);
  fs.readFile(fileName, "utf-8", function(err, data) {
    if(err){
      console.log(err);
      res.send({ error: err})
    } else {
      console.log(data);
      const jsonData = csvJSON.csvJSON(data);
      const dataToSend = [];
      for (el of jsonData) {
        if (el.denominazione_regione === req.params.regione) {
          dataToSend.push(el)
        }
      }
      res.send({error: false, data: dataToSend});
    }
  })
})

//get covid data x regione x un giorno
router.get(`/meteo/:regione/:year/:month/:day`, (req, res, next)=>{
  let month = "";
  switch(req.params.month){
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
  fs.readFile(`./public/province/${req.params.regione}.txt`, (err, data)=> {
    if(err) {
      res.send({ error: err})
    } else {
      const comuniStr = data.toString();
      const comuni = comuniStr.split('\n');
      console.log(comuni.length);
      for (let i = 0; i < comuni.length; i ++) {
        console.log()
        const comune = comuni[i];
        const url = `${urlRoot}${comune}/${date}?format=csv`;
        axios.get(url)
          .then((resp)=>{
            if(resp.headers['content-type'] === 'text/csv'){
              console.log(ssvJSON.ssvJSON(resp.data)[0]);
              dataToSend.push(ssvJSON.ssvJSON(resp.data)[0]);
                if (i === comuni.length - 1){
                  console.log(dataToSend);
                  res.send({error: false, data: dataToSend});
                }
            }
          })
          .catch((err)=> {
            res.send({ error: err})
          })
      }
    }
  })
})


// faccio la get che mi da il meteo per un dato giorno per una data provincia (per unire le tabelle)
router.get('/meteo/:regione([A-Za-z]*)/:provincia([A-Za-z]*)/:year(\\d+)/:month(\\d+)/:day(\\d+)', function(req, res, next) {
  const urlRoot = "https://www.ilmeteo.it/portale/archivio-meteo/";
  let month = "";
  switch(req.params.month){
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
  .then((resp)=> {
    if(resp.headers['content-type'] === 'text/csv') {
      res.send(ssvJSON.ssvJSON(resp.data)[0]);
    } else {
      res.send({})
    }
  })
  .catch((err)=>{
    res.send(err);
  })
})

//post per salvare i dati
router.post("/save/:title", function(req, res, next) {
  const dataToSave = req.body.data;
  const toSaveName = req.params.title;
  console.log("richiesta arrivata");
  console.log(dataToSave);
  if (fs.existsSync(`./public/saved-files/${toSaveName}.json`)) {
    res.send({nameIsTaken: true, success: false})
  } else {
    fs.appendFile(`./public/saved-files/${toSaveName}.json`, JSON.stringify(dataToSave), (err) => {
      if (err) {
        res.send(err);
        console.log(err);
      } else {
        res.send({nameIsTaken: false, success: true})
      }
    })
  }
})

router.post("/save/force/:title", function(req, res, next) {
  const dataToSave = req.body.data;
  const toSaveName = req.params.title;
  console.log("richiesta arrivata");
  console.log(dataToSave);
  fs.writeFile(`./public/saved-files/${toSaveName}.json`, JSON.stringify(dataToSave), (err) => {
      if (err) {
        res.send(err);
        console.log(err);
      } else {
        res.send({nameIsTaken: true, success: true})
      }
    })
  })

//get per i dati salvati
router.get("/saved/:filename", (req, res, next)=>{
  const fileName = `./public/saved-files/${req.params.filename}.json`;
  fs.readFile(fileName, "utf-8", (err, data) =>{
    if (err) {
      res.send({error: err});
    } else {
      console.log(data);
      res.send({error: false, data: JSON.parse(data)});
    }
  })
})

module.exports = router;
