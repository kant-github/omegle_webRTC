import { Socket } from "socket.io";
interface Users {
    name: string
    socket: Socket
}

export class userManager {
    private users: Users[];
    private queue: string[];

    constructor() {
        this.users = [];
        this.queue = [];
    }

    addUser(name: string, socket: Socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
    }

    removeUser(socketId: string) {
        const user = this.users.find(x => x.socket.id === socketId);

        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x === socketId);
    }

    clearQueue() {
        if (this.queue.length < 2) {
            console.log("Not enough users to create room");
            return;
        }

        const socketID1 = this.queue.pop();
        const socketID2 = this.queue.pop();

        const user1 = this.users.find(x => x.socket.id === socketID1);
        const user2 = this.users.find(x => x.socket.id === socketID2);

        console.log("room creation started");

    }
}