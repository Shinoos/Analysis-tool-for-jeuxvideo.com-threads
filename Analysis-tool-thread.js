(async function main() {
    const scriptVersion = "v1.6.2";
    checkScriptVersion();
    let currentPage = 1;
    let messagesCount = new Map();
    let totalMessages = 0;
    let totalPages = 0;
    let isPaused = false;
    let isPendingRequest = false;
    let pausedSummary = "";
    const allMessages = [];
    const analyzedPages = new Set();
    const previousPositions = new Map();
    const userStats = new Map();
    const maxPages = (() => {
        let max = 1;
        for (const a of document.querySelectorAll(".bloc-liste-num-page a.lien-jv")) {
            const n = parseInt(a.textContent, 10);
            if (n > max) max = n;
        }
        const pNum = parseInt(location.pathname.split("-")[3], 10) || 1;
        return Math.max(max, pNum);
    })();
    const startTime = Date.now();
    const topicTitleElement = document.querySelector("#bloc-title-forum");
    const topicTitle = topicTitleElement ? topicTitleElement.textContent.trim() : "Titre indisponible";

    function userPageInput() {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
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
            transform: scale(0.99);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            position: relative;
        `;

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '×';
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
            });

            const title = document.createElement('h2');
            title.textContent = 'Sélection des pages à analyser';
            title.style.cssText = `
            color: #6064f4;
            margin-bottom: 20px;
            font-size: 20px;
        `;

            const description = document.createElement('p');
            const pageText = maxPages === 1 ? '1 page' : `${maxPages} pages`;
            description.innerHTML = `Ce topic contient ${pageText}.<br><br>Sélectionnez la page de début et la page de fin.`;
            description.style.cssText = `
            color: #b9bbbe;
            margin-bottom: 20px;
            line-height: 1.5;
        `;

            const startInput = document.createElement('input');
            startInput.type = 'number';
            startInput.min = 1;
            startInput.max = maxPages;
            startInput.value = 1;
            startInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid #40444b;
            border-radius: 8px;
            background: #1e1f22;
            color: #ffffff;
            font-size: 16px;
            text-align: center;
        `;

            const endInput = document.createElement('input');
            endInput.type = 'number';
            endInput.min = 1;
            endInput.max = maxPages;
            endInput.value = maxPages;
            endInput.style.cssText = `
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

            const updateStartButtonState = () => {
                const startValue = parseInt(startInput.value, 10);
                const endValue = parseInt(endInput.value, 10);
                let isValid = true;
                if (isNaN(startValue) || startValue < 1 || startValue > maxPages) {
                    isValid = false;
                }
                if (isNaN(endValue) || endValue < 1 || endValue > maxPages) {
                    isValid = false;
                }
                if (startValue > endValue) {
                    isValid = false;
                }
                startButton.disabled = !isValid;
                if (!isValid) {
                    startButton.style.background = "#888888";
                    startButton.style.cursor = "not-allowed";
                } else {
                    startButton.style.background = "#6064f4";
                    startButton.style.cursor = "pointer";
                }
            };

            startInput.addEventListener('input', updateStartButtonState);
            endInput.addEventListener('input', updateStartButtonState);
            updateStartButtonState();

            startButton.addEventListener('mouseenter', () => {
                if (!startButton.disabled) {
                    startButton.style.background = '#4346ab';
                    startButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
                }
            });

            startButton.addEventListener('mouseleave', () => {
                if (!startButton.disabled) {
                    startButton.style.background = '#6064f4';
                    startButton.style.boxShadow = 'none';
                    startButton.style.transform = 'scale(1)';
                }
            });

            startButton.addEventListener('mousedown', () => {
                if (!startButton.disabled) {
                    startButton.style.transform = 'scale(0.98)';
                    startButton.style.background = '#4346ab';
                    startButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                }
            });

            startButton.addEventListener('mouseup', () => {
                if (!startButton.disabled) {
                    startButton.style.transform = 'scale(1)';
                    startButton.style.background = '#6064f4';
                    startButton.style.boxShadow = 'none';
                }
            });

            startButton.addEventListener('click', () => {
                const startPage = Math.max(1, Math.min(parseInt(startInput.value, 10) || 1, maxPages));
                const endPage = Math.max(startPage, Math.min(parseInt(endInput.value, 10) || maxPages, maxPages));
                overlay.remove();
                resolve({
                    startPage,
                    endPage
                });
            });

            modal.appendChild(closeButton);
            modal.appendChild(title);
            modal.appendChild(description);
            modal.appendChild(document.createTextNode('Page de début :'));
            modal.appendChild(startInput);
            modal.appendChild(document.createTextNode('Page de fin :'));
            modal.appendChild(endInput);
            modal.appendChild(startButton);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            requestAnimationFrame(() => {
                modal.style.transform = 'scale(1)';
                modal.style.opacity = '1';
            });

            startInput.focus();

            window.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const startPage = Math.max(1, Math.min(parseInt(startInput.value, 10) || 1, maxPages));
                    const endPage = Math.max(startPage, Math.min(parseInt(endInput.value, 10) || maxPages, maxPages));
                    overlay.remove();
                    resolve({
                        startPage,
                        endPage
                    });
                }
                if (event.key === 'Escape') {
                    overlay.remove();
                }
            });
        });
    }

    const {
        startPage,
        endPage
    } = await userPageInput();
    currentPage = startPage;
    const analysisMaxPages = endPage;

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
        .version {
        position: fixed;
        bottom: 10px;
        left: 10px;
        color: #b9bbbe;
        font-size: 12px;
        font-family: Arial, sans-serif;
        opacity: 0.7;
        z-index: 1000;
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
        <button onclick="showTimelineChart()">Timeline</button>
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
        .action-button {
        font-family: Arial, sans-serif;
        font-weight: bold;
        padding: 10px 20px;
        font-size: 16px;
        text-align: center;
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .action-button:active {
        transform: scale(0.97);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        }
        .blue-button {
        background-color: #6064f4;
        }
        .blue-button:hover {
        background-color: #4346ab;
        }
        .blue-button:active {
        background-color: #4346ab;
        }
        .orange-button {
        background-color: #d39100;
        }
        .orange-button:hover {
        background-color: #a87200;
        }
        .orange-button:active {
        background-color: #a87200;
        }
        .red-button {
        background-color: #ff4d4d;
        }
        .red-button:hover {
            background-color: #cc3f3f;
        }
        .red-button:active {
        background-color: #cc3f3f;
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
        .progress-percentage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffffff;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        z-index: 1;
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
        .stats-container {
        margin-top: 15px;
        padding: 15px;
        background: #28292d;
        border-radius: 8px;
        }
        .stats-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        }
        .stats-label {
        color: #b9bbbe;
        }
        .stats-value {
        font-weight: bold;
        }
        .settings-icon {
        position: fixed;
        bottom: 10px;
        left: 50px;
        font-size: 24px;
        color: #b9bbbe;
        cursor: pointer;
        z-index: 1000;
        transition: color 0.2s ease;
        }
        .settings-icon:hover {
        color: #ffffff;
        }
        .settings-menu {
        position: fixed;
        bottom: 50px;
        left: 50px;
        background: #2c2f33;
        border: 1px solid #40444b;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: none;
        color: #ffffff;
        font-family: Arial, sans-serif;
        }
        .settings-menu.show {
        display: block;
        }
        .settings-menu label {
        display: flex;
        align-items: center;
        font-size: 14px;
        }
        .settings-menu input[type="checkbox"] {
        margin-right: 10px;
        }
        .fusion-option-similar {
        background-color: #6064f4;
        color: #ffffff;
        border-radius: 4px;
        padding: 5px 10px;
        opacity: 1;
        }
        select.fusion-select {
        width: 100%;
        height: 200px;
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #40444b;
        border-radius: 8px;
        background-color: #1e1f22;
        color: #ffffff;
        font-size: 14px;
        cursor: pointer;
        outline: none;
        scrollbar-width: thin;
        scrollbar-color: #6064f4 #2c2f33;
        }
        select.fusion-select::-webkit-scrollbar {
        width: 8px;
        }
        select.fusion-select::-webkit-scrollbar-track {
        background: #2c2f33;
        border-radius: 4px;
        }
        select.fusion-select::-webkit-scrollbar-thumb {
        background: #6064f4;
        border-radius: 4px;
        }
        select.fusion-select option {
        background-color: #1e1f22;
        color: #ffffff;
        padding: 8px 10px;
        border-radius: 4px;
        margin: 2px 0;
        transition: background-color 0.2s ease, color 0.2s ease;
        }
        select.fusion-select option:hover {
        background-color: #2c2f33;
        }
        select.fusion-select option:checked {
        background-color: #3b4048;
        color: #ffffff;
        border-left: 4px solid #7289da;
        padding-left: 30px;
        position: relative;
        font-weight: normal;
        }
        select.fusion-select option:checked::before {
        content: "✔";
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #7289da;
        font-size: 12px;
        }
        select.fusion-select option.fusion-option-similar:checked {
        background-color: #3b4048;
        color: #ffffff;
        border-left: 4px solid #7289da;
        padding-left: 30px;
        opacity: 1;
        }
        select.fusion-select option.fusion-option-similar:checked::before {
        content: "✔";
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #7289da;
        font-size: 12px;
        }
        .similarity-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        }
        .similarity-label {
        color: #b9bbbe;
        font-size: 14px;
        }
        .similarity-value {
        color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        min-width: 40px;
        text-align: right;
        }
        input[type="range"] {
        width: 100%;
        -webkit-appearance: none;
        background: #40444b;
        border-radius: 5px;
        height: 8px;
        outline: none;
        cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #7289da;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        }
        input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #7289da;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        }
        .fusion-option-similar {
        border: 1px solid #7289da;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="controls">
        <button onclick="pauseAnalysis()">Pause</button>
        <button onclick="resumeAnalysis()" class="disabled" disabled>Reprendre</button>
        <button onclick="copyResults()">Copier les résultats</button>
        <button onclick="showTimelineChart()">Timeline</button>
        </div>
        <div id="search-bar" class="search-bar" style="display:none; text-align:center; margin-bottom:15px;">
          <input id="search-input" type="text" placeholder="Rechercher un mot, lien, etc…" 
                 style="width:60%; padding:8px; border-radius:4px; border:1px solid #40444b; background:#1e1f22; color:#fff;">
        <button id="search-button" class="action-button blue-button"
                style="margin-left:12px; font-size:12px; padding:11px;">
          Actualiser
        </button>
        </div>
        <div id="search-results" style="display:none; margin-bottom:15px; max-height:500px; overflow-y:auto; border:1px solid #40444b; border-radius:4px; background:#1e1f22; padding:10px;">
        <div style="color:#b9bbbe; text-align:center;">
        Veuillez saisir une recherche.
        </div>
        </div>
        <div class="progress-bar">
        <div class="fill"></div>
        <span class="progress-percentage">0%</span>
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
        <div class="version"><a href="https://github.com/Shinoos/Analysis-tool-for-jeuxvideo.com-threads/commits/main/" target="_blank">${scriptVersion}</a></div>
    </div>
    <div class="settings-icon" onclick="toggleSettingsMenu()">⚙️</div>
        <div class="settings-menu" id="settings-menu">
        <label>
        <input type="checkbox" id="copy-all-user-data">
        Copier les données supplémentaires
        </label>
        <button id="fusion-auto-button" class="action-button blue-button" style="width: auto; padding: 5px 10px; font-size: 13px; margin-top: 10px;">
        Fusionner tous les secondaires potentiels
        </button>
        <br>
        <button id="search-topic-button" class="action-button blue-button" 
        style="width: auto; padding: 5px 10px; font-size: 13px;">
        Rechercher dans le topic
        </button>
        </div>
    </body>
    </html>`;

    const progressBar = window.document.querySelector(".progress-bar .fill");
    const summaryElement = window.document.querySelector("#summary");
    const resultsTable = window.document.querySelector("#results");
    const statusElement = window.document.querySelector("#status");
    const notificationContainer = window.document.querySelector(".notification-container");

    function toggleSettingsMenu() {
        const settingsMenu = document.querySelector("#settings-menu");
        settingsMenu.classList.toggle("show");
    }
    window.toggleSettingsMenu = toggleSettingsMenu;

    function toggleSearchBar() {
        const bar = document.getElementById('search-bar');
        const results = document.getElementById('search-results');
        const header = document.getElementById('search-header');
        const input = document.getElementById('search-input');
        const isHidden = bar.style.display === 'none';

        bar.style.display = isHidden ? 'block' : 'none';
        results.style.display = isHidden ? 'block' : 'none';

        if (!isHidden) {
            if (header) {
                header.style.display = 'none';
            }
        } else {
            if (header && input.value.trim()) {
                header.style.display = 'flex';
                pSearch();
            }
        }
    }

    window.toggleSearchBar = toggleSearchBar;

    function extractSearch(text, searchInput) {
        const lowerText = text.toLowerCase();
        const lowerSearchInput = searchInput.toLowerCase();
        const i = lowerText.indexOf(lowerSearchInput);

        if (i < 0) {
            return text.slice(0, 100) + (text.length > 100 ? '…' : '');
        }

        const start = Math.max(0, i - 45);
        const end = Math.min(text.length, i + searchInput.length + 45);
        let excerpt = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');

        const eInput = searchInput.replace(/[*+?^${}()|[\]\\]/g, '\\$&');
        const highlightReg = new RegExp(eInput, 'gi');
        return excerpt.replace(highlightReg, match => `<mark>${match}</mark>`);
    }

    async function pSearch(page = 1) {
        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');
        const query = input.value.trim().toLowerCase();

        results.innerHTML = '';
        results.style.position = 'relative';

        const existingHeader = document.getElementById('search-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        if (!query) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center;';
            empty.textContent = 'Aucune recherche saisie.';
            results.appendChild(empty);
            return;
        }

        const matches = allMessages.filter(m => m.text.toLowerCase().includes(query));
        const totalCount = matches.length;

        const header = document.createElement('div');
        header.id = 'search-header';
        Object.assign(header.style, {
            background: '#1e1f22',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 10px',
            borderBottom: '1px solid #40444b',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px'
        });

        const counter = document.createElement('span');
        counter.style.cssText = 'color:#b9bbbe; font-size:13px;';
        counter.textContent = `${totalCount} message${totalCount>1?'s':''} trouvé${totalCount>1?'s':''}`;
        header.appendChild(counter);

        const perPage = 20;
        const totalPages = Math.ceil(totalCount / perPage) || 1;
        const current = Math.min(Math.max(page, 1), totalPages);
        counter.textContent = `${totalCount} message${totalCount>1?'s':''} trouvé${totalCount>1?'s':''} (${current}/${totalPages})`;

        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex; align-items:center;';

        const prev = document.createElement('span');
        prev.textContent = 'Précédent';
        Object.assign(prev.style, {
            color: '#6064f4',
            fontSize: '12px',
            cursor: current > 1 ? 'pointer' : 'default',
            opacity: current > 1 ? '1' : '0.5',
            marginRight: '8px',
            userSelect: 'none'
        });
        if (current > 1) prev.addEventListener('click', () => {
            pSearch(current - 1);
            document.getElementById('search-results').scrollTop = 0;
        });
        nav.appendChild(prev);

        const next = document.createElement('span');
        next.textContent = 'Suivant';
        Object.assign(next.style, {
            color: '#6064f4',
            fontSize: '12px',
            cursor: current < totalPages ? 'pointer' : 'default',
            opacity: current < totalPages ? '1' : '0.5',
            userSelect: 'none'
        });
        if (current < totalPages) next.addEventListener('click', () => {
            pSearch(current + 1);
            document.getElementById('search-results').scrollTop = 0;
        });
        nav.appendChild(next);

        header.appendChild(nav);

        results.parentNode.insertBefore(header, results);

        results.style.borderTop = 'none';
        results.style.borderTopLeftRadius = '0';
        results.style.borderTopRightRadius = '0';

        if (!query || totalCount === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#ffa500; text-align:center; margin-top:16px;';
            empty.textContent = `Aucun message trouvé pour « ${input.value} »`;
            results.appendChild(empty);
            return;
        }

        const startIdx = (current - 1) * perPage;
        const pageItems = matches.slice(startIdx, startIdx + perPage);

        pageItems.forEach(({
            pseudo,
            avatar,
            link,
            text
        }) => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; align-items:flex-start; margin:10px 0;';
            const excerpt = extractSearch(text, input.value.trim());
            item.innerHTML = `
                <img src="${avatar}" alt="${pseudo}"
                    style="width:32px; height:32px; border-radius:50%; margin-right:8px;">
                <div style="flex:1">
                <span style="color:#6064f4; font-weight:bold">${pseudo}</span>
                    <p style="margin:4px 0;color:#fff; font-size:14px; line-height:1.4">
                      <a href="${link||'#'}" target="_blank" style="color:#fff; display:block">
                        ${excerpt}
                      </a>
                    </p>
                </div>`;

            results.appendChild(item);
        });
    }

    document.getElementById('search-button').addEventListener('click', e => {
        e.preventDefault();
        setTimeout(() => pSearch(), 0);
    });
    document.getElementById('search-input').addEventListener('keyup', e => e.key === 'Enter' && pSearch());

    document.addEventListener('click', (event) => {
        const settingsMenu = document.querySelector('#settings-menu');
        const settingsIcon = document.querySelector('.settings-icon');

        if (!settingsIcon.contains(event.target) && !settingsMenu.contains(event.target)) {
            if (settingsMenu.classList.contains('show')) {
                settingsMenu.classList.remove('show');
            }
        }
    });

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

    pauseAnalysis = () => !isPaused && (isPaused = true, updateStatus("Analyse mise en pause.", "orange", true));
    resumeAnalysis = () => !isPendingRequest && isPaused && (isPaused = false, updateStatus("Analyse en cours..."), handlePage());
    updateProgress = () => {
        const progress = ((currentPage - startPage) / (analysisMaxPages - startPage + 1) * 100).toFixed(0);
        progressBar.style.width = `${progress}%`;
        const elapsedTime = (Date.now() - startTime) / 1000;
        let timeRemainingText = '';

        if (currentPage > startPage) {
            const pagesProcessed = currentPage - startPage;
            const averageTimePerPage = elapsedTime / pagesProcessed;
            const pagesRemaining = analysisMaxPages - currentPage + 1;
            const timeRemaining = pagesRemaining * averageTimePerPage;

            if (timeRemaining > 0) {
                if (timeRemaining < 60) {
                    timeRemainingText = `durée restante estimée : ${Math.round(timeRemaining)}s`;
                } else {
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = Math.round(timeRemaining % 60);
                    timeRemainingText = `durée restante estimée : ${minutes}m ${seconds}s`;
                }
            } else {
                timeRemainingText = '';
            }
        } else {
            timeRemainingText = '...';
        }
        document.querySelector(".progress-percentage").textContent = `${progress}% ${timeRemainingText}`;
    };

    copyResults = () => {
        try {
            const rows = window.document.querySelectorAll("#results tr");
            const copyAllUserData = document.querySelector("#copy-all-user-data").checked;
            let resultsText = window.document.querySelector("#summary").textContent + "\n\n";

            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3) {
                    const position = cells[0]?.textContent.split(' ')[0] || "?";
                    const pseudo = cells[1]?.textContent || "?";
                    const messageCount = parseInt(cells[2]?.textContent) || 0;
                    resultsText += `#${position} : ${pseudo} -> ${messageCount} ${messageCount === 1 ? "message" : "messages"}\n`;

                    if (copyAllUserData) {
                        const stats = userStats.get(pseudo) || {
                            totalChars: 0,
                            messageCount: 0,
                            averageChars: 0,
                            stickerCount: 0,
                            smileyCount: 0,
                            messageDates: new Map()
                        };

                        const messagesByDay = new Map();
                        for (const [dateStr, count] of stats.messageDates) {
                            const dayPart = dateStr.split(' à ')[0].trim();
                            messagesByDay.set(dayPart, (messagesByDay.get(dayPart) || 0) + count);
                        }

                        let mostActiveDay = 'Aucun';
                        let maxMessages = 0;
                        for (const [date, count] of messagesByDay) {
                            if (count > maxMessages) {
                                maxMessages = count;
                                mostActiveDay = date;
                            }
                        }

                        const activeDays = messagesByDay.size;
                        const messagePerActiveDay = activeDays > 0 ? Math.round(stats.messageCount / activeDays) : 0;

                        let averageInterval = "N/A";
                        if (stats.messageCount > 1) {
                            const monthMap = {
                                'janvier': 0,
                                'février': 1,
                                'mars': 2,
                                'avril': 3,
                                'mai': 4,
                                'juin': 5,
                                'juillet': 6,
                                'août': 7,
                                'septembre': 8,
                                'octobre': 9,
                                'novembre': 10,
                                'décembre': 11
                            };

                            let allTimestamps = [];
                            for (const [dateStr, count] of stats.messageDates.entries()) {
                                const parts = dateStr.trim().split(/\s+/);
                                if (parts.length < 3) continue;
                                const day = parseInt(parts[0], 10);
                                const month = monthMap[parts[1].toLowerCase()];
                                const year = parseInt(parts[2], 10);
                                let hour = 0,
                                    minute = 0,
                                    second = 0;
                                if (parts.length >= 5) {
                                    const timeParts = parts[4].split(":");
                                    hour = parseInt(timeParts[0], 10) || 0;
                                    minute = parseInt(timeParts[1], 10) || 0;
                                    second = parseInt(timeParts[2], 10) || 0;
                                }
                                const timestamp = new Date(year, month, day, hour, minute, second).getTime();
                                for (let i = 0; i < count; i++) {
                                    allTimestamps.push(timestamp);
                                }
                            }

                            if (allTimestamps.length > 1) {
                                allTimestamps.sort((a, b) => a - b);
                                let totalDiff = 0;
                                for (let i = 1; i < allTimestamps.length; i++) {
                                    totalDiff += allTimestamps[i] - allTimestamps[i - 1];
                                }
                                const avgDiff = totalDiff / (allTimestamps.length - 1);

                                let remaining = Math.floor(avgDiff / 1000);
                                const days = Math.floor(remaining / 86400);
                                remaining %= 86400;
                                const hours = Math.floor(remaining / 3600);
                                remaining %= 3600;
                                const minutes = Math.floor(remaining / 60);
                                const seconds = remaining % 60;

                                averageInterval = (
                                    (days ? days + "j " : "") +
                                    (hours ? hours + "h " : "") +
                                    (minutes ? minutes + "m " : "") +
                                    (seconds ? seconds + "s" : "")
                                ).trim() || "0s";
                            }
                        }

                        resultsText += `Moy. caractères/message: ${stats.averageChars || 0}\n`;
                        resultsText += `Moy. de messages par jour: ${messagePerActiveDay}\n`;
                        resultsText += `Temps moy. entre deux messages: ${averageInterval}\n`;
                        resultsText += `Stickers postés: ${stats.stickerCount || 0}\n`;
                        resultsText += `Smileys postés: ${stats.smileyCount || 0}\n`;
                        resultsText += `Jour le plus actif: ${mostActiveDay.split(' à ')[0]} (${maxMessages} messages)\n\n`;
                    }
                }
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
        for (let i = 0; i < 25 && currentPage <= analysisMaxPages; i++) {
            if (!analyzedPages.has(currentPage)) {
                pagesToProcess.push(currentPage);
            }
            currentPage++;
        }

        if (pagesToProcess.length === 0) {
            if (currentPage > analysisMaxPages) {
                updateStatus("Analyse terminée.", "green bold", true);
                showNotification("Analyse terminée ! Vous pouvez désormais interagir avec les pseudos en cliquant dessus.", "info", 10000);
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

                            const messageContainer = messageElement.closest(".conteneur-message");
                            if (messageContainer) {
                                const dateElement = messageContainer.querySelector(".bloc-date-msg");
                                let messageDate = dateElement ? dateElement.textContent.trim() : null;

                                if (!userStats.has(pseudo)) {
                                    userStats.set(pseudo, {
                                        totalChars: 0,
                                        messageCount: 0,
                                        averageChars: 0,
                                        stickerCount: 0,
                                        smileyCount: 0,
                                        messageDates: new Map()
                                    });
                                }
                                const stats = userStats.get(pseudo);
                                stats.messageCount++;
                                if (messageDate) {
                                    stats.messageDates.set(messageDate, (stats.messageDates.get(messageDate) || 0) + 1);
                                }

                                const messageContent = messageContainer.querySelector(".txt-msg");
                                if (messageContent) {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = messageContent.innerHTML;
                                    tempDiv.querySelectorAll('blockquote').forEach(bq => bq.remove());

                                    const stickerRegex = /https?:\/\/(?:www\.)?(noelshack\.com|image\.noelshack\.com)\/.*\.(png|jpe?g|gif)$/i;
                                    const smileyRegex = /https?:\/\/(?:www\.)?(?:jeuxvideo\.com|image.jeuxvideo\.com)\/smileys_img\/.*\.(png|jpe?g|gif)$/i;
                                    let stickersFound = 0;
                                    let smileysFound = 0;

                                    tempDiv.querySelectorAll('img').forEach(img => {
                                        const src = img.getAttribute('src');
                                        if (src && (stickerRegex.test(src) || src.includes("image.jeuxvideo.com/stickers"))) {
                                            stickersFound++;
                                        } else if (smileyRegex.test(src) || src.includes("smileys_img")) {
                                            smileysFound++;
                                        }
                                    });

                                    stats.stickerCount += stickersFound;
                                    stats.smileyCount += smileysFound;

                                    tempDiv.querySelectorAll('a').forEach(a => a.remove());
                                    const textOnly = tempDiv.textContent.trim();
                                    stats.totalChars += textOnly.length;
                                    stats.averageChars = Math.round(stats.totalChars / stats.messageCount);

                                    const avatarElem = messageContainer.querySelector(".bloc-avatar-msg img");
                                    const avatarUrl = avatarElem ? avatarElem.getAttribute("data-src") || avatarElem.getAttribute("data-original") || avatarElem.src : "";

                                    const messageBlock = messageElement.closest(".bloc-message-forum");
                                    const messageId = messageBlock ? messageBlock.getAttribute("data-id") : null;
                                    let messageLink = messageId ? `https://www.jeuxvideo.com/forums/message/${messageId}` : (() => {
                                        const linkEl = messageContainer.querySelector(".bloc-date-msg a.lien-jv");
                                        return (linkEl && linkEl.href.includes('/forums/message/')) ? new URL(linkEl.href, window.location.origin).href : "";
                                    })();

                                    allMessages.push({
                                        pseudo: pseudo,
                                        avatar: avatarUrl,
                                        link: messageLink,
                                        text: textOnly
                                    });
                                }
                            }
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
                    // console.error(`Erreur sur la page ${page}: ${result.value.error}`);
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

            if (allRedirected && currentPage > analysisMaxPages) {
                updateStatus("Analyse terminée.", "green bold", true);
                showNotification("Analyse terminée ! Vous pouvez désormais interagir avec les pseudos en cliquant dessus.", "info", 10000);
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
                updateStatus("Analyse interrompue en raison d'erreurs répétées.", "red", true);
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
                updateStatus("Analyse interrompue en raison d'erreurs répétées.", "red", true);
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

            if (currentPage <= analysisMaxPages && !isPaused) {
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
            }

            previousPositions.set(pseudo, position);
            row.innerHTML = `<td>${position} ${positionChange}</td><td>${pseudo}</td><td>${count} <span style="color: #b9bbbe; font-size: 0.72em;">(${percentage}%)</span></td>`;

            if (currentPage > analysisMaxPages || isPaused) {
                row.addEventListener("click", (e) => {
                    if (e.target.tagName !== 'TD') return;
                    showUserActionMenu(pseudo, count, row);
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

    function calculateSimilarity(str1, str2) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();

        if (str1 === str2) return 1;

        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return 1 - distance / maxLen;
    }

    function fusionPseudos(targetPseudo, sourcePseudo, count) {
        messagesCount.set(targetPseudo, (messagesCount.get(targetPseudo) || 0) + count);
        messagesCount.delete(sourcePseudo);
        previousPositions.delete(sourcePseudo);

        if (userStats.has(sourcePseudo)) {
            const sourceStats = userStats.get(sourcePseudo);
            if (!userStats.has(targetPseudo)) {
                userStats.set(targetPseudo, {
                    totalChars: 0,
                    messageCount: 0,
                    averageChars: 0,
                    stickerCount: 0,
                    smileyCount: 0,
                    messageDates: new Map()
                });
            }
            const targetStats = userStats.get(targetPseudo);
            targetStats.totalChars += sourceStats.totalChars;
            targetStats.messageCount += sourceStats.messageCount;
            targetStats.averageChars = Math.round(targetStats.totalChars / targetStats.messageCount);
            targetStats.stickerCount = (targetStats.stickerCount || 0) + (sourceStats.stickerCount || 0);
            targetStats.smileyCount = (targetStats.smileyCount || 0) + (sourceStats.smileyCount || 0);

            for (const [date, count] of sourceStats.messageDates) {
                targetStats.messageDates.set(date, (targetStats.messageDates.get(date) || 0) + count);
            }

            userStats.delete(sourcePseudo);
        }
    }

    function showUserActionMenu(pseudo, count, row) {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "99",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });

        const menu = document.createElement("div");
        Object.assign(menu.style, {
            backgroundColor: "#2c2f33",
            border: "1px solid #40444b",
            borderRadius: "12px",
            padding: "25px",
            width: "30vw",
            maxWidth: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: "#ffffff",
            position: "relative",
            transform: "scale(0.9)",
            opacity: "0",
            transition: "transform 0.3s ease, opacity 0.3s ease"
        });

        const titleContainer = document.createElement("div");
        Object.assign(titleContainer.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "15px",
        });

        const title = document.createElement("h3");
        title.textContent = `${pseudo}`;
        Object.assign(title.style, {
            fontSize: "18px",
            textAlign: "center",
            color: "#6064f4",
            fontWeight: "600",
            margin: "0 10px 0 0",
        });

        const chartButton = document.createElement("button");
        chartButton.textContent = "Graphique";
        chartButton.classList.add("action-button", "blue-button");
        Object.assign(chartButton.style, {
            padding: "4px 8px",
            fontSize: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            lineHeight: "1.2",
            outline: "none",
        });
        chartButton.addEventListener("click", () => showActivityChart(pseudo));

        titleContainer.appendChild(title);
        titleContainer.appendChild(chartButton);
        menu.appendChild(titleContainer);

        const actionButtons = document.createElement("div");
        Object.assign(actionButtons.style, {
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
        });

        const fusionButton = document.createElement("button");
        fusionButton.textContent = "Fusionner";
        fusionButton.classList.add("action-button", "orange-button");
        Object.assign(fusionButton.style, {
            flex: "1",
            padding: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
        });
        fusionButton.addEventListener("click", () => {
            showFusionMenu(pseudo, count, contentContainer);
        });

        actionButtons.appendChild(fusionButton);
        menu.appendChild(actionButtons);

        const contentContainer = document.createElement("div");
        contentContainer.style.margin = "20px 0";
        showUserStats(pseudo, contentContainer);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Fermer";
        cancelButton.classList.add("action-button", "red-button");
        Object.assign(cancelButton.style, {
            width: "98%",
            padding: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            //marginTop: "10px",
            fontSize: "16px",
        });
        cancelButton.addEventListener("click", () => overlay.remove());

        menu.appendChild(contentContainer);
        menu.appendChild(cancelButton);

        overlay.appendChild(menu);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            menu.style.transform = "scale(1)";
            menu.style.opacity = "1";
        });

        window.addEventListener("keydown", (e) => e.key === "Escape" && overlay.remove());
    }

    function showUserStats(pseudo, container) {
        container.innerHTML = "";

        const stats = userStats.get(pseudo) || {
            totalChars: 0,
            messageCount: 0,
            averageChars: 0,
            stickerCount: 0,
            smileyCount: 0,
            messageDates: new Map()
        };

        const messagesByDay = new Map();
        for (const [dateStr, count] of stats.messageDates) {
            const dayPart = dateStr.split(' à ')[0].trim();
            messagesByDay.set(dayPart, (messagesByDay.get(dayPart) || 0) + count);
        }

        let mostActiveDay = 'Aucun';
        let maxMessages = 0;
        for (const [date, count] of messagesByDay) {
            if (count > maxMessages) {
                maxMessages = count;
                mostActiveDay = date;
            }
        }

        const messageCount = stats.messageCount || 0;
        const averageChars = stats.averageChars || 0;
        const activeDays = messagesByDay.size;
        const stickerCount = stats.stickerCount || 0;
        const smileyCount = stats.smileyCount || 0;
        const messagePerActiveDay = activeDays > 0 ? Math.round(stats.messageCount / activeDays) : 0;

        let averageInterval = "N/A";
        if (stats.messageCount > 1) {
            const monthMap = {
                'janvier': 0,
                'février': 1,
                'mars': 2,
                'avril': 3,
                'mai': 4,
                'juin': 5,
                'juillet': 6,
                'août': 7,
                'septembre': 8,
                'octobre': 9,
                'novembre': 10,
                'décembre': 11
            };

            let allTimestamps = [];
            for (const [dateStr, count] of stats.messageDates.entries()) {
                const parts = dateStr.trim().split(/\s+/);
                if (parts.length < 3) continue;
                const day = parseInt(parts[0], 10);
                const month = monthMap[parts[1].toLowerCase()];
                const year = parseInt(parts[2], 10);
                let hour = 0,
                    minute = 0,
                    second = 0;
                if (parts.length >= 5) {
                    const timeParts = parts[4].split(":");
                    hour = parseInt(timeParts[0], 10) || 0;
                    minute = parseInt(timeParts[1], 10) || 0;
                    second = parseInt(timeParts[2], 10) || 0;
                }
                const timestamp = new Date(year, month, day, hour, minute, second).getTime();
                for (let i = 0; i < count; i++) {
                    allTimestamps.push(timestamp);
                }
            }

            if (allTimestamps.length > 1) {
                allTimestamps.sort((a, b) => a - b);
                let totalDiff = 0;
                for (let i = 1; i < allTimestamps.length; i++) {
                    totalDiff += allTimestamps[i] - allTimestamps[i - 1];
                }
                const avgDiff = totalDiff / (allTimestamps.length - 1);

                let remaining = Math.floor(avgDiff / 1000);
                const days = Math.floor(remaining / 86400);
                remaining %= 86400;
                const hours = Math.floor(remaining / 3600);
                remaining %= 3600;
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;

                averageInterval = (
                    (days ? days + "j " : "") +
                    (hours ? hours + "h " : "") +
                    (minutes ? minutes + "m " : "") +
                    (seconds ? seconds + "s" : "")
                ).trim() || "0s";
            }
        }

        const statsHTML = `
        <div class="stats-container">
            <div class="stats-row">
            <span class="stats-label">Messages postés:</span>
            <span class="stats-value">${messageCount}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label">Moy. caractères/message:</span>
            <span class="stats-value">${averageChars}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label" title="Calcul du nombre de messages postés par jour d'activité.\nExemple : si 10 messages sont postés lundi et 10 jeudi, alors la moyenne sera de 10 et non de 5.">Moy. de messages par jour:</span>
            <span class="stats-value">${messagePerActiveDay}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label">Temps moy. entre deux messages:</span>
            <span class="stats-value">${averageInterval}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label">Stickers postés:</span>
            <span class="stats-value">${stickerCount}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label">Smileys postés:</span>
            <span class="stats-value">${smileyCount}</span>
            </div>
            <div class="stats-row">
            <span class="stats-label">Jour le plus actif:</span>
            <span class="stats-value">${mostActiveDay.split(' à ')[0]} (${maxMessages} messages)</span>
            </div>
        </div>
        `;
        container.innerHTML = statsHTML;
    }

    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function showActivityChart(pseudo) {
        const stats = userStats.get(pseudo) || {
            messageDates: new Map()
        };

        const messagesByDay = new Map();
        for (const [dateStr, count] of stats.messageDates) {
            const dayPart = dateStr.split(' à ')[0].trim();
            messagesByDay.set(dayPart, (messagesByDay.get(dayPart) || 0) + count);
        }

        const dates = [...messagesByDay.keys()].sort((a, b) => {
            const months = {
                'janvier': 0,
                'février': 1,
                'mars': 2,
                'avril': 3,
                'mai': 4,
                'juin': 5,
                'juillet': 6,
                'août': 7,
                'septembre': 8,
                'octobre': 9,
                'novembre': 10,
                'décembre': 11
            };
            const partsA = a.trim().split(/\s+/);
            const dayA = parseInt(partsA[0], 10);
            const monthA = months[partsA[1]?.toLowerCase()];
            const yearA = parseInt(partsA[2], 10);

            const partsB = b.trim().split(/\s+/);
            const dayB = parseInt(partsB[0], 10);
            const monthB = months[partsB[1]?.toLowerCase()];
            const yearB = parseInt(partsB[2], 10);

            if (isNaN(dayA) || monthA === undefined || isNaN(yearA)) {
                return -1;
            }
            if (isNaN(dayB) || monthB === undefined || isNaN(yearB)) {
                return 1;
            }

            const dateA = new Date(yearA, monthA, dayA);
            const dateB = new Date(yearB, monthB, dayB);

            return dateA - dateB;
        });

        const messageCounts = dates.map(date => messagesByDay.get(date) || 0);

        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });

        const chartContainer = document.createElement("div");
        Object.assign(chartContainer.style, {
            backgroundColor: "#2c2f33",
            border: "1px solid #40444b",
            borderRadius: "12px",
            padding: "25px",
            width: "800px",
            maxWidth: "95%",
            maxHeight: "90%",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            position: "relative",
            transform: "scale(0.9)",
            opacity: "0",
            transition: "transform 0.3s ease, opacity 0.3s ease",
        });

        const title = document.createElement("h3");
        title.textContent = `Activité quotidienne de ${pseudo}`;
        Object.assign(title.style, {
            fontSize: "20px",
            marginBottom: "20px",
            textAlign: "center",
            color: "#6064f4",
            fontWeight: "600",
        });
        chartContainer.appendChild(title);

        const canvas = document.createElement("canvas");
        Object.assign(canvas.style, {
            maxHeight: "500px",
            width: "100%",
        });
        chartContainer.appendChild(canvas);

        const closeButton = document.createElement("button");
        closeButton.textContent = "Fermer";
        closeButton.classList.add("action-button", "red-button");
        Object.assign(closeButton.style, {
            width: "98%",
            padding: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px",
            fontSize: "16px",
        });
        closeButton.addEventListener("click", () => overlay.remove());
        chartContainer.appendChild(closeButton);

        overlay.appendChild(chartContainer);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            chartContainer.style.transform = "scale(1)";
            chartContainer.style.opacity = "1";
        });

        try {
            if (typeof Chart === 'undefined') {
                await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
            }

            const useThinBars = dates.length > 100;

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: dates.length > 0 ? dates.map(date => date.split(' à ')[0]) : ['Aucune donnée'],
                    datasets: [{
                        label: 'Messages postés',
                        data: messageCounts.length > 0 ? messageCounts : [0],
                        backgroundColor: '#6064f4',
                        borderColor: '#4346ab',
                        borderWidth: 1,
                        barPercentage: 0.9,
                        ...(useThinBars ? {
                            barThickness: 6,
                            maxBarThickness: 10
                        } : {}),
                        categoryPercentage: 0.95
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                color: '#b9bbbe',
                                font: {
                                    size: 14
                                }
                            },
                            grid: {
                                color: '#40444b'
                            },
                            title: {
                                display: false,
                                text: 'Nombre de messages',
                                color: '#b9bbbe',
                                font: {
                                    size: 16
                                }
                            }
                        },
                        x: {
                            ticks: {
                                color: '#b9bbbe',
                                font: {
                                    size: 14
                                },
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: false,
                                callback: function(value, index, ticks) {
                                    const skipInterval = Math.ceil(ticks.length / 10);
                                    if (index === 0 || index === ticks.length - 1) {
                                        return this.getLabelForValue(value);
                                    }
                                    return (index % skipInterval === 0 ? this.getLabelForValue(value) : '');
                                }
                            },
                            grid: {
                                display: false
                            },
                            title: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#b9bbbe',
                                font: {
                                    size: 16
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement de Chart.js.', error);
            canvas.style.display = 'none';
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Erreur : Impossible de charger le graphique.';
            errorMessage.style.color = '#ff0000';
            errorMessage.style.textAlign = 'center';
            chartContainer.insertBefore(errorMessage, closeButton);
        }

        window.addEventListener("keydown", (e) => e.key === "Escape" && overlay.remove());
    }

    async function showTimelineChart() {
        const getTimelineData = () => {
            const dayActivity = new Map();

            for (const stats of userStats.values()) {
                for (const [dateStr, count] of stats.messageDates.entries()) {
                    const day = dateStr.split(" à ")[0].trim();
                    dayActivity.set(day, (dayActivity.get(day) || 0) + count);
                }
            }

            const sortedDays = [...dayActivity.entries()].sort((a, b) => {
                const parseDate = d => {
                    const [day, monthName, year] = d.split(" ");
                    const monthMap = {
                        'janvier': 0,
                        'février': 1,
                        'mars': 2,
                        'avril': 3,
                        'mai': 4,
                        'juin': 5,
                        'juillet': 6,
                        'août': 7,
                        'septembre': 8,
                        'octobre': 9,
                        'novembre': 10,
                        'décembre': 11
                    };

                    return new Date(parseInt(year, 10), monthMap[monthName.toLowerCase()], parseInt(day, 10));
                };
                return parseDate(a[0]) - parseDate(b[0]);
            });

            return {
                labels: sortedDays.map(d => d[0]),
                values: sortedDays.map(d => d[1])
            };
        };

        const data = getTimelineData();

        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });

        const chartContainer = document.createElement("div");
        Object.assign(chartContainer.style, {
            backgroundColor: "#2c2f33",
            border: "1px solid #40444b",
            borderRadius: "12px",
            padding: "25px",
            width: "850px",
            maxWidth: "95%",
            maxHeight: "90%",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            position: "relative",
        });

        const title = document.createElement("h3");
        title.textContent = "Activité du topic";
        Object.assign(title.style, {
            fontSize: "20px",
            marginBottom: "20px",
            textAlign: "center",
            color: "#6064f4",
            fontWeight: "600",
        });

        const canvas = document.createElement("canvas");
        Object.assign(canvas.style, {
            maxHeight: "500px",
            width: "100%",
        });

        const closeButton = document.createElement("button");
        closeButton.textContent = "Fermer";
        closeButton.classList.add("action-button", "red-button");
        Object.assign(closeButton.style, {
            width: "98%",
            padding: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px",
            fontSize: "16px",
        });

        chartContainer.appendChild(title);
        chartContainer.appendChild(canvas);
        chartContainer.appendChild(closeButton);
        overlay.appendChild(chartContainer);
        document.body.appendChild(overlay);

        let timelineChart;
        try {
            if (typeof Chart === 'undefined') {
                await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
            }

            const useThinBars = data.labels.length > 100;

            timelineChart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Messages par jour',
                        data: data.values,
                        backgroundColor: '#6064f4',
                        borderColor: '#4346ab',
                        ...(useThinBars ? {
                            barThickness: 6,
                            maxBarThickness: 10
                        } : {}),
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    ` ${context.raw} message${context.raw === 1 ? "" : "s"}`
                            }
                        },
                        legend: {
                            labels: {
                                color: '#b9bbbe',
                                font: {
                                    size: 16
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#b9bbbe',
                                font: {
                                    size: 12
                                },
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: false,
                                callback: function(value, index, ticks) {
                                    const skipInterval = Math.ceil(ticks.length / 10);
                                    if (index === 0 || index === ticks.length - 1) {
                                        return this.getLabelForValue(value);
                                    }
                                    return (index % skipInterval === 0 ? this.getLabelForValue(value) : '');
                                }
                            },
                            grid: {
                                color: '#40444b'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#b9bbbe',
                                stepSize: 1
                            },
                            grid: {
                                color: '#40444b'
                            }
                        }
                    },
                    onClick: function(evt, activeElements) {
                        if (activeElements.length > 0) {
                            const index = activeElements[0].index;
                            const selectedDate = this.data.labels[index];
                            showDateDetails(selectedDate);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement de Chart.js.', error);
            canvas.style.display = 'none';
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Erreur : Impossible de charger le graphique.';
            errorMessage.style.color = '#ff0000';
            errorMessage.style.textAlign = 'center';
            chartContainer.insertBefore(errorMessage, closeButton);
        }

        const updateTimeline = () => {
            const newData = getTimelineData();
            if (timelineChart) {
                timelineChart.data.labels = newData.labels;
                timelineChart.data.datasets[0].data = newData.values;

                if (newData.labels.length > 100) {
                    timelineChart.data.datasets[0].barThickness = 6;
                    timelineChart.data.datasets[0].maxBarThickness = 10;
                } else {
                    timelineChart.data.datasets[0].barThickness = undefined;
                    timelineChart.data.datasets[0].maxBarThickness = undefined;
                }
                timelineChart.update();
            }
        };

        const timelineInterval = setInterval(updateTimeline, 1000);

        closeButton.addEventListener("click", () => {
            clearInterval(timelineInterval);
            overlay.remove();
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                clearInterval(timelineInterval);
                overlay.remove();
            }
        });
    }

    window.showTimelineChart = showTimelineChart;

    function showDateDetails(selectedDate) {
        const detailsMap = new Map();

        userStats.forEach((stats, pseudo) => {
            stats.messageDates.forEach((count, fullDate) => {
                const dayPart = fullDate.split(" à ")[0].trim();
                if (dayPart === selectedDate) {
                    detailsMap.set(pseudo, (detailsMap.get(pseudo) || 0) + count);
                }
            });
        });

        const detailsData = Array.from(detailsMap.entries())
            .map(([pseudo, count]) => ({
                pseudo,
                count
            }))
            .sort((a, b) => b.count - a.count);

        if (detailsData.length === 0) {
            showNotification(`Aucun message du ${selectedDate}`, "warning", 3000);
            return;
        }

        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "150",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });

        const detailsContainer = document.createElement("div");
        Object.assign(detailsContainer.style, {
            backgroundColor: "#2c2f33",
            border: "1px solid #40444b",
            borderRadius: "12px",
            padding: "20px",
            width: "400px",
            maxWidth: "90%",
            maxHeight: "80%",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        });

        const header = document.createElement("h3");
        header.textContent = `Détails du ${selectedDate}`;
        header.style.color = "#6064f4";
        header.style.textAlign = "center";
        detailsContainer.appendChild(header);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.marginTop = "10px";

        const headerRow = document.createElement("tr");
        const thPseudo = document.createElement("th");
        thPseudo.textContent = "Pseudo";
        thPseudo.style.border = "1px solid #40444b";
        thPseudo.style.padding = "5px";
        thPseudo.style.color = "#ffffff";

        const thCount = document.createElement("th");
        thCount.textContent = "Messages";
        thCount.style.border = "1px solid #40444b";
        thCount.style.padding = "5px";
        thCount.style.color = "#ffffff";

        headerRow.appendChild(thPseudo);
        headerRow.appendChild(thCount);
        table.appendChild(headerRow);

        detailsData.forEach(item => {
            const row = document.createElement("tr");
            const tdPseudo = document.createElement("td");
            tdPseudo.textContent = item.pseudo;
            tdPseudo.style.border = "1px solid #40444b";
            tdPseudo.style.padding = "5px";
            tdPseudo.style.color = "#ffffff";

            const tdCount = document.createElement("td");
            tdCount.textContent = item.count;
            tdCount.style.border = "1px solid #40444b";
            tdCount.style.padding = "5px";
            tdCount.style.color = "#ffffff";

            row.appendChild(tdPseudo);
            row.appendChild(tdCount);
            table.appendChild(row);
        });

        detailsContainer.appendChild(table);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Fermer";
        closeBtn.classList.add("action-button", "red-button");
        Object.assign(closeBtn.style, {
            marginTop: "15px",
            padding: "10px 20px",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });

        closeBtn.addEventListener("click", () => overlay.remove());
        detailsContainer.appendChild(closeBtn);

        overlay.appendChild(detailsContainer);
        document.body.appendChild(overlay);

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                overlay.remove();
            }
        });
    }

    function showFusionMenu(pseudo, count, container) {
        container.innerHTML = "";

        const description = window.document.createElement("p");
        description.textContent = `Sélectionnez un ou plusieurs pseudos à fusionner avec "${pseudo}".`;
        Object.assign(description.style, {
            fontSize: "14px",
            marginBottom: "15px",
            textAlign: "center",
            color: "#b9bbbe",
            lineHeight: "1.4",
        });
        container.appendChild(description);

        const similarityContainer = window.document.createElement("div");
        similarityContainer.classList.add("similarity-container");

        const similarityLabel = window.document.createElement("span");
        similarityLabel.textContent = "Seuil de similarité :";
        similarityLabel.classList.add("similarity-label");
        similarityContainer.appendChild(similarityLabel);

        const similarityInput = window.document.createElement("input");
        Object.assign(similarityInput, {
            type: "range",
            min: "0",
            max: "100",
            value: "70",
            step: "1"
        });
        Object.assign(similarityInput.style, {
            flex: "1",
        });
        similarityContainer.appendChild(similarityInput);

        const similarityValue = window.document.createElement("span");
        similarityValue.textContent = `${similarityInput.value}%`;
        similarityValue.classList.add("similarity-value");
        similarityContainer.appendChild(similarityValue);

        container.appendChild(similarityContainer);

        const presetsContainer = window.document.createElement("div");
        Object.assign(presetsContainer.style, {
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
            justifyContent: "center",
        });
        const presets = [{
                label: "Faible (50%)",
                value: 50
            },
            {
                label: "Moyen (70%)",
                value: 70
            },
            {
                label: "Élevé (90%)",
                value: 90
            },
        ];
        presets.forEach(preset => {
            const button = window.document.createElement("button");
            button.textContent = preset.label;
            button.classList.add("action-button", "blue-button");
            Object.assign(button.style, {
                padding: "6px 12px",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                transition: "background-color 0.2s ease",
            });

            button.addEventListener("click", () => {
                similarityInput.value = preset.value;
                similarityValue.textContent = `${preset.value}%`;
                updatePseudosList(searchInput.value.trim());
            });
            presetsContainer.appendChild(button);
        });
        container.appendChild(presetsContainer);

        const searchContainer = window.document.createElement("div");
        Object.assign(searchContainer.style, {
            position: "relative",
            width: "100%",
            marginBottom: "12px",
        });

        const searchInput = window.document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Rechercher un pseudo...";
        Object.assign(searchInput.style, {
            width: "100%",
            padding: "10px 35px 10px 12px",
            border: "1px solid #40444b",
            borderRadius: "8px",
            backgroundColor: "#1e1f22",
            color: "#ffffff",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
        });
        searchInput.addEventListener("focus", () => {
            searchInput.style.borderColor = "#7289da";
        });
        searchInput.addEventListener("blur", () => {
            searchInput.style.borderColor = "#40444b";
        });

        const clearButton = window.document.createElement("span");
        clearButton.textContent = "×";
        Object.assign(clearButton.style, {
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#b9bbbe",
            fontSize: "18px",
            display: "none",
            transition: "color 0.2s ease",
        });

        clearButton.addEventListener("click", () => {
            searchInput.value = "";
            updatePseudosList();
            clearButton.style.display = "none";
        });

        clearButton.addEventListener("mouseenter", () => {
            clearButton.style.color = "#ffffff";
        });

        clearButton.addEventListener("mouseleave", () => {
            clearButton.style.color = "#b9bbbe";
        });

        searchInput.addEventListener("input", () => {
            updatePseudosList(searchInput.value.trim());
            clearButton.style.display = searchInput.value.trim() ? "block" : "none";
        });

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearButton);
        container.appendChild(searchContainer);

        const fusionSelect = window.document.createElement("select");
        fusionSelect.classList.add("fusion-select");
        fusionSelect.multiple = true;
        fusionSelect.setAttribute("aria-label", "Sélectionner les pseudos à fusionner");
        Object.assign(fusionSelect.style, {
            width: "100%",
            height: "200px",
            marginBottom: "15px",
            padding: "10px",
            border: "1px solid #40444b",
            borderRadius: "8px",
            backgroundColor: "#1e1f22",
            color: "#ffffff",
            fontSize: "14px",
            cursor: "pointer",
            outline: "none",
        });

        const updatePseudosList = (filter = "") => {
            fusionSelect.innerHTML = '';

            const similarityThreshold = parseInt(similarityInput.value, 10) / 100;

            const availablePseudos = [...messagesCount.entries()]
                .filter(([p, _]) => p !== pseudo && p.toLowerCase().includes(filter.toLowerCase()))
                .map(([p, c]) => ({
                    pseudo: p,
                    count: c,
                    similarity: calculateSimilarity(pseudo, p)
                }));

            const similarPseudos = availablePseudos
                .filter(p => p.similarity >= similarityThreshold)
                .sort((a, b) => {
                    if (a.similarity !== b.similarity) {
                        return b.similarity - a.similarity;
                    }
                    return a.pseudo.localeCompare(b.pseudo);
                });

            const nonSimilarPseudos = availablePseudos
                .filter(p => p.similarity < similarityThreshold)
                .sort((a, b) => a.pseudo.localeCompare(b.pseudo));

            const sortedPseudos = [...similarPseudos, ...nonSimilarPseudos];

            if (sortedPseudos.length === 0) {
                const option = window.document.createElement("option");
                option.textContent = "Aucun pseudo disponible";
                option.disabled = true;
                option.style.padding = "8px 10px";
                option.style.color = "#b9bbbe";
                fusionSelect.appendChild(option);
            } else {
                sortedPseudos.forEach(({
                    pseudo: p,
                    count: c,
                    similarity
                }) => {
                    const option = window.document.createElement("option");
                    option.value = p;
                    option.textContent = `${p} (${c} ${c > 1 ? "messages" : "message"})`;
                    option.setAttribute("aria-label", `${p}, ${c} messages, similarité ${Math.round(similarity * 100)}%`);
                    if (similarity >= similarityThreshold) {
                        option.classList.add("fusion-option-similar");
                    }
                    if (similarity > 0.9) {
                        option.selected = true;
                    }
                    option.title = `Similarité avec ${pseudo} : ${(similarity * 100).toFixed(0)}%`;
                    fusionSelect.appendChild(option);
                });
            }
        };

        updatePseudosList();

        similarityInput.addEventListener("input", () => {
            similarityValue.textContent = `${similarityInput.value}%`;
            updatePseudosList(searchInput.value.trim());
        });

        fusionSelect.addEventListener("change", () => {
            Array.from(fusionSelect.options).forEach(option => {
                option.style.display = "";
            });
        });

        const confirmButton = window.document.createElement("button");
        confirmButton.textContent = "Confirmer la fusion";
        confirmButton.classList.add("action-button", "orange-button");
        Object.assign(confirmButton.style, {
            width: "98%",
            padding: "12px",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "10px",
            fontSize: "16px",
            fontWeight: "600",
        });

        confirmButton.addEventListener("click", () => {
            const selectedOptions = [...fusionSelect.selectedOptions];
            if (selectedOptions.length > 0) {
                selectedOptions.forEach(option => {
                    const sourcePseudo = option.value;
                    fusionPseudos(pseudo, sourcePseudo, messagesCount.get(sourcePseudo));
                });

                updateResults();
                searchInput.value = "";
                clearButton.style.display = "none";
                updatePseudosList();
                showNotification(`${selectedOptions.length} pseudo(s) fusionné(s) avec ${pseudo}`, "success");
            } else {
                showNotification("Aucun pseudo sélectionné pour la fusion.", "warning");
            }
        });

        container.appendChild(fusionSelect);
        container.appendChild(confirmButton);
    }

    function fusionAllPotentialSecondary() {
        const fusionMessages = [];
        const pseudos = Array.from(messagesCount.keys());

        for (let i = 0; i < pseudos.length; i++) {
            const mainPseudo = pseudos[i];
            if (!messagesCount.has(mainPseudo)) continue;

            for (let j = i + 1; j < pseudos.length; j++) {
                const otherPseudo = pseudos[j];
                if (!messagesCount.has(otherPseudo)) continue;

                const similarity = calculateSimilarity(mainPseudo, otherPseudo);

                if (similarity >= 0.70) {
                    fusionMessages.push(`"${otherPseudo}" → "${mainPseudo}"`);
                    fusionPseudos(mainPseudo, otherPseudo, messagesCount.get(otherPseudo));
                }
            }
        }

        updateResults();

        if (fusionMessages.length === 0) {
            showNotification("Aucune fusion pertinente détectée.", "warning");
        } else {
            fusionMessages.forEach((fusionMsg, index) => {
                setTimeout(() => {
                    showNotification(fusionMsg, "success", 3000);
                }, index * 300);
            });
        }
    }

    document.getElementById("fusion-auto-button").addEventListener("click", fusionAllPotentialSecondary);
    document.getElementById("search-topic-button").addEventListener("click", toggleSearchBar);

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
        if (isPaused && pausedSummary) {
            summaryElement.innerHTML = pausedSummary;
            return;
        }

        const totalTime = Date.now() - startTime;
        const pagesRemaining = currentPage <= analysisMaxPages ? analysisMaxPages - currentPage + 1 : 0;
        const summary =
            `<div class="topic-title bold">Topic : ${topicTitle}</div>\n` +
            "Total de messages analysés : " + totalMessages + "<br>\n" +
            "Pages restantes : " + (pagesRemaining > 0 ? pagesRemaining : "Aucune") + "<br>\n" +
            "Total de pages analysées : " + totalPages + "<br>\n" +
            "Durée totale de l'analyse : " + new Date(totalTime).toISOString().substr(11, 8);
        summaryElement.innerHTML = summary;

        if (!isPaused) {
            pausedSummary = "";
        }
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
