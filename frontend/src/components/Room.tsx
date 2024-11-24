import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const URL: string = "http://localhost:3000"

interface props {
    name: string | null;
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
}

export default function Room({ name }: props) {
    // const [searchParams, setSearchParams] = useSearchParams();
    // const name = searchParams.get('name');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobby, setLobby] = useState(true);
    useEffect(() => {
        const socket = io(URL);

        socket.on('send-offer', ({ roomId }) => {
            console.log("sending offer from the frontend");
            setLobby(false);
            socket.emit('offer', {
                roomId,
                sdp: ""
            })
        })

        socket.on('offer', async ({ roomId, offer }) => {
            console.log("recieved the offer and sending the answer now ");
            await new Promise(t => setTimeout(t, 7000));
            setLobby(false);
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