void function() {
  let _currentPage = 1;
  let _count = new Map();
  let _totalMessages = 0;
  let _totalPages = 0;

  handlePage();

  async function handlePage() {
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
      _currentPage++;

      if (duration > 2000) {
        console.log('Limitation par les serveurs jeuxvideo.com, pause de 10 secondes...');
        setTimeout(handlePage, 10000);
      } else {
        handlePage();
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de la page ${_currentPage}:`, error);
    }
  }

  function showResults() {
    let results = `Total de messages analysés : ${_totalMessages}\n`;
    results += `Total de pages analysées : ${_totalPages}\n\n`;
    let sorted = [..._count.entries()].sort((a, b) => b[1] - a[1]);
    let place = 1;
    sorted.forEach(([pseudo, count]) => {
      results += `${place} : ${pseudo} -> ${count} messages\n`;
      place++;
    });

    console.log(results);
  }
}();