import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const URL: string = "http://localhost:3000"

interface props {
    name: string | null;
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
}

export default function Room({ name, localAudioTrack, localVideoTrack }: props) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobby, setLobby] = useState(true);
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [recievingPc, setRecievingPc] = useState<RTCPeerConnection | null>(null);


    useEffect(() => {
        const socket = io(URL);

        socket.on('send-offer', ({ roomId }) => {
            console.log("sending offer from the frontend");
            setLobby(false);

            const pc = new RTCPeerConnection();
            setSendingPc(pc);

            if (localVideoTrack) {
                console.log("added senders video track to pc object");
                pc.addTrack(localVideoTrack)
            }

            if (localAudioTrack) {
                console.log("added senders audio track to pc object");
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = (e) => {
                console.log("recieving ice candidate locally");
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: 'sender',
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = () => {
                const sdp = pc.createOffer();
                // @ts-ignore
                pc.setLocalDescription(sdp);
                socket.emit('offer', {
                    roomId,
                    sdp
                })
            }


        })

        socket.on('offer', async ({ roomId, sdp: remoteSdp }) => {
            console.log("recieved the offer and sending the answer now ");
            setLobby(false);

            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp);
            
            setRecievingPc(pc);
            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp);
            
            socket.emit("answer", {
                roomId,
                sdp: ""
            })
        })


        socket.on('answer', ({ roomId, answer }) => {
            setLobby(false);
            console.log('connection done :)');
        })

        socket.on('lobby', () => {
            setLobby(true);
        })

    }, [])

    if (lobby) {
        <div>Waiting to connect you to someone</div>
    }
    return (
        <div>
            Hi {name}
        </div>
    )
}