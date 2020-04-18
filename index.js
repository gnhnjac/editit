require('dotenv').config();

var express = require('express');
var socket = require('socket.io');

var app = express();

var port = process.env.PORT || 3000;

var server = app.listen(port, ()=> {

    console.log(`listening on port ${port}`);

})

app.use(express.static('public'));

var io = socket(server);

io.on('connection', (socket)=> {

    console.log(`New connection from ${socket.id}`);

    socket.on('disconnect', ()=> {

        console.log(`${socket.id} has disconnected`);

    })

})