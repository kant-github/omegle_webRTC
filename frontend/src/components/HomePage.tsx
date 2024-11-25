import { useEffect, useRef, useState } from "react"
import Room from "./Room";

export default function HomePage() {
    const [joined, setJoined] = useState(false);
    const [name, setName] = useState<string | null>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })

        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        if (!videoRef.current) {
            return;
        }

        videoRef.current.srcObject = new MediaStream([videoTrack]);
        videoRef.current.play();
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam();
        }
    }, [videoRef])

    if (!joined) {
        return (
            <div>
                <video autoPlay ref={videoRef}></video>
                <label htmlFor="name">Enter your name</label>
                <input id="name" type="text" onChange={(e) => {
                    setName(e.target.value)
                }} />
                <button onClick={() => setJoined(true)}>Join</button>
            </div>
        )
    }

    return <Room localVideoTrack={localVideoTrack} localAudioTrack={localAudioTrack} name={name} />
}