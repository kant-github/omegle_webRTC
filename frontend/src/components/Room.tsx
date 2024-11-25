import { useEffect, useRef, useState } from "react"
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
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);



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
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: 'sender',
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("negotiated and sent the offer");
                const sdp = await pc.createOffer();
                // @ts-ignore
                pc.setLocalDescription(sdp);
                socket.emit('offer', {
                    roomId,
                    sdp
                })
            }


        })

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            console.log("recieved the offer and sending the answer now ");
            console.log(remoteSdp);
            setLobby(false);

            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp);

            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp);
            setReceivingPc(pc);

            //setting up the upcoming stream
            const stream = new MediaStream()
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setRemoteMediaStream(stream);
            window.pcr = pc;
            pc.ontrack = (e) => {
                alert('incoming video on track')
            }

            //on-ice-candidate on the reciever side :)
            pc.onicecandidate = (e) => {
                if (!e.candidate) {
                    return;
                }
                if (e.candidate) {
                    socket.emit('add-ice-candidate', {
                        candidate: e.candidate,
                        roomId,
                        type: 'receiver'
                    })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            })

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track;
                const track2 = pc.getTransceivers()[1].receiver.track;

                if (track1.kind === 'audio') {
                    setRemoteAudioTrack(track1);
                    setRemoteVideoTrack(track2);
                } else {
                    setRemoteAudioTrack(track2);
                    setRemoteVideoTrack(track1);
                }

                // @ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1);
                // @ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2);
                // @ts-ignore
                remoteVideoRef.current.play();
            }, 5000)
        })


        socket.on('answer', ({ roomId, sdp: remoteSdp }) => {
            console.log('recieved the answer');
            console.log(remoteSdp);
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            })
            console.log('connection done :)');
        })

        socket.on('lobby', () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            console.log("add ice candidate from remote");
            console.log({ candidate, type })
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receicng pc nout found")
                    } else {
                        console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc nout found")
                    } else {
                        // console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })

        setSocket(socket);

    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])

    return (
        <div>
            <video autoPlay width={400} height={400} ref={localVideoRef}></video>
            {lobby ? "Waiting to connect you to someone" : null}
            <video autoPlay width={400} height={400} ref={remoteVideoRef}></video>
        </div>

    )
}