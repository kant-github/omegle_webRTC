import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client"

const URL: string = "http://localhost:3000"
export default function Room() {
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get('name');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobby, setLobby] = useState(true);
    useEffect(() => {
        console.log("inisde use Effect");
        const socket = io(URL);

        socket.on("send-offer", ({ roomId }) => {
            alert("send offer please");
            setLobby(false);
            socket.emit("offer", {
                roomId,
                sdp: ""
            })
        })

        socket.on('offer', ({ roomId, offer }) => {
            alert('send answer please');
            setLobby(false);
            socket.emit("answer", {
                roomId,
                sdp: ""
            })
        })

        socket.on('lobby', () => {
            setLobby(true);
        })

        socket.on('answer', ({ roomId, answer }) => {
            alert('connection done :)');
        })


    }, [])

    return (
        <div>
            Hi {name}
        </div>
    )
}