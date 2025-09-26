/**
 * @file        manual_recording.js
 * @description Handles dark mode toggle, dynamic field control, and DVR channel logic for popup UI.
 * @author      Gildas LeFur
 * @copyright   © 2025 Gildas LeFur. All rights reserved.
 * @license     MIT
 * @version     1.0.0
 * @date        2025-09-25
 * @history
 *   - 1.0.0 (2025-09-25): Initial version with popup layout and basic UI wiring.
 */

// Retrieve the URL of the DVR that was read by the extension popup
const params = new URLSearchParams(window.location.search);
const dvrUrl = params.get("ipPort");

console.log("Received DVR URL:", dvrUrl);

// Constants
const DefaultImageUrl = "https://tmsimg.fancybits.co/assets/p9467679_st_h6_aa.jpg"

// Global variables for the user inputs
let channelNumber = 0
let episodeTitle = ""
let imageUrl = DefaultImageUrl
let movie = ""
let programName = ""
let programType = ""
let startDate = ""
let startTime = ""
let stopDate = ""
let stopTime = ""
let summary = ""

// Other global variables
let duration = 0
let jsonPayload = {}
let noErrors = true
let startDateTime = 0

function calculateDuration() {
  console.log("> calculateDuration()")
  
  startDateTime = new Date(`${startDate}T${startTime}`);
  console.log("startDateTime: " + startDateTime)
  const stopDateTime = new Date(`${stopDate}T${stopTime}`);
  console.log("stopDateTime: " + stopDateTime)

  const differenceInMilliseconds = stopDateTime - startDateTime;

  duration = Math.floor(differenceInMilliseconds / 1000);

  console.log("Duration: " + duration)

  if (duration <= 0) {
    noErrors = false
  }

  console.log("proceed: " + noErrors)
  console.log("< calculateDuration()")
}

function confirmAllInputsAreFilled() {
  console.log("> confirmAllInputsAreFilled()")

  let showAlert = !startDate || !startTime || !stopDate || !stopTime || !channelNumber || !programName || !imageUrl

  if (programType === "tv") {
    showAlert = showAlert && !episodeTitle
  }
  
  if (showAlert) {
    console.log("Missing some inputs. Alerting the user.")
    alert("Make sure to fill in all the inputs!")

    noErrors = false
  } 

  console.log("proceed: " + noErrors)
  console.log("< confirmAllInputsAreFilled()")
}

function confirmStartTimeInFuture() {
  console.log("> confirmStartTimeInFuture()")

  const now = new Date()
  const startDateTime = new Date(`${startDate}T${startTime}`);

  if (startDateTime.getTime() <= now.getTime()) {
    console.log("startDateTime in the past. Alerting the user.")
    alert("Make sure to pick a start time in the future!")

    noErrors = false
  }

  console.log("proceed: " + noErrors)
  console.log("< confirmStartTimeInFuture()")
}

function confirmStopTimeAfterStartTime() {
  console.log("> confirmStopTimeAfterStartTime()")

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const stopDateTime = new Date(`${stopDate}T${stopTime}`);

  if (stopDateTime.getTime() <= startDateTime.getTime()) {
    console.log("The stop time is invalid. Alerting the user.")
    alert("Make sure to pick a stop time that is later than the start time!")

    noErrors = false
  }

  console.log("proceed: " + noErrors)
  console.log("< confirmStopTimeAfterStartTime()")
}

function createJsonPayload() {
  console.log("> createJsonPayload()")

  jsonPayload = {
    Airing: {}
  };

  jsonPayload.Name = programName;
  jsonPayload.Time = startDateTime.getTime() / 1000;
  jsonPayload.Duration = duration;
  jsonPayload.Channels = [channelNumber];
  jsonPayload.Airing.Source = "manual";
  jsonPayload.Airing.Channel = channelNumber;
  jsonPayload.Airing.Time = jsonPayload.Time;
  jsonPayload.Airing.Duration = duration;
  jsonPayload.Airing.Title = programName;
  jsonPayload.Airing.Summary = summary
  jsonPayload.Airing.Image = imageUrl

  if (programType === "tv") {
    jsonPayload.Airing.SeriesID = "manual/" + programName;
    jsonPayload.Airing.Categories = ["Show"];
    jsonPayload.Airing.EpisodeTitle = episodeTitle;
  }
  else {
    jsonPayload.Airing.MovieID = "manual/" + programName;
    jsonPayload.Airing.Categories = ["Movie"];
  }

  console.log(JSON.stringify(jsonPayload, null, 2));
  console.log("< createJsonPayload()")
}

