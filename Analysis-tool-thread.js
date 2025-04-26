 (async function main() {
  const scriptVersion = "v1.3.1";
  checkScriptVersion();
  let currentPage = 1;
  let messagesCount = new Map();
  let totalMessages = 0;
  let totalPages = 0;
  let isPaused = false;
  let isPendingRequest = false;
  const analyzedPages = new Set();
  const previousPositions = new Map();
  const pagination = document.querySelector(".bloc-liste-num-page");
  const maxPages = pagination ? (pagination.querySelectorAll("a.xXx.lien-jv").length > 0 ? parseInt(pagination.querySelectorAll("a.xXx.lien-jv")[Math.max(0, pagination.querySelectorAll("a.xXx.lien-jv").length - (pagination.querySelectorAll("a.xXx.lien-jv").length > 11 ? 2 : 1))].textContent, 10) || 1 : 1) : 1;
  const startTime = Date.now();
  const topicTitleElement = document.querySelector("#bloc-title-forum");
  const topicTitle = topicTitleElement ? topicTitleElement.textContent.trim() : "Titre indisponible";

  function userPageInput() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #2c2f33;
        border-radius: 12px;
        padding: 30px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        text-align: center;
        color: #ffffff;
        transform: scale(0.9);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
      `;

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: #b9bbbe;
        font-size: 30px;
        cursor: pointer;
        transition: color 0.2s ease;
        padding: 0;
        line-height: 1;
        width: 25px;
        height: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
      `;

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.color = '#ffffff';
        closeButton.style.backgroundColor = 'rgba(255,255,255,0.1)';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.color = '#b9bbbe';
        closeButton.style.backgroundColor = 'transparent';
      });

      closeButton.addEventListener('click', () => {
        overlay.remove();
        return;
      });

      const title = document.createElement('h2');
      title.textContent = 'Sélection de la page de départ';
      title.style.cssText = `
        color: #6064f4;
        margin-bottom: 20px;
        font-size: 20px;
      `;

      const description = document.createElement('p');
      const pageText = maxPages === 1 ? '1 page' : ` ${maxPages} pages`;
      description.textContent = `Ce topic contient ${pageText}. À partir de quelle page souhaitez-vous commencer l'analyse ?`;
      description.style.cssText = `
        color: #b9bbbe;
        margin-bottom: 20px;
        line-height: 1.5;
      `;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.max = maxPages;
      input.value = 1;
      input.style.cssText = `
        width: 100%;
        padding: 12px;
        margin-bottom: 20px;
        border: 1px solid #40444b;
        border-radius: 8px;
        background: #1e1f22;
        color: #ffffff;
        font-size: 16px;
        text-align: center;
      `;

      input.addEventListener('keydown', (event) => {
        if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
          event.preventDefault();
        }
      });

      input.addEventListener('input', () => {
        const value = parseInt(input.value, 10) || 1;
        if (value > maxPages) {
          input.value = maxPages;
        } else if (value < 1) {
          input.value = 1;
        }
      });

      const startButton = document.createElement('button');
      startButton.textContent = 'Commencer l\'analyse';
      startButton.style.cssText = `
        width: 100%;
        padding: 12px;
        background: #6064f4;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
      `;

      startButton.addEventListener('mouseenter', () => {
        startButton.style.background = '#4346ab';
        startButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
      });

      startButton.addEventListener('mouseleave', () => {
        startButton.style.background = '#6064f4';
        startButton.style.boxShadow = 'none';
      });

      startButton.addEventListener('mousedown', () => {
        startButton.style.transform = 'scale(0.98)';
        startButton.style.background = '#4346ab';
        startButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      });

      startButton.addEventListener('mouseup', () => {
        startButton.style.transform = 'scale(1)';
        startButton.style.background = '#6064f4';
        startButton.style.boxShadow = 'none';
      });

      startButton.addEventListener('click', () => {
        const selectedPage = Math.max(1, Math.min(parseInt(input.value, 10) || 1, maxPages));
        overlay.remove();
        resolve(selectedPage);
      });

      modal.appendChild(closeButton);
      modal.appendChild(title);
      modal.appendChild(description);
      modal.appendChild(input);
      modal.appendChild(startButton);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
      });

      input.focus();

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const selectedPage = Math.max(1, Math.min(parseInt(input.value, 10) || 1, maxPages));
          overlay.remove();
          resolve(selectedPage);
        }

        if (event.key === 'Escape') {
          overlay.remove();
          return;
        }

      });
    });
  }

  const userInput = await userPageInput();
  currentPage = userInput;

  window.document.body.innerHTML = `
      <html>
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #111214; 
          color: #ffffff; 
          line-height: 1.5;
        }
        .notification-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          pointer-events: none;
        }
        .notification {
          background-color: #6064f4;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          opacity: 0;
          transform: translateX(100%);
          transition: opacity 0.3s ease, transform 0.3s ease;
          font-family: Arial, sans-serif;
          pointer-events: none;
        }
        .notification.show {
          opacity: 1;
          transform: translateX(0);
        }
        .notification.error { background-color: #ff0000; }
        .notification.success { background-color: #05980c; }
        .notification.warning { background-color: #ffa500; }
        .container { 
          padding: 20px; 
          max-width: 800px; 
          margin: 0 auto; 
        }
        .controls { 
          margin-bottom: 20px; 
          text-align: center;
        }
        button {
         font-family: Arial, sans-serif;
         font-weight: bold;
         font-style: normal;
         margin: 5px;
         padding: 10px 20px;
         font-size: 16px;
         min-width: 100px;
         text-align: center;
         background: #6064f4;
         border: none;
         border-radius: 5px;
         color: white;
         cursor: pointer;
         transition: background 0.3s ease;
         box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
         transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        button:hover { 
         background: #4346ab; 
        }
        button:active {
         transform: scale(0.97);
         background-color: #4346ab;
         box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
         transition: transform 0.15s ease, background-color 0.15s ease;
        }
        button.disabled {
         cursor: not-allowed;
         opacity: 0.5;
        }
        button:active {
         font-family: inherit;
         font-weight: bold;
         font-style: inherit;
        }
        button.reprendre {
         pointer-events: none;
         opacity: 0.5;
        }
        button.reprendre.active {
         pointer-events: auto;
         opacity: 1;
        }
        .progress-bar { 
          background: #2b2d31; 
          border-radius: 10px; 
          height: 20px; 
          overflow: hidden; 
          position: relative; 
          margin-bottom: 20px; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .progress-bar .fill { 
          background: #6064f4; 
          height: 100%; 
          width: 0%; 
          border-radius: 10px 0 0 10px;
          transition: width 0.5s ease-in-out;
        }
        .summary { 
          margin-bottom: 20px; 
          background: #1e1f22; 
          padding: 10px; 
          border-radius: 5px; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
          background: #1e1f22; 
          border-radius: 5px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        th, td { 
          border: 1px solid #40444b; 
          padding: 8px; 
          text-align: left; 
          color: #ffffff; 
        }
        th { 
          background: #2b2d31; 
        }
        td { 
          background: #1e1f22;
          width: 70px;
        }
        tr:nth-child(even) td { 
          background: #2c2f33; 
        }
        td:nth-child(1), th:nth-child(1) {
         width: 70px;
        }
        td:nth-child(2), th:nth-child(2) {
         width: 150px;
        }
        td:nth-child(3), th:nth-child(3) {
         width: 120px;
        }
        .green { 
          color: #06ab0e; 
        }
        .red { 
          color: #ff0000; 
        }
        .orange { 
          color: #ffa500; 
        }
        .bold { 
          font-weight: bold; 
        }
        .status {
          margin-top: 10px;
          padding: 10px;
          border-radius: 5px;
          background: #1e1f22;
          text-align: center;
          font-size: 18px;
          min-width: 200px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        #spinner {
         display: inline-block;
         width: 14px;
         height: 14px;
         border: 2px solid #1e1f22;
         border-top: 2px solid #06ab0e;
         border-radius: 50%;
         animation: spin 1s linear infinite, halo 1.5s ease-in-out infinite;
         margin-right: 10px;
        }
        @keyframes spin {
         0% {
         transform: rotate(0deg);
         }
         100% {
         transform: rotate(360deg);
         }
        }
        @keyframes halo {
         0% {
         box-shadow: 0 0 5px rgba(6, 171, 14, 0.5), 0 0 10px rgba(6, 171, 14, 0.3), 0 0 10px rgba(6, 171, 14, 0.2);
         }
         50% {
         box-shadow: 0 0 10px rgba(6, 171, 14, 0.7), 0 0 20px rgba(6, 171, 14, 0.5), 0 0 20px rgba(6, 171, 14, 0.4);
         }
         100% {
         box-shadow: 0 0 5px rgba(6, 171, 14, 0.5), 0 0 10px rgba(6, 171, 14, 0.3), 0 0 10px rgba(6, 171, 14, 0.2);
         }
        }
        .topic-title {
         font-size: 18px;
         text-align: center;
         margin-bottom: 10px;
         color: #b9bbbe;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="controls">
          <button onclick="pauseAnalysis()">Pause</button>
          <button onclick="resumeAnalysis()" class="disabled" disabled>Reprendre</button>
          <button onclick="copyResults()">Copier les résultats</button>
        </div>
        <div class="progress-bar">
          <div class="fill"></div>
        </div>
        <div class="summary" id="summary"></div>
        <div id="status" class="status green">
        <span id="spinner"></span> Analyse en cours...
        </div>
        <div class="results">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pseudo</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody id="results"></tbody>
          </table>
        </div>
        <div class="notification-container"></div>
      </div>
    </body>
    </html>`;

  const progressBar = window.document.querySelector(".progress-bar .fill");
  const summaryElement = window.document.querySelector("#summary");
  const resultsTable = window.document.querySelector("#results");
  const statusElement = window.document.querySelector("#status");
  const notificationContainer = window.document.querySelector(".notification-container");

  function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, duration);
  }

  pauseAnalysis = () => !isPaused && (isPaused = true, updateStatus("Analyse mise en pause.", "orange", true) /*, console.log("Pause demandée.")*/ );
  resumeAnalysis = () => !isPendingRequest && isPaused && (isPaused = false, updateStatus("Analyse en cours...") /*, console.log("Reprise demandée.")*/ , handlePage());
  updateProgress = () => progressBar.style.width = `${Math.min(currentPage / maxPages * 100, 100)}%`;

  copyResults = () => {
    try {
      const rows = window.document.querySelectorAll("#results tr");
      let resultsText = window.document.querySelector("#summary").textContent + "\n\n";
      rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3)
          resultsText += `#${cells[0]?.textContent.split(' ')[0] || "?"} : ${cells[1]?.textContent || "?"} -> ${parseInt(cells[2]?.textContent) || 0} ${parseInt(cells[2]?.textContent) === 1 ? "message" : "messages"}\n`;
      });
      navigator.clipboard.writeText(resultsText.replace(/Pages restantes.*\n|Analyse terminée.\n/, ''))
        .then(() => showNotification("Résultats copiés dans le presse-papiers !", "success"))
        .catch(err => {
          console.error("Échec de la copie des résultats :", err);
          showNotification("Échec de la copie des résultats.", "error");
        });

    } catch (e) {
      showNotification(`Erreur : ${e}`, "error");
    }
  };

  handlePage();

  async function handlePage(attempt = 1) {
    if (isPaused) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return handlePage(attempt);
    }

    if (statusElement.innerHTML !== `<span id="spinner"></span> Analyse en cours...`) {
      updateStatus("Analyse en cours...", "green", false);
    }

    const pagesToProcess = [];
    const originalCurrentPage = currentPage;
    for (let i = 0; i < 25 && currentPage <= maxPages; i++) {
      if (!analyzedPages.has(currentPage)) {
        pagesToProcess.push(currentPage);
      }
      currentPage++;
    }

    if (pagesToProcess.length === 0) {
      if (currentPage > maxPages) {
        updateStatus("Analyse terminée.", "green bold", true);
        showNotification("Analyse terminée ! Vous pouvez désormais fusionner des pseudos en cliquant dessus.", "info", 10000);
        updateSummary();
      }
      return;
    }

    try {
      isPendingRequest = true;

      const pagePromises = pagesToProcess.map(async (page) => {
        const path = location.pathname.split("-").map((_, i) => i === 3 ? page : _).join("-");
        try {
          const response = await fetch(path);
          if (response.status === 403) {
            throw new Error(`Erreur 403 sur la page ${page}`);
          }

          if (response.redirected) {
            return {
              page,
              redirected: true,
              messagesOnPage: 0,
              success: true
            };
          }

          const body = await response.text();
          const doc = document.implementation.createHTMLDocument();
          doc.documentElement.innerHTML = body;
          let messagesOnPage = 0;

          doc.querySelectorAll(".bloc-pseudo-msg").forEach((messageElement) => {
            const isBlacklisted = messageElement.closest(".conteneur-message-blacklist") !== null;
            const pseudoElement = messageElement.querySelector(".text-user") || messageElement;
            const pseudo = pseudoElement.innerText.trim();

            if (!isBlacklisted && pseudo !== "Auteur blacklisté") {
              messagesCount.set(pseudo, (messagesCount.get(pseudo) || 0) + 1);
              messagesOnPage++;
            }
          });

          return {
            page,
            redirected: false,
            messagesOnPage,
            success: true
          };
        } catch (error) {
          return {
            page,
            success: false,
            error: error.message
          };
        }
      });

      const results = await Promise.allSettled(pagePromises);
      let has403Error = false;
      let pagesProcessed = 0;
      let failedPages = [];

      results.forEach((result, index) => {
        const page = pagesToProcess[index];
        if (result.status === "fulfilled" && result.value.success) {
          const {
            redirected,
            messagesOnPage
          } = result.value;
          analyzedPages.add(page);
          pagesProcessed++;
          if (!redirected) {
            totalMessages += messagesOnPage;
            totalPages++;
          }
        } else if (result.status === "fulfilled" && !result.value.success) {
          console.error(`Erreur sur la page ${page}: ${result.value.error}`);
          if (result.value.error.includes("Erreur 403")) {
            has403Error = true;
          } else {
            failedPages.push(page);
          }
        } else {
          console.error(`Erreur sur la page ${page}: ${result.reason}`);
          failedPages.push(page);
        }
      });

      isPendingRequest = false;

      if (has403Error) {
        currentPage = originalCurrentPage;
        isPaused = true;
        updateStatus("Erreur 403 : Veuillez résoudre le CAPTCHA Cloudflare puis cliquer sur Reprendre.", "red", true);
        showNotification("Erreur 403 détectée.", "error", 10000);
        updateSummary();
        return;
      }

      if (pagesProcessed > 0) {
        updateProgress();
        updateResults();
        updateSummary();
      }

      const allRedirected = pagesProcessed === pagesToProcess.length && results.every((result) => result.status === "fulfilled" && result.value.success && result.value.redirected);

      if (allRedirected && currentPage > maxPages) {
        updateStatus("Analyse terminée.", "green bold", true);
        showNotification("Analyse terminée ! Vous pouvez désormais fusionner des pseudos en cliquant dessus.", "info", 10000);
        updateSummary();
        return;
      }

      if (failedPages.length > 0 && attempt < 50) {
        currentPage = originalCurrentPage;
        updateStatus(`Erreur réseau sur ${failedPages.length} page(s), tentative ${attempt}/50.`, "orange", false);
        showNotification(`Erreur réseau sur ${failedPages.length} page(s), tentative ${attempt}/50.`, "warning", 5000);
        const delay = Math.min(2 ** attempt * 100, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        const retryPages = failedPages.filter(page => !analyzedPages.has(page));
        if (retryPages.length > 0) {
          currentPage = Math.min(...retryPages);
          return handlePage(attempt + 1);
        }
      } else if (failedPages.length > 0) {
        currentPage = originalCurrentPage;
        console.error("Échec malgré plusieurs tentatives pour les pages:", failedPages);
        updateStatus("Analyse interrompue en raison d'erreurs répétées.", "red bold", true);
        showNotification(`Erreur fatale sur ${failedPages.length} page(s) après 50 tentatives.`, "error", 30000000);
        updateSummary();
        return;
      }

      if (!isPaused) {
        handlePage(1);
      } else {
        updateStatus("Analyse mise en pause.", "orange", true);
        updateSummary();
      }

    } catch (error) {
      console.error("Erreur lors du traitement des pages:", error);
      currentPage = originalCurrentPage;
      isPendingRequest = false;

      if (attempt < 50) {
        updateStatus(`Erreur, tentative ${attempt}/50...`, "orange", false);
        showNotification(`Erreur, tentative ${attempt}/50 après un délai...`, "warning", 5000);
        const delay = Math.min(2 ** attempt * 100, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        handlePage(attempt + 1);
      } else {
        console.error("Échec malgré plusieurs tentatives.");
        updateStatus("Analyse interrompue en raison d'erreurs répétées.", "red bold", true);
        showNotification(`Erreur fatale : ${error.message}`, "error", 30000000);
        updateSummary();
      }
    }
  }

  function updateResults() {
    resultsTable.innerHTML = "";
    let sorted = [...messagesCount.entries()].sort((a, b) => b[1] - a[1]);

    sorted.forEach(([pseudo, count], index) => {
      let row = window.document.createElement("tr");
      let position = index + 1;
      let positionChange = "";
      let previousPosition = previousPositions.get(pseudo);
      let percentage = ((count / totalMessages) * 100).toFixed(1);

      switch (true) {
        case typeof previousPosition !== "undefined" && position < previousPosition:
          positionChange = `<span class="green">⇧ ${previousPosition - position}</span>`;
          break;

        case typeof previousPosition !== "undefined" && position > previousPosition:
          positionChange = `<span class="red">⇩ ${position - previousPosition}</span>`;
          break;

        default:
          positionChange = "";
      }

      previousPositions.set(pseudo, position);
      row.innerHTML = `<td>${position} ${positionChange}</td><td>${pseudo}</td><td>${count} <span style="color: #b9bbbe; font-size: 0.72em;">(${percentage}%)</span></td>`;

      if (currentPage > maxPages) {
        row.addEventListener("click", () => {
          showFusionMenu(pseudo, count, row);
        });

        row.addEventListener("mouseover", () => {
          const cells = row.querySelectorAll("td");
          cells.forEach(cell => {
            cell.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
          });
          row.style.cursor = "pointer";
        });

        row.addEventListener("mouseout", () => {
          const cells = row.querySelectorAll("td");
          cells.forEach(cell => {
            cell.style.backgroundColor = "";
          });
        });
      }
      resultsTable.appendChild(row);
    });
  }

  function fusionPseudos(targetPseudo, sourcePseudo, count) {
    messagesCount.set(targetPseudo, (messagesCount.get(targetPseudo) || 0) + count);
    messagesCount.delete(sourcePseudo);
    previousPositions.delete(sourcePseudo);
  }

  function showFusionMenu(pseudo, count, row) {
    const overlay = window.document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "99";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const menu = window.document.createElement("div");
    menu.style.backgroundColor = "#2c2f33";
    menu.style.border = "1px solid #40444b";
    menu.style.borderRadius = "12px";
    menu.style.padding = "25px";
    menu.style.width = "350px";
    menu.style.maxWidth = "90%";
    menu.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
    menu.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    menu.style.color = "#ffffff";
    menu.style.position = "relative";
    menu.style.transform = "scale(0.9)";
    menu.style.opacity = "0";
    menu.style.transition = "transform 0.3s ease, opacity 0.3s ease";

    const title = window.document.createElement("h3");
    title.textContent = "Fusionner les pseudos";
    title.style.fontSize = "18px";
    title.style.marginBottom = "15px";
    title.style.textAlign = "center";
    title.style.color = "#6064f4";
    title.style.fontWeight = "600";
    menu.appendChild(title);

    const description = window.document.createElement("p");
    description.textContent = `Vous allez fusionner le pseudo "${pseudo}" avec un autre. Le pseudo sélectionné dans le menu déroulant disparaîtra du tableau et sera fusionné.`;
    description.style.fontSize = "14px";
    description.style.marginBottom = "20px";
    description.style.textAlign = "center";
    description.style.color = "#b9bbbe";
    description.style.lineHeight = "1.4";
    menu.appendChild(description);

    const fusionSelect = window.document.createElement("select");
    fusionSelect.style.width = "100%";
    fusionSelect.style.height = "45px";
    fusionSelect.style.marginBottom = "20px";
    fusionSelect.style.padding = "10px";
    fusionSelect.style.border = "1px solid #40444b";
    fusionSelect.style.borderRadius = "8px";
    fusionSelect.style.backgroundColor = "#1e1f22";
    fusionSelect.style.color = "#ffffff";
    fusionSelect.style.fontSize = "14px";
    fusionSelect.style.cursor = "pointer";
    fusionSelect.style.outline = "none";
    fusionSelect.style.transition = "border-color 0.3s ease";

    const defaultOption = window.document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Sélectionnez un pseudo";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    fusionSelect.appendChild(defaultOption);

    const sortedPseudos = [...messagesCount.entries()]
      .filter(([p, _]) => p !== pseudo)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [p, c] of sortedPseudos) {
      const option = window.document.createElement("option");
      option.value = p;
      option.textContent = `${p} (${c} ${c > 1 ? "messages" : "message"})`;
      fusionSelect.appendChild(option);
    }

    const fusionButton = window.document.createElement("button");
    fusionButton.textContent = "Fusionner";
    fusionButton.style.padding = "12px 18px";
    fusionButton.style.backgroundColor = "#6064f4";
    fusionButton.style.color = "#ffffff";
    fusionButton.style.border = "none";
    fusionButton.style.borderRadius = "8px";
    fusionButton.style.cursor = "pointer";
    fusionButton.style.width = "100%";
    fusionButton.style.marginBottom = "10px";
    fusionButton.style.fontSize = "16px";
    fusionButton.style.fontWeight = "600";

    fusionButton.addEventListener("click", () => {
      try {
        const sourcePseudo = fusionSelect.value;
        if (sourcePseudo) {
          fusionPseudos(pseudo, sourcePseudo, messagesCount.get(sourcePseudo));
          overlay.remove();
          updateResults();
          showNotification(`Le pseudo ${sourcePseudo} a été fusionné avec ${pseudo}`, "success");
        }
      } catch (error) {
        console.error("Une erreur s'est produite lors de la fusion des pseudos :", error);
        showNotification("Une erreur est survenue lors de la fusion. Veuillez réessayer.", "error", 5000);
      }
    });

    const cancelButton = window.document.createElement("button");
    cancelButton.textContent = "Annuler";
    cancelButton.style.padding = "12px 18px";
    cancelButton.style.backgroundColor = "#ff4d4d";
    cancelButton.style.color = "#ffffff";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "8px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.width = "100%";

    cancelButton.addEventListener("click", () => {
      overlay.remove();
    });

    menu.appendChild(fusionSelect);
    menu.appendChild(fusionButton);
    menu.appendChild(cancelButton);

    overlay.appendChild(menu);
    window.document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      menu.style.transform = "scale(1)";
      menu.style.opacity = "1";
    });

    window.addEventListener("keydown", (e) => e.key === "Escape" && overlay.remove());

  }

  function updateStatus(text, className = "green", isPaused = false) {
    const spinner = '<span id="spinner"></span>';
    statusElement.innerHTML = `${isPaused || isPendingRequest ? "" : spinner} ${text}`;
    statusElement.className = `status ${className}`;

    const pauseButton = window.document.querySelector(".controls button:first-child");
    const resumeButton = window.document.querySelector(".controls button:nth-child(2)");

    switch (true) {
      case text.includes("Erreur 403"):
        resumeButton.classList.add("active");
        resumeButton.classList.remove("disabled");
        resumeButton.removeAttribute("disabled");
        pauseButton.classList.add("disabled");
        pauseButton.setAttribute("disabled", "true");
        break;

      case text.includes("Analyse mise en pause.") && !isPendingRequest:
        resumeButton.classList.add("active");
        resumeButton.classList.remove("disabled");
        resumeButton.removeAttribute("disabled");
        pauseButton.classList.add("disabled");
        pauseButton.setAttribute("disabled", "true");
        break;

      case text.includes("Analyse mise en pause.") && isPendingRequest:
        resumeButton.classList.remove("active");
        resumeButton.classList.add("disabled");
        resumeButton.setAttribute("disabled", "true");
        pauseButton.classList.add("disabled");
        pauseButton.setAttribute("disabled", "true");
        break;

      case text.includes("Analyse terminée."):
        resumeButton.classList.add("disabled");
        resumeButton.setAttribute("disabled", "true");
        pauseButton.classList.add("disabled");
        pauseButton.setAttribute("disabled", "true");
        break;

      default:
        resumeButton.classList.remove("active");
        resumeButton.classList.add("disabled");
        resumeButton.setAttribute("disabled", "true");
        pauseButton.classList.remove("disabled");
        pauseButton.removeAttribute("disabled");
        break;
    }
  }

  function updateSummary() {
    const totalTime = Date.now() - startTime;
    const pagesRemaining = currentPage <= maxPages ? maxPages - currentPage + 1 : 0;
    const summary =
      `<div class="topic-title bold">Titre du topic : ${topicTitle}</div>\n` +
      "Total de messages analysés : " + totalMessages + "<br>\n" +
      "Pages restantes : " + (pagesRemaining > 0 ? pagesRemaining : "Aucune") + "<br>\n" +
      "Total de pages analysées : " + totalPages + "<br>\n" +
      "Durée totale de l'analyse : " + new Date(totalTime).toISOString().substr(11, 8);
    summaryElement.innerHTML = summary;
  }

  async function checkScriptVersion() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads/refs/heads/main/Analysis-tool-thread.js');
      const onlineScript = await response.text();
      const onlineScriptVersion = onlineScript.match(/const scriptVersion = "(.+)";/)[1];

      if (onlineScriptVersion !== scriptVersion) {
        console.warn(`Analysis-tool-for-jeuxvideo.com-threads → Vous utilisez actuellement une ancienne version du script (${scriptVersion}). Une nouvelle version du script (${onlineScriptVersion}) est disponible : https://github.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads`)
      } else {
        console.log(`Analysis-tool-for-jeuxvideo.com-threads → Vous utilisez bien la dernière version du script : ${scriptVersion} 👍`);
      }
    } catch (error) {
      console.error('Analysis-tool-for-jeuxvideo.com-threads → Erreur lors de la vérification de la version du script :', error);
    }
  }

 })();
