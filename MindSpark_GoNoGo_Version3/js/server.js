// The server.js file connects the Arduino Uno Mini to the browser
// for the Go/No-Go test for vocal input.
// It listens for new serial input, only reacts on the correct stimulus pages,
// and sends trigger or timeout events to the browser.

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");

const serialPath = "/dev/cu.usbmodem2101"; // May be adjusted if required.

const baudRate = 115200;

// Only these stimulus pages should respond to verbal input.
const pagesListening = new Set(["Page2", "Page4"]);

// How long the system waits before treating no new input as a timeout.
const missedResponseDelayMs = 1000;

// This defines how often the system checks for timeouts.
const timerCheckIntervalMs = 100;

let activePage = null;

let isListening = false;

// This checks the last raw line received from the serial (ths is used to avoid any duplicates).
let lastRawLine = null;

// This stores the most recent 'Go' number received from the serial input.
let lastGoNumber = null;

// This stores the 'Go' number present when the current page was entered.
let pageBaselineGoNumber = null;

// This stores the time of the last response input.
let lastResponseTime = Date.now();

// This stores the last response serial text that was accepted.
let lastResponseText = "";

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
      isListening = pagesListening.has(activePage);

      // Reset baseline so old serial data doesn't retrigger
      pageBaselineGoNumber = lastGoNumber;
      lastResponseTime = Date.now();

      console.log(
        `[WS] Active page: ${activePage}, listening=${isListening}, baselineGo=${pageBaselineGoNumber}`
      );
    }
  });

  // This simply logs when the browser disconnects.
  ws.on("close", () => {
    console.log("[WS] Browser disconnected");
  });
});

// This opens the serial connection to the Arduino.
const port = new SerialPort({
  path: serialPath,
  baudRate: baudRate
});

// This breaks incoming serial data into lines.
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// This confirms that the serial port has successfully opened.
port.on("open", () => {
  console.log(`[SERIAL] Opened ${serialPath} @ ${baudRate}`);
});

// This documents any serial connection errors.
port.on("error", (err) => {
  console.error("[SERIAL] Error:", err.message);
});

// Extract the number from serial input in the format of "Go <number>".
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

  // Ignore serial input unless the current page is meant to listen for it.
  if (!isListening) return;

  // Ignore older Go values so input from a previous page does not retrigger here.
  if (
    goNum !== null &&
    pageBaselineGoNumber !== null &&
    goNum <= pageBaselineGoNumber
  ) {
    return;
  }

  // Only accept the line if it is different from the last accepted input.
  if (line !== lastResponseText) {
    lastResponseText = line;
    lastResponseTime = Date.now();

    console.log("[VOICE TRIGGER]", line);

    // Send a trigger event to the browser to show that new vocal input was detected.
    broadcast({
      type: "event",
      reason: "serial_changed",
      lastSerial: lastResponseText
    });
  }
});

// Regularly check whether listening is active but no new input has arrived in time.
setInterval(() => {
  if (!isListening) return;

  const now = Date.now();

  // If too much time has passed since the last accepted input, send a timeout event.
  if (now - lastResponseTime >= missedResponseDelayMs) {
    lastResponseTime = now;

    console.log("[TIMEOUT] No new serial input");

    broadcast({
      type: "event",
      reason: "timeout",
      lastSerial: lastResponseText || "—"
    });
  }
}, timerCheckIntervalMs);
