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
const idField = document.getElementById('idInput');
const text = document.getElementById('messageInput');
const fileField = document.getElementById('fileInput');
console.log(ROOM_ID);
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
    });

    c.on("data", handleData);
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
    });

    conn.on("data", handleData);

    conn.on("close", () => {
        console.log("DISCONNECTED");
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
    };

    reader.readAsArrayBuffer(file);
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
  addMessage("Sent "+ fileField.files[0]["name"]);
}
document.getElementById('sendBtn').addEventListener("click", SendFromInput);
document.getElementById('fileBtn').addEventListener("click", FileFromInput);
