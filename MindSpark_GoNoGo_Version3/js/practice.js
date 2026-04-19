// The practice.js file controls the flow for the practice section of the Go/No-Go test.
// It manages the setup, state tracking, user selections, audio cues,
// progress updates, and page-to-page navigation for the practice session which consists of 10 trials.

let Response_Method = 'S'; // 'S' = Screen select (default), 'V' = Verbal.
let Audio_Option = localStorage.getItem("audio_option") || 'Y'; // Retrieves the user's selected audio setting from local storage. It defaults to 'Y' if no value has been stored.
let Alertness_Level = 1; // Default alertness level.
let currentTrial = 1; // Stores the current practice trial number being displayed.
let ratio = .5; // Defines the ratio used to randomly determine whether a 'Go' or a 'No-Go' practice page is displayed.
let feedbackDelay = 1500; // Defines how long a feedback page remains visible before automatically moving to the next practice trial.
const totalTrials = 10; // Defines the total number of practice trials.
let trialCounterEl; // Stores a reference to the HTML element used to display the current practice trial number.

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname;

  // If the user has entered the introduction page, then reset the
  // their alertness selection in local storage so that each new practice session
  // begins from the same default starting state.
  if (page.includes("index.html")) {
    // Setting default alertness level to Level 1: "I am struggling to stay awake"
    localStorage.setItem("alertness_level", "1");
    // Reset the practice counter.
    localStorage.setItem("count", "1");
  }

  // On the two stimulus practice pages, read the current practice trial number
  // from local storage, display it on the screen, and then update the stored value
  // so that the next trial number is ready for the following page.
  if (
    page.includes("gonogo-practice-touch-1.html") ||
    page.includes("gonogo-practice-touch-3.html"))
  {
    trialCounterEl = document.getElementById("counter");
    trialCounterEl.textContent = localStorage.getItem("count") || 1;

    let count = Number(localStorage.getItem("count") || 1);
    currentTrial = count;
    count++;

    if (count > totalTrials) {
      count = 1;
    }

    localStorage.setItem("count", count);
  }
  if (page.includes("gonogo-setup-options.html")) {
    proceedBtn.onclick = () => {
      const verbalChoice = localStorage.getItem("Response_Method");
  
      if (verbalChoice === "V") {
        window.location.href = "gonogo-setup-verbal-1.html";
      } else {
        window.location.href = "gonogo-setup-alertness.html";
      }
    };
  }

  if (page.includes("gonogo-setup-alertness.html")) {
    proceedTestOptBtn.onclick = () => {
      const verbalChoice = localStorage.getItem("Response_Method");
  
      if (verbalChoice === "V") {
        window.location.href = "gonogo-practice-verbal-static.html";
      } else {
        window.location.href = "gonogo-practice-touch-1.html";
      }
    };
  
    const alertnessBackBtn = document.getElementById("alertnessBackBtn");
  
    if (alertnessBackBtn) {
      alertnessBackBtn.onclick = () => {
        const verbalChoice = localStorage.getItem("Response_Method");
  
        if (verbalChoice === "V") {
          window.location.href = "gonogo-setup-verbal-1.html";
        } else {
          window.location.href = "gonogo-setup-options.html";
        }
      };
    }
  }
});



// Two different audio sounds are used during the practice trials.
// One sound is associated with the circle stimulus type, and the other sound
// is associated with the square stimulus type.
const highBeep = new Audio('../audio/gonogo-circle-audio.mp3');
const lowBeep  = new Audio('../audio/gonogo-square-audio.mp3');

// This function updates the progress bar based on the current practice trial number.
// The width is calculated as a proportion of the total number of practice trials.
function updateProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  const progressWidth = ((currentTrial - 1) / totalTrials) * 295;
  bar.style.width = `${progressWidth}px`;
}

// This function determines what should happen after a feedback page is displayed.
// It checks whether the practice session has ended and, if not, it randomly chooses
// the next 'Go' or 'No-Go' practice stimulus page.
function nextTrial() {
  // IMPORTANT: nextTrial() is called from the FEEDBACK pages.
  // On those pages, currentTrial resets to 1, so we must use localStorage state.
  const nextCount = Number(localStorage.getItem("count") || 1);

  // If the next count goes back to 1, the practice trial has just completed.
  if (nextCount === 1) {
    window.location.href = "gonogo-practice-complete.html";
    return;
  }

// Randomly determine whether the next practice trial should be a 'Go' or a 'No-Go' trial,
// and then direct the user to the corresponding practice stimulus page.
  const isGoTrial = Math.random() < ratio;
  window.location.href = isGoTrial
    ? 'gonogo-practice-touch-1.html'
    : 'gonogo-practice-touch-3.html';
}


