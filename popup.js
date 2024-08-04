// Get the current tab's URL
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var url = new URL(tabs[0].url);

  // Check if the URL starts with "http://", includes a port number, and is followed by "/admin"
  if (url.protocol === "http:" && url.port && url.pathname.startsWith("/admin")) {
    // Save the URL up to "/admin" as the DVR URL
    var dvrUrl = url.protocol + "//" + url.hostname + ":" + url.port;

    sessionStorage.setItem('dvrUrl', dvrUrl)

    document.getElementById('record').addEventListener('click', function() {
      window.open(chrome.runtime.getURL('manual_recording.html'), 'newwindow', 'width=524,height=390,left=700,top=150');
    });

    document.getElementById('export').addEventListener('click', function() {
      window.open(chrome.runtime.getURL('export_import.html'), 'newwindow', 'width=524,height=490,left=700,top=150');
    });
  } else {
    window.close()

    alert("No Channels DVR URL detected. Please load a page from your Channels DVR server and try this extension again.");
  }
});


