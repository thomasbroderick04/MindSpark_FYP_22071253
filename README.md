This repository contains the code required to fully execute a functional Go/No-Go cognitive testing system for MindSpark. File types include the necessary, HTML, CSS, JavaScript, and Arduino ".ino" file(s).

The following link will allow for complete access to three iterations of this testing sequence with full backend functionality implemented.

NOTE: This link should be opened on a Google Chrome browser:

https://thomasbroderick04.github.io/22071253_MindSpark_FYP/

ADDITIONAL CONTEXT: To run the project using verbal input with the Arduino and its microphone sensor, the user would first open the project folder and 
start the Node.js server through the terminal using the required command. This server acts as the communication layer between the Arduino and the
browser-based interface. At the same time, the Arduino UNO Mini, which is coded with the provided .ino file and connected the server via USB (in development, USB was connected
to a MacBook Pro). When a sound above the defined threshold is detected, the Arduino sends a signal through the serial connection to the server.

Once the server is running in the terminal, the user opens the web interface in a browser by loading index.html. 
The browser displays the Go/No-Go test while the server continuously handles incoming serial port data and passes it to 
the interface in real time using the WebSockets API.

The overall architecture consists of: the browser-based interface, the Node.js server, 
and the Arduino hardware input system. This combined architecture allows the system to present
stimuli, detect user responses, and update the interface in real time.

ADDITIONAL NOTES:

Although MindSpark is framed primarily as a mobile application prototype within the Figma design, the GitHub implementation was developed in a way that extends beyond the limitations of a standard mobile-only environment. This was an intentional decision within the academic process. Rather than restricting the functional prototype to smartphone-based interaction alone, I used the GitHub implementation to explore how the Go/No-Go test and other types of tests could operate within a more advanced and adaptable technical setup.
In particular, the GitHub architecture was designed to demonstrate how the application could integrate with external hardware, specifically the Arduino Uno, in order to support alternative input devices and interaction methods that may not be easily supported within a conventional mobile application. While it would have been simpler to rely solely on the built-in microphone of a mobile device, this would also have limited the project’s ability to explore more diverse and potentially more sophisticated forms of interaction. It also better reflects how cognitive testing systems might be expanded in research or professional environments where specialised hardware is appropriate. Overall, this approach therefore positioned the prototype not only as a mobile application concept, but also as a more flexible cognitive testing system capable of supporting broader multimodal interaction.
