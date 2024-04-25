const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
// const { Server } = require("socket.io");
const server = http.createServer(app);
require('dotenv').config()
const io = require("socket.io")(server, {
    cors: {
        origin: "http://0aac-145-93-92-236.ngrok-free.app",
        // origin: process.env.ORIGIN_WEBAPP,
        methods: ["GET", "POST"]
    },
});

app.use(cors());

// Store the relationships between socket instances and rooms
// TODO: Replace with redis 
const sids = new Map(); // Map<SocketId, Set<Room>>
const rooms = new Map(); // Map<Room, Set<SocketId>>
const socketUsers = new Map();

const roomIsFull = (roomid) => {
    const usersInRooms = [];
    rooms.forEach((users, room) => {
        if (room !== roomid) return;
        usersInRooms.push(...Array.from(users));
    });

    if (usersInRooms.length < 2)
        return false;

    return true;
}
app.get('/room/:roomid', (req, res) => {
    const roomid = req.params.roomid;
    const usersInRooms = [];


    rooms.forEach((users, room) => {
        if (room !== roomid) return;
        usersInRooms.push(...Array.from(users));
    });

    if (usersInRooms.length < 2)
        res.json(usersInRooms);
    else res.json('Room full')
})

// Handle socket connection
io.on('connection', (socket) => {
    console.log('a user connected');

    // Function to join a room with a user ID
    socket.on('join', (data) => {
        const { room, userId } = data;

        // Associate userId with socket.id
        socketUsers.set(socket.id, userId);

        if (!socket.rooms.has(room)) { // Check if socket is not already in the room
            // Add socket to the room
            socket.join(room);

            // Update sids Map with user ID
            if (!sids.has(userId)) {
                sids.set(userId, new Set());
            }
            sids.get(userId).add(room);

            // Update rooms Map
            if (!rooms.has(room)) {
                rooms.set(room, new Set());
            }
            io.to(room).emit('userJoined', userId);
            rooms.get(room).add(userId);

            console.log(`User ${userId} joined room ${room}`);
        }
    });

    // Function to leave a room with a user ID
    socket.on('leave', (data) => {
        const { room, userId } = data;

        if (socket.rooms.has(room)) { // Check if socket is already in the room
            // Remove socket from the room
            socket.leave(room);

            // Update sids Map
            if (sids.has(userId)) {
                sids.get(userId).delete(room);
            }

            // Update rooms Map
            if (rooms.has(room)) {
                rooms.get(room).delete(userId);
                io.to(room).emit('userLeft', userId);
            }

            console.log(`User ${userId} left room ${room}`);
        }
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        // Get the userId associated with this socket.id
        const userId = socketUsers.get(socket.id);

        socket.rooms.forEach((room) => {
            if (rooms.has(room)) {
                rooms.get(room).delete(userId);
                io.to(room).emit('userLeft', userId);
            }
        });

        // Remove socket.id and its associated userId from the map
        socketUsers.delete(socket.id);
    });
});
// Listen on port 3000
server.listen(5000, () => {
    console.log('listening on *:5000');
});