This repository contains the fully functional Go/No-Go cognitive testing sequence for MindSpark that runs through a combination of a web application, 
a Node.js server, and an Arduino-based sound input device.

The following link will allow for complete access to three iterations of this testing sequence with full backend functionality implemented.
NOTE: This link should be opened on a Google Chrome browser:

https://thomasbroderick04.github.io/22071253_MindSpark_FYP/

ADDITIONAL CONTEXT: To run the project using verbal input with the Arduino and its microphone sensor, the user would first open the project folder and 
starts the Node.js server through the terminal using the required command. This server acts as the communication layer between the Arduino and the
browser-based interface. At the same time, the Arduino UNO Mini, which is coded with the provided .ino file and connected to a Macbook Pro via USB, 
listens for microphone input by connecting to the serial port on the server. When a sound above the defined threshold is detected, the Arduino sends a signal 
through the serial connection to the server.

Once the server is running in the terminal, the user opens the web interface in a browser by loading index.html. 
The browser displays the Go/No-Go test while the server continuously handles incoming Arduino data and passes it to the 
interface in real time using WebSockets API.

So, this project runs through three connected parts: the browser-based test interface, 
the Node.js server that is run through a terminal, and the Arduino hardware input system. 
These allow the system to present stimuli, detect user responses, and update the interface in real time.
