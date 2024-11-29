  (async function main() {
    const scriptVersion = "v1.2.1";
    checkScriptVersion();
    let _currentPage = 1;
    let _count = new Map();
    let _totalMessages = 0;
    let _totalPages = 0;
    let _isPaused = false;
    let _isPendingRequest = false;
    const analyzedPages = new Set();
    const _previousPositions = new Map();
    const pagination = document.querySelector(".bloc-liste-num-page");
    const _maxPages = pagination ? (pagination.querySelectorAll("a.xXx.lien-jv").length > 0 ? parseInt(pagination.querySelectorAll("a.xXx.lien-jv")[Math.max(0, pagination.querySelectorAll("a.xXx.lien-jv").length - (pagination.querySelectorAll("a.xXx.lien-jv").length > 11 ? 2 : 1))].textContent, 10) || 1 : 1) : 1;
    const _startTime = Date.now();
    const topicTitleElement = document.querySelector("#bloc-title-forum");
    const topicTitle = topicTitleElement ? topicTitleElement.textContent.trim() : "Titre indisponible";
    const userPageInput = prompt("À partir de quelle page souhaitez-vous commencer l'analyse ?\nLaissez vide pour analyser tout le topic depuis la page 1.");

    if (userPageInput === null) return console.warn("Lancement annulé.");

    _currentPage = userPageInput ? Math.max(1, parseInt(userPageInput, 10) || 1) : 1;

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
      </div>
    </body>
    </html>`;

    const progressBar = window.document.querySelector(".progress-bar .fill");
    const summaryElement = window.document.querySelector("#summary");
    const resultsTable = window.document.querySelector("#results");
    const statusElement = window.document.querySelector("#status");

    pauseAnalysis = () => !_isPaused && (_isPaused = true, updateStatus("Analyse mise en pause.", "orange", true) /*, console.log("Pause demandée.")*/ );
    resumeAnalysis = () => !_isPendingRequest && _isPaused && (_isPaused = false, updateStatus("Analyse en cours...") /*, console.log("Reprise demandée.")*/ , handlePage());
    updateProgress = () => progressBar.style.width = `${Math.min(_currentPage / _maxPages * 100, 100)}%`;
    copyResults = () => {
      try {
        const rows = window.document.querySelectorAll("#results tr");
        let resultsText = (window.document.querySelector("#summary")?.textContent || "Récap non trouvé.") + "\n\n";
        rows.forEach(row => {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 3)
            resultsText += `#${cells[0]?.textContent.split(' ')[0] || "?"} : ${cells[1]?.textContent || "?"} -> ${parseInt(cells[2]?.textContent) || 0} ${parseInt(cells[2]?.textContent) === 1 ? "message" : "messages"}\n`;
        });
        navigator.clipboard.writeText(resultsText.replace(/Pages restantes.*\n|Analyse terminée.\n/, ''))
          .then(() => alert("Résultats copiés dans le presse-papiers !"))
          .catch(err => alert("Échec de la copie des résultats : " + err));
      } catch (e) {
        alert("Erreur : " + e.message);
      }
    };

    handlePage();

    async function handlePage(attempt = 1) {

      _isPaused && await new Promise((resolve) => setTimeout(resolve, 100)) && handlePage(attempt);

      if (analyzedPages.has(_currentPage)) {
        _currentPage++;
        return handlePage();
      }

      updateSummary();
      const path = location.pathname.split("-").map((_, i) => i === 3 ? _currentPage : _).join("-");

      try {
        _isPendingRequest = true;
        const startTime = Date.now();
        const response = await fetch(path);
        const loadTime = Date.now() - startTime;

        loadTime > 2000 && ( /*console.log(`Rate limit détecté (${loadTime} ms). Pause forcée de 7 secondes...`),*/ await new Promise(resolve => setTimeout(resolve, 7000)));

        switch (true) {
          case response.redirected:
            updateResults();
            updateStatus(
              _currentPage > _maxPages ? "Analyse terminée." : "Analyse mise en pause.",
              _currentPage > _maxPages ? "green bold" : "orange", true
            );
            _isPendingRequest = false;
            return;
        }

        const body = await response.text();
        const doc = document.implementation.createHTMLDocument();
        let messagesOnPage = 0;

        doc.documentElement.innerHTML = body;
        doc.querySelectorAll(".bloc-pseudo-msg").forEach(
          (messageElement) => {
            const pseudo = messageElement.innerText.trim();
            _count.set(pseudo, (_count.get(pseudo) || 0) + 1);
            messagesOnPage++;
          }
        );

        _totalMessages += messagesOnPage;
        _totalPages++;
        analyzedPages.add(_currentPage);
        updateProgress();
        updateResults();
        updateSummary();
        _isPendingRequest = false;

        switch (true) {
          case (!_isPaused && _currentPage <= _maxPages):
            _currentPage++;
            _isPendingRequest = false;
            handlePage();
            break;

          case (_currentPage > _maxPages):
            _isPendingRequest = false;
            updateStatus("Analyse terminée.", "green bold", true);
            break;

          default:
            updateStatus("Analyse mise en pause.", "orange", true);
            break;
        }

      } catch (error) {
        console.error("Erreur sur la page " + _currentPage + ":", error);
        switch (true) {
          case (attempt < 50):
            const delay = Math.min(2 ** attempt * 100, 5000);
            setTimeout(() => handlePage(attempt + 1), delay);
            break;

          default:
            console.error("Échec malgré plusieurs tentatives.");
            updateStatus("Analyse interrompue.", "red bold", true);
            _isPendingRequest = false;
            throw new Error("Analyse interrompue.");
            break;
        }
      }
    }

    function updateResults() {
      resultsTable.innerHTML = "";
      let sorted = [..._count.entries()].sort((a, b) => b[1] - a[1]);

      sorted.forEach(([pseudo, count], index) => {
        let row = window.document.createElement("tr");
        let position = index + 1;
        let positionChange = "";
        let previousPosition = _previousPositions.get(pseudo);

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

        _previousPositions.set(pseudo, position);
        row.innerHTML = `<td>${position} ${positionChange}</td><td>${pseudo}</td><td>${count}</td>`;

        if (_currentPage > _maxPages) {
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
      if (_count.has(targetPseudo)) {
        _count.set(targetPseudo, _count.get(targetPseudo) + count);
      } else {
        _count.set(targetPseudo, count);
      }

      _count.delete(sourcePseudo);
      _previousPositions.delete(sourcePseudo);
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

      const sortedPseudos = [..._count.entries()]
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
        const sourcePseudo = fusionSelect.value;
        if (sourcePseudo) {
          fusionPseudos(pseudo, sourcePseudo, _count.get(sourcePseudo));
          overlay.remove();
          updateResults();
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

      const handleEscKey = (e) => {
        if (e.key === "Escape") {
          overlay.remove();
        }
      };
      window.addEventListener("keydown", handleEscKey);
    }

    function updateStatus(text, className = "green", isPaused = false) {
      const spinner = '<span id="spinner"></span>';
      statusElement.innerHTML = `${isPaused || _isPendingRequest ? "" : spinner} ${text}`;
      statusElement.className = `status ${className}`;

      const pauseButton = window.document.querySelector(".controls button:first-child");
      const resumeButton = window.document.querySelector(".controls button:nth-child(2)");

      switch (true) {
        case text.includes("Analyse mise en pause.") && !_isPendingRequest:
          resumeButton.classList.add("active");
          resumeButton.classList.remove("disabled");
          resumeButton.removeAttribute("disabled");
          pauseButton.classList.add("disabled");
          pauseButton.setAttribute("disabled", "true");
          break;

        case text.includes("Analyse mise en pause.") && _isPendingRequest:
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
      const totalTime = Date.now() - _startTime;
      const pagesRemaining = _currentPage <= _maxPages ? _maxPages - _currentPage + 1 : "Aucune";
      const summary =
        `<div class="topic-title bold">Titre du topic : ${topicTitle}</div>\n` +
        "Total de messages analysés : " + _totalMessages + "<br>\n" +
        "Pages restantes : " + pagesRemaining + "<br>\n" +
        "Total de pages analysées : " + _totalPages + "<br>\n" +
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
