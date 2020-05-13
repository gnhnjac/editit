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

// Rand Subject array
var randSubjects;

// Rand Subject Chosen
var randSubject;

// Random picked image
var image;

var finishedImages = [];

var amChooser = false;

var timerTime = 0;

var fontSize = 55;

var stage = 1;

var leftClick = false;

var mousePos = {
    x: 0,
    y: 0
};

ctx.textAlign = "center";
ctx.font = fontSize + "px Comic Sans MS";

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

var playerHolderGame = document.getElementById('playersContainerGame');

var amOwner = false;

// Forms

var forms = [];

forms.push(document.getElementById('lobbySetRounds'));

forms.push(document.getElementById('lobbySetEditTime'));

var playBtn = document.getElementById('buttonLobbyPlay');

var submitImg = document.getElementById('submitimage');

// Pregame actions

playBtn.addEventListener('click', () => {

    socket.emit('startround', { rounds: forms[0].value, per: forms[1].value });

});

socket.on('notenoughplayers', () => {

    alert("You Need a minimum of 3 players");

})

socket.on('failed', () => {


    document.getElementById('game').innerHTML = "<p> ROOM DOESNT EXIST </p>";

});

socket.on('midgame', (data) => {

    if (data.src) {
        image = new Image;

        image.src = data.src;

        randSubject = data.sub;

        stage = 5;

    } else {

        stage = 1;

    }

    document.getElementById('screenLobby').style.display = "none";

    document.getElementById('gameScreen').style.display = "initial";

    setInterval(main, 10);

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

    if (data.mid == false) {
        playerHolder.innerHTML = "";

        for (playerData of data.players) {

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
    } else {

        playerHolderGame.innerHTML = "";

        for (playerData of data.players) {

            let pData = `<div class="gamePlayer">`;

            if (playerData.id == data.chooserid) {

                pData += '<p style="display: inline-block; text-align: center;"> 🚩 </p>'

            }

            pData += `<p class="name"> ${playerData.name} </p>`;

            if (playerData.id == socket.id) {

                pData += `<p class="you"> You </p>`;

            }

            pData += `<p style="display: inline-block; text-align: center;"> ${playerData.points} </p>`;

            playerHolderGame.innerHTML += `${pData} </div>`;
        }

    }

});

// Game actions

submitImg.addEventListener('click', () => {

    const file = document.getElementById('photoshopped').files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        socket.emit('submitimage', reader.result);
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }

})

socket.on('startround', (chooserInd) => {

    if (chooserInd == socket.id) {

        amChooser = true;

    }

    document.getElementById('screenLobby').style.display = "none";

    document.getElementById('gameScreen').style.display = "initial";

    randSubjects = getRandomSubjects();

    setInterval(main, 10);

});

socket.on('timer', (t) => {

    timerTime = t;

})



socket.on('imageChosen', (data) => {

    image = new Image;

    image.src = data.src;

    randSubject = data.sub;

    stage = 4;

});

socket.on('begindrawing', () => {

    stage = 5;

});

socket.on('roundover', (images) => {

    finishedImages = [];

    for (imageSrc of images) {

        var fimage = new Image();
        fimage.src = imageSrc;

        finishedImages.push(fimage);

    }

    document.getElementById("photoshopped").style.opacity = 0;
    document.getElementById("photoshopped").disabled = true;

    document.getElementById("submitimage").style.opacity = 0;
    document.getElementById("submitimage").disabled = true;

    canvas.width = 1300;

    stage = 6;

})

function main() {

    clear();

    if (stage == 1) {

        ctx.fillStyle = '#286580';

        if (amChooser) {
            ctx.fillText("Welcome to EditIT!", canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText("Wait for the chooser", canvas.width / 2, canvas.height / 2);
            ctx.fillText("to choose a subject", canvas.width / 2, canvas.height / 2 + fontSize);

        }


        if (amOwner) {
            let continueBtn = new Button(canvas.width / 2, canvas.height / 2 + 100, "Continue", 'black');

            continueBtn.show();

            if (continueBtn.collide(mousePos.x, mousePos.y) && leftClick) stage++; leftClick = false;
        }
    }

    if (stage == 2) {

        ctx.fillStyle = '#286580';
        ctx.fillText("Choose a subject", canvas.width / 2, canvas.height / 2);

        for (let i = 0; i < 3; i++) {

            let subjectButton = new Button(canvas.width / 2, canvas.height / 2 + fontSize * 2 + fontSize * i, randSubjects[i], 'black');

            subjectButton.show();

            if (subjectButton.collide(mousePos.x, mousePos.y) && leftClick) {

                randSubject = randSubjects[i];

                stage++;

                leftClick = false;

            }

        }

    }

    if (stage == 3) {

        ctx.fillStyle = '#286580';
        ctx.fillText("Getting the image...", canvas.width / 2, canvas.height / 2);

        getImage(randSubject).then(res => {

            socket.emit('preeditcountdown', { img: res, sub: randSubject });

        });

        stage = -1;

    }

    if (stage == 4) {

        ctx.fillStyle = '#286580';

        ctx.fillText(timerTime, canvas.width / 2, canvas.height / 2);

        if (timerTime == 0) {

            if (amOwner) {

                socket.emit('roundcountdown');

            }

            document.getElementById("photoshopped").style.opacity = 100;
            document.getElementById("photoshopped").disabled = false;

            document.getElementById("submitimage").style.opacity = 100;
            document.getElementById("submitimage").disabled = false;

        }

    }

    if (stage == 5) {

        ctx.drawImage(image, canvas.width / 2 - image.width / 2, canvas.height / 2 - image.height / 4);

        ctx.fillStyle = 'black';
        ctx.fillText("Subject: " + randSubject, canvas.width / 2, fontSize * 1.5);

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
        ctx.fillText(Math.floor(timerTime / 60) + ":" + timerTime % 60, canvas.width / 2, fontSize * 4);

        if (timerTime == 0) {

            if (amOwner) {
                socket.emit('roundover');
            }

        }

    }

    if (stage == 6) {

        var i = 0;
        var zoomed = false;
        for (let j = -finishedImages.length / 2; j < finishedImages.length / 2; j++) {

            var rect = canvas.getBoundingClientRect();

            let x = mousePos.x - rect.left;

            let y = mousePos.y - rect.top;

            if (x >= canvas.width / 2 + j * (canvas.width / 6) && x <= canvas.width / 2 + j * (canvas.width / 6) + canvas.width / 6 && y >= 0 && y <= canvas.width / 6) {

                ctx.drawImage(finishedImages[i], canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);
                ctx.strokeStyle = "black";
                ctx.strokeRect(canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);
                zoomed = true;

            } else {

                if (!zoomed) {
                    ctx.drawImage(finishedImages[i], canvas.width / 2 + j * (canvas.width / 6), 0, canvas.width / 6, canvas.width / 6);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(canvas.width / 2 + j * (canvas.width / 6), 0, canvas.width / 6, canvas.width / 6);
                }
            }

            i++;
        }

    }

}