//CONFIGURATION
const express = require('express');
const mysql = require('mysql');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios').default;
const sessions = require('express-session');
const CryptoJS = require('crypto-js');
const MySQLStore = require('express-mysql-session')(sessions);
const favicon = require('serve-favicon');
const path = require('path');
require('dotenv').config();

//DB CONNECTION DETAILS
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_BASE,
  timezone: 'Z',
});

//APP.USE
app.use(express.static('Frontend'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'favicon.ico')));

//Session store options
const options = {
  host: process.env.DB_HOST,
  port: port,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_BASE,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  createDatabaseTable: true,
  connectionLimit: 1,
  endConnectionOnClose: true,
  charset: 'utf8mb4_bin',
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
};

var sessionStore = new MySQLStore({ options }, pool);

//Login config
app.use(
  sessions({
    secret: process.env.SESS_SECRET,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    resave: false,
    store: sessionStore,
  })
);

//HOST CONFIG
app.get('/', (req, res) => {
  res.sendFile('Frontend/index.html');
});

// LISTEN ON PORT HERUKO || 3000
app.listen(port, () => console.info(`-> Server is listening on port ${port}`));

/*----------------------------------------YAHOO-----------------------------------------------*/
//Classes for get api request
class appGet {
  constructor(host) {
    this.host = host;
    this.data;

    this.getApp = function () {
      return app.get(`/${this.host}`, (req, res) => {
        res.set({
          'Access-Control-Allow-Origin': '*',
          'content-type': 'application/json',
          'Access-Control-Allow-Methods': 'GET',
        });
        //Sen Data to client
        res.json(this.data);
      });
    };
  }
}

//Yahoo options
function Option(url) {
  return {
    method: 'GET',
    url: url,
    params: { modules: 'defaultKeyStatistics,assetProfile' },
    headers: {
      'X-API-KEY': process.env.YAHOO_KEY,
    },
  };
}

//Header 
let indexHeader;
let sendHeadData = new appGet('data/header');
function getHeaderData() {
  let IndexData = [];
  let config = Option(
    'https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=%5EGSPC%2C%5EIXIC%2C%5ERUT%2C%5EFTSE%2C%5EGDAXI%2C%5EOMX%2C%5EN225%2C%5EHSI%2C000001.SS%2C%5EAXJO'
  );
  //Get header data
  axios
    .request(config)
    .then((response) => {
      //Add time off data uppdate
      let date = new Date();
      IndexData[10] = {
        date: date.toLocaleString('sv-SE'),
      };
      //Clear response
      for (let i = 0; i < 10; i++) {
        let last = response.data.quoteResponse.result[i].regularMarketPrice;
        let close =
          response.data.quoteResponse.result[i].regularMarketChangePercent;

        last = last.toFixed(2);
        close = close.toFixed(2);

        IndexData[i] = {
          shortName: response.data.quoteResponse.result[i].shortName,
          regularMarketPrice: last,
          regularMarketPreviousClose: close,
        };
      }

      //Send data to client
      indexHeader = IndexData;
      sendHeadData.data = indexHeader;
      sendHeadData.getApp();
    })
    .catch((error) => {
      console.error(error);
    });
}
getHeaderData();

