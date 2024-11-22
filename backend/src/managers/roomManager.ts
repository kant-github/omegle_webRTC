import { Users } from "./userManagers";

interface Room {
    user1: Users;
    user2: Users
}

let GLOBAL_ROOM_ID = 1;

export class RoomManager {
    private rooms: Map<string, Room>

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    createRoom(user1: Users, user2: Users) {

        const roomId = this.generate().toString();

        this.rooms.set(roomId, {
            user1,
            user2
        })

        user1.socket.emit("send-offer", {
            roomId
        })

        user2.socket.emit("send-offer", {
            roomId
        })
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }

}