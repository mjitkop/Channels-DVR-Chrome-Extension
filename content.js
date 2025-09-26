/**
 * @file        content.js
 * @description Handles dark mode toggle, dynamic field control, and DVR channel logic for popup UI.
 *              For support: https://community.getchannels.com/t/channels-dvr-extras-the-chrome-extension/44569
 * @author      Gildas LeFur
 * @copyright   © 2025 Gildas LeFur. All rights reserved.
 * @license     MIT
 * @version     1.0.0
 * @date        2025-09-21
 * @history
 *   - 1.0.0 (2025-09-21): Initial version with popup layout and basic UI wiring.
 */

(function () {
    const url = window.location.href;
  
    if (window.location.pathname.includes("/admin/dvr/")) {
      const match = url.match(/^https?:\/\/([^/]+)\//);
      const ipPort = match ? match[1] : null;
  
      if (ipPort) {
        console.log("Captured IP and Port:", ipPort);
      }
  
      // Wait for the DOM to settle
      const observer = new MutationObserver(() => {
        const scheduleElement = Array.from(document.querySelectorAll("div.nav-item"))
        .find(el => el.textContent.trim() === "Schedule");

      if (scheduleElement && !document.getElementById("manual-recording-btn")) {
        const button = document.createElement("button");
        button.textContent = "Manual Recording";
        button.style.marginTop = "0px";
        button.style.display = "inline-block";
        button.style.padding = "6px 10px";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";
        button.style.border = "1px solid #ccc";
        button.style.borderRadius = "4px";
        button.style.backgroundColor = "#f5f5f5";
        button.style.color = "#333";
        button.id = "manual-recording-btn";
      
        scheduleElement.parentNode.insertBefore(button, scheduleElement.nextSibling);

        button.addEventListener("click", () => {
            const popupUrl = chrome.runtime.getURL("manual_recording.html")+ `?ipPort=${encodeURIComponent(ipPort)}`;

            // Position relative to current window
            const popupWidth = 510;
            const popupHeight = 400;
            const offsetX = 164; // pixels from current window's left
            const offsetY = 200; // pixels from current window's top

            const left = window.screenX + offsetX;
            const top = window.screenY + offsetY;

            window.open(
                popupUrl,
                "ManualRecordingPopup",
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=no`
            );
        });
          
        scheduleElement.parentNode.insertBefore(button, scheduleElement);
        }
      });
  
      observer.observe(document.body, { childList: true, subtree: true });
    }
  })();