function openImageInNewWindow() {
  console.log("> openImageInNewWindow()")

  const imageUrl = document.getElementById('image').value

  //window.open(imageUrl, "_blank")
  const popupWindow = window.open("", "ImagePopup", "width=440,height=360,left=600,top=250");
  popupWindow.document.write('<html><head><title>Image Preview</title></head><body>');
  popupWindow.document.write('<img src="' + imageUrl + '" alt="Image" style="width:100%; height:auto;">');
  popupWindow.document.write('</body></html>');
  popupWindow.document.close();

  console.log("< openImageInNewWindow()")
}

function readUserInputs() {
  console.log("> readUserInputs()")

  startDate = document.getElementById('startDate').value
  startTime = document.getElementById('startTime').value
  stopDate = document.getElementById('stopDate').value
  stopTime = document.getElementById('stopTime').value

  console.log("Start date: " + startDate);
  console.log("Start time: " + startTime);
  console.log("Stop date: " + stopDate);
  console.log("Stop time: " + stopTime);

  channelNumber = document.getElementById('channel').value
  console.log("Channel number: " + channelNumber)

  programName = document.getElementById('program').value
  console.log("Program name: " + programName)

  programType = document.querySelector('input[name="programType"]:checked').value
  console.log("Program type: " + programType)

  episodeTitle = document.getElementById('episode').value
  console.log("Episode title: " + episodeTitle)

  summary = document.getElementById('summary').value
  console.log("Summary: " + summary)

  imageUrl = document.getElementById('image').value
  console.log("Image URL: " + imageUrl)

  console.log("< readUserInputs()")
}

function sendRequestToServer() {
  console.log("> sendRequestToServer()")

  noErrors = true;

  let requestUrl = "http://" + dvrUrl + "/dvr/jobs/new";
  console.log("Request URL: " + requestUrl);

  readUserInputs();

  confirmAllInputsAreFilled();

  if (noErrors) {
    confirmStartTimeInFuture()
  }

  if (noErrors) {
    confirmStopTimeAfterStartTime();
  }

  if (noErrors) {
    calculateDuration();
  }

  if (noErrors) {
    createJsonPayload();

    fetch(requestUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonPayload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        alert("Manual recording scheduled successfully! You may now check your DVR schedule to confirm.")
    })
    .catch((error) => {
        console.error('Error:', error);

        alert("Error: " + error)
    });
  }

  console.log("< sendRequestToServer()")
}

function getTodaysDate() {
  console.log("> getTodaysDate()")
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0');

  const localDate = `${year}-${month}-${day}`;
  console.log(localDate); // e.g., "2025-09-25"
  console.log("< getTodaysDate()")
  return localDate
}

let today = getTodaysDate();
document.getElementById('startDate').value = today
document.getElementById('stopDate').value = today

document.getElementById('preview').addEventListener('click', openImageInNewWindow);
document.getElementById('schedule').addEventListener('click', sendRequestToServer);

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkModeToggle");
  const body = document.body;

  // Apply saved dark mode preference
  const darkModeEnabled = localStorage.getItem("darkMode") === "true";
  toggle.checked = darkModeEnabled;
  if (darkModeEnabled) {
    body.classList.add("dark");
  } else {
    body.classList.remove("dark");
  }

  // Listen for toggle changes
  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    localStorage.setItem("darkMode", enabled.toString());

    if (enabled) {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const episodeInput = document.getElementById("episode");
  const episodeLabel = document.querySelector('label[for="episode"]');
  const programTypeRadios = document.querySelectorAll('input[name="programType"]');

  function updateEpisodeField() {
    const selectedType = document.querySelector('input[name="programType"]:checked').value;
    const isTV = selectedType === "tv";

    episodeInput.disabled = !isTV;

    if (!isTV) {
      episodeInput.value = ""; // Clear the field when disabled
      episodeInput.classList.add("episode-disabled");
      episodeLabel.classList.add("episode-disabled");
    } else {
      episodeInput.classList.remove("episode-disabled");
      episodeLabel.classList.remove("episode-disabled");
    }
  }

  updateEpisodeField();

  programTypeRadios.forEach(radio => {
    radio.addEventListener("change", updateEpisodeField);
  });
});