//Index 
let indexChart;
let indexData = new appGet('data/index');
function getIndexData() {
  let config = Option(
    'https://yfapi.net/v8/finance/spark?interval=1d&range=4y&symbols=%5EOMX%2C%5EGSPC%2C%5EIXIC%2C%5ERUT%2C%5EFTSE%2C%5EGDAXI%2C%5EN225%2C%5EHSI%2C000001.SS%2C%5EAXJO'
  );
  // Get index data
  axios
    .request(config)
    .then((response) => {
      //Sort response
      let toClient = [];
      let index = ['^OMX','^GSPC','^IXIC','^RUT','^FTSE','^GDAXI','^N225','^HSI','000001.SS','^AXJO'];
      for(let i = 0; i < index.length; i++){
        let symbol = index[i];
        let time = [];
        for (let i = 0; i < response.data[symbol].timestamp.length; i++) {
          let date = new Date(response.data[symbol].timestamp[i] * 1000);
          date.getTime();
          time.push(date.toLocaleString('sv-SE'));
        }
        toClient.push({
          id: symbol,
          close: response.data[symbol].close,
          time: time,
        });
      }

      indexChart = toClient;
      indexData.data = indexChart;
      indexData.getApp();
    })
    .catch((error) => {
      console.error(error);
    });
}
getIndexData();
//Kontroll för uppdatera yahoo data
setInterval(() => {

  let minut = new Date().getMinutes();
  let hour = new Date().getHours();

  //Uppdatera header data var 15:e minut
  if (minut === 15 || minut === 30 || minut === 45 || minut === 0) {
    getHeaderData();
  }

  //Uppdatera chart data 1 ggr/dag
  if(hour === 23 && minut === 55){
    getIndexData();
  }

}, 60000);

/*----------------------------------------FORUM-------------------------------------------------*/
//Function som skickar ut den datan som visar på "main page Forum" i subject 
app.get('/forum/subject', (req, res) => {

  pool.getConnection(function (err, con) {
    if (err) throw err;

    //Hämta id på de ämnen som har trådar ur forum
    function getSubID(){
      return new Promise((resolve) => {
        let sql = 'SELECT * FROM subject WHERE active = "Active"';
        con.query(sql, (err, result) => {
          if (err) throw err;
          con.release();
          resolve(result);
        });
      });
    }

    //Async som skickar data till client
    async function sendSubject(){
      try {
        let text = await getSubID();
        
        if (text.length !== 0) {
          let subject = [];
          for (let i = 0; i < text.length; i++) {
            subject.push({
              id: text[i]['id'],
              index: text[i]['sub_index'],
              ticker: text[i]['sub_short'],
            });
          }
          res.status(201).json(subject).end();
        } else {
          res.status(204).end();
        }
      } catch (err) {
        console.log(err);
        res.status(500).end();
      }
    }
    sendSubject();
  });
});

//Hämtar & skickar Thread 
app.post('/forum/get/thread', (req, res) => {

  let subID = req.body['id'];

  pool.getConnection((err, con) => {
    if (err) throw err;

    //Hämta respektive thread text
    function thrT() {
      return new Promise((resolve) => {
        let sql = 'SELECT * FROM thread WHERE subject_id = ? ORDER BY thread_date';
        con.query(sql, [subID], (err, result) => {
          if (err) throw err;
          con.release();
          resolve(result);
        });
      });
    }
    //Skickar thread till client
    async function getThread() {
      try {
        let thrText = await thrT();

        if(thrText.length >= 1){
          let thr_text = [];
          for (let i = 0; i < thrText.length; i++) {
            thr_text.push({
              id: thrText[i]['id'],
              title: thrText[i]['thread_title'],
              date: thrText[i]['thread_date'].toLocaleString('sv-SE'),
            });
          }

          res.status(201).json(thr_text).end();
          //Om försök att hämta trådar till aktie, men som redan är borttagen
        } else {
          res.status(404).end();
        }
        
      } catch (err) {
        console.log(err);
        res.status(500).end();
      }
    }
    getThread();
  });
});

