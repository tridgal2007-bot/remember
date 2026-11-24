/*
 * RELATOS ENGARRAFADOS — LÓGICA DO SITE
 *
 * Edite os textos em js/data/memories.js.
 * Edite senha, e-mail, música e clima em js/config.js.
 * Edite o visual em css/styles.css.
 */
(() => {
  'use strict';

  const CONFIG = window.RELATOS_CONFIG;
  const memories = window.RELATOS_MEMORIES;

  if (!CONFIG || !Array.isArray(memories)) {
    console.error('Não foi possível carregar config.js ou memories.js.');
    return;
  }

  // ---------------------------------------------------------------------------
  // ELEMENTOS E ESTADO
  // ---------------------------------------------------------------------------
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const grid = $('#bottleGrid');
  const modal = $('#modal');
  const weather = $('#weather');
  const music = $('#music');
  const soundButton = $('#soundBtn');

  const categoryLabels = CONFIG.categoryLabels;

  let currentFilter = 'all';
  let activeMemoryId = null;
  let previousFocus = null;
  let weatherTimer = null;
  let clockTimer = null;
  let weatherIndex = 0;

  const formatId = (id) => String(id).padStart(2, '0');

  const initialParrotMessage = $('#parrotMessage');
  if (initialParrotMessage) {
    initialParrotMessage.textContent = `“${CONFIG.parrotGreeting}”`;
  }

  // ---------------------------------------------------------------------------
  // PAPAGAIO — ANÚNCIO DOS RELATOS
  // ---------------------------------------------------------------------------
  function parrotAnnounce(message) {
    const messageElement = $('#parrotMessage');
    if (messageElement) {
      messageElement.textContent = `“${message}”`;
    }
  }

  // ---------------------------------------------------------------------------
  // GARRAFAS — LISTAGEM, FILTROS E ABERTURA
  // ---------------------------------------------------------------------------
  function createBottle(memory, index) {
    const bottle = document.createElement('button');
    const category = categoryLabels[memory.category] || 'Relato';

    bottle.type = 'button';
    bottle.className = 'memory-bottle';
    bottle.style.animationDelay = `${Math.min(index * 25, 300)}ms`;
    bottle.setAttribute(
      'aria-label',
      `Abrir garrafa ${formatId(memory.id)}: ${memory.title}`
    );

    bottle.innerHTML = `
      <span class="bottle-seal">${formatId(memory.id)}</span>
      <span class="bottle-visual">
        <span class="bottle-neck"></span>
        <span class="bottle-outline"></span>
        <img
          src="image/image${memory.id}.png"
          alt="Imagem do relato ${formatId(memory.id)}"
          loading="lazy"
          decoding="async"
        >
      </span>
      <span class="bottle-name"></span>
      <span class="bottle-meta">${category} · abrir garrafa</span>
    `;

    bottle.querySelector('.bottle-name').textContent = memory.title;
    bottle.querySelector('img').addEventListener('error', (event) => {
      event.currentTarget.style.opacity = '0';
    });
    bottle.addEventListener('click', () => openMemory(memory.id, bottle));

    return bottle;
  }

  function renderMemories() {
    if (!grid) return;

    const visibleMemories = memories.filter((memory) => {
      return currentFilter === 'all' || memory.category === currentFilter;
    });

    grid.replaceChildren(
      ...visibleMemories.map((memory, index) => createBottle(memory, index))
    );

    const count = $('#count');
    if (count) {
      const noun = visibleMemories.length === 1 ? 'garrafa' : 'garrafas';
      count.textContent = `${visibleMemories.length} ${noun}`;
    }
  }

  function setFilter(button) {
    $$('.filter').forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });

    currentFilter = button.dataset.filter || 'all';
    renderMemories();
  }

  $$('.filter').forEach((button) => {
    button.addEventListener('click', () => setFilter(button));
  });

  function openMemory(id, focusTarget = document.activeElement) {
    const memory = memories.find((item) => item.id === id);
    if (!memory || !modal) return;

    activeMemoryId = id;
    previousFocus = focusTarget;

    $('#modalImg').src = `image/image${memory.id}.png`;
    $('#modalImg').alt = `Imagem do relato: ${memory.title}`;
    $('#modalCategory').textContent =
      `GARRAFA ${formatId(memory.id)} · ${categoryLabels[memory.category] || 'Relato'}`;
    $('#modalTitle').textContent = memory.title;
    $('#modalBody').innerHTML = memory.body;

    $('#prev').disabled = id <= Math.min(...memories.map((item) => item.id));
    $('#next').disabled = id >= Math.max(...memories.map((item) => item.id));

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#closeModal').focus();

    const announcement = CONFIG.parrotOpenMessage
      .replace('{id}', formatId(memory.id))
      .replace('{title}', memory.title);
    parrotAnnounce(announcement);
  }

  function closeMemory() {
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  $('#closeModal')?.addEventListener('click', closeMemory);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeMemory();
  });

  $('#prev')?.addEventListener('click', () => {
    const previous = memories
      .filter((item) => item.id < activeMemoryId)
      .sort((a, b) => b.id - a.id)[0];
    if (previous) openMemory(previous.id);
  });

  $('#next')?.addEventListener('click', () => {
    const next = memories
      .filter((item) => item.id > activeMemoryId)
      .sort((a, b) => a.id - b.id)[0];
    if (next) openMemory(next.id);
  });

  document.addEventListener('keydown', (event) => {
    if (!modal?.classList.contains('open')) return;

    if (event.key === 'Escape') closeMemory();
    if (event.key === 'ArrowLeft') $('#prev')?.click();
    if (event.key === 'ArrowRight') $('#next')?.click();
  });

  // ---------------------------------------------------------------------------
  // TELA DE ENTRADA
  // ---------------------------------------------------------------------------
  $('#gateForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = $('#password').value.trim().toLocaleLowerCase('pt-BR');
    const acceptedPasswords = CONFIG.passwords.map((value) =>
      String(value).toLocaleLowerCase('pt-BR')
    );

    if (!acceptedPasswords.includes(password)) {
      $('#gateError').textContent = 'Palavra incorreta. Tente novamente.';
      return;
    }

    $('#gate').classList.add('hidden');
    $('#app').classList.remove('hidden');

    startClock();
    startWeather();

    try {
      await music.play();
      setSoundState(true);
    } catch {
      setSoundState(false);
    }
  });

  // ---------------------------------------------------------------------------
  // RELÓGIO
  // ---------------------------------------------------------------------------
  function updateClock() {
    const now = new Date();
    $('#clock').textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
    $('#date').textContent = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  }

  function startClock() {
    if (clockTimer) clearInterval(clockTimer);
    updateClock();
    clockTimer = setInterval(() => {
      if (!document.hidden) updateClock();
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // MÚSICA
  // ---------------------------------------------------------------------------
  music.src = CONFIG.musicPath;
  music.volume = Number.isFinite(CONFIG.musicVolume)
    ? Math.min(1, Math.max(0, CONFIG.musicVolume))
    : 0.12;

  function setSoundState(isPlaying) {
    soundButton.setAttribute('aria-pressed', String(isPlaying));
    $('#soundLabel').textContent = isPlaying ? 'Música ligada' : 'Trilha sonora';
  }

  soundButton?.addEventListener('click', async () => {
    if (music.paused) {
      try {
        await music.play();
        setSoundState(true);
      } catch {
        setSoundState(false);
        $('#soundLabel').textContent = 'Adicione sound/musica.mp3';
      }
      return;
    }

    music.pause();
    setSoundState(false);
  });

  music.addEventListener('error', () => setSoundState(false));
  music.addEventListener('play', () => setSoundState(true));
  music.addEventListener('pause', () => setSoundState(false));

  // ---------------------------------------------------------------------------
  // CLIMA — CAMADA VISUAL SOBRE A INTERFACE
  // ---------------------------------------------------------------------------
  const weatherModes = CONFIG.weatherModes || ['sun', 'rain', 'storm', 'snow'];

  function createWeatherParticles() {
    if (!weather) return;

    weather.querySelectorAll('.rain-drop, .snowflake').forEach((particle) => {
      particle.remove();
    });

    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const rainCount = isMobile ? 18 : 34;
    const snowCount = isMobile ? 18 : 35;

    for (let index = 0; index < rainCount; index += 1) {
      const drop = document.createElement('i');
      drop.className = 'rain-drop';
      drop.style.setProperty('--x', `${Math.random() * 100}%`);
      drop.style.setProperty('--h', `${22 + Math.random() * 55}px`);
      drop.style.setProperty('--dur', `${0.7 + Math.random() * 0.9}s`);
      drop.style.setProperty('--delay', `${-Math.random() * 4}s`);
      drop.style.setProperty('--op', 0.15 + Math.random() * 0.26);
      weather.appendChild(drop);
    }

    for (let index = 0; index < snowCount; index += 1) {
      const flake = document.createElement('i');
      flake.className = 'snowflake';
      flake.style.setProperty('--x', `${Math.random() * 100}%`);
      flake.style.setProperty('--s', `${2 + Math.random() * 4}px`);
      flake.style.setProperty('--dur', `${9 + Math.random() * 13}s`);
      flake.style.setProperty('--delay', `${-Math.random() * 12}s`);
      flake.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`);
      weather.appendChild(flake);
    }
  }

  function changeWeather() {
    if (!weather || !weatherModes.length) return;
    weatherIndex = (weatherIndex + 1) % weatherModes.length;
    weather.className = `weather ${weatherModes[weatherIndex]} active`;
  }

  function startWeather() {
    if (!weather) return;

    createWeatherParticles();
    weatherIndex = 0;
    weather.className = `weather ${weatherModes[weatherIndex]} active`;

    if (weatherTimer) clearInterval(weatherTimer);
    weatherTimer = setInterval(() => {
      if (!document.hidden) changeWeather();
    }, CONFIG.weatherInterval);
  }

  document.addEventListener('visibilitychange', () => {
    const siteIsVisible = !$('#app').classList.contains('hidden');
    if (!document.hidden && siteIsVisible && !weatherTimer) startWeather();
  });

  // ---------------------------------------------------------------------------
  // RESPOSTA DA SOPHIA — ENVIO DIRETO PELO FORMULÁRIO (SEM MAILTO)
  // ---------------------------------------------------------------------------
  $('#replyForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const messageField = $('#reply');
    const status = $('#replyStatus');
    const submitButton = form.querySelector('button[type="submit"]');
    const message = messageField.value.trim();

    if (!message) {
      status.textContent = 'Escreva uma mensagem antes de enviar.';
      messageField.focus();
      return;
    }

    if (!CONFIG.replyEmail) {
      status.textContent = 'O endereço de recebimento não foi configurado.';
      return;
    }

    submitButton.disabled = true;
    status.textContent = 'Enviando mensagem…';

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${CONFIG.replyEmail.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: 'Sophia',
            message,
            _subject: 'Uma mensagem nos Relatos Engarrafados',
            _honey: ''
          })
        }
      );

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'O serviço não confirmou o recebimento.');
      }

      status.textContent = 'Mensagem enviada. Obrigado por escrever.';
      messageField.value = '';
      form.classList.add('sent');
    } catch (error) {
      console.error('Falha ao enviar a resposta:', error);
      status.textContent = 'Não foi possível enviar agora. Verifique a conexão e tente novamente.';
    } finally {
      submitButton.disabled = false;
    }
  });

  // ---------------------------------------------------------------------------
  // INICIALIZAÇÃO
  // ---------------------------------------------------------------------------
  renderMemories();
})();
