require('dotenv').config();

const express = require('express');
const request = require("request");
const fs = require('fs');

var app = express();

var port = process.env.PORT || 3000;

var server = app.listen(port, () => {

    console.log(`listening on port ${port}`);

})

app.get('/api/nouns', async function (req, res) {

    fs.readFile('nouns.txt', 'utf8', (err, data) => {

        res.json({ nouns: data });

    });

})

app.get('/api/random_flickr', async function (req, response) {

    var options = {
        method: 'GET',
        url: `https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&text=${req.query.search}&sort=relevance&per_page=500&api_key=${process.env.API_KEY}`
    };

    await request(options, (error, res) => {

        let image = JSON.parse(res.body)['photos']['photo'][Math.floor(Math.random() * 500)];

        response.json({ url: `https://farm${image['farm']}.staticflickr.com/${image['server']}/${image['id']}_${image['secret']}.jpg` });

    });

});

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

    this.midGame = false;

    this.players = [];
    this.chooserIndex = -1;

    this.time = 0;
    this.timer = false;

    this.rounds;
    this.perRound;

    this.subject;
    this.image;

}

Room.prototype.addPlayer = function (name, id) {

    let owner = false

    if (this.players.length < 1) {
        owner = true;
    }

    this.players.push({ name: name, id: id, owner: owner, points: 0, psub: 0 });

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

Room.prototype.submitImage = function (id, image) {

    for (let i = 0; i < this.players.length; i++) {

        if (this.players[i].id == id) {

            this.players[i].psub = image;

        }

    }

}

Room.prototype.getImages = function () {

    var images = [];

    for (let i = 0; i < this.players.length; i++) {

        if (this.players[i].psub == 0) {

            this.players[i].psub = "resources/background.png";

        }

        images.push(this.players[i].psub);

    }

    return images;

}

Room.prototype.timerTick = function () {

    if (this.timer) {

        if (this.time == 0) {

            this.timer = false;

        }

        io.to(this.id).emit('timer', this.time);

        if (this.time != 0) {
            this.time--;
        }

    }

}

Room.prototype.setTime = function (t) {

    this.time = t;

}

Room.prototype.startTimer = function (t) {

    io.to(this.id).emit('timer', this.time);

    this.timer = true;

}

var rooms = [];

// Second Operations
setInterval(() => {

    for (room of rooms) {

        room.timerTick();

    }

}, 1000);

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

            var room = rooms[findRoom(data.id, rooms)];

            playerRoomId = data.id;

            socket.join(data.id);

            console.log(`${data.name} has joined room ${data.id}`);

            let isOwner = room.addPlayer(data.name, socket.id);

            socket.emit('init', isOwner);

            io.to(playerRoomId).emit('updateplayers', { players: room.players, mid: room.midGame, chooserid: 0 });

            if (room.midGame) {

                socket.emit('midgame', { src: data.img, sub: data.sub });
                io.to(playerRoomId).emit('updateplayers', { players: room.players, mid: room.midGame, chooserid: room.players[room.chooserIndex].id });

            }

        } else {

            socket.emit('failed');

        }
    });

    socket.on('formchange', (data) => {

        socket.to(playerRoomId).broadcast.emit('formchange', { rounds: data.rounds, editTime: data.editTime });

    });

    // game

    socket.on('startround', (data) => {

        var room = rooms[findRoom(playerRoomId, rooms)];

        if (room.players.length >= 2) {
            room.midGame = true;
            room.chooserIndex++;

            room.rounds = data.rounds;
            room.perRound = data.per;

            io.to(playerRoomId).emit('startround', room.players[room.chooserIndex].id);

            io.to(playerRoomId).emit('updateplayers', { players: room.players, mid: room.midGame, chooserid: room.players[room.chooserIndex].id });

        } else {

            socket.emit('notenoughplayers');

        }

    });

    socket.on('preeditcountdown', (data) => {

        var room = rooms[findRoom(playerRoomId, rooms)];

        room.setTime(5);
        room.startTimer();

        room.image = data.img;
        room.subject = data.sub;

        io.to(playerRoomId).emit('imageChosen', { src: data.img, sub: data.sub });

    });

    socket.on('roundcountdown', () => {

        var room = rooms[findRoom(playerRoomId, rooms)];

        //room.setTime(room.perRound*60);
        room.setTime(7);

        room.startTimer();

        io.to(playerRoomId).emit('begindrawing');

    })

    socket.on('submitimage', (img) => {

        var room = rooms[findRoom(playerRoomId, rooms)];

        room.submitImage(socket.id, img);

    });

    socket.on('roundover', () => {

        var room = rooms[findRoom(playerRoomId, rooms)];

        io.to(playerRoomId).emit('roundover', room.getImages());

    })

    socket.on('disconnect', () => {

        if (playerRoomId != undefined) {

            var room = rooms[findRoom(playerRoomId, rooms)];

            let newOwner = room.removePlayer(socket.id);

            if (!newOwner) {

                rooms.splice(findRoom(playerRoomId, rooms), 1);

            } else {

                io.sockets.connected[newOwner].emit('init', true);

                if (room.midGame) {

                    if(room.chooserIndex+1 > room.players.length) {

                        room.chooserIndex = 0;

                    }

                    io.to(playerRoomId).emit('updateplayers', { players: room.players, mid: room.midGame, chooserid: room.players[room.chooserIndex].id });
    
                } else {

                    io.to(playerRoomId).emit('updateplayers', { players: room.players, mid: room.midGame, chooserid: 0 });

                }

            }

        }

        console.log(`${socket.id} has disconnected`);

    });

});