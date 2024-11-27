import http from "http";
import express, { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { UserManager } from "./managers/userManagers";

const PORT = 8080;
const app = express();
const server = http.createServer(app);
const userManager = new UserManager();


app.get("/", (req: Request, res: Response) => {
    return res.json({
      message: "your crooked backend is up"  
    })
})

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

io.on('connection', (socket: Socket) => {
    console.log("a user is connected");

    socket.on('user-joined', ({ name }) => {
        userManager.addUser(name, socket);
    })

    socket.on('disconnect', () => {
        console.log("a user is disconnected")
        userManager.removeUser(socket.id)
    })
})

server.listen(PORT, () => {
    console.log(`App is listening at port* ${PORT}`);
})