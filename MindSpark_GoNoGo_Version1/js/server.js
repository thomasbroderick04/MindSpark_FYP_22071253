// The server.js file connects the Arduino Uno Mini to the browser
// for the Go/No-Go test for vocal input.
// It listens for new serial input, only reacts on the correct stimulus pages,
// and sends trigger or timeout events to the browser.

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");

// Defines the serial port path used to connect to the Arduino.
const SERIAL_PATH = "/dev/cu.usbmodem2101"; // May be adjusted if required.

// Defines the communication speed used for the serial connection.
const BAUD_RATE = 9600;

// Only the stimulus pages should respond to vocal input.
const LISTENING_PAGES = new Set(["Page2", "Page4"]);

// Defines how long the system waits before treating the no new input as a timeout.
const NO_INPUT_TIMEOUT_MS = 1000;

// Defines how often the timeout check runs.
const TIMER_TICK_MS = 100;

// Stores the page currently active in the browser.
let activePage = null;

// Tracks whether the current page should listen for vocal input.
let isListening = false;

// Stores the most recent raw serial line received.
let lastRawLine = null;

// Stores the most recent valid 'Go' number received from the serial input.
let lastGoNumber = null;

// Stores the 'Go' number present when the current page was entered.
let pageBaselineGoNumber = null;

// Stores the time of the last accepted input.
let lastAcceptedTime = Date.now();

// Stores the last accepted serial text.
let lastAcceptedText = "";

// Creates the WebSocket server used to communicate with the browser pages.
const wss = new WebSocket.Server({ port: 8080 });

// Sends a message to all connected browser clients.
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

console.log("WebSocket server running at ws://localhost:8080");

// When the browser connects, listen for page updates from the front end.
wss.on("connection", (ws) => {
  console.log("[WS] Browser connected");

  // Read incoming messages from the browser and parse them as JSON.
  ws.on("message", (buf) => {
    let data;
    try {
      data = JSON.parse(buf.toString());
    } catch {
      return;
    }

    // When the browser reports a new page, update the active page and
    // decide whether this page should currently listen for vocal input.
    if (data.type === "page_enter" && typeof data.page === "string") {
      activePage = data.page;
      isListening = LISTENING_PAGES.has(activePage);

      // Reset baseline so old serial data doesn't retrigger
      pageBaselineGoNumber = lastGoNumber;
      lastAcceptedTime = Date.now();

      console.log(
        `[WS] Active page: ${activePage}, listening=${isListening}, baselineGo=${pageBaselineGoNumber}`
      );
    }
  });

  // Log when the browser disconnects.
  ws.on("close", () => {
    console.log("[WS] Browser disconnected");
  });
});

// Opens the serial connection to the Arduino.
const port = new SerialPort({
  path: SERIAL_PATH,
  baudRate: BAUD_RATE
});

// Splits incoming serial data into lines.
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// Confirm that the serial port opened successfully.
port.on("open", () => {
  console.log(`[SERIAL] Opened ${SERIAL_PATH} @ ${BAUD_RATE}`);
});

// Document any serial connection errors.
port.on("error", (err) => {
  console.error("[SERIAL] Error:", err.message);
});

// Extract the number from serial input in the format "Go <number>".
function parseGoNumber(line) {
  const match = line.match(/^Go\s*(\d+)$/i);
  if (!match) return null;
  return Number(match[1]);
}

// Handle each new line of serial input from the Arduino.
parser.on("data", (data) => {
  const line = data.trim(); 
  if (!line) return;

  // Deduplicate identical consecutive lines
  // Ignore repeated identical lines so the same input is not processed twice in a row.
  if (line === lastRawLine) return;
  lastRawLine = line;

  console.log("[SERIAL IN]", line);

  // If the line contains a valid Go number, store it.
  const goNum = parseGoNumber(line);
  if (goNum !== null) {
    lastGoNumber = goNum;
  }

  // Only react during listening pages
  // Ignore serial input unless the current page is meant to listen for it.
  if (!isListening) return;

  // Must be newer than page baseline
  // Ignore older Go values so input from a previous page does not retrigger here.
  if (
    goNum !== null &&
    pageBaselineGoNumber !== null &&
    goNum <= pageBaselineGoNumber
  ) {
    return;
  }

  // Accept only new text
  // Only accept the line if it is different from the last accepted input.
  if (line !== lastAcceptedText) {
    lastAcceptedText = line;
    lastAcceptedTime = Date.now();

    console.log("[VOICE TRIGGER]", line);

    // Send a trigger event to the browser to show that new vocal input was detected.
    broadcast({
      type: "event",
      reason: "serial_changed",
      lastSerial: lastAcceptedText
    });
  }
});

// Regularly check whether listening is active but no new input has arrived in time.
setInterval(() => {
  if (!isListening) return;

  const now = Date.now();

  // If too much time has passed since the last accepted input, send a timeout event.
  if (now - lastAcceptedTime >= NO_INPUT_TIMEOUT_MS) {
    lastAcceptedTime = now;

    console.log("[TIMEOUT] No new serial input");

    broadcast({
      type: "event",
      reason: "timeout",
      lastSerial: lastAcceptedText || "—"
    });
  }
}, TIMER_TICK_MS);