const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require("http").Server(app);
const wss = new WebSocket.Server({ server });


const path = require('path');
const htmlFilePath = path.join(process.cwd(), 'index.html');
const jsFilePath = path.join(process.cwd(), 'script_toma_datos.js');

app.get('/', function(req, res) {
    res.sendFile(htmlFilePath);
  });

app.get('/script_toma_datos.js', function(req, res) {
    res.type('application/javascript');
    res.sendFile(jsFilePath);
});
  


wss.on("connection", function connection(ws){
  console.log("Conexion hecha");

  ws.on("message", function incoming(message){
    const msg = JSON.parse(message);
    
    switch(msg.msg){
      case "START":
        //writeStream = fs.createWriteStream(`data/${Date.now()}.json`);
        
        break;
      case "STOP":
        //if (writeStream) writeStream.end();
        console.log("STOP");
        break;
      case "HAND":
        //writeStream.write(msg.payload + os.EOL);
        console.log("Waiting");
        break;
      case "RECORDING":
        console.log(msg.payload);
        break;

      default:
    }
  });
});

server.listen(3000, () => console.log('server started'));