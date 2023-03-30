const express = require('express');

const fs = require('fs');
const os = require('os');

const app = express();
const server = require("http").Server(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

wss.on("connection", function(ws){
  let writeStream = null;
  ws.on("message", function(message){
    const msg = JSON.parse(message);
    
    switch(msg.type){
      case "START":
        writeStream = fs.createWriteStream(`data/${Date.now()}.json`);
        break;
      case "STOP":
        if (writeStream) writeStream.end();
        break;
      case "HAND":
        writeStream.write(msg.payload + os.EOL);
        break;
      default:
    }
  });
});

server.listen(3000, () => console.log('server started'));
