/* ==========================================================================
   PERRENGUE CHIC: INTERAÇÕES (JavaScript Vanilla)
   0. Tela inicial          1. Barra de progresso   2. Carrossel de banners
   3. Menu mobile           4. Filtro e paginação   5. Carrinho e pedido     6. Animação de entrada   7. Navegação ativa
   8. Ano no rodapé
   9. Hero dinâmico
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ------------------------------------------------------------------------
     0. TELA INICIAL ESTILO LINKTREE
     Retém o foco até a escolha do visitante e some com fade suave.
     ------------------------------------------------------------------------ */
  const intro = document.getElementById('linktree-intro');

  if (intro) {
    document.body.classList.add('linktree-open');
    const introSiblings = Array.prototype.slice.call(document.body.children).filter(function (element) { return element !== intro; });
    introSiblings.forEach(function (element) {
      element.setAttribute('inert', '');
      element.setAttribute('aria-hidden', 'true');
    });

    const introLinks = Array.prototype.slice.call(intro.querySelectorAll('a[href]'));
    const closeIntro = function () {
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      intro.classList.add('is-closing');

      window.setTimeout(function () {
        intro.classList.add('is-closed');
        intro.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('linktree-open');
        introSiblings.forEach(function (element) {
          element.removeAttribute('inert');
          element.removeAttribute('aria-hidden');
        });

        document.dispatchEvent(new CustomEvent('perrengue:intro-close'));
        const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
        if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: scrollBehavior });
        // Sem mover o foco de propósito: ao esconder a tela inicial, o foco volta
        // para o body e o Tab começa pelo skip-link. (Focar a logo gerava um
        // retângulo dourado de outline indesejado.)
        if (document.activeElement && intro.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }, prefersReducedMotion ? 0 : 260);
    };

    intro.querySelectorAll('[data-linktree-close]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        closeIntro();
      });
    });

    intro.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeIntro();
        return;
      }

      if (event.key !== 'Tab' || introLinks.length === 0) return;

      const first = introLinks[0];
      const last = introLinks[introLinks.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const primaryLink = intro.querySelector('[data-linktree-close]');
    if (primaryLink) primaryLink.focus({ preventScroll: true });

    /* ----------------------------------------------------------------------
       0B. BRILHOS NO CURSOR (canvas fino, só enquanto a tela inicial está aberta)
       Partículas douradas discretas que nascem onde o mouse/dedo passa.
       ---------------------------------------------------------------------- */
    const sparkleCanvas = intro.querySelector('.linktree__sparkles');
    const reducedMotionSparkles = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (sparkleCanvas && sparkleCanvas.getContext && !reducedMotionSparkles) {
      const sparkleContext = sparkleCanvas.getContext('2d');

      if (sparkleContext) {
        const SPARKLE_COLORS = ['#D8B46A', '#F0D795', '#C5A059'];
        const MAX_PARTICLES = 48;
        const SPAWN_DISTANCE = 16;   // px mínimos entre pontos de spawn (trilha espalhada, não contínua)
        const SPAWN_INTERVAL = 30;   // ms mínimos entre spawns
        let sparkles = [];
        let sparkleFrame = null;
        let sparkleSize = 0;
        let lastSpawnX = null;
        let lastSpawnY = null;
        let lastSpawnAt = 0;

        const resizeSparkles = function () {
          const rect = intro.getBoundingClientRect();
          const ratio = Math.min(window.devicePixelRatio || 1, 2);
          sparkleSize = Math.max(1, rect.width);
          sparkleCanvas.width = Math.round(sparkleSize * ratio);
          sparkleCanvas.height = Math.round(Math.max(1, rect.height) * ratio);
          sparkleCanvas.style.width = sparkleSize + 'px';
          sparkleCanvas.style.height = Math.max(1, rect.height) + 'px';
          sparkleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const spawnSparkles = function (x, y) {
          const moved = lastSpawnX === null ? Infinity : Math.hypot(x - lastSpawnX, y - lastSpawnY);
          const now = Date.now();
          if (moved < SPAWN_DISTANCE || now - lastSpawnAt < SPAWN_INTERVAL) return;
          lastSpawnX = x;
          lastSpawnY = y;
          lastSpawnAt = now;

          const count = 1 + (Math.random() < 0.35 ? 1 : 0);
          for (let i = 0; i < count && sparkles.length < MAX_PARTICLES; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.25 + Math.random() * 0.55;
            sparkles.push({
              x: x + (Math.random() - 0.5) * 16,
              y: y + (Math.random() - 0.5) * 16,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.22,
              radius: 0.6 + Math.random() * 1.1,
              sparkleCross: Math.random() < 0.22,
              color: SPARKLE_COLORS[(Math.random() * SPARKLE_COLORS.length) | 0],
              life: 0,
              maxLife: 52 + ((Math.random() * 26) | 0)
            });
          }
        };

        const drawSparkles = function () {
          sparkleContext.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

          sparkles = sparkles.filter(function (sparkle) {
            sparkle.life += 1;
            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            sparkle.vy += 0.012;
            sparkle.vx *= 0.985;

            const progress = sparkle.life / sparkle.maxLife;
            if (progress >= 1) return false;

            const alpha = Math.sin(Math.PI * Math.min(progress, 1));
            // halo suave atrás do núcleo
            sparkleContext.globalAlpha = alpha * 0.16;
            sparkleContext.fillStyle = sparkle.color;
            sparkleContext.beginPath();
            sparkleContext.arc(sparkle.x, sparkle.y, sparkle.radius * 2.6, 0, Math.PI * 2);
            sparkleContext.fill();
            // núcleo discreto
            sparkleContext.globalAlpha = alpha * 0.55;
            sparkleContext.beginPath();
            sparkleContext.arc(sparkle.x, sparkle.y, sparkle.radius, 0, Math.PI * 2);
            sparkleContext.fill();

            if (sparkle.sparkleCross) {
              const cross = sparkle.radius * (2.3 - progress);
              sparkleContext.globalAlpha = alpha * 0.4;
              sparkleContext.strokeStyle = sparkle.color;
              sparkleContext.lineWidth = 0.75;
              sparkleContext.beginPath();
              sparkleContext.moveTo(sparkle.x - cross, sparkle.y);
              sparkleContext.lineTo(sparkle.x + cross, sparkle.y);
              sparkleContext.moveTo(sparkle.x, sparkle.y - cross);
              sparkleContext.lineTo(sparkle.x, sparkle.y + cross);
              sparkleContext.stroke();
            }
            return true;
          });

          sparkleContext.globalAlpha = 1;
        };

        const sparkleTick = function () {
          drawSparkles();
          sparkleFrame = sparkles.length > 0 ? window.requestAnimationFrame(sparkleTick) : null;
        };

        const queueSparkleFrame = function () {
          if (sparkleFrame === null) sparkleFrame = window.requestAnimationFrame(sparkleTick);
        };

        resizeSparkles();
        window.addEventListener('resize', resizeSparkles, { passive: true });

        intro.addEventListener('pointermove', function (event) {
          const rect = sparkleCanvas.getBoundingClientRect();
          spawnSparkles(event.clientX - rect.left, event.clientY - rect.top);
          queueSparkleFrame();
        }, { passive: true });

        document.addEventListener('perrengue:intro-close', function () {
          sparkles = [];
          if (sparkleFrame !== null) {
            window.cancelAnimationFrame(sparkleFrame);
            sparkleFrame = null;
          }
          sparkleContext.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
        });
      }
    }
  }

  /* ------------------------------------------------------------------------
     1. BARRA DE PROGRESSO DA PÁGINA
     ------------------------------------------------------------------------ */
  const pageProgress = document.getElementById('page-progress');

  if (pageProgress) {
    function updateProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      pageProgress.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    function updateHeaderShadow() {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
    }

    window.addEventListener('scroll', updateHeaderShadow, { passive: true });
    window.addEventListener('resize', updateHeaderShadow);
    updateHeaderShadow();
  }

  /* ------------------------------------------------------------------------
     2. CARROSSEL DE BANNERS EM LOOP
     ------------------------------------------------------------------------ */
  const slides = Array.prototype.slice.call(document.querySelectorAll('.banner-slide'));
  const dots = Array.prototype.slice.call(document.querySelectorAll('.banner-dot'));
  const bannerTrack = document.querySelector('.banners__track');
  const realCount = dots.length;

  if (realCount > 1 && bannerTrack) {
    let currentSlide = 0;
    let carouselTimer;
    let resetting = false;

    function applyTransform(index, animate) {
      if (!animate) bannerTrack.style.transition = 'none';
      bannerTrack.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (!animate) {
        void bannerTrack.offsetWidth;
        bannerTrack.style.transition = '';
      }
    }

    function syncDots(index) {
      const realIndex = index % realCount;
      dots.forEach(function (dot, i) {
        const active = i === realIndex;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function showBanner(index, animate) {
      currentSlide = index;
      applyTransform(index, animate !== false);
      slides.forEach(function (slide, i) { slide.classList.toggle('is-active', i === index % slides.length); });
      syncDots(index);
    }

    /* Avança para o clone do primeiro banner e, sem salto na transição, volta ao início. */
    function nextBanner() {
      if (resetting) return;
      showBanner(currentSlide + 1, true);
      if (currentSlide === realCount) {
        resetting = true;
        const onEnd = function (event) {
          if (event.propertyName !== 'transform') return;
          bannerTrack.removeEventListener('transitionend', onEnd);
          showBanner(0, false);
          resetting = false;
        };
        bannerTrack.addEventListener('transitionend', onEnd);
      }
    }

    function startCarousel() { carouselTimer = window.setInterval(nextBanner, 8000); }
    function stopCarousel() { window.clearInterval(carouselTimer); }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showBanner(i, true);
        stopCarousel();
        startCarousel();
      });
    });

    const carousel = document.getElementById('banner-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopCarousel);
      carousel.addEventListener('mouseleave', startCarousel);
      carousel.addEventListener('focusin', stopCarousel);
      carousel.addEventListener('focusout', startCarousel);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopCarousel();
      else startCarousel();
    });

    showBanner(0, false);
    startCarousel();
  }

  /* ------------------------------------------------------------------------
     3. MENU MOBILE (hambúrguer)
     ------------------------------------------------------------------------ */
  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu-principal');
  const header = document.querySelector('.site-header');

  function setMenu(open) {
    if (!menuToggle || !menu) return;
    menu.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Fecha o menu ao tocar em qualquer link
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    // Fecha ao clicar fora ou pressionar Escape
    document.addEventListener('click', function (event) {
      if (header && !header.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     4. FILTRO E PAGINAÇÃO DO CATÁLOGO EM TEMPO REAL
     Cada card define sua categoria em data-category. Cada categoria mostra
     quatro peças por vez em telas menores que 1024px e seis no desktop;
     quando há mais, a navegação de páginas aparece no fim da seção,
     acima dos botões de categoria.
     ------------------------------------------------------------------------ */
  function getPageSize() {
    if (window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) return 6;
    return 4;
  }

  var currentPageSize = getPageSize();
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-filter]'));
  const cards = Array.prototype.slice.call(document.querySelectorAll('.product-card'));
  const emptyStates = Array.prototype.slice.call(document.querySelectorAll('.coming-soon[data-category]'));
  const grid = document.getElementById('grade-produtos');
  const pagination = document.getElementById('catalog-pagination');
  const pagesContainer = document.getElementById('catalog-pages');
  const prevPageButton = pagination ? pagination.querySelector('[data-page-action="prev"]') : null;
  const nextPageButton = pagination ? pagination.querySelector('[data-page-action="next"]') : null;

  // As abas aparecem duas vezes: no topo do catálogo e no fim da lista.
  // Cada grupo tem a sua própria navegação por setas, e o estado fica igual
  // nos dois, então clicar embaixo reflete em cima e vice-versa.
  // O grupo .tabs--cores é o subfiltro de cores da aba Brincos e tem navegação própria.
  const tabGroups = Array.prototype.slice.call(document.querySelectorAll('.tabs:not(.tabs--cores)'));
  const colorTabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-color-filter]'));
  const colorFilterBar = document.getElementById('filtro-cores');
  // "coloridos" agrupa os data-color vermelho, marrom, branco e preto.
  const colorGroups = { coloridos: ['vermelho', 'marrom', 'branco', 'preto', 'verde'] };
  let currentFilter = 'todos';
  let currentColor = 'todos';
  let currentPage = 1;

  function getMatchingCards(filter, color) {
    return cards.filter(function (card) {
      const matchesCategory = filter === 'todos' || card.dataset.category === filter;
      const group = colorGroups[color];
      const matchesColor = filter !== 'brincos' || !color || color === 'todos' ||
        card.dataset.color === color ||
        (group ? group.indexOf(card.dataset.color) !== -1 : false);
      return matchesCategory && matchesColor;
    });
  }

  function updateColorTabs(color) {
    colorTabs.forEach(function (tab) {
      const isActive = tab.dataset.colorFilter === color;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
  }

  // O subfiltro de cores só faz sentido dentro da aba Brincos.
  function updateColorBar(filter) {
    if (colorFilterBar) colorFilterBar.hidden = filter !== 'brincos';
  }

  function updateTabs(filter) {
    tabs.forEach(function (tab) {
      const isActive = tab.dataset.filter === filter;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
  }

  function getPageItems(totalPages, page) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, function (_, index) { return index + 1; });
    }

    var items = [1];
    var start = Math.max(2, page - 1);
    var end = Math.min(totalPages - 1, page + 1);

    if (page <= 3) { start = 2; end = 4; }
    if (page >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
    if (start > 2) items.push('ellipsis');
    for (var pageNumber = start; pageNumber <= end; pageNumber += 1) items.push(pageNumber);
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  }

  function scrollToGrid() {
    if (!grid) return;
    var rootStyles = window.getComputedStyle(document.documentElement);
    var headerHeight = parseFloat(rootStyles.getPropertyValue('--header-height')) || 80;
    var top = grid.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function renderPagination(totalPages, page) {
    if (!pagination || !pagesContainer || !prevPageButton || !nextPageButton) return;

    var shouldShow = totalPages > 1;
    pagination.hidden = !shouldShow;
    prevPageButton.disabled = !shouldShow || page === 1;
    nextPageButton.disabled = !shouldShow || page === totalPages;
    pagesContainer.innerHTML = '';

    if (!shouldShow) return;

    getPageItems(totalPages, page).forEach(function (item) {
      if (item === 'ellipsis') {
        var ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '…';
        ellipsis.setAttribute('aria-hidden', 'true');
        pagesContainer.appendChild(ellipsis);
        return;
      }

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'page-number' + (item === page ? ' is-active' : '');
      button.textContent = String(item);
      button.setAttribute('aria-label', 'Ver página ' + item);
      if (item === page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', function () { goToPage(item); });
      pagesContainer.appendChild(button);
    });
  }

  function renderCatalog(filter, page) {
    const matchingCards = getMatchingCards(filter, currentColor);
    const pageSize = getPageSize();
    const totalPages = Math.max(1, Math.ceil(matchingCards.length / pageSize));
    const safePage = Math.min(Math.max(page || 1, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const visibleCards = matchingCards.slice(start, start + pageSize);

    var prefersReducedMotionNow = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach(function (card) { card.hidden = visibleCards.indexOf(card) === -1; });
    visibleCards.forEach(function (card, index) {
      card.style.setProperty('--reveal-delay', String(Math.min(index, 5) * 55) + 'ms');
      if (!prefersReducedMotionNow) card.classList.remove('is-visible');
    });

    // Re-adiciona o fade na próxima pintura: o IntersectionObserver só
    // dispara em mudança de interseção, então sem isto os cards que já
    // estavam visíveis ficavam presos semi-transparentes.
    if (!prefersReducedMotionNow) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          visibleCards.forEach(function (card) { card.classList.add('is-visible'); });
        });
      });
    }

    // Categorias ainda sem peças continuam com o aviso dentro da grade.
    emptyStates.forEach(function (state) {
      state.hidden = filter === 'todos' || state.dataset.category !== filter;
    });

    if (grid) {
      const tabTop = document.getElementById('tab-' + filter);
      if (tabTop) grid.setAttribute('aria-labelledby', tabTop.id);
    }

    currentFilter = filter;
    currentPage = safePage;
    currentPageSize = pageSize;
    updateTabs(filter);
    updateColorBar(filter);
    updateColorTabs(currentColor);
    renderPagination(totalPages, safePage);
  }

  function goToPage(page) {
    renderCatalog(currentFilter, page);
    scrollToGrid();
  }

  function activateTab(selectedTab) {
    const filter = selectedTab.dataset.filter;
    if (filter !== currentFilter) currentColor = 'todos';
    const nextPage = filter === currentFilter ? currentPage : 1;
    renderCatalog(filter, nextPage);
  }

  if (prevPageButton) {
    prevPageButton.addEventListener('click', function () {
      if (currentPage > 1) goToPage(currentPage - 1);
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener('click', function () {
      var matchingCards = getMatchingCards(currentFilter, currentColor);
      var totalPages = Math.ceil(matchingCards.length / getPageSize());
      if (currentPage < totalPages) goToPage(currentPage + 1);
    });
  }

  tabGroups.forEach(function (group) {
    const groupTabs = Array.prototype.slice.call(group.querySelectorAll('.tab[data-filter]'));

    groupTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activateTab(tab); });

      // Navegação por teclado recomendada para o padrão de abas (setas, Home e End)
      tab.addEventListener('keydown', function (event) {
        let nextIndex = null;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % groupTabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + groupTabs.length) % groupTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = groupTabs.length - 1;

        if (nextIndex !== null) {
          event.preventDefault();
          groupTabs[nextIndex].focus();
          activateTab(groupTabs[nextIndex]);
        }
      });
    });
  });

  // Subfiltro de cores da aba Brincos. Como os cards de brincos já estão
  // ordenados por preço no HTML e o filtro preserva a ordem do DOM, tanto
  // "todos" quanto cada cor exibem as peças do menor para o maior preço.
  if (colorFilterBar) {
    const groupColorTabs = Array.prototype.slice.call(colorFilterBar.querySelectorAll('.tab[data-color-filter]'));

    function activateColorTab(selectedTab) {
      currentColor = selectedTab.dataset.colorFilter;
      renderCatalog(currentFilter, 1);
    }

    groupColorTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activateColorTab(tab); });

      // Navegação por teclado dentro do grupo de cores (setas, Home e End)
      tab.addEventListener('keydown', function (event) {
        let nextIndex = null;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % groupColorTabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + groupColorTabs.length) % groupColorTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = groupColorTabs.length - 1;

        if (nextIndex !== null) {
          event.preventDefault();
          groupColorTabs[nextIndex].focus();
          activateColorTab(groupColorTabs[nextIndex]);
        }
      });
    });
  }

  var initialTab = tabs.filter(function (tab) { return tab.classList.contains('is-active'); })[0] || tabs[0];
  if (initialTab) renderCatalog(initialTab.dataset.filter, 1);

  var catalogResizeTimer;
  window.addEventListener('resize', function () {
    window.clearTimeout(catalogResizeTimer);
    catalogResizeTimer = window.setTimeout(function () {
      if (getPageSize() !== currentPageSize) renderCatalog(currentFilter, currentPage);
    }, 120);
  }, { passive: true });

  /* ------------------------------------------------------------------------
     5. CARRINHO E FINALIZAÇÃO DO PEDIDO PELO WHATSAPP
     O carrinho guarda apenas os nomes das peças no navegador: cada item é
     exclusivo, não tem quantidade e não fica reservado ao enviar o pedido.
     ------------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = '558399240346';
  const CART_STORAGE_KEY = 'perrengue-chic-cart-v1';
  const cartTrigger = document.getElementById('cart-trigger');
  const cartCount = document.getElementById('cart-count');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDialog = document.getElementById('cart-dialog');
  const cartItemsList = document.getElementById('cart-items');
  const cartEmptyMessage = document.getElementById('cart-empty');
  const cartTotalElement = document.getElementById('cart-total');
  const cartCheckoutButton = document.getElementById('cart-checkout');
  const cartCloseButton = document.querySelector('[data-cart-close]');
  const cartAddButtons = Array.prototype.slice.call(document.querySelectorAll('.cart-add-button[data-product]'));
  const pageMain = document.querySelector('main');
  const cartProducts = new Map();

  cards.forEach(function (card) {
    if (card.classList.contains('product-card--unavailable')) return;
    const priceElement = card.querySelector('.product-card__price-value');
    if (!priceElement || !card.dataset.product) return;
    const priceText = priceElement.textContent.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const price = Number(priceText);
    if (Number.isFinite(price)) cartProducts.set(card.dataset.product, { name: card.dataset.product, price: Math.round(price * 100) });
  });

  function readCart() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter(function (name, index) {
        return typeof name === 'string' && cartProducts.has(name) && saved.indexOf(name) === index;
      });
    } catch (error) {
      return [];
    }
  }

  let cart = readCart();
  let previouslyFocusedElement = null;

  function saveCart() {
    try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (error) { /* armazenamento local opcional */ }
  }

  function formatCurrency(cents) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  }

  function updateCartButtons() {
    cartAddButtons.forEach(function (button) {
      const isAdded = cart.indexOf(button.dataset.product) !== -1;
      button.textContent = isAdded ? 'No carrinho ✓' : 'Adicionar ao carrinho';
      button.classList.toggle('is-added', isAdded);
      button.disabled = isAdded;
      button.setAttribute('aria-pressed', String(isAdded));
    });
  }

  function renderCart() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    const products = cart.map(function (name) { return cartProducts.get(name); }).filter(Boolean);
    const total = products.reduce(function (sum, product) { return sum + product.price; }, 0);

    products.forEach(function (product) {
      const item = document.createElement('li');
      item.className = 'cart-item';
      const details = document.createElement('div');
      details.className = 'cart-item__details';
      const name = document.createElement('span');
      name.className = 'cart-item__name';
      name.textContent = product.name;
      const price = document.createElement('strong');
      price.className = 'cart-item__price';
      price.textContent = formatCurrency(product.price);
      details.appendChild(name);
      details.appendChild(price);

      const removeButton = document.createElement('button');
      removeButton.className = 'cart-item__remove';
      removeButton.type = 'button';
      removeButton.dataset.cartRemove = product.name;
      removeButton.setAttribute('aria-label', 'Remover ' + product.name + ' do carrinho');
      removeButton.textContent = 'Remover';
      item.appendChild(details);
      item.appendChild(removeButton);
      cartItemsList.appendChild(item);
    });

    if (cartEmptyMessage) cartEmptyMessage.hidden = products.length > 0;
    cartItemsList.hidden = products.length === 0;
    if (cartTotalElement) cartTotalElement.textContent = formatCurrency(total);
    if (cartCheckoutButton) cartCheckoutButton.disabled = products.length === 0;
    if (cartCount) cartCount.textContent = String(products.length);
    if (cartTrigger) cartTrigger.setAttribute('aria-label', 'Abrir carrinho, ' + products.length + (products.length === 1 ? ' produto' : ' produtos'));
    updateCartButtons();
  }

  function openCart() {
    if (!cartOverlay || !cartDialog) return;
    previouslyFocusedElement = document.activeElement;
    cartOverlay.hidden = false;
    document.body.classList.add('cart-open');
    if (pageMain) pageMain.setAttribute('inert', '');
    if (cartCloseButton) cartCloseButton.focus();
  }

  function closeCart() {
    if (!cartOverlay || cartOverlay.hidden) return;
    cartOverlay.hidden = true;
    document.body.classList.remove('cart-open');
    if (pageMain) pageMain.removeAttribute('inert');
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') previouslyFocusedElement.focus();
  }

  function buildCheckoutMessage(products) {
    const lines = products.map(function (product, index) {
      return (index + 1) + '. ' + product.name + ' — ' + formatCurrency(product.price);
    });
    const total = products.reduce(function (sum, product) { return sum + product.price; }, 0);
    return 'Olá, gostaria de finalizar a compra desses pedidos:\n\n' + lines.join('\n') +
      '\n\nTotal: ' + formatCurrency(total) + '\n\nAguardo confirmação de disponibilidade e informações de entrega.';
  }

  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartCloseButton) cartCloseButton.addEventListener('click', closeCart);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', function (event) {
      if (event.target === cartOverlay) closeCart();
    });
  }
  if (cartItemsList) {
    cartItemsList.addEventListener('click', function (event) {
      const removeButton = event.target.closest('[data-cart-remove]');
      if (!removeButton) return;
      cart = cart.filter(function (name) { return name !== removeButton.dataset.cartRemove; });
      saveCart();
      renderCart();
    });
  }
  cartAddButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const name = button.dataset.product;
      if (!cartProducts.has(name) || cart.indexOf(name) !== -1) return;
      cart.push(name);
      saveCart();
      renderCart();
    });
  });
  if (cartCheckoutButton) {
    cartCheckoutButton.addEventListener('click', function () {
      const products = cart.map(function (name) { return cartProducts.get(name); }).filter(Boolean);
      if (!products.length) return;
      const message = buildCheckoutMessage(products);
      const url = 'https://api.whatsapp.com/send/?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(message) + '&type=phone_number&app_absent=0';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
  if (cartDialog) {
    cartDialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCart();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.prototype.slice.call(cartDialog.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
  window.addEventListener('storage', function (event) {
    if (event.key !== CART_STORAGE_KEY) return;
    cart = readCart();
    renderCart();
  });
  renderCart();

  /* ------------------------------------------------------------------------
     6. ANIMAÇÃO DE ENTRADA AO ROLAR
     ------------------------------------------------------------------------ */
  // Cards do catálogo são controlados pelo renderCatalog (re-anima a cada
  // troca de página/filtro); o observer cuida das seções e títulos.
  const revealItems = document.querySelectorAll('.reveal:not(.product-card)');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------------
     7. DESTAQUE DA SEÇÃO ATUAL NA NAVEGAÇÃO
     ------------------------------------------------------------------------ */
  const sectionIds = Array.prototype.slice
    .call(document.querySelectorAll('main section[id]'))
    .map(function (section) { return section.id; });
  const navLinks = document.querySelectorAll('.navbar__links a[href^="#"]');

  if ('IntersectionObserver' in window && navLinks.length) {
    const navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sectionIds.forEach(function (id) {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     8. ANO ATUAL NO RODAPÉ
     ------------------------------------------------------------------------ */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------------
     9. HERO DINÂMICO: POEIRA DE OURO EM CANVAS
     Movimento discreto, pausado fora da tela e desligado com reduced-motion.
     ------------------------------------------------------------------------ */
  var heroSection = document.querySelector('.hero');
  var heroCanvas = document.getElementById('hero-particles');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroSection && heroCanvas && !reducedMotion) {
    var heroContext = null;

    try {
      heroContext = heroCanvas.getContext && heroCanvas.getContext('2d');
    } catch (error) {
      heroContext = null;
    }

    if (!heroContext) {
      heroCanvas.remove();
    } else {
      var particleWidth = 0;
      var particleHeight = 0;
      var heroInView = true;
      var animationFrame = null;
      var particles = [];
      var pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

      function createParticle() {
        return {
          x: Math.random() * particleWidth,
          y: Math.random() * particleHeight,
          radius: 0.8 + Math.random() * 2.1,
          velocityX: -0.08 + Math.random() * 0.16,
          velocityY: -0.035 + Math.random() * 0.11,
          phase: Math.random() * Math.PI * 2,
          speed: 0.45 + Math.random() * 0.7,
          depth: 0.35 + Math.random() * 0.65
        };
      }

      function resizeParticles() {
        var rect = heroSection.getBoundingClientRect();
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        particleWidth = Math.max(1, rect.width);
        particleHeight = Math.max(1, rect.height);
        heroCanvas.width = Math.round(particleWidth * ratio);
        heroCanvas.height = Math.round(particleHeight * ratio);
        heroCanvas.style.width = particleWidth + 'px';
        heroCanvas.style.height = particleHeight + 'px';
        heroContext.setTransform(ratio, 0, 0, ratio, 0, 0);

        var desired = Math.max(22, Math.min(52, Math.round(particleWidth / 30)));
        particles = Array.from({ length: desired }, createParticle);
      }

      function drawParticles(time) {
        animationFrame = null;
        pointer.x += (pointer.targetX - pointer.x) * 0.045;
        pointer.y += (pointer.targetY - pointer.y) * 0.045;
        heroContext.clearRect(0, 0, particleWidth, particleHeight);

        particles.forEach(function (particle) {
          particle.x += particle.velocityX * (0.5 + particle.depth * 0.7);
          particle.y += particle.velocityY;
          particle.phase += 0.012 * particle.speed;

          if (particle.x < -12) particle.x = particleWidth + 12;
          if (particle.x > particleWidth + 12) particle.x = -12;
          if (particle.y < -12) particle.y = particleHeight + 12;
          if (particle.y > particleHeight + 12) particle.y = -12;

          var twinkle = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(time * 0.0016 * particle.speed + particle.phase));
          var alpha = (0.12 + 0.32 * twinkle) * particle.depth;
          var drawX = particle.x + (pointer.x - 0.5) * 18 * particle.depth;
          var drawY = particle.y + (pointer.y - 0.5) * 12 * particle.depth;
          var gradient = heroContext.createRadialGradient(drawX, drawY, 0, drawX, drawY, particle.radius * 5);

          gradient.addColorStop(0, 'rgba(255, 238, 190, ' + alpha + ')');
          gradient.addColorStop(0.35, 'rgba(197, 160, 89, ' + (alpha * 0.72) + ')');
          gradient.addColorStop(1, 'rgba(197, 160, 89, 0)');
          heroContext.fillStyle = gradient;
          heroContext.beginPath();
          heroContext.arc(drawX, drawY, particle.radius * 5, 0, Math.PI * 2);
          heroContext.fill();
        });

        if (heroInView && !document.hidden) animationFrame = window.requestAnimationFrame(drawParticles);
      }

      function updateParticleLoop() {
        var shouldRun = heroInView && !document.hidden && !document.body.classList.contains('linktree-open');
        if (shouldRun && animationFrame === null) animationFrame = window.requestAnimationFrame(drawParticles);
        if (!shouldRun && animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      }

      if ('IntersectionObserver' in window) {
        var heroVisibilityObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { heroInView = entry.isIntersecting; });
          updateParticleLoop();
        }, { threshold: 0.01 });
        heroVisibilityObserver.observe(heroSection);
      }

      document.addEventListener('perrengue:intro-close', updateParticleLoop);
      window.addEventListener('resize', resizeParticles, { passive: true });
      document.addEventListener('visibilitychange', updateParticleLoop);
      heroSection.addEventListener('pointermove', function (event) {
        var rect = heroSection.getBoundingClientRect();
        pointer.targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
        pointer.targetY = (event.clientY - rect.top) / Math.max(rect.height, 1);
      }, { passive: true });
      heroSection.addEventListener('pointerleave', function () {
        pointer.targetX = 0.5;
        pointer.targetY = 0.5;
      });

      resizeParticles();
      updateParticleLoop();
    }
  } else if (heroCanvas) {
    heroCanvas.remove();
  }
});
