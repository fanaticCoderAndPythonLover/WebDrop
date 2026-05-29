const peer = new Peer({
  host: "129.159.15.157",
  port: 9000,
  path: "/myapp",
  secure: false, // Use true with HTTPS
});

const socket = io();
const connections = {};
let fileBuffer = [];
const messages = document.getElementById("messages");
const text = document.getElementById('messageInput');
const fileField = document.getElementById('fileInput');


peer.on("open", (id) => {
  socket.emit("register-peer", {
    room: ROOM_ID,
    peerId: id
  });
})

peer.on("connection", (c) => {

    connections[c.peer] = c;
    window.conn = c;
    c.on("open", () => {
        console.log("INCOMING READY:", c.peer);
        const h3 = document.createElement("h3");
        h3.id = conn.peerId;
        h3.innerText = "Connected to: " + conn.peer;
        document.getElementById('peerList').appendChild(h3);
    });

    c.on("data", handleData);
    c.on("close", () => {
        
        document.getElementById('peerList').removeChild(document.getElementById(conn.peerId));
    });
});

socket.on("peer-joined", (data) => {

    const peerId = data.peerId;

    if (peerId === peer.id) return;

    window.conn = peer.connect(peerId);

    setupConnection(window.conn);
});

function setupConnection(conn) {

    conn.on("open", () => {
        console.log("CONNECTED");
        const h3 = document.createElement("h3");
        h3.id = conn.peerId;
        h3.innerText = "Connected to: " + conn.peer;
        document.getElementById('peerList').appendChild(h3);

    });

    conn.on("data", handleData);

    conn.on("close", () => {
        console.log("DISCONNECTED");
        document.getElementById('peerList').removeChild(document.getElementById(conn.peerId));
    });
}

function sendText(msg) {

    if (!window.conn?.open) {
        console.log("NO CONNECTION");
        return;
    }

    window.conn.send({
        type: "text",
        data: msg.value
    });

    // lokalny echo
    addMessage("ME: " + msg.value);
}


function sendFile(file) {
    
    const reader = new FileReader();

    reader.onload = () => {
        window.conn.send({
            type: "file",
            name: file.name,
            data: reader.result
        });
        addFile(file.name, URL.createObjectURL(new Blob([reader.result])));
    };

    reader.readAsArrayBuffer(file);
}

function addFile(name, url) {
  document.getElementById("fileList").innerHTML +=
    `<a href="${url}">${name}</a><br>`;
}

function handleData(data) {

    if (data.type === "file") {

        const blob = new Blob([data.data]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = data.name;
        a.innerText = "download " + data.name;

        messages.appendChild(a);
    }
    if (data.type === "text") {
        addMessage("THEM: " + data.data);
    }
  

} 

function addMessage(msg) {

    const div = document.createElement("div");
    div.innerText = msg;

    messages.appendChild(div);
}


function ConnFromInput() {
    connectToPeer(idField);
}

function SendFromInput() {
   sendText(text); 
}
function FileFromInput() {
  sendFile(fileField.files[0]);
  
}
document.getElementById("topbar").innerText = "WebDrop || Room: " + ROOM_ID + " || 🟢 Connected";
document.getElementById('sendBtn').addEventListener("click", SendFromInput);
document.getElementById('fileBtn').addEventListener("click", FileFromInput);
