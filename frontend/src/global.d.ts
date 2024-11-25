export {};

declare global {
    interface Window {
        pcr: RTCPeerConnection;
    }
}