//Hämtar & skickar content 
app.post('/forum/get/content', (req, res) => {

  let thr_ID = req.body['key'];
  let beg = req.body['beg'];
  let end = req.body['end'];

  pool.getConnection((err, con) => {
    if (err) throw err;

    //Hämta alla trådars id kopplat till detta index
    function getConID() {
      return new Promise((resolve) => {
        let sql = `SELECT * FROM content WHERE thread_id = ? LIMIT ${beg} OFFSET ${end}`;
        con.query(sql, [thr_ID], (err, result) => {
          if (err) throw err;
          con.release();
          resolve(result);
        });
      });
    }

    async function content() {
      try {
        let text = await getConID();

        if(text.length >= 1){
          let con_text = [];
          for (let i = 0; i < text.length; i++) {
            let data = {
              id: text[i]['id'],
              text: text[i]['con_text'],
              date: text[i]['con_date'].toLocaleString('sv-SE'),
              user: text[i]['con_user'],
              likes: text[i]['con_like'],
            };
            con_text.push(data);
          }

          res.status(201).json(con_text).end();
          // Om försök att hämta content till thread som redan är borttagen
        } else {
          res.status(204).end();
        }
      } catch (err) {
        console.log(err);
        res.status(500).end();
      }
    }
    content();
  });
});

//Hämtar och skickar 20 senaste kommenterade trådarna 
app.get('/forum/whatsnew', (req, res) => {
  pool.getConnection((err, con) => {
    if (err) throw err;

    //Get last 20 content id
    function getCon() {
      return new Promise((resolve) => {
        let sql = 'SELECT * FROM content ORDER BY con_date DESC LIMIT 20';
        con.query(sql, (err, result) => {
          if (err) throw err;
          con.release();
          resolve(result);
        });
      });
    }

    //Send threads api
    async function sendThreads() {
      try {
        let content = await getCon();

        let whatsNew = [];
        for (let i = 0; i < content.length; i++) {
          let check = whatsNew.some((o) => o.thread_id === content[i]['thread_id']);

          if (!check) {
            whatsNew.push({
              sub_id: content[i]['subject_id'],
              sub_index: content[i]['sub_index'],
              thread_id: content[i]['thread_id'],
              thread_title: content[i]['thread_title'],
              content_name: content[i]['con_text'],
              content_date: content[i]['con_date'].toLocaleString('sv-SE'),
            });
          }
        }

        //Skickar indexdata till client
        res.status(201).json(whatsNew).end();
      } catch (err) {
        console.log(err);
        res.status(500).end();
      }
    }
    sendThreads();
  });
});

