import { Socket } from "socket.io";
import { RoomManager } from "./roomManager";

export interface Users {
    name: string
    socket: Socket
}

export class UserManager {

    private queue: string[];
    private users: Users[];
    private roomManager: RoomManager;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {

        this.users.push({ name, socket });
        this.queue.push(socket.id);

        socket.emit("lobby");

        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {

        const data = this.roomManager.getRoomBySocketId(socketId);
        if (!data) return;

        const room = data.room;
        const roomId = data.roomId;

        if (room) {
            const remainingUser = room.user1.socket.id === socketId ? room.user2 : room.user1;
            this.queue.push(remainingUser.socket.id);
            this.roomManager.destroyRoom(roomId);
            remainingUser.socket.emit("lobby");
        }

        const user = this.users.find(x => x.socket.id === socketId);

        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x !== socketId);
        console.log("printing the queue ");
        for (let i = 0; i < this.queue.length; i++) {
            console.log(this.queue[i]);
        }

        this.clearQueue();
    }

    clearQueue() {

        if (this.queue.length < 2) {
            return;
        }

        const socketID1 = this.queue.pop();
        const socketID2 = this.queue.pop();

        const user1 = this.users.find(x => x.socket.id === socketID1);
        const user2 = this.users.find(x => x.socket.id === socketID2);

        if (!user1 || !user2) {
            return;
        }

        this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {

        socket.on('offer', ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id)
        })

        socket.on('answer', ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        })

        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
    }

}