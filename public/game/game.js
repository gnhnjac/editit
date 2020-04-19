
const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get('id') || '';
const playerName = urlParams.get('name') || 'Player';

var socket = io();

socket.emit('joinroom', {id: gameID, name: playerName});

document.getElementById('invite').value = gameID;

var playerHolder = document.getElementsByClassName('players')[0];

socket.on('newplayer', (data)=> {

    playerHolder.innerHTML = "";

    for(player of data) {

        playerHolder.innerHTML += `<p> ${player.name} </p>`;

    }

})

function main() {

}

setInterval(main, 10);