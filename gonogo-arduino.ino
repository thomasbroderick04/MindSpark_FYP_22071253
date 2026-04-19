// This code uses a microphone that is connected to an Arduino UNO Mini to detect when a sound from that microphone occurs (e.g., someone speaking "Go").
// It does this by quickly reading the microphone signal over a short period of time and finding the difference between the highest, and the lowest readings
// in order to estimate how strong the sound is. If this measured sound level goes above a certain threshold, it is treated as the start of a sound.
// This code then counts it and sends the current count to the serial monitor. It keeps track of whether it is currently INSIDE of a sound, and waits until the signal drops
// below a lower threshold before allowing another sound to be detected. Finally, a short wait time is also used to prevent the same sound from being counted multiple times.

// This is the analog pin on the Arduino UNO Mini that the microphone is connected to.
const int soundPin = A0;

// This determines how long the system listens each time to measure a microphone signal for each reading (in milliseconds).
const unsigned long checkWindow = 25;

// These values will likely need adjusting depending on background noise during FYP Demo Day, for example
const float soundStartPoint = 0.008;   // A sound is treated as starting when the measured amplitude rises above this value. Can be increased if environment is noisy.
const float soundEndPoint = 0.002;    // A sound is treated at finished when the measured amplitude falls below this value.

// This is the minimum wait time that must pass before a sound can be counted. So, this avoids sound from accidentally being counted twice.
const unsigned long waitTime = 600;

unsigned long lastTimeCounted = 0;  // This stores the last time a sound was counted.
bool hearingSound = false;          // This tracks whether the code currently considers itself to be inside an active sound. It is true when a sound is active.
int soundCount = 0;                 // This counts the total number of sounds that have been detected so far.

// This function measures the microphone signal over a short time and calculates how loud or strong the sound is.
float readAmplitude(unsigned long windowMs) {

  // This records the start time of the reading.
  unsigned long startTime = millis();

  int highestReading = 0;
  int lowestReading = 1023;

  // This keeps taking readings until the time period is up.
  while (millis() - startTime < windowMs) {

    int currentReading = analogRead(soundPin);

    // This updates the maximum value if this reading is higher.
    if (currentReading > highestReading) highestReading = currentReading;

    // This updates the minimum value if this reading is lower.
    if (currentReading < lowestReading) lowestReading = currentReading;
  }

  // This is the difference between max and min gives the signal range.
  int range = highestReading - lowestReading;

  // This converts the raw values into a voltage value.
  return range * (5.0 / 1023.0);
}

void setup() {
  // This starts serial communication so the system can see the output.
  Serial.begin(115200);

  // This adds a small delay to simply allow the system to stabilise.
  delay(300);
}

void loop() {

  // Get the current sound level.
  float currentAmplitude = readAmplitude(checkWindow);

  // This detects the start of a sound.
  // This only happens if the system is not already inside an active sound,
  // the amplitude is above the threshold,
  // and enough time has passed since the last trigger.
  if (!hearingSound &&
      currentAmplitude > soundStartPoint &&
      millis() - lastTimeCounted > waitTime) {

    // Print the current count.
    Serial.println(soundCount);
    soundCount++;

    // A sound has just been detected, so mark that the system is now inside an active sound.
    hearingSound = true;

    // This stores the time to enforce the cooldown.
    lastTimeCounted = millis();
  }

  // This detects the end of a sound.
  // Once it becomes quiet enough again,
  // the system allows the next sound to be detected.
  if (hearingSound && currentAmplitude < soundEndPoint) {
    hearingSound = false;
  }
}
