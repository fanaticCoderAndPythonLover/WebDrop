#!/bin/bash

/home/ubuntu/WebDrop/venv/bin/python3 /home/ubuntu/WebDrop/app.py & 

/usr/local/bin/peerjs --port 9000 --path /myapp & 
