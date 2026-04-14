// The app.js file controls the overall flow of the Go/No-Go test, including countdown,
// stimulus presentation, user response handling, score tracking, progress updates,
// audio playback, and movement between the different test pages.

(() => {
  const TOTAL_TRIALS = 50;
  let Audio_Option = localStorage.getItem("audio_option") || 'Y'; // Retrieves the user's selected audio setting from local storage. It defaults to 'Y' if no value has been stored.
  const STIMULUS_MS = 800; // Defines how long the stimulus page stays visible before automatically moving on (if the user does nothing).
  const STIMULUS_HALF_MS = 600; // Defines when the stimulus visually changes (fades to the background color). Helps with the transition when the same shape is displayed in succession.
  const FEEDBACK_MS = 100; // Defines how long a feedback page stays visible before the buffer period begins.
  const TRIAL_WAIT_TIME_MS = 650; // Defines The extra waiting time between trials after feedback.
  const PROGRESS_PX = 295;
  const COUNTDOWN_SECONDS = 10;
  const GO_NOGO_RATIO = .5; // Defines the ratio used to randomly determine whether a 'Go' or a 'No-Go' stimulus page is displayed.

  // We use two different audio tones: a high beep and a low beep. A specific tone is
  // used for a 'Go' and a 'No-Go' symbol when the respective stimulus page is displayed.
  const highBeep = new Audio('audio/GoNoGoCircleAudio.mp3');
  const lowBeep  = new Audio('audio/GoNoGoSquareAudio.mp3');

  // Using the 'S' structure to be able to store and retrieve numeric values from local storage.
  // Using this structure allows us to avoid having to do conversions from numeric to string and vice versa
  // each time we want to store a numeric value in local storage.
  const S = {
    getInt(key, defaultValue) {
      const v = parseInt(localStorage.getItem(key), 10); // Read local storage item and convert to a number.
      return Number.isFinite(v) ? v : defaultValue; // Check if 'v' is a number. If not, return the default value.
    },
    setInt(key, val) {
      localStorage.setItem(key, String(val));
    }
  };

  // This function resets trial counters.
  function resetTestState() {
    S.setInt("gng_trial", 1);
    S.setInt("gng_correct", 0);
    S.setInt("gng_incorrect", 0);
    S.setInt("gng_misses", 0);
    S.setInt("gng_current_sequence", 0);
    S.setInt("Correct_Sequence_Count", 0);
  }

  function endTestAndReset() {
    window.location.href = "GoNoGoResultsPage6.html";
  }

  // This function is used to generate a random value based on a predefined ratio that
  // determines whether a 'Go' or a 'No-Go' test page will be displayed.
  // Furthermore, a check is performed that calls the appropriate page depending
  // on the response method that the user had previously selected (e.g., voice or screen).
  function pickStimulusPage50_50() {
    const method = localStorage.getItem("Response_Method") || "S";

    // 'isGo' is assigned a value of 'true' or 'false' based on whether the random value
    // being generated is less than the defined 'Go' to 'No-Go' ratio.
    const isGo = Math.random() < GO_NOGO_RATIO;

    if (method === "V") {
      return isGo ? "GoNoGoVocalOfficial2Page.html" : "GoNoGoVocalOfficial4Page.html";
    } else { // Else, the response method is the screen output.
      return isGo ? "GoNoGoOfficialPage2.html" : "GoNoGoOfficialPage4.html";
    }
  }

  // Function that reads local storage to determine the current trial number and then
  // performs a check to determine if the total number of trials has been reached, and
  // if so, it calls the function 'endTestAndReset'; otherwise, it returns no value and the
  // next trial of the test continues.
  function advanceToNextTrialOrEnd() {
    const current = S.getInt("gng_trial", 1);

    if (current >= TOTAL_TRIALS) {
      endTestAndReset();
      return;
    }

    S.setInt("gng_trial", current + 1);
    window.location.href = pickStimulusPage50_50();
  }

  // Function that is used to update the width of the progress bar based on the trial number.
  // Function reads local storage to determine the current trial based on the 'gng_trial' local storage value.
  function setTrialAndProgress() {
    const trial = S.getInt("gng_trial", 1);

    // Now update the trial counter next to the progress bar.
    const trialEl = document.getElementById("trialNumber");
    if (trialEl) trialEl.textContent = String(trial);

    // Now update the width of the progress bar to reflect the percentage of trials completed.
    const bar = document.getElementById("progress-bar");
    if (bar) {
      const completed = trial - 1;
      const pct = completed / TOTAL_TRIALS;
      bar.style.width = `${Math.round(PROGRESS_PX * pct)}px`;
    }
  }

  // Function to fade the 'Go' or 'No-Go' stimulus object to the colour of the background.
  // This helps more clearly define the transition between consecutive tests
  // where the image displayed is the same.
  function fadeStimulusToBackground() {
    const stimulus = document.getElementById("stimulus");
    if (!stimulus) return;
    stimulus.style.background = "#EFEFEF";
  }

  // Function that keeps track of, and updates localStorage, to maintain
  // the count of consecutive correct user responses.
  function updateSequence(isSuccessful) {
    if (isSuccessful) {
      const currentSeq = S.getInt("gng_current_sequence", 0) + 1;
      S.setInt("gng_current_sequence", currentSeq);

      const maxSeq = S.getInt("Correct_Sequence_Count", 0);
      if (currentSeq > maxSeq) {
        S.setInt("Correct_Sequence_Count", currentSeq);
      }
    } else { // If the user made an incorrect response (missed or hit 'Go' on a No-Go item), set the current sequence back to zero.
      S.setInt("gng_current_sequence", 0);
    }
  }

  // Function to update the countdown counter and then initiate a call to
  // begin the test when the counter gets to zero.
  function onCountdownPage() {
    resetTestState();

    const el = document.getElementById("countdownSeconds");
    let remaining = COUNTDOWN_SECONDS;

    if (el) el.textContent = remaining;

    // Setting the countdown interval to be in 1-second increments, reducing
    // time remaining by 1 each time.
    const t = setInterval(() => {
      remaining -= 1;
      if (el) el.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(t);
        window.location.href = pickStimulusPage50_50();
      }
    }, 1000);
  }

  // This function manages which stimulus page is to be displayed based on a parameter
  // that determines whether one of the 'Go' pages is to be displayed (when the parameter value is "true").
  // A further check is required to determine which of the 'Go' pages is to be displayed based on whether
  // or not the response method is either voice- or screen-based. The function also handles the playing
  // of an appropriate sound corresponding with the stimulus page. Furthermore, this function handles
  // the timing and the status updates of trial counters, etc.
  function onStimulusPage(noGoPage) {
    setTrialAndProgress();
    const goBtn = document.getElementById("goBtn");
    const method = localStorage.getItem("Response_Method") || "S";

    let responded = false;

    // Play appropriate sound depending on whether the page presents a 'Go' or a 'No-Go' stimulus.
    if (Audio_Option === "Y") {
      const sound = noGoPage ? highBeep : lowBeep; // Sound is assigned to a specific .mp3 based on whether the page is a 'Go' or a 'No-Go' page.
      sound.play().catch(() => {}); // Catch is for error handling in case the browser cannot play sound.
    }

    const halfTimer = setTimeout(fadeStimulusToBackground, STIMULUS_HALF_MS);

    //
    const stimulusTimer = setTimeout(() => {
      if (responded) return;

      // Below code is executed when a user response was not detected within the time allocated
      // for the user to respond. The time allowed for a user response is captured in 'STIMULUS_MS'.
      // The setTimeout function is used to update the appropriate counters in the event that
      // a user response was not detected in the time allocated.
      clearTimeout(halfTimer);

      if (noGoPage) { // If the user did not respond on a 'No-Go' stimulus page, then update the correct answer counter and sequence.
        S.setInt("gng_correct", S.getInt("gng_correct", 0) + 1);
        updateSequence(true);
      } else { // Else, the page was a 'Go' stimulus page and the user did not respond.
        S.setInt("gng_incorrect", S.getInt("gng_incorrect", 0) + 1);
        S.setInt("gng_misses", S.getInt("gng_misses", 0) + 1);
        updateSequence(false);
      }

      advanceToNextTrialOrEnd();
    }, STIMULUS_MS);

    // This function is called in response to the user clicking on the 'Go' button or when
    // a sound input is detected on the microphone.
    function handleGoResponse() {
      if (responded) return;
      responded = true;

      clearTimeout(stimulusTimer);
      clearTimeout(halfTimer);

      if (noGoPage) { // User clicked or provided sound input on a 'No-Go' stimulus page.
        S.setInt("gng_incorrect", S.getInt("gng_incorrect", 0) + 1);
        updateSequence(false);
        window.location.href = "GoNoGoOfficialPage3.html"; // Display feedback page stating user is incorrect.
      } else { // User clicked or provided sound input on a 'Go' stimulus page.
        S.setInt("gng_correct", S.getInt("gng_correct", 0) + 1);
        updateSequence(true);
        window.location.href = "GoNoGoOfficialPage5.html"; // Display feedback page stating user is correct.
      }
    }

    // If the response method selected by the user is the standard screen-based mode,
    // then an event listener is added to the 'Go' button so that the function
    // 'handleGoResponse' is called when the button is clicked.
    if (method === "S") {
      if (goBtn) {
        goBtn.addEventListener("click", handleGoResponse);
      }
    }

    // If the response method selected by the user is a verbal response, then a WebSocket
    // connection is created in order to listen for an incoming signal from the
    // microphone input system running locally.
    if (method === "V") {
      const ws = new WebSocket("ws://localhost:8080");

      // 'currentPageName' is assigned based on whether the current stimulus page
      // is a 'No-Go' page or a 'Go' page. This allows the local microphone input
      // system to know which page the user is currently viewing.
      const currentPageName = noGoPage ? "Page2" : "Page4";

      // When the WebSocket connection is opened, a message is sent to indicate
      // which page has just been entered.
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({
          type: "page_enter",
          page: currentPageName
        }));
      });

      // This event listener waits for a message to be received through the WebSocket.
      // If the message indicates that the serial input has changed, this is treated
      // as a vocal response being detected from the user.
      ws.addEventListener("message", (evt) => {
        const msg = JSON.parse(evt.data);

        if (msg.type === "event" && msg.reason === "serial_changed") {
          // This provides brief visual feedback to show that a vocal input
          // has been detected by the system by flashing the microphone button a light green.
          if (goBtn) {
            goBtn.style.background = "#00C853";
            setTimeout(() => {
              goBtn.style.background = "#5E5E5E";
            }, 200);
          }

          handleGoResponse();
        }
      });
    }
  }

  // This function controls the amount of time the feedback page is displayed before
  // then moving on to the next trial after a specified wait time.
  // The wait time is added to create a small delay before the next trial page is displayed.
  function onFeedbackPage() {
    setTimeout(() => {
      setTimeout(() => {
        advanceToNextTrialOrEnd();
      }, TRIAL_WAIT_TIME_MS);
    }, FEEDBACK_MS);
  }

  // On page load, determine the appropriate function to call.
  document.addEventListener("DOMContentLoaded", () => {
    const file = window.location.pathname.split("/").pop();

    switch (file) {
      case "GoNoGoCountdownPage1.html":
        onCountdownPage();
        break;

      case "GoNoGoOfficialPage2.html":
      case "GoNoGoVocalOfficial2Page.html":
        onStimulusPage(true);
        break;

      case "GoNoGoOfficialPage4.html":
      case "GoNoGoVocalOfficial4Page.html":
        onStimulusPage(false);
        break;

      case "GoNoGoOfficialPage3.html": // Correct Response
      case "GoNoGoOfficialPage5.html": // Incorrect Response
        onFeedbackPage();
        break;

      default:
        break;
    }
  });
})();