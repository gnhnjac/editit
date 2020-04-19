
const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get('id') || '';
const playerName = urlParams.get('name') || 'Player';

var socket = io();

socket.emit('joinroom', {id: gameID, name: playerName});

document.getElementById('invite').value = gameID;

var playerHolder = document.getElementById('playersContainer');

var player = {name: playerName, id: 0};

// Forms

var forms = [];

forms.push(document.getElementById('lobbySetRounds'));

forms.push(document.getElementById('lobbySetEditTime'));

socket.on('init', (data)=> {

    if(data.owner) {
        document.getElementById('invite').value = gameID;
    } else {

        document.getElementsByClassName('containerInvite')[0].innerHTML = "";
        
        for(form of document.getElementsByClassName('form-control')) {

            form.disabled = true;

        }

    }

    player.id = data.id;

});

for(form of forms) {

    form.addEventListener('change', ()=> {

        socket.emit('formchange', ({rounds: forms[0].value, editTime: forms[1].value, id: gameID}));
    
    
    });
    
}

socket.on('formchange', (data)=> {

    forms[0].value = data.rounds;
    forms[1].value = data.editTime;

});

socket.on('newplayer', (data)=> {

    playerHolder.innerHTML = "";

    for(playerData of data) {

        let pData = `<div class="lobbyPlayer">`;

        if(playerData.owner) {

            pData += `<img src="crown.png" alt="He's the owner""></img>`;

        }

        pData += `<p class="name"> ${playerData.name} </p>`;

        if(playerData.id == player.id) {

            pData += `<p class="you"> You </p>`;

        }

        playerHolder.innerHTML += `${pData} </div>`;

    }

});

function main() {

}

setInterval(main, 10);