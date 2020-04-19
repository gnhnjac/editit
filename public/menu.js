
var ID = function () {
    return Math.random().toString(36).substr(2, 9);
};

const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get('id') || '';

console.log(gameID);

var socket = io({query: {

    id: gameID

}});

var button = document.getElementById('newroom');

button.addEventListener('click', ()=> {

    var newid = ID();

    socket.emit('createroompage', {id: newid});

});

socket.on('redirect', (data)=> {

    window.location.href = data;

});