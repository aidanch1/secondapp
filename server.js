var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io'); var app = express();
var server = http.Server(app);
var io = socketIO(server); app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static('public'));
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(5000, function () {
    console.log('Starting sever on port 5000\nPress ctrl+c to stop the server');
});

var players = {};
var bullets = [];
const MAP_SIZE = 3000;
io.on('connection', function (socket) {
    socket.on('new player', function (name) {
        let newPlayer = {
            x: Math.floor(Math.random() * MAP_SIZE),
            y: Math.floor(Math.random() * MAP_SIZE),
            speed: 5,
            radius: 25,
            direction: 0,
            username: name,
            score: 0
        }
        players[socket.id] = newPlayer;
        io.sockets.emit('update players', players);
    });
    socket.on('movement', function (data) {
        var player = players[socket.id] || {};
        if (data.left) {
            player.x -= player.speed;
        }
        if (data.right) {
            player.x += player.speed;
        }
        if (data.up) {
            player.y -= player.speed;
        }
        if (data.down) {
            player.y += player.speed;
        }
        //make sure players can't escape boundaries
        player.x = Math.max(0, Math.min(MAP_SIZE, player.x));
        player.y = Math.max(0, Math.min(MAP_SIZE, player.y));

        player.direction = data.direction;

        for (i = 0; i < eggs.length; i++) {
            if (touching(eggs[i], player)) {
                eggs.splice(i, 1);
                player.score += 1;
                io.sockets.emit('update players', players);
            }
        }
        for (i = 0; i < bullets.length; i++) {
            if (bullets[i].owner != socket.id && touching(bullets[i], player)) {
                bullets.splice(i, 1);
                delete players[socket.id];
                io.sockets.emit('update players', players);
                socket.emit('death');
            }
        }

    });
    socket.on('shot', function (dir) {
        if (players[socket.id] != null) {
            let bullet = {
                x: players[socket.id].x,
                y: players[socket.id].y,
                direction: dir,
                owner: socket.id,
                radius: 10,
                p: 0
            }
            bullets.push(bullet);
        }

    });
    socket.on('disconnect', function (){
        delete players[socket.id];
        io.sockets.emit('update players', players);
    });
});



setInterval(function () {
    io.sockets.emit('state', players, eggs, bullets);
}, 1000 / 60);

setInterval(function () {
    for (i = 0; i < bullets.length; i++) {
        if (bullets[i].x < 0 || bullets[i].x > MAP_SIZE || bullets[i].y < 0 || bullets[i].y > MAP_SIZE) {
            bullets.splice(i, 1);
        }
        else {
            bullets[i].x += 10 * Math.sin(bullets[i].direction);
            bullets[i].y -= 10 * Math.cos(bullets[i].direction)
        }
    }
}, 1000 / 60);

var eggs = [];
setInterval(function () {
    if (eggs.length < 75) {
        let egg = {
            x: Math.floor(Math.random() * MAP_SIZE),
            y: Math.floor(Math.random() * MAP_SIZE),
            radius: 10
        }
        eggs.push(egg);
    }
}, 250);

function distanceSquared(x1, y1, x2, y2) {
    return Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
}
function touching(circle1, circle2) {
    let dif = circle1.radius - circle2.radius;
    let sum = circle1.radius + circle2.radius;
    let dist = distanceSquared(circle1.x, circle1.y, circle2.x, circle2.y);
    return Math.pow(dif, 2) <= dist && dist <= Math.pow(sum, 2);
}



