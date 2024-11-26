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

    getRoomBySocketId(socketId: string) {

        for (const [roomId, room] of this.rooms) {
            if (room.user1.socket.id === socketId || room.user2.socket.id === socketId) {
                return {
                    roomId,
                    room
                };
            }
        }
        return null;
    }

    createRoom(user1: Users, user2: Users) {

        const roomId = this.generate().toString();
        this.rooms.set(roomId, {
            user1,
            user2
        })

        user1.socket.emit("send-offer", {
            roomId,
            partnersName: user2.name
        })

        user2.socket.emit("send-offer", {
            roomId,
            partnersName: user1.name
        })

    }

    destroyRoom(roomId: string) {
        this.rooms.delete(roomId);        
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