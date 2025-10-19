/**
 * @file        background.js
 * @description Handles background messaging for Channels DVR Extras.
 * @author      Gildas LeFur
 * @copyright   © 2025 Gildas LeFur. All rights reserved.
 * @license     MIT
 * @version     2.0.0
 * @date        2025-10-18
 * @history
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "menuClick") {
    console.log("Menu item clicked:", message.action);
    console.log("File ID:", message.fileId);
  }
});