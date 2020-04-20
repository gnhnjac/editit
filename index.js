require('dotenv').config();

var express = require('express');

var app = express();

var port = process.env.PORT || 3000;

var server = app.listen(port, () => {

    console.log(`listening on port ${port}`);

})

app.use(express.static('public'));

var io = require('socket.io')(server);

var ID = function () {
    return Math.random().toString(36).substr(2, 9);
};

function findRoom(id, arr) {

    for (let i = 0; i < arr.length; i++) {

        if (arr[i].id == id) {

            return i;

        }

    }

}

function checkExists(roomID, arr) {

    for (room of arr) {

        if (room.id == roomID) {

            return true;

        }

    }

}

function Room(id) {

    this.id = id;

    this.players = [];

}

Room.prototype.addPlayer = function (name, id) {

    let owner = false

    if (this.players.length < 1) {
        owner = true;
    }

    this.players.push({ name: name, id: id, owner: owner });

    return owner;

}

Room.prototype.removePlayer = function (id) {

    for (let i = 0; i < this.players.length; i++) {

        if (this.players[i].id == id) {

            this.players.splice(i, 1);

            if (this.players.length > 0) {
                this.players[0].owner = true;

                return this.players[0].id;
            } else {

                return false;

            }
        }

    }

}

var rooms = [];

io.on('connection', (socket) => {

    console.log(`New connection from ${socket.id}`);

    var playerRoomId;

    socket.on('createroompage', (data) => {

        var newid = ID();
        rooms.push(new Room(newid));

        socket.emit('redirect', `/game/?id=${newid}&name=${data.name}`);

    });

    socket.on('joinroompage', (data) => {

        if (checkExists(data.id, rooms)) {

            socket.emit('redirect', `/game/?id=${data.id}&name=${data.name}`);

        }

    });

    socket.on('joinroom', (data) => {

        if (checkExists(data.id, rooms)) {
            var roomObj = rooms[findRoom(data.id, rooms)];

            playerRoomId = data.id;

            socket.join(data.id);

            console.log(`${data.name} has joined room ${data.id}`);

            let isOwner = roomObj.addPlayer(data.name, socket.id);

            socket.emit('init', isOwner);

            io.to(playerRoomId).emit('updateplayers', roomObj.players);
        } else {

            socket.emit('failed');

        }
    });

    socket.on('formchange', (data) => {

        socket.to(playerRoomId).broadcast.emit('formchange', { rounds: data.rounds, editTime: data.editTime });

    });

    socket.on('disconnect', () => {

        if (playerRoomId != undefined) {

            var roomObj = rooms[findRoom(playerRoomId, rooms)];

            let newOwner = roomObj.removePlayer(socket.id);

            if (!newOwner) {

                rooms.splice(findRoom(playerRoomId, rooms), 1);

            } else {

                io.sockets.connected[newOwner].emit('init', true);

                io.to(playerRoomId).emit('updateplayers', room.players);

            }

        }

        console.log(`${socket.id} has disconnected`);

    });

});