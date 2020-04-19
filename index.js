require('dotenv').config();

var express = require('express');

var app = express();

var port = process.env.PORT || 3000;

var server = app.listen(port, ()=> {

    console.log(`listening on port ${port}`);

})

app.use(express.static('public'));

var io  = require('socket.io')(server);

var rooms = [];

setInterval(()=> {

}, 1000);

io.on('connection', (socket)=> {

    console.log(`New connection from ${socket.id}`);

    if(rooms.includes(socket.handshake.query.id)) {

        socket.emit('redirect', `/game/?id=${socket.handshake.query.id}`);

    }

    socket.on('createroompage', (data)=> {

        rooms.push(data.id);

        socket.emit('redirect', `/game/?id=${data.id}`);

    });

    socket.on('joinroom', (data)=> {

        socket.join(data.id);

        console.log(`${socket.id} has joined room ${data.id}`);

    })

    socket.on('disconnect', ()=> {

        console.log(`${socket.id} has disconnected`);

    });

});