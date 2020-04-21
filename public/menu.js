
var socket = io();

var playerName = document.getElementById('name');
var gameID = document.getElementById('gameid');
var create = document.getElementById('newroom');
var join = document.getElementById('joinroom');

create.addEventListener('click', () => {

    socket.emit('createroompage', { name: playerName.value });

});

join.addEventListener('click', () => {

    socket.emit('joinroompage', { id: gameID.value, name: playerName.value });

});

socket.on('redirect', (data) => {

    window.location.href = data;

});