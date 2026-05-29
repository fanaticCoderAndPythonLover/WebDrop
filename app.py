from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, join_room, emit
import time
import os
from werkzeug.utils import secure_filename


app = Flask(__name__)
app.config['SECRET_KEY'] = "secret"
socketio = SocketIO(app, cors_allowed_origins="*")
app.config["UPLOAD_FOLDER"] = "uploads"
rooms = {}

@app.route("/room/<room_id>")
def room(room_id):
    if room_id not in rooms:
        rooms[room_id] = {
            "created": time.time(),
            "users": []
        }

        
    return render_template("room.html", room_id=room_id)

@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)


@socketio.on("message")
def handle_message(data):

    emit(
        "message",
        {
            "msg":data["msg"]
        },
        to=data["room"]
    )
@socketio.on("file")
def handle_file(data):
    filename = secure_filename(data["name"])
    content = data["content"]
    room = data["room"]

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    with open(filepath, "wb") as f:
        f.write(bytes(content))

    emit("file", {
        "name": filename,
        "url": f"/download/{filename}"
    }, to=room)

#WebRTC

@socketio.on("offer")
def offer(data):
    emit("offer", data, to=data["room"])

@socketio.on("answer")
def answer(data):
    emit("answer", data, to=data["room"])

@socketio.on("ice")
def ice(data):
    emit("ice", data, to=data["room"])


@socketio.on("register-peer")
def register_peer(data):
    room = data["room"]
    peer_id = data["peerId"]

    rooms[room]["users"].append(peer_id)
    join_room(room)
    emit(
        "peer-joined",
        {"room": room, "peerId": peer_id},
        to=room
    )
    print('emit successful')

socketio.run(app, host="0.0.0.0", port=5005)
    
