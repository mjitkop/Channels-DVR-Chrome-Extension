/**
 * @file        content.js
 * @description Handles dark mode toggle, dynamic field control, and DVR channel logic for popup UI.
 *              For support: https://community.getchannels.com/t/channels-dvr-extras-the-chrome-extension/44569
 * @author      Gildas LeFur
 * @copyright   © 2025 Gildas LeFur. All rights reserved.
 * @license     MIT
 * @version     2.0.0
 * @date        2025-09-21
 * @history
 *   - 2.0.0 (2015-10-18): 
 *       - Added an entry in the top menu to open the manual recording screen: DVR > Manual
 *       - Added the option "Mark As Not Recorded" in DVR > Manage > Shows/Movies > Options
 *       - "Mark As Not Recorded" is also available for recorded episodes in Library > TV Shows 
 *       - Started preliminary work on tracking channel lineup changes 
 *         (button "Recent Changes" visible in Settings > Sources but not fully coded yet)
 *   - 1.0.0 (2025-09-21): Initial version with popup layout and basic UI wiring.
 */

(function () {
  const ipPort = extractIpPort();
  if (ipPort) console.log("Captured IP and Port:", ipPort);

  observeDomChanges();
  setupGlobalClickListener();

  // Optional: fallback injection on load
  window.addEventListener("load", () => {
    setTimeout(injectMarkAsNotRecorded, 1000);
  });

  document.addEventListener("click", (event) => {
  const manageButton = event.target.closest("button.dropdown-toggle");
  if (manageButton && manageButton.textContent.includes("Manage")) {
    // Delay to allow the dropdown menu to populate
    setTimeout(() => injectMarkAsNotRecorded(), 300);
  }
  });

  // Wait for DOM to be ready and menu to exist
  const observer = new MutationObserver(() => {
    if (document.querySelector('div.dropdown-menu[aria-labelledby="basic-nav-dropdown"]')) {
      insertManualMenuItem();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ────────────────────────────────────────────────
  // 🔧 Function Definitions
  // ────────────────────────────────────────────────

  function extractIpPort() {
    const match = window.location.href.match(/^https?:\/\/([^/]+)\//);
    return match ? match[1] : null;
  }

  function observeDomChanges() {
    const observer = new MutationObserver(() => {
      if (window.location.pathname.includes("/admin/dvr/")) {
        injectManualRecordingButton(ipPort);
      } 
      injectMarkAsNotRecorded();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setupGlobalClickListener() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button.btn");
      if (!button) return;

      const episodeContainer = button.closest(".list-group-item");
      const checkbox = episodeContainer?.querySelector("input[type='checkbox']");
      const fileId = checkbox?.value;

      const label = button.textContent.trim();
      const icon = button.querySelector("svg");
      const action = label || icon?.getAttribute("data-icon");

      if (fileId && action) {
        console.log("Clicked action:", action);
        console.log("Associated file ID:", fileId);

        chrome.runtime.sendMessage({ type: "menuClick", action, fileId });
      }
    });
  }

  function injectManualRecordingButton(ipPort) {
    const scheduleElement = Array.from(document.querySelectorAll("div.nav-item"))
      .find(el => el.textContent.trim() === "Schedule");

    if (!scheduleElement || document.getElementById("manual-recording-btn")) return;

    const button = document.createElement("button");
    button.textContent = "Manual Recording";
    Object.assign(button.style, {
      marginTop: "0px",
      display: "inline-block",
      padding: "6px 10px",
      fontSize: "14px",
      cursor: "pointer",
      border: "1px solid #ccc",
      borderRadius: "4px",
      backgroundColor: "#f5f5f5",
      color: "#333"
    });
    button.id = "manual-recording-btn";

    button.addEventListener("click", () => {
      const popupUrl = chrome.runtime.getURL("manual_recording.html") + `?ipPort=${encodeURIComponent(ipPort)}`;
      const left = window.screenX + 164;
      const top = window.screenY + 200;

      window.open(popupUrl, "ManualRecordingPopup", `width=510,height=400,left=${left},top=${top},resizable=no`);
    });

    scheduleElement.parentNode.insertBefore(button, scheduleElement);
  }

  function injectMarkAsNotRecorded() {
    const allMenus = document.querySelectorAll(".list-group-item");

    allMenus.forEach(menu => {
      const dropdowns = menu.querySelectorAll(".dropdown-menu");

      dropdowns.forEach(dropdown => {
        // Skip if already injected
        if (dropdown.querySelector(".mark-not-recorded")) return;

        // Skip if menu is empty or not yet populated
        const items = Array.from(dropdown.querySelectorAll("a.dropdown-item"));
        if (items.length === 0) return;

        const debugIndex = items.findIndex(item =>
          item.textContent.includes("View Debug Log")
        );
        if (debugIndex === -1) return;

        // Create new menu item
        const newItem = document.createElement("a");
        newItem.className = "dropdown-item mark-not-recorded";
        newItem.href = "#";
        newItem.textContent = "Mark As Not Recorded";

        newItem.addEventListener("click", async (e) => {
          e.preventDefault();

          const checkbox = menu.querySelector("input[type='checkbox']");
          const fileId = checkbox?.value;
          if (!fileId) return;

          const dvrUrl = `http://${ipPort}`;
          const infoUrl = `${dvrUrl}/dvr/files/${fileId}`;
          console.log(`infoUrl: ${infoUrl}`)

          try {
            const response = await fetch(infoUrl);
            if (!response.ok) throw new Error("Failed to fetch mediainfo");

            const data = await response.json();
            const programId = data?.Airing?.ProgramID;
            if (!programId) throw new Error("ProgramID not found");

            const [exists, status] = await getProgramStatus(programId, fileId);
            if (exists) {
              console.log("Program found with status:", status);

              const encodedProgramId = encodeURIComponent(programId);
              const deleteUrl = `${dvrUrl}/dvr/programs/${encodedProgramId}`;
              const deleteResponse = await fetch(deleteUrl, { method: "DELETE" });

              if (!deleteResponse.ok) throw new Error("Failed to delete program");

              console.log(`Program ${programId} deleted successfully`);
              alert(`Program ${programId} marked as Not Recorded.`);

              // Close the dropdown menu safely
              const dropdownMenu = menu.querySelector(".dropdown-menu");
              const dropdownContainer = menu.querySelector(".dropdown");

              if (dropdownMenu && document.body.contains(dropdownMenu)) {
                dropdownMenu.classList.remove("show");
              }
              if (dropdownContainer && document.body.contains(dropdownContainer)) {
                dropdownContainer.classList.remove("show");
              }
            }
          } catch (err) {
            console.error("Error marking as not recorded:", err);
            alert("Failed to mark as not recorded.");
          }
        });

        dropdown.insertBefore(newItem, items[debugIndex]);
      });
    });
  }

  async function getProgramStatus(programId, fileID) {
  try {
    const dvrUrl = `http://${ipPort}`;
    const response = await fetch(`${dvrUrl}/dvr/programs`);
    if (!response.ok) throw new Error(`Failed to fetch programs: ${response.status}`);

    const programs = await response.json();
    const status = programs[programId];

    const expectedRecordedStatus = `recorded-${fileID}`;
    const isValidStatus = status === "skipped" || status === expectedRecordedStatus;

    return [isValidStatus, isValidStatus ? status : null];

  } catch (error) {
    console.error("Error checking ProgramID:", error);
    return [false, null];
  }
  }

  function insertManualMenuItem() {
    const menu = document.querySelector('div.dropdown-menu[aria-labelledby="basic-nav-dropdown"]');
    if (!menu) return;

    const passesLink = Array.from(menu.querySelectorAll('a.dropdown-item')).find(a =>
      a.textContent.trim() === 'Passes'
    );
    if (!passesLink) return;

    const manualLink = document.createElement('a');
    manualLink.className = 'dropdown-item';
    manualLink.innerHTML = `
      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="hand-paper"
          class="svg-inline--fa fa-hand-paper fa-fw mr-1" role="img"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path fill="currentColor"
              d="M408.781 128.969c-13.25 0-24 10.75-24 24v56h-8v-88c0-13.25-10.75-24-24-24s-24 10.75-24 24v88h-8V72c0-13.25-10.75-24-24-24s-24 10.75-24 24v136h-8V24c0-13.25-10.75-24-24-24s-24 10.75-24 24v184h-8V104c0-13.25-10.75-24-24-24s-24 10.75-24 24v232l-31.5-52.5c-6.75-11.25-21.25-15-32.5-8.25s-15 21.25-8.25 32.5l80 133.25C174.281 486.719 194.281 512 224 512h112c61.75 0 112-50.25 112-112V152.969c0-13.25-10.75-24-24-24z"/>
      </svg>
      Manual
    `;
    manualLink.style.color = "#fff";

    manualLink.addEventListener('click', (e) => {
      e.preventDefault();

      // Close the dropdown menu
      menu.classList.remove('show');
      const toggleButton = document.querySelector('#basic-nav-dropdown');
      if (toggleButton && toggleButton.classList.contains('show')) {
        toggleButton.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', 'false');
      }

      const popupUrl = chrome.runtime.getURL("manual_recording.html") + `?ipPort=${encodeURIComponent(ipPort)}`;
      const left = window.screenX + 164;
      const top = window.screenY + 200;

      window.open(popupUrl, "ManualRecordingPopup", `width=510,height=400,left=${left},top=${top},resizable=no`);
    });

    // Insert after "Passes"
    passesLink.insertAdjacentElement('afterend', manualLink);
  }
})();