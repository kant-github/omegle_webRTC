import { useEffect, useRef, useState } from "react";
import Room from "./Room";

export default function HomePage() {
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState<string | null>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);

  const getUserVideo = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60 }
      },
      audio: true,
    });

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    setLocalVideoTrack(videoTrack);
    setLocalAudioTrack(audioTrack);

    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = new MediaStream([videoTrack]);
    videoRef.current.play();
  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getUserVideo();
    }
  }, [videoRef]);

  if (!joined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-800">
        <div className="bg-zinc-900 shadow-lg rounded-lg p-6 w-full max-w-md flex flex-col items-center border-[1px] border-zinc-700">
          <h1 className="text-xl font-bold text-zinc-400">Check Your Camera</h1>
          <video
            className="mt-6 border rounded-md shadow-sm"
            width="400px"
            autoPlay
            ref={videoRef}
          ></video>
          <div className="mt-6 w-full">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-400"
            >
              Enter Your Name
            </label>
            <input
              id="name"
              type="text"
              className="mt-2 w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none"
              placeholder="Your Name"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
          <button
            onClick={() => setJoined(true)}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <Room
      localVideoTrack={localVideoTrack}
      localAudioTrack={localAudioTrack}
      name={name}
    />
  );
}