// When the page finishes loading, determine which page the user is currently on
// and then run the relevant logic for that specific page.
document.addEventListener('DOMContentLoaded', () => {

  const path = window.location.pathname;

  // Handles the response method selection buttons which allows the user
  // to choose between either a screen-based input and verbal input.
  const verbalBtn = document.getElementById('verbalBtn');
  const screenBtn = document.getElementById('screenBtn');

  if (verbalBtn && screenBtn) {
    // This function updates the selected response method and also updates the
    // visual styling of the buttons so the selected choice is clearly shown.
    function setResponseMethod(method) {
      Response_Method = method;
      localStorage.setItem("Response_Method", method);

      verbalBtn.classList.toggle('selected', method === 'V');
      verbalBtn.classList.toggle('unselected', method !== 'V');

      screenBtn.classList.toggle('selected', method === 'S');
      screenBtn.classList.toggle('unselected', method !== 'S');
    }

    setResponseMethod('S'); // Default toggle
    verbalBtn.onclick = () => setResponseMethod('V');
    screenBtn.onclick = () => setResponseMethod('S');
  }

  // Handles the audio selection buttons and allows the user
  // to choose whether practice audio should be enabled or disabled.
  const audioYes = document.getElementById('audioYes');
  const audioNo  = document.getElementById('audioNo');

  if (audioYes && audioNo) {
    // This function updates the selected audio option, stores it in local storage,
    // and updates the styling of the buttons to show the current selection.
    function setAudioOption(option) {
      Audio_Option = option;
      localStorage.setItem('audio_option', option);
      audioYes.classList.toggle('selected', option === 'Y');
      audioYes.classList.toggle('unselected', option !== 'Y');

      audioNo.classList.toggle('selected', option === 'N');
      audioNo.classList.toggle('unselected', option !== 'N');
    }

    // setAudioOption('Y'); // Default toggle
    audioYes.onclick = () => setAudioOption('Y');
    audioNo.onclick  = () => setAudioOption('N');
  }

  // Handles the user's alertness selection and stores the selected
  // level and descriptive text in local storage.
  const alertButtons = document.querySelectorAll('.alert-btn');

  if (alertButtons.length > 0) {
    // This function updates the current alertness level, stores it, and ensures
    // the appropriate alertness button is visually marked as selected.
    function setAlertness(level) {
      Alertness_Level = level;
      localStorage.setItem("alertness_level", String(level));

      const selectedBtn = [...alertButtons].find(
        btn => Number(btn.dataset.level) === level
      );

      if (selectedBtn) {
        localStorage.setItem(
          "alertness_text",
          selectedBtn.textContent.trim()
        );
      }

      alertButtons.forEach(btn => {
        const btnLevel = Number(btn.dataset.level);
        btn.classList.toggle('selected', btnLevel === level);
        btn.classList.toggle('unselected', btnLevel !== level);
      });
    }

    // Restore stored alertness, where it defaults back to 1.
    const storedLevel =
      Number(localStorage.getItem("alertness_level")) || 1;

    setAlertness(storedLevel);

    alertButtons.forEach(btn => {
      btn.onclick = () => setAlertness(Number(btn.dataset.level));
    });
  }

  // On the practice trial and feedback pages, update the progress bar so that
  // the user can visually see how far through the practice session they are.
  if (
    path.includes('gonogo-practice-touch-1.html') ||
    path.includes('gonogo-practice-touch-2.html') ||
    path.includes('gonogo-practice-touch-3.html') ||
    path.includes('gonogo-practice-touch-4.html')
  ) {
    updateProgressBar();
  }

  // If the user has enabled audio playing alongside the stimulus,
  // then the appropriate sound is played when
  // a stimulus practice page is displayed.
  if (Audio_Option === 'Y') {
    if (path.includes('gonogo-practice-touch-1.html')) {
      highBeep.play();
    }
    else if (path.includes('gonogo-practice-touch-3.html') || path.includes('gonogo-practice-verbal-static.html') ) {
      lowBeep.play();
    }
  }
   // If the user does not tap the 'Go' button when the 'No-Go' symbol appears, the page
   // will be displayed for 3 seconds before the appropriate feedback page is displayed.
   if (path.includes('gonogo-practice-touch-3.html')) {
    setTimeout(() => {
     window.location.href = 'gonogo-practice-touch-5.html';
    }, 3000);
  }
   else if (path.includes('gonogo-practice-touch-1.html')) {
    setTimeout(() => {
     window.location.href = 'gonogo-practice-touch-6.html';
    }, 3000);
  }

  // On the feedback pages, wait for the defined delay period and then
  // automatically move on to the next practice trial.
  if (
    path.includes('gonogo-practice-touch-2.html') ||
    path.includes('gonogo-practice-touch-4.html') ||
    path.includes('gonogo-practice-touch-5.html') ||
    path.includes('gonogo-practice-touch-6.html')
  ) {
    setTimeout(() => {
      nextTrial();
    }, feedbackDelay);
  }

});