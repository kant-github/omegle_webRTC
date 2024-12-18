import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import Loading from "./Loading";

const BACKEND_URL: string = "https://backend-crooked.kantbuilds.com"

interface props {
    name: string | null;
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
}

export default function Room({ name, localAudioTrack, localVideoTrack }: props) {
    const [lobby, setLobby] = useState(true);
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [partnersName, setPartnersName] = useState<string | null>(null);
    // const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    // const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    // const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    console.log(sendingPc);
    console.log(receivingPc);

    useEffect(() => {
        const socket = io(BACKEND_URL);

        socket.on('connect', () => {
            if (name) {
                socket.emit("user-joined", {
                    name
                })
            }
        })

        socket.on('send-offer', ({ roomId, partnersName }) => {
            setPartnersName(partnersName);
            setLobby(false);

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:global.stun.twilio.com:3478" },
                    {
                        urls: "turn:global.turn.twilio.com:3478?transport=udp",
                        username: "56b38e26bd05e143c752bfd344f9562e9fd80d4d4da91f04ee10249da5413835",
                        credential: "xlNfdeWPg4S54dA1NFj/OcFf6DjSHSxKgoBP2fINeiY="
                    },
                    {
                        urls: "turn:global.turn.twilio.com:3478?transport=tcp",
                        username: "56b38e26bd05e143c752bfd344f9562e9fd80d4d4da91f04ee10249da5413835",
                        credential: "xlNfdeWPg4S54dA1NFj/OcFf6DjSHSxKgoBP2fINeiY="
                    }
                ]
            });
            setSendingPc(pc);

            if (localVideoTrack) {
                pc.addTrack(localVideoTrack)
            }

            if (localAudioTrack) {
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
                const sdp = await pc.createOffer();
                pc.setLocalDescription(sdp);
                socket.emit('offer', {
                    roomId,
                    sdp
                })
            }
        })

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {

            setLobby(false);

            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp);

            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp);
            setReceivingPc(pc);

            const stream = new MediaStream()
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            window.pcr = pc;
            pc.ontrack = () => {
                alert('incoming video on track')
            }

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

                // if (track1.kind === 'audio') {
                //     setRemoteAudioTrack(track1);
                //     setRemoteVideoTrack(track2);
                // } else {
                //     setRemoteAudioTrack(track2);
                //     setRemoteVideoTrack(track1);
                // }


                const mediaStream = remoteVideoRef.current?.srcObject as MediaStream | null;
                if (mediaStream) {
                    mediaStream.addTrack(track1);
                    mediaStream.addTrack(track2);
                }


                remoteVideoRef.current?.play();
            }, 5000)
        })


        socket.on('answer', ({ sdp: remoteSdp }) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            })
        })

        socket.on('lobby', () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {

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

        return () => {
            setLobby(true);
            socket.disconnect();
        }

    }, [localAudioTrack, localVideoTrack, name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoTrack])

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-black relative">

            {/* Receiver's video */}
            <div className="w-3/4 max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg relative">
                {
                    lobby ? (<Loading />) : (
                        <video
                            autoPlay
                            ref={remoteVideoRef}
                            className="w-full h-full object-cover"
                        ></video>
                    )
                }
                <span className="absolute bottom-4 right-4 bg-blue-500 text-white text-sm px-3 py-1 rounded-md shadow-md">
                    {partnersName}
                </span>
            </div>

            {/* Sender's Video */}
            <div className="absolute bottom-50 left-12 w-40 h-40 border-2 border-white rounded-md overflow-hidden shadow-md bg-gray-800">
                <video
                    autoPlay
                    ref={localVideoRef}
                    className="h-full w-full object-cover"
                ></video>
                <span className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md">
                    You
                </span>
            </div>

            {lobby && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-70 text-white text-sm px-4 py-2 rounded-md shadow-md">
                    Waiting to connect you to someone...
                </div>
            )}
        </div>
    );

}