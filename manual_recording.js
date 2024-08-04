// Retrieve the URL of the DVR that was read by the extension popup
let dvrUrl = sessionStorage.getItem('dvrUrl')

// Constants
const DefaultImageUrl = "https://tmsimg.fancybits.co/assets/p9467679_st_h6_aa.jpg"

// Global variables for the user inputs
let channelNumber = 0
let episodeTitle = ""
let imageUrl = DefaultImageUrl
let programName = ""
let startDate = ""
let startTime = ""
let stopDate = ""
let stopTime = ""

// Other global variables
let duration = 0
let jsonPayload = {}
let proceed = true
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
    proceed = false
  }

  console.log("proceed: " + proceed)
  console.log("< calculateDuration()")
}

function confirmAllInputsAreFilled() {
  console.log("> confirmAllInputsAreFilled()")

  if (!startDate || !startTime || !stopDate || !stopTime || !channelNumber || !programName || !episodeTitle || !imageUrl) {
    console.log("Missing some inputs. Alerting the user.")
    alert("Make sure to fill in all the inputs!")

    proceed = false
  } 

  console.log("proceed: " + proceed)
  console.log("< confirmAllInputsAreFilled()")
}

function confirmStartTimeInFuture() {
  console.log("> confirmStartTimeInFuture()")

  const now = new Date()
  const startDateTime = new Date(`${startDate}T${startTime}`);

  if (startDateTime.getTime() <= now.getTime()) {
    console.log("startDateTime in the past. Alerting the user.")
    alert("Make sure to pick a start time in the future!")

    proceed = false
  }

  console.log("proceed: " + proceed)
  console.log("< confirmStartTimeInFuture()")
}

function confirmStopTimeAfterStartTime() {
  console.log("> confirmStopTimeAfterStartTime()")

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const stopDateTime = new Date(`${stopDate}T${stopTime}`);

  if (stopDateTime.getTime() <= startDateTime.getTime()) {
    console.log("The stop time is invalid. Alerting the user.")
    alert("Make sure to pick a stop time that is later than the start time!")

    proceed = false
  }

  console.log("proceed: " + proceed)
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
  jsonPayload.Airing.EpisodeTitle = episodeTitle;
  jsonPayload.Airing.Summary = "Manual recording created with the Chrome extension.";
  jsonPayload.Airing.SeriesID = "MANUAL";
  jsonPayload.Airing.ProgramID = "MAN" + jsonPayload.Time;
  jsonPayload.Airing.Image = imageUrl

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

  episodeTitle = document.getElementById('episode').value
  console.log("Episode title: " + episodeTitle)

  imageUrl = document.getElementById('image').value
  console.log("Image URL: " + imageUrl)

  console.log("< readUserInputs()")
}

function sendRequestToServer() {
  console.log("> sendRequestToServer()")

  proceed = true;

  let requestUrl = dvrUrl + "/dvr/jobs/new";
  console.log("Request URL: " + requestUrl);

  readUserInputs();

  confirmAllInputsAreFilled();

  if (proceed) {
    confirmStartTimeInFuture()
  }

  if (proceed) {
    confirmStopTimeAfterStartTime();
  }

  if (proceed) {
    calculateDuration();
  }

  if (proceed) {
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

document.getElementById('preview').addEventListener('click', openImageInNewWindow);
document.getElementById('schedule').addEventListener('click', sendRequestToServer);


