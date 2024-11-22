import http from "http";
import express from "express";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server({
    cors: {
        origin: "*"
    }
})

io.on('connection', (socket: Socket) => {
    console.log("a user connected");
})