    (async function main() {
    const scriptVersion = "v1.0.1";
    let _currentPage = 1;
    let _count = new Map();
    let _totalMessages = 0;
    let _totalPages = 0;
    let _isPaused = false;
    const pagination = document.querySelector(".bloc-liste-num-page");
    const _maxPages = pagination ? (pagination.querySelectorAll("a.xXx.lien-jv").length > 0 ? parseInt(pagination.querySelectorAll("a.xXx.lien-jv")[Math.max(0, pagination.querySelectorAll("a.xXx.lien-jv").length - (pagination.querySelectorAll("a.xXx.lien-jv").length > 11 ? 2 : 1))].textContent, 10) || 1 : 1) : 1;
    const _startTime = Date.now();
    const topicTitleElement = document.querySelector("#bloc-title-forum");
    const topicTitle = topicTitleElement ? topicTitleElement.textContent.trim() : "Titre indisponible";
    const userPageInput = prompt("À partir de quelle page souhaitez-vous commencer l'analyse ?\nLaissez vide pour analyser tout le topic depuis la page 1.");

    if (userPageInput === null || userPageInput.trim() === "") {
    _currentPage = 1;
    } else {
    _currentPage = Math.max(1, parseInt(userPageInput, 10) || 1);
    }
    const uiWindow = window.open("", "_blank", "width=800,height=600");

    uiWindow.document.write(
    `<!DOCTYPE html> 
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Analysis-tool-for-jeuxvideo.com-threads.js ${scriptVersion}</title> 
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #2f3136; 
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
        margin: 5px;
        padding: 10px 20px;
        font-size: 16px;
        min-width: 100px;
        text-align: center;
        background: #7289da;
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        transition: background 0.3s ease;
        }
        button:hover { 
          background: #5b6eae; 
        }
        .progress-bar { 
          background: #40444b; 
          border-radius: 10px; 
          height: 20px; 
          overflow: hidden; 
          position: relative; 
          margin-bottom: 20px; 
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .progress-bar .fill { 
          background: #7289da; 
          height: 100%; 
          width: 0%; 
          border-radius: 10px 0 0 10px;
        }
        .summary { 
          margin-bottom: 20px; 
          background: #36393f; 
          padding: 10px; 
          border-radius: 5px; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
          background: #36393f; 
          border-radius: 5px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        th, td { 
          border: 1px solid #40444b; 
          padding: 8px; 
          text-align: left; 
          color: #dcdfe4; 
        }
        th { 
          background: #2f3136; 
        }
        td { 
          background: #36393f; 
        }
        tr:nth-child(even) td { 
          background: #2c2f33; 
        }
        .green { 
          color: #43b581; 
        }
        .red { 
          color: #f04747; 
        }
        .orange { 
          color: #faa61a; 
        }
        .bold { 
          font-weight: bold; 
        }
        .status {
        margin-top: 10px;
        padding: 10px;
        border-radius: 5px;
        background: #36393f;
        text-align: center;
        font-size: 18px;
        min-width: 200px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        }
        #spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #fff;
        border-top: 2px solid #43b581;
        border-radius: 50%;
        animation: spin 1s linear infinite;
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
          <button onclick="window.opener.pauseAnalysis()">Pause</button>
          <button onclick="window.opener.resumeAnalysis()">Reprendre</button>
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
      <script>
        function copyResults() {
          const summary = document.querySelector("#summary").textContent;
          let resultsText = summary + "\\n\\n";
          let rows = document.querySelectorAll("#results tr");
          rows.forEach((row) => {
            let cells = row.querySelectorAll("td");
            resultsText += \`#\${cells[0].textContent.split(' ')[0]} : \${cells[1].textContent} -> \${cells[2].textContent} messages\\n\` ;
          });
          resultsText = resultsText.replace(/Pages restantes.*\\n/, '');
          resultsText = resultsText.replace(/Analyse terminée.\\n/, '');
          navigator.clipboard.writeText(resultsText)
            .then(() => alert("Résultats copiés dans le presse-papiers !"))
            .catch(err => alert("Échec de la copie des résultats : " + err));
        }
      </script>
    </body>
  </html>`
  );

    const progressBar = uiWindow.document.querySelector(".progress-bar .fill");
    const summaryElement = uiWindow.document.querySelector("#summary");
    const resultsTable = uiWindow.document.querySelector("#results");
    const statusElement = uiWindow.document.querySelector("#status");

    window.pauseAnalysis = function () {
        _isPaused = true;
        updateStatus("Analyse mise en pause.", "orange", true);
        console.log("Pause demandée.");
    };

    window.resumeAnalysis = function () {
        if (!_isPaused) return;
        _isPaused = false;
        updateStatus("Analyse en cours...");
        console.log("Reprise demandée.");
        handlePage();
    };

    async function handlePage(attempt = 1) {
        if (_isPaused) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return handlePage(attempt);
        }

        updateSummary();
        const splitPath = location.pathname.split("-");
        splitPath[3] = _currentPage;
        const path = splitPath.join("-");

        try {
            const startTime = Date.now();
            const response = await fetch(path);
            const loadTime = Date.now() - startTime;

            if (loadTime > 2000) {
                console.log(`Rate limit détecté (${loadTime} ms). Pause de 10 secondes...`);
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }

            if (response.redirected) {
                updateResults();
                updateStatus(
                    _currentPage > _maxPages ? "Analyse terminée." : "Analyse mise en pause.",
                    _currentPage > _maxPages ? "green bold" : "orange", true
                );
                return;
            }

            const body = await response.text();
            const doc = document.implementation.createHTMLDocument();
            doc.documentElement.innerHTML = body;
            let messagesOnPage = 0;
            doc.querySelectorAll(".bloc-pseudo-msg").forEach(
                (messageElement) => {
                    const pseudo = messageElement.innerText.trim();
                    _count.set(pseudo, (_count.get(pseudo) || 0) + 1);
                    messagesOnPage++;
                }
            );

            _totalMessages += messagesOnPage;
            _totalPages++;
            updateProgress();
            updateResults();

            if (!_isPaused && _currentPage <= _maxPages) {
                _currentPage++;
                handlePage();
            } else {
                updateStatus(
                    _currentPage > _maxPages ? "Analyse terminée." : "Analyse mise en pause.",
                    _currentPage > _maxPages ? "green bold" : "orange", true
                );
            }
        } catch (error) {
            console.error("Erreur sur la page " + _currentPage + ":", error);
            if (attempt < 50) {
                const delay = Math.min(2 ** attempt * 100, 5000);
                setTimeout(() => handlePage(attempt + 1), delay);
            } else {
                console.error("Échec malgré plusieurs tentatives.");
                updateStatus("Analyse interrompue.", "red bold", true);
            }
        }
    }

    handlePage();

    const _previousPositions = new Map();

    function updateResults() {
        resultsTable.innerHTML = "";
        let sorted = [..._count.entries()].sort((a, b) => b[1] - a[1]);

        sorted.forEach(([pseudo, count], index) => {
            let row = uiWindow.document.createElement("tr");
            let position = index + 1;
            let positionChange = "";
            let previousPosition = _previousPositions.get(pseudo);

            switch (true) {
                case typeof previousPosition !== "undefined" && position < previousPosition:
                    positionChange = `<span class="green">↑ ${
                        previousPosition - position
                    }</span>`;
                    break;
                case typeof previousPosition !== "undefined" && position > previousPosition:
                    positionChange = `<span class="red">↓ ${
                        position - previousPosition
                    }</span>`;
                    break;
                default:
                    positionChange = "";
            }

            _previousPositions.set(pseudo, position);
            row.innerHTML = `<td>${position} ${positionChange}</td><td>${pseudo}</td><td>${count}</td>`;
            resultsTable.appendChild(row);
        });
    }

    function updateStatus(text, className = "green", isPaused = false) {
        const spinner = '<span id="spinner"></span>';
        statusElement.innerHTML = `${isPaused ? "" : spinner} ${text}`;
        statusElement.className = `status ${className}`;
    }

    function updateProgress() {
        const progress = Math.min((_currentPage / _maxPages) * 100, 100);
        progressBar.style.width = `${progress}%`;
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
})();
