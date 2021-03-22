var socket = io();
socket.on('message', function (data) {
    console.log(data);
});

var menu = document.getElementById('menu');
var playbutton = document.getElementById('play');
var usernameinput = document.getElementById('username');
var leaderboard = document.getElementById("leaderboard");

const tank = new Image();
tank.onload = function(){
    canvas.style.display = 'none';
    menu.style.display = 'block';
    usernameinput.focus();
};
tank.src = '/assets/tank.svg';

playbutton.onclick = function () {
    menu.style.display = 'none';
    leaderboard.style.display = 'block';
    socket.emit('new player', usernameinput.value);
    canvas.style.display = 'block';
}

var movement = {
    up: false,
    down: false,
    left: false,
    right: false,
    direction: 0,
}
document.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 65:
            movement.left = true;
            break;
        case 87:
            movement.up = true;
            break;
        case 68:
            movement.right = true;
            break;
        case 83:
            movement.down = true;
            break;
    }
});
document.addEventListener('keyup', function (event) {
    switch (event.keyCode) {
        case 65:
            movement.left = false;
            break;
        case 87:
            movement.up = false;
            break;
        case 68:
            movement.right = false;
            break;
        case 83:
            movement.down = false;
            break;
    }
});
const tankRotate = Math.PI / 2;
document.onmousemove = function (event) {
    movement.direction = Math.atan2(event.clientX - window.innerWidth / 2, window.innerHeight / 2 - event.clientY) - tankRotate;
}

document.addEventListener('click', function (event) {
    let w = canvas.width / 2;
    let h = canvas.height / 2;
    let x = event.clientX;
    let y = event.clientY;
    let dir = Math.atan2(x - w, h - y);
    socket.emit('shot', dir);
})

setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);

socket.on('update players', function (list) {
    leaderboard.textContent = '';
    let name = document.createElement("div");
    name.classList.add("name");
    name.innerText = 'LEADERBOARD';
    let row = document.createElement("div");
    row.classList.add("row");
    row.appendChild(name);
    leaderboard.appendChild(row);

    var sortable = [];
    for (let i in list) {
        sortable.push(list[i]);
    }
    sortable.sort(function (a, b) { return b.score - a.score });

    for (i = 0; i < sortable.length; i++) {
        let name = document.createElement("div");
        let score = document.createElement("div");
        name.classList.add("name");
        score.classList.add("score");
        name.innerText = sortable[i].username;
        score.innerText = sortable[i].score;

        let row = document.createElement("div");
        row.classList.add("row");
        row.appendChild(name);
        row.appendChild(score);
        leaderboard.appendChild(row);
    }
});

socket.on('death', function(){
    alert("you died.")
    location.reload()
});

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var context = canvas.getContext('2d');


socket.on('state', function (players, eggs, bullets) {
    var me = players[socket.id];

    if (me !== undefined) {
        //technically a white "background" for now
        context.clearRect(0, 0, canvas.width, canvas.height);

        //boundaries
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, 3000, 3000); // MAP size is 3000

        //draw players
        for (let i in players) {
            let player = players[i];
            if (i == socket.id) {
                context.fillStyle = 'blue';
            }
            else {
                context.fillStyle = 'red';
            }
            drawPlayer(player, me);
        }
        //draw bullets
        context.fillStyle = 'black';
        for (i = 0; i < bullets.length; i++) {
            drawObject(bullets[i], me);
        }
        //draw eggs
        context.fillStyle = 'yellow';
        for (i = 0; i < eggs.length; i++) {
            let egg = eggs[i];
            drawObject(egg, me);
        }
    }
});

function drawObject(object, me) {
    context.beginPath();
    let x = canvas.width / 2 + object.x - me.x;
    let y = canvas.height / 2 + object.y - me.y;
    context.arc(x, y, object.radius, 0, 2 * Math.PI);
    context.fill();
}
function drawPlayer(player, me) {
    const canvasX = canvas.width / 2 + player.x - me.x;
    const canvasY = canvas.height / 2 + player.y - me.y;
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(player.direction);
    /*context.beginPath();
    context.arc(0, 0, player.radius, 0, 2 * Math.PI);
    context.fill();*/
    context.drawImage(
        tank,
        -player.radius,
        -player.radius,
        /*player.radius * 2,
        player.radius * 2,*/ // WIDTH AND HEIGHT not thaaat useful here
    );
    context.font = "20px Arial";
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.fillText(player.username, 0, -player.radius);
    context.restore();
}


