// ==UserScript==
// @name         Analysis-tool-for-jeuxvideo.com-threads
// @description  Analysis tool designed to calculate the number of posts made by users in a thread
// @author       Shinoos
// @version      1.0.6
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @updateURL    https://raw.githubusercontent.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads/refs/heads/main/userscript.user.js
// @downloadURL  https://raw.githubusercontent.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads/refs/heads/main/userscript.user.js
// @match        https://www.jeuxvideo.com/forums/42*
// @match        https://www.jeuxvideo.com/forums/1*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    async function GMxhr(details) {
        if (typeof GM !== 'undefined' && GM.xmlHttpRequest) {
            return new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    ...details,
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject
                });
            });
        } else if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    ...details,
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject
                });
            });
        }
        throw new Error("GMxhr non supporté sur ce gestionnaire de scripts.");
    }

    const forumRightCol = document.querySelector("#forum-right-col");
    if (!forumRightCol) return;

    const buttonDiv = document.createElement('div');
    buttonDiv.style.textAlign = "center";

    const button = document.createElement('button');
    button.textContent = "Faire un classement du topic";
    button.style.padding = "8px 16px";
    button.style.fontSize = "14px";
    button.style.fontWeight = "bold";
    button.style.cursor = "pointer";
    button.style.backgroundColor = "#6064f4";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.fontFamily = "Arial, sans-serif";
    button.style.transition = "background-color 0.15s ease, transform 0.20s ease";
    buttonDiv.appendChild(button);
    forumRightCol.appendChild(buttonDiv);

    button.addEventListener('mouseover', function() {
        button.style.backgroundColor = "#4346ab";
        button.style.transform = "scale(1.03)";
    });

    button.addEventListener('mouseout', function() {
        button.style.backgroundColor = "#6064f4";
        button.style.transform = "scale(1)";
    });

    button.addEventListener('mousedown', function() {
        button.style.transform = "scale(0.97)";
    });

    button.addEventListener('mouseup', function() {
        button.style.transform = "scale(1)";
    });

    button.addEventListener('click', function() {
        executeAnalysisScript();
    });

    async function executeAnalysisScript() {
        try {
            const response = await GMxhr({
                method: "GET",
                url: "https://raw.githubusercontent.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads/refs/heads/main/Analysis-tool-thread.js"
            });
            const script = document.createElement('script');
            script.textContent = response.responseText;
            document.body.appendChild(script);
        } catch (e) {
            alert("Analysis-tool-for-jeuxvideo.com-threads → Impossible de charger le script.");
            console.error(e);
        }
    }

})();
