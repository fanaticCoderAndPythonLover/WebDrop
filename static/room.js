const peer = new Peer({
  host: "129.159.15.157",
  port: 9000,
  path: "/myapp",
  secure: false, // Use true with HTTPS
});

const socket = io();
const connections = {};
let peers = {};
let selectedPeer= null;
let fileBuffer = [];
const messages = document.getElementById("messages");
const text = document.getElementById('textInput');
const fileField = document.getElementById('fileInput');


peer.on("open", (id) => {
  socket.emit("register-peer", {
    room: ROOM_ID,
    peerId: id,
    name: displayName
  });
  console.log("peer.on open socket emitted register-peer");
})

socket.on("peer-list", (data) => {
  peers = data;
  renderPeers(peers);
  console.log("socket received peer-list");
});

function renderPeers(peers) {
  const el = document.getElementById("peerList");
  console.log(typeof peers);
  el.innerHTML = "";
  try {
    Object.entries(peers).forEach(([id, p]) => {
    el.innerHTML += `
      <div class="peer">
        <div class="name">
          <span class="dot green"></span>
          ${p.name}
        </div>

        <button onclick="selectPeer('${id}')">
          Select
        </button>
      </div>
    `;
  });
  } catch {
  console.log("error");
  }
}

function selectPeer(id) {
  selectedPeer = id;

  if (window.conn) window.conn.close();

  window.conn = peer.connect(id);

  window.conn.on("open", () => {
    console.log("CONNECTED TO", id);
  });

  window.conn.on("data", handleData);
}

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

socket.on("disconnect", (data) => {
    document.getElementById('peerList').removeChild(document.getElementById(data.id));
}

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
	conn.send({
	    type: "disconnect",
	    id: conn.peerId,
            room: ROOM_ID
	});
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


function SendFromInput() {
   sendText(text); 
}
function FileFromInput() {
  sendFile(fileField.files[0]);
  
}

function showSend() {
  document.getElementById("sendPanel").style.display = "block";
  document.getElementById("receivePanel").style.display = "none";
}

function showReceive() {
  document.getElementById("sendPanel").style.display = "none";
  document.getElementById("receivePanel").style.display = "block";
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

function generateName() {
  const animals = ["fox", "wolf", "cat", "hawk", "bear"];
  const n = Math.floor(Math.random() * 9999);
  return animals[Math.floor(Math.random() * animals.length)] + n;
}

let displayName = getCookie("displayName");

if (!displayName) {
  displayName = generateName();
  setCookie("displayName", displayName);
  document.getElementById("displayname").innerText = "Your name: " + displayName;
}

function showIncomingFile(name, blob) {
  const url = URL.createObjectURL(blob);

  document.getElementById("incoming").innerHTML += `
    <div>
      📁 ${name}
      <a href="${url}" download>download</a>
    </div>
  `;
}


document.getElementById('sendBtn').addEventListener("click", SendFromInput);
document.getElementById('fileBtn').addEventListener("click", FileFromInput);
