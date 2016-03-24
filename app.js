
// create server
var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

console.log('Server Started');

// usernames which are currently connected to the chat
var usernames = {};

// images to dispaly
var images = ['car.png', 'dog.png', 'flower.png'];

// rooms which are currently available in chat

io.sockets.on('connection', function (socket) {
	
	console.log('______________________________________________');
	console.log('User connected');

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){

		var joiningRoom = roomToJoin();

		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = joiningRoom;
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join(joiningRoom);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected <b>' + socket.room +'</b>');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(joiningRoom).emit('updatechat', 'SERVER', username + ' has connected to this room');
		// socket.emit('updaterooms', rooms, socket.room);

		console.log("PEOPLE WAITING=" + rooms[joiningRoom].peopleJoined);

		console.log("[adduser] joiningRoom=" + joiningRoom)
		rooms[joiningRoom].peopleJoined = rooms[joiningRoom].peopleJoined+1;
		
		console.log("PEOPLE JOINED=" + rooms[joiningRoom].peopleJoined);

		setImageForRoom(socket.room);
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);

		console.log("message: " + data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		// socket.emit('updaterooms', rooms, newroom);

		setImageForRoom(newroom);
		
	});
	
	function setImageForRoom(room) {
		// set image
		var image_name = 'dog.png';
		switch (room) {
			case 'room1':
				image_name = "dog.png";	
			break;
			case 'room2':
				image_name = "car.png";
			break;
			case 'room3':
				image_name = "flower.jpg";
			break;
			default:
			break;
		}
		socket.emit('setimage', image_name);
	}

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});


// ROOM MANAGER
function Room() {
	var name;
	var peopleJoined;
	var imageSource;
};

var rooms = {};

function  roomToJoin() {

	console.log("[roomToJoin] rooms.length=" + arrLenght(rooms));


	for (x in rooms) {
		if (rooms[x].peopleJoined < 2) {
			console.log("[roomToJoin] Joining to existing room name="+rooms[x].name+", people joined=" + rooms[x].peopleJoined);
			return rooms[x].name;
		}
	}	

	
	// create new room
	var newroom = new Room();
	newroom.imageSource = "dog.png";
	newroom.name = "newroom"+arrLenght(rooms);
	newroom.peopleJoined = 0;

	rooms[newroom.name] = newroom;

	console.log("[roomToJoin] Created new room name="+rooms[newroom.name].name+", people joined=" + rooms[newroom.name].peopleJoined);
	console.log("[roomToJoin] rooms.length=" + arrLenght(rooms));

	return newroom.name;	
}

function arrLenght(array) {
	return Object.keys(array).length;
}




