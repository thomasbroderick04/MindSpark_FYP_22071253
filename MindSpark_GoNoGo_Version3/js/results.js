// The results.js file controls the logic of the Go/No-Go 
// test results page by retrieving stored test data, calculating
// performance values, and displaying the user's final results.

(() => {
  // This function is used to read a value from local storage using the key provided.
  // Since values in local storage are stored as strings, parseInt is used to convert
  // the stored value into a number so that it can be used in calculations later.
  // If the value retrieved is not a valid number, then the function returns 0 by default.
  function getInt(key) {
    const v = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(v) ? v : 0;
  }

  // This function is used to locate a specific HTML element on the page using its id
  // and then update that element's text content with the value provided.
  // First, a check is performed to ensure that the element exists before
  // changing any content.
  function setText(id, value) {
    const pageElement = document.getElementById(id);
    if (pageElement) pageElement.textContent = value;
  }

  // This function is used to calculate the percentage of a number.
  function percentNumber(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  // This function updates the alertness level number contained within the
  // green circle on the results page.
  function updateAlertnessScore(alertnessNumber) {
    const scoreEl = document.getElementById("alertnessScore");
    if (scoreEl) {
      scoreEl.textContent = alertnessNumber;
    }
  }

  const storedLevel =  Number(localStorage.getItem("alertness_level")) || 1;
  updateAlertnessScore(storedLevel);

  // When the DOM content has fully loaded, the script begins retrieving the relevant
  // test result values from local storage and displaying them in the correct areas
  // of the results page.
  document.addEventListener("DOMContentLoaded", () => {
    const correct = getInt("gng_correct");
    const incorrect = getInt("gng_incorrect");
    const misses = getInt("gng_misses");
    const bestStreak = getInt("Correct_Sequence_Count");

    // The total number of trials is determined by adding together the number of
    // correct responses, incorrect responses recorded during the test.
    const totalTrials = correct + incorrect; // Misses are already included in the incorrect toal.

    // The overall accuracy percentage is calculated by comparing the number of correct
    // responses to the total number of trials completed. 
    const accuracyPercent = percentNumber(correct, totalTrials);
    const degrees = accuracyPercent * 3.6;
    const ring = document.getElementById("progressRing");
    if (ring) {
        ring.style.background = `conic-gradient(from 0deg, #007e72 0deg ${degrees}deg, #badfdb ${degrees}deg 360deg)`;
    }

    // This section updates the main summary section on the results page so that it displays
    // the user's overall accuracy percentage, total number of correct responses,
    // total number of errors, and the highest sequence of correct responses.
    setText("scoreAccuracy", `${accuracyPercent}%`);
    setText("correctResponses", String(correct));
    setText("totalErrors", String(incorrect));
    setText("bestStreak", `${bestStreak} in a row`);

    // This displays the total number of trials completed in the performance breakdown section.
    setText("totalTrials", String(totalTrials));

    // These values calculate the percentage breakdown for each response type:
    // correct responses, incorrect responses, and misses. Each percentage is based
    // on the total number of trials completed. If no trials were recorded, then 
    // the percentage defaults to 0.
    const nogoError = incorrect - misses;
    const goPercent = totalTrials ? Math.round((correct / totalTrials) * 100) : 0;
    const nogoPercent = totalTrials ? Math.round((nogoError / totalTrials) * 100) : 0;
    const missPercent = totalTrials ? Math.round((misses / totalTrials) * 100) : 0;

    // Updates the page with the number and percentage of correct 'Go' responses.
    setText("breakdownGoCount", String(correct));
    setText("breakdownGoPercent", `${goPercent}%`);

    // Updates the page with the number and percentage of incorrect 'No-Go' responses.
    setText("breakdownNoGoErrorCount", String(nogoError));
    setText("breakdownNoGoErrorPercent", `${nogoPercent}%`);

    // Updates the page with the number and percentage of missed responses.
    setText("breakdownMissCount", String(misses));
    setText("breakdownMissPercent", `${missPercent}%`);

    // Updates the page with alertness text that the user previously selected
    // before beginning the test. If no value has been stored,
    // "--" is displayed instead.

    let attention_level_text = "";
    switch (storedLevel) {
      case 1:
        attention_level_text = "I am struggling to stay awake";
        break;
      case 2:
        attention_level_text = "I feel extremely sleepy";
        break;
      case 3:
        attention_level_text = "I feel very sleepy";
        break;
      case 4:
        attention_level_text = "I feel sleepy";
        break;
      case 5:
        attention_level_text = "I feel slightly sleepy";
        break;
      case 6:
        attention_level_text = "I feel neither alert nor sleepy";
        break;
      case 7:
        attention_level_text = "I feel mostly alert";
        break;
      case 8:
        attention_level_text = "I feel alert";
        break;
      case 9:
        attention_level_text = "I feel very alert";
        break;
    }
   // setText("alertnessLabel", localStorage.getItem("alertness_text") || "--");
    setText("alertnessLabel", attention_level_text);

    // There are three default performance category ranges. These values are then
    // updated depending on the user's final accuracy percentage. 
    let label = "Lower Consistency";
    let range = "(0–69%)";

    if (accuracyPercent >= 85) {
      label = "High Consistency";
      range = "(85-100%)";
    } else if (accuracyPercent >= 70) {
      label = "Moderate Consistency";
      range = "(70–84%)";
    }


    // This displays the final performance label and its associated percentage range
    // in the results page performance section.
    setText("perfLabel", label);
    setText("perfRange", range);

    // This updates the colour of the performance label text based on the user's
   // final accuracy percentage. The text colour is then
   // adjusted according to the performance category.
    const perfLabelColour = document.getElementById("perfLabel");

    if (perfLabelColour) {
      if (accuracyPercent >= 85) {
        perfLabelColour.style.color = "#186904"; 
      } else if (accuracyPercent >= 70) {
        perfLabelColour.style.color = "#785202"; 
      } else {
        perfLabelColour.style.color = "#A71818"; 
      }
    }
    
    // This adjusts the width of the fill bar so that it reflects
    // the user's final accuracy percentage. The percentage is converted into a pixel width
    // based on the maximum width of the grey background bar.
    const fillBar = document.getElementById("percentFill");
    if (fillBar) {
      const maxWidth = 327; // Matches the grey bar width
      const px = Math.round((accuracyPercent / 100) * maxWidth);
      fillBar.style.width = `${px}px`;
    }
  });
})();