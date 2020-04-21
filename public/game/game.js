// Game Variables

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 650;
canvas.height = 650;

var subjects;

fetch('/api/nouns', { method: 'GET' }).then(res => {

    const data = res.json();

    data.then(res => {

        subjects = res.nouns.split('\n')

    });

});

var randSubjects;

var randSubject;

var image;


var timerInterval;
var timer = false;
var countdown = 5;

var fontSize = 55;

ctx.textAlign = "center";
ctx.font = fontSize + "px Comic Sans MS";

var stage = -1;

var introstage = 1;

var leftClick = false;

var mousePos = {
    x: 0,
    y: 0
};

document.onmouseup = function (e) {

    if (e.button == 0) {

        leftClick = true;

    }

    mousePos.x = e.clientX;
    mousePos.y = e.clientY;

};

// Game functions

function getRandomSubjects() {

    let currentAvailable = [];

    currentAvailable = currentAvailable.concat(subjects);

    let returnVals = [];

    for (let i = 0; i < 3; i++) {

        let index = Math.floor(Math.random() * currentAvailable.length);
        let item = currentAvailable[index];

        returnVals.push(item);

        currentAvailable.splice(index, 1);

    }

    return returnVals;

}

async function getImage(search) {

    const response = await fetch(`/api/random_flickr/?search=${search}`, {
        method: "GET",

        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },

    });

    const data = await response.json();

    return data.url;


}

function decreaseTimer() {

    if (timer) {
        countdown--;
    }
}

async function toDataURL(url) {
    return fetch(url).then((response) => {
            return response.blob();
        }).then(blob => {
            return URL.createObjectURL(blob);
        });
}

async function download() {
    const a = document.createElement("a");
    a.href = await toDataURL(image.src);
    a.download = randSubject + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function clear() {

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

function Button(x, y, text, color) {

    this.x = x;
    this.y = y;

    this.text = text;

    this.w = ctx.measureText(this.text).width;
    this.h = fontSize;

    this.color = color;

}

Button.prototype.show = function () {

    ctx.fillStyle = this.color;

    ctx.fillText(this.text, this.x, this.y);

}

Button.prototype.collide = function (xPos, yPos) {

    var rect = canvas.getBoundingClientRect();

    let x = xPos - rect.left;

    let y = yPos - rect.top;

    return (x >= this.x - this.w / 2 && x <= this.x + this.w / 2 && y <= this.y && y >= this.y - this.h);

}

// Pregame Variables

const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get('id') || '';
const playerName = urlParams.get('name') || 'Player';

var socket = io();

socket.emit('joinroom', { id: gameID, name: playerName });

document.getElementById('invite').value = gameID;

var playerHolder = document.getElementById('playersContainer');

var amOwner = false;

// Forms

var forms = [];

forms.push(document.getElementById('lobbySetRounds'));

forms.push(document.getElementById('lobbySetEditTime'));

var playBtn = document.getElementById('buttonLobbyPlay');

// Pregame actions

playBtn.addEventListener('click', () => {

    socket.emit('startgame');

});

socket.on('failed', () => {


    document.getElementById('game').innerHTML = "<p> ROOM DOESNT EXIST </p>";

});

socket.on('midgame', () => {


    document.getElementById('game').innerHTML = "<p> GAME ALREADY STARTED </p>";

});

socket.on('init', (owner) => {

    if (owner) {

        amOwner = true;

        document.getElementsByClassName('containerInvite')[0].style.display = "initial";

        for (form of document.getElementsByClassName('form-control')) {

            form.disabled = false;

        }

        document.getElementById('buttonLobbyPlay').disabled = false;


    } else {

        amOwner = false;

        document.getElementsByClassName('containerInvite')[0].style.display = "none";

        for (form of document.getElementsByClassName('form-control')) {

            form.disabled = true;

        }

        document.getElementById('buttonLobbyPlay').disabled = true;

    }

});

for (form of forms) {

    form.addEventListener('change', () => {

        socket.emit('formchange', ({ rounds: forms[0].value, editTime: forms[1].value }));


    });

}

socket.on('formchange', (data) => {

    forms[0].value = data.rounds;
    forms[1].value = data.editTime;

});

socket.on('updateplayers', (data) => {

    playerHolder.innerHTML = "";

    for (playerData of data) {

        let pData = `<div class="lobbyPlayer">`;

        if (playerData.owner) {

            pData += `<img src="resources/crown.png" alt="He's the owner""></img>`;

        }

        pData += `<p class="name"> ${playerData.name} </p>`;

        if (playerData.id == socket.id) {

            pData += `<p class="you"> You </p>`;

        }

        playerHolder.innerHTML += `${pData} </div>`;

    }

});

// Game actions

socket.on('startgame', () => {

    document.getElementById('screenLobby').style.display = "none";

    document.getElementById('gameScreen').style.display = "initial";

    stage = 0;

    randSubjects = getRandomSubjects();

    timerInterval = setInterval(decreaseTimer, 1000);

    setInterval(main, 10);


});

socket.on('imageChosen', (data) => {

    image = new Image;

    image.src = data.src;

    randSubject = data.sub;

    introstage = 4;

})



function main() {

    clear();

    if (stage == 0) {

        if (introstage == 1) {

            ctx.fillStyle = '#286580';
            ctx.fillText("Welcome to EditIT!", canvas.width / 2, canvas.height / 2);

            if (amOwner) {
                let continueBtn = new Button(canvas.width / 2, canvas.height / 2 + 100, "Continue", 'black');

                continueBtn.show();

                if (continueBtn.collide(mousePos.x, mousePos.y) && leftClick) introstage++; leftClick = false;
            }
        }

        if (introstage == 2) {

            ctx.fillStyle = '#286580';
            ctx.fillText("Choose a subject", canvas.width / 2, canvas.height / 2);

            for (let i = 0; i < 3; i++) {

                let subjectButton = new Button(canvas.width / 2, canvas.height / 2 + fontSize * 2 + fontSize * i, randSubjects[i], 'black');

                subjectButton.show();

                if (subjectButton.collide(mousePos.x, mousePos.y) && leftClick) {

                    randSubject = randSubjects[i];

                    introstage++;

                    leftClick = false;

                }

            }

        }

        if (introstage == 3) {

            ctx.fillStyle = '#286580';
            ctx.fillText("Getting the image...", canvas.width / 2, canvas.height / 2);

            getImage(randSubject).then(res => {

                socket.emit('imageChosen', { img: res, sub: randSubject });

            });

            introstage = -1;

        }

        if (introstage == 4) {

            timer = true;

            ctx.fillStyle = '#286580';

            ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);

            if (countdown == 0) {

                timer = false;

                countdown = 180;

                introstage++;

            }

        }

        if (introstage == 5) {

            timer = true;

            ctx.drawImage(image, canvas.width / 2 - image.width / 2, canvas.height / 2 - image.height / 4);

            ctx.fillStyle = 'black';
            ctx.fillText("Subject: " + randSubject, canvas.width / 2, fontSize*1.5);

            let button = new Button(canvas.width / 2, fontSize * 2.8, "Download", 'lime');

            button.show();

            const a = document.createElement("a");
            a.href = toDataURL(image.src);
            a.download = randSubject + ".png";

            if (button.collide(mousePos.x, mousePos.y) && leftClick) {
                download();
                leftClick = false;
            }

            ctx.fillStyle = '#286580';
            ctx.fillText(Math.floor(countdown / 60) + ":" + countdown % 60, canvas.width / 2, fontSize * 4);
        }

    }

}