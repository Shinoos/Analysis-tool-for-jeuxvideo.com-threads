function startAnalysis(initialPage = 1) {
  let _currentPage = initialPage;
  let _count = new Map();
  let _totalMessages = 0;
  let _totalPages = 0;
  const _startTime = Date.now();
  let _isPaused = false;

  handlePage();

  async function handlePage(attempt = 1) {
    
    console.log(`Page ${_currentPage}…`);
    let splitPath = location.pathname.split('-');
    splitPath[3] = _currentPage;
    let path = splitPath.join('-');

    const startTime = Date.now();

    try {
      let response = await fetch(path);
      const duration = Date.now() - startTime;

      if (response.redirected) {
        showResults();
        return;
      }

      let body = await response.text();
      let doc = document.implementation.createHTMLDocument();
      doc.documentElement.innerHTML = body;

      let messagesOnPage = 0;

      doc.querySelectorAll('.bloc-pseudo-msg').forEach((messageElement) => {
        let pseudo = messageElement.innerText.trim();
        if (_count.has(pseudo)) {
          _count.set(pseudo, _count.get(pseudo) + 1);
        } else {
          _count.set(pseudo, 1);
        }
        messagesOnPage++;
      });

      _totalMessages += messagesOnPage;
      _totalPages++;

      if (_isPaused) {
        console.log(`Analyse en pause...`);
        _currentPage++;
        return;
      }

      _currentPage++;

      if (duration > 2000) {
        console.log('Limitation par les serveurs jeuxvideo.com, pause de 7 secondes...');
        setTimeout(() => handlePage(), 7000);
      } else {
        handlePage();
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de la page ${_currentPage}:`, error);

      if (attempt < 20) {
        const delay = Math.min(2 ** attempt * 100, 5000);
        console.log(`Nouvelle tentative pour la page ${_currentPage} dans ${delay} ms...`);
        setTimeout(() => handlePage(attempt + 1), delay);
      } else {
        console.error('Toujours en échec malgré plusieurs tentatives. Arrêt du script.');
      }
    }
  }

  function showResults() {
    const totalTime = Date.now() - _startTime;
    const durationString = new Date(totalTime).toISOString().substr(11, 8);

    let results = `Total de messages analysés : ${_totalMessages}\n`;
    results += `Total de pages analysées : ${_totalPages}\n`;
    results += `Durée de l'analyse : ${durationString}\n\n`;

    let sorted = [..._count.entries()].sort((a, b) => b[1] - a[1]);
    let place = 1;
    sorted.forEach(([pseudo, count]) => {
      results += `${place} : ${pseudo} -> ${count} messages\n`;
      place++;
    });

    console.log(results);
  }

  function pauseAnalysis() {
    if (_isPaused) {
      console.log('L\'analyse est déjà en pause.');
    } else {
      _isPaused = true;
      console.log('Pause demandée. Elle sera effective après l’analyse de la page en cours.');
    }
  }

  function resumeAnalysis() {
    if (!_isPaused) {
      console.log('L\'analyse n\'est pas en pause.');
    } else {
      _isPaused = false;
      console.log('Reprise de l\'analyse...');
      handlePage();
    }
  }

  window.pauseAnalysis = pauseAnalysis;
  window.resumeAnalysis = resumeAnalysis;
}

// Le script peut se démarrer à partir de n'importe quelle page, exemple pour la page 1000 : startAnalysis(1000);
startAnalysis();
