require('dotenv').config();

var express = require('express');

var app = express();

var port = process.env.PORT || 3000;

var server = app.listen(port, ()=> {

    console.log(`listening on port ${port}`);

})

app.use(express.static('public'));

var io  = require('socket.io')(server);

var ID = function () {
    return Math.random().toString(36).substr(2, 9);
};

function findRoom(id, arr) {

    for(let i = 0; i < arr.length; i++) {

        if(arr[i].id == id) {

            return i;

        }

    }

}

function checkExists(roomID, arr) {

    for(room of arr) {

        if(room.id == roomID) {

            return true;

        }

    }

}

function Room(id) {

    this.id = id;

    this.players = [];

}

Room.prototype.addPlayer = function(name, id) {

    this.players.push({name: name, id: id});

}

var rooms = [];

setInterval(()=> {

}, 1000);

io.on('connection', (socket)=> {

    console.log(`New connection from ${socket.id}`);

    socket.on('createroompage', (data)=> {

        var newid = ID();
        rooms.push(new Room(newid));

        socket.emit('redirect', `/game/?id=${newid}&name=${data.name}`);

    });

    socket.on('joinroompage', (data)=> {

        if(checkExists(data.id, rooms)) {

            socket.emit('redirect', `/game/?id=${data.id}&name=${data.name}`);
    
        }

    })

    socket.on('joinroom', (data)=> {

        var room = rooms[findRoom(data.id, rooms)];

        socket.join(data.id);

        console.log(`${data.name} has joined room ${data.id}`);

        room.addPlayer(data.name, data.id);

        io.to(data.id).emit('newplayer', room.players);

    })

    socket.on('disconnect', ()=> {

        console.log(`${socket.id} has disconnected`);

    });

});