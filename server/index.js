import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import router from './router.js';
import cors from 'cors';

import { addUser, getUser, removeUser, getUsersInRoom } from './users.js';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {
    console.log('We have a new Connection');

    socket.on('join', ({ name, room }, callback) => {
        // console.log(name, room);
        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) {
            return callback({ error })
        }

        //Chatbot greeting
        socket.emit('message', { user: 'Admin', text: `${user.name}, Welcome to the room ${user.room}` })
        //everyone gets the info apart from the user who joined
        socket.broadcast.to(user.room).emit('message', { user: "Admin", text: `${user.name} has joined the room!` });

        socket.join(user.room)

        io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });

        callback();
        // const error = true;
        // if (error) {
        //     callback({ error: 'error' });
        // }

    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message })


        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: "Admin", text: `${user.name} has left the room!` })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })
})





app.use('/', router);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
