import http from "http";
import express from "express";
import WebSocket, { WebSocketEventMap, WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log("a user connected");
})