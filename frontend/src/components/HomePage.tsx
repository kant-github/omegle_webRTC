import { useEffect, useRef, useState } from "react";
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
      getCam();
    }
  }, [videoRef]);

  if (!joined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md flex flex-col items-center">
          <h1 className="text-xl font-bold text-gray-800">Check Your Camera</h1>
          <video
            className="mt-6 border rounded-md shadow-sm"
            width="400px"
            autoPlay
            ref={videoRef}
          ></video>
          <div className="mt-6 w-full">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
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
            className="mt-6 px-6 py-2 bg-zinc-600 text-white font-semibold rounded-md shadow-md hover:bg-zinc-700 focus:outline-none"
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
