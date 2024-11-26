import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

const URL: string = "http://localhost:3000"

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
        const socket = io(URL);

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
            // setRemoteMediaStream(stream);
            window.pcr = pc;
            pc.ontrack = () => {
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

        return () => {
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

            // Receiver's video
            <div className="w-3/4 max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg relative">
                <video
                    autoPlay
                    ref={remoteVideoRef}
                    className="w-full h-full object-cover"
                ></video>
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