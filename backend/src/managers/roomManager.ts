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
        console.log("created room's id is : ", roomId);

        this.rooms.set(roomId, {
            user1,
            user2
        })
        console.log("asking for offer from user 1");
        user1.socket.emit("send-offer", {
            roomId
        })
        console.log("asking for offer from user 2");
        user2.socket.emit("send-offer", {
            roomId
        })
    }

    onOffer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }

        const recievingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1
        recievingUser.socket.emit("offer", {
            sdp,
            roomId
        })
    }

    onAnswer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }

        const recievingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        recievingUser.socket.emit('answer', {
            sdp,
            roomId
        })
    }

    onIceCandidates(roomId: string, senderSocketid: string, candidate: any, type: "sender" | "receiver") {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;
        receivingUser.socket.emit("add-ice-candidate", ({ candidate, type }));
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }
}