/*--------------------------------------INTERACTION---------------------------------------------------*/
//Skapande av nya trådar i forum 
app.post('/forum/newthread', (req, res) => {

  if (
    req.session.loggedin === true &&
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let sub_ID = req.body['subjectID'];
    let sub = req.body['subject'];
    let thre = req.body['thread'];
    let text = req.body['text'];
    let user = req.session.username;
    let userId = req.session.userid;

    pool.getConnection((err, con) => {
      if (err) throw err;

      //Hämta kolla om det skapde subject har status active eller inte
      function subjectCheck() {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM subject WHERE id = ? AND active = "Active"';
          con.query(sql, [sub_ID], (err, result) => {
            if (err) throw err;
            if (result.length === 0) {
              let sql = 'UPDATE subject SET active = "Active" WHERE id = ?';
              con.query(sql, [sub_ID], (err) => {
                if (err) throw err;
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      }
      //Sätt in denna thread och hämta id
      function threadID() {
        return new Promise((resolve) => {
          let post = { thread_title: thre, subject_id: sub_ID, sub_index: sub };
          let sql = 'INSERT INTO thread SET ?';
          con.query(sql, post, (err, result) => {
            if (err) throw err;
            resolve(result.insertId);
          });
        });
      }
      //Sätt in och hämta id på content
      function contentID(thr_ID) {
        return new Promise((resolve) => {
          let postCon = {
            con_text: text,
            con_user: user,
            user_id: userId,
            thread_id: thr_ID,
            subject_id: sub_ID,
            thread_title: thre,
            sub_index: sub,
          };
          let sql = 'INSERT INTO content SET ?';
          con.query(sql, postCon, (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      async function insertNewThread() {
        try {
          await subjectCheck();
          let thr_ID = await threadID();
          await contentID(thr_ID);

          con.release();
          res.status(201).end();
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      insertNewThread();
    });
  } else {
    res.status(403).end();
  }
});

//Kommentera en befintlig trådar i forum 
app.post('/forum/newcomment', (req, res) => {
  if (
    req.session.loggedin === true &&
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let sub = req.body['subName'];
    let subID = req.body['subId'];
    let thread = req.body['thrName'];
    let thr_ID = req.body['thrId'];
    let text = req.body['text'];
    let user = req.session.username;
    let uID = req.session.userid;

    pool.getConnection((err, con) => {
      if (err) throw err;  

      function insert() {
        return new Promise((resolve, reject) => {
          let postCom = {
            con_text: text,
            con_user: user,
            user_id: uID,
            thread_id: thr_ID,
            subject_id: subID,
            thread_title: thread,
            sub_index: sub,
          };
          let sql = 'INSERT INTO content SET ?';
          con.query(sql, postCom, (err) => {
            if (err) {
              //Ifall den tråd som kommenterats har blivit borttaget innan kommentar försöker bli adderad
              if (err.errno === 1452) {
                con.release();
                res.status(404).end();
                reject(err);
              } else {
                throw err;
              }
            } else {
              con.release();
              resolve();
            }
          });
        });
      }

      async function insertComment() {
        try {
          await insert();

          res.status(202).end();
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      insertComment();
    });
  } else {
    res.status(403).end();
  }
});

//likar content 
app.put('/forum/like', (req, res) => {

  if (
    req.get('host') === 'localhost:3000',
    req.session.loggedin === true
  ){
    let conID= req.body['key'];
    let userID = req.session.userid;

    pool.getConnection((err, con) => {
      if (err) throw err;

      function checkLikes() {
        return new Promise((resolve) => {
          let sql = `SELECT * FROM likes WHERE user_id = '${userID}' AND content_id = '${conID}'`;
          con.query(sql, (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }

      function insertCheck() {
        return new Promise((resolve, reject) => {
          let insert = {
            user_id: userID,
            content_id: conID,
          };
          let sql = 'INSERT INTO likes SET ?';
          con.query(sql, insert, (err) => {
            if (err) {
              //Ifall den tråd som får like har blivit borttaget innan like försöker bli adderad
              if (err.errno === 1452) {
                con.release();
                res.status(404).end();
                reject(err);
              } else {
                throw err;
              }
            } else {
              resolve();
            }
          });
        });
      }

      function getNum() {
        return new Promise((resolve) => {
          let sql = 'SELECT con_like FROM content WHERE id = ?';
          con.query(sql, [conID], (err, result) => {
            if (err) throw err;
            resolve(result[0]['con_like']);
          });
        });
      }

      function uppdate(insert) {
        return new Promise((resolve) => {
          let sql = `UPDATE content SET con_like = ${insert} WHERE id = ${conID}`;
          con.query(sql, (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      async function likeCon() {
        try {
          let check = await checkLikes();

          if (check.length === 0) {
            await insertCheck();

            let num = await getNum();
            let insert;
            if (num !== null) {
              insert = num + 1;
            } else {
              insert = 1;
            }
            await uppdate(insert);

            con.release();
            res.status(201).end();
          } else {
            con.release();
            res.status(202).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      likeCon();
    });
  } else {
    res.status(403).end();
  }
});

/*--------------------------------------LOGIN-------------------------------------------------------*/
//Kontrollerar om session user är inloggad 
app.get('/forum/controll', (req, res) => {
  if(req.session.loggedin === true) {
    res.status(202).json({user: req.session.username}).end();
  } else {
    res.status(204).end();
  }
});

//Login från befintlig användare 
app.post('/forum/user/login', (req, res) => {
  
  if (
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let name = req.body['name'];
    let pass = req.body['pass'];

    pool.getConnection((err, con) => {
      if (err) throw err;
      //Kontrollerar användarnamnet
      function checkUser() {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM user WHERE user_name = ?';
          con.query(sql, [name], (err, result) => {
            if (err) throw err;
            con.release();
            resolve(result);
          });
        });
      }

      async function login() {
        try {
          let check = await checkUser();

          if (check.length === 1) {
            let passDB = check[0]['user_pass'];
            var bytes = CryptoJS.AES.decrypt(passDB, 'secret key 123');
            var originalPass = bytes.toString(CryptoJS.enc.Utf8);

            //Kontrollerar lösenordet
            if (pass === originalPass) {
              req.session.loggedin = true;
              req.session.username = name;
              req.session.userid = check[0]['id'];

              res.status(202).end();
            } else {
              res.status(401).end();
            }
          } else {
            res.status(401).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      login();
    });

  } else {
    res.status(403).end();
  }
});

//Skapande av ny användare 
app.post('/forum/user/create', (req, res) => {

  if (
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let name = req.body['name'];
    let pass = req.body['pass'];
    let hash = CryptoJS.AES.encrypt(pass, 'secret key 123').toString();

    pool.getConnection((err, con) => {
      if (err) throw err;
      //Kontrollera ifall anvädarnamnet redan finns
      function lookForUser() {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM user WHERE user_name = ?';
          con.query(sql, [name], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }
      //Sätt in användarnamn samt crypterat lösenord
      function insertUser() {
        return new Promise((resolve) => {
          let post = { user_name: name, user_pass: hash };
          let sql = 'INSERT INTO user SET ?';
          con.query(sql, post, (err, result) => {
            if (err) throw err;
            resolve(result.insertId);
          });
        });
      }

      async function creatUser() {
        try {
          let check = await lookForUser();

          if (check.length === 0) {
            let userID = await insertUser();

            req.session.loggedin = true;
            req.session.username = name;
            req.session.userid = userID;
            
            con.release();
            res.status(201).end();
          } else {
            con.release();
            res.status(401).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      creatUser();
    });

  } else {
    res.status(403).end();
  }
});

//Logout 
app.get('/forum/user/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/');
    res.end();
  });
});

//Uppdatera lösenord 
app.put('/forum/user/uppdate', (req, res) => {

  if (
    req.session.loggedin &&
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let name = req.session.username;
    let old = req.body['old'];
    let pass = req.body['pass'];

    pool.getConnection((err, con) => {
      if (err) throw err;

      //Hämtar tidigare lösenord från anvädaren
      function checkOldPass() {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM user WHERE user_name = ?';
          con.query(sql, [name], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }
      //Efter kontroll, uppdatera lösenord
      function uppdate(hash) {
        return new Promise((resolve) => {
          let sql = 'UPDATE user SET user_pass = ? WHERE user_name = ?';
          con.query(sql, [hash, name], (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      async function uppdatePass() {
        try {
          let checkPass = await checkOldPass();
          

          let passDB = checkPass[0]['user_pass'];
          var bytes = CryptoJS.AES.decrypt(passDB, 'secret key 123');
          var originalPass = bytes.toString(CryptoJS.enc.Utf8);

          if (old === originalPass) {
            let hash = CryptoJS.AES.encrypt(pass, 'secret key 123').toString();
            await uppdate(hash);

            con.release();
            res.status(201).end();
          } else {
            con.release();
            res.status(401).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      uppdatePass();
    });
  } else {
    res.status(403).end();
  }
});

/*---------------------------------------------------SEARCH-----------------------------------------------------*/
//Sökfunction 
app.post('/forum/search', (req, res) => {
  if (
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let data = req.body;

    pool.getConnection((err, con) => {
      if (err) throw err;

      function searchCon() {
        return new Promise((resolve) => {
          let sql = `SELECT * FROM subject WHERE sub_index LIKE '%${data['search']}%' AND active = "Active" OR sub_short LIKE '%${data['search']}%' AND active = "Active" ORDER BY id DESC LIMIT 5`;
          con.query(sql, (err, result) => {
            if (err) throw err;
            con.release();
            resolve(result);
          });
        });
      }

      async function searching() {
        try {
          let search = await searchCon();
          
          if (search.length !== 0) {
            let subject = [];

            for (let i = 0; i < search.length; i++) {
              subject.push({
                id: search[i]['id'],
                subject: search[i]['sub_index'],
              });
            }
            res.status(201).json(subject).end();
          } else {
            res.status(201).json({ key: null }).end();
          }
          
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      searching();
    });
  } else {
    res.status(403).end();
  }
});

//Sökfunction för new Thread / val av subject 
app.post('/forum/select', (req, res) => {
  
  if (
    req.get('Content-type') === 'application/json; charset=UTF-8') {

    let data = req.body;

    pool.getConnection((err, con) => {
      if (err) throw err;

      function searchSub() {
        return new Promise((resolve) => {
          let sql = `SELECT * FROM subject WHERE sub_index LIKE '${data['search']}%' OR sub_short LIKE '%${data['search']}%' ORDER BY id DESC LIMIT 5`;
          con.query(sql, (err, result) => {
            if (err) throw err;
            con.release();
            resolve(result);
          });
        });
      }

      async function searching() {
        try {
          let sea = await searchSub();

          if (sea.length !== 0) {
            let sendTo = [];

            for (let i = 0; i < sea.length; i++) {
              sendTo.push({
                id: sea[i]['id'],
                subject: sea[i]['sub_index'],
              });
            }
            res.status(201).json(sendTo).end();
          } else {
            res.status(201).json({ key: null }).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      searching();
    });
  } else {
    res.status(403).end();
  }
});

/*--------------------------------------------------EDIT---------------------------------------------------------*/
//Uppdaterar content 
app.put('/forum/uppdate', (req, res) => {

  if (
    req.get('Content-type') === 'application/json; charset=UTF-8' &&
    req.session.loggedin === true
  ) {
    let id = req.body['key'];
    let text = req.body['uppdate'];

    pool.getConnection((err, con) => {
      if (err) throw err;

      function uppCon() {
        return new Promise((resolve) => {
          let sql = `UPDATE content SET con_text = ? WHERE id = '${id}'`;
          con.query(sql, [text], (err) => {
            if (err) throw err;
            con.release();
            resolve();
          });
        });
      }

      async function uppdate() {
        try {
          await uppCon();

          res.status(201).end();
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      uppdate();
    });
  } else {
    res.status(403).end();
  }
});

//Tar bort content 
app.delete('/forum/delete', (req, res) => {

  if (
    req.get('Content-type') === 'application/json; charset=UTF-8' &&
    req.session.loggedin === true) {
      
    let subId = req.body['subId'];
    let thrId = req.body['thrId'];
    let conId = req.body['conId'];

    pool.getConnection((err, con) => {
      if (err) throw err;

      function delLikes() {
        return new Promise((resolve) => {
          let sql = 'DELETE FROM likes WHERE content_id = ?';
          con.query(sql, [conId], (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      function delContentRow() {
        return new Promise((resolve) => {
          let sql = 'DELETE FROM content WHERE id = ?';
          con.query(sql, [conId], (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      function checkIfThread() {
        return new Promise((resolve) => {
          let sql = 'SELECT id FROM content WHERE thread_id = ?';
          con.query(sql, [thrId], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }

      function delThreadRow() {
        return new Promise((resolve) => {
          let sql = 'DELETE FROM thread WHERE id = ?';
          con.query(sql, [thrId], (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      function subCheck() {
        return new Promise((resolve) => {
          let sql = 'SELECT id FROM thread WHERE subject_id = ? LIMIT 1';
          con.query(sql, [subId], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }

      function uppdatActiveRow() {
        return new Promise((resolve) => {
          let sql = `UPDATE subject SET active = ${null} WHERE id = ?`;
          con.query(sql, [subId], (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      async function deletePost() {
        try {
          await delLikes();
          await delContentRow();

          let forumThr = await checkIfThread();
          
          if (forumThr.length < 1) {
            await delThreadRow();

            //Om thread, content och subject tas bort
            let forumSub = await subCheck();
            if (forumSub.length < 1) {
              await uppdatActiveRow();

              con.release();
              res.status(204).end();

              //Om thread och content tas bort
            } else {
              con.release();
              res.status(202).end();
            }
  
            //Om bara content tas bort
          } else {
            con.release();
            res.status(200).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      deletePost();
    });
  } else {
    res.status(403).end();
  }
});

/*------------------------------------------------PROFIL------------------------------------------------------*/
//Hanterar och skickar senaste likes kopplat till användare
app.get('/forum/userlikes', (req, res) => {

  if (req.session.loggedin === true) {
    let user = req.session.userid;

    pool.getConnection((err, con) => {
      if (err) throw err;

      //Hämtar 10 senate likes
      function getUserLikes() {
        return new Promise((resolve) => {
          let sql = `SELECT * FROM likes WHERE user_id = '${user}' ORDER BY like_date DESC LIMIT 10`;
          con.query(sql, (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }
      //Hämtar content text
      function getConText(conID) {
        return new Promise((resolve) => {
          let query = 'SELECT * FROM content WHERE id IN (?) ORDER BY con_date DESC';
          con.query(query, [conID], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }

      async function getLikes() {
        try {
          let like = await getUserLikes();

          if (like.length > 0) {
            let conID = [];
            for (let i = 0; i < like.length; i++) {
              conID.push(like[i]['content_id']);
            }

            let conTex = await getConText(conID);

            let fileToSend = [];
            for (let i = 0; i < conTex.length; i++) {
              fileToSend.push({
                subID: conTex[i]['subject_id'],
                subName: conTex[i]['sub_index'],
                thrID: conTex[i]['thread_id'],
                thrName: conTex[i]['thread_title'],
                conID: conTex[i]['id'],
                conText: conTex[i]['con_text'],
                conDate: conTex[i]['con_date'].toLocaleString('sv-SE'),
              });
            }

            con.release();
            res.status(201).json(fileToSend).end();
          } else {
            con.release();
            res.status(201).json({ key: null }).end();
          }
        } catch (err) {
          console.log(err);
          res.status(500).end();
        }
      }
      getLikes();
    });
  } else {
    res.status(403).end();
  }
});

//Hanterar och skickar senaste kommentera poster kopplat till användare 
app.get('/forum/userPost', (req, res) => {

  if (req.session.loggedin === true) {
    let id = req.session.userid;

    pool.getConnection((err, con) => {
      if (err) throw err;
      //Hämtar upp emot 10 senaste kommentarer för användaren
      function getContent() {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM content WHERE user_id = ? ORDER BY con_date DESC LIMIT 10';
          con.query(sql, [id], (err, result) => {
            if (err) throw err;
            resolve(result);
          });
        });
      }

      //Skickar poster till client
      async function sendBack() {
        try {
          let content = await getContent();

          if (content.length !== 0) {
            let fileToSend = [];
            for (let i = 0; i < content.length; i++) {
              fileToSend.push({
                subID: content[i]['subject_id'],
                subName: content[i]['sub_index'],
                thrID: content[i]['thread_id'],
                thrName: content[i]['thread_title'],
                conID: content[i]['id'],
                conText: content[i]['con_text'],
                conDate: content[i]['con_date'].toLocaleString('sv-SE'),
              });
            }
            con.release();
            res.status(201).json(fileToSend).end();
          } else {
            con.release();
            res.status(201).json({ key: null }).end();
          }
        } catch (error) {
          console.log(error);
          res.status(500).end();
        }
      }
      sendBack();
    });
  } else {
    res.status(403).end();
  }
});
