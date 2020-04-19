
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get('id') || '';

var socket = io();

socket.emit('joinroom', {id: gameID});

function main() {



}

setInterval(main, 10);