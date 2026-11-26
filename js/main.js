/* ==========================================================================
   PERRENGUE CHIC: INTERAÇÕES (JavaScript Vanilla)
   1. Barra de progresso   2. Carrossel de banners   3. Menu mobile
   4. Filtro do catálogo   5. Links do WhatsApp   6. Animação de entrada
   7. Navegação ativa   8. Ano no rodapé
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

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
     seis peças por vez; quando há mais, a navegação de páginas aparece no
     fim da seção, acima dos botões de categoria.
     ------------------------------------------------------------------------ */
  var PAGE_SIZE = 6;
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
  const tabGroups = Array.prototype.slice.call(document.querySelectorAll('.tabs'));
  let currentFilter = 'todos';
  let currentPage = 1;

  function getMatchingCards(filter) {
    return cards.filter(function (card) {
      return filter === 'todos' || card.dataset.category === filter;
    });
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
    const matchingCards = getMatchingCards(filter);
    const totalPages = Math.max(1, Math.ceil(matchingCards.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(page || 1, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const visibleCards = matchingCards.slice(start, start + PAGE_SIZE);

    cards.forEach(function (card) { card.hidden = visibleCards.indexOf(card) === -1; });

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
    updateTabs(filter);
    renderPagination(totalPages, safePage);
  }

  function goToPage(page) {
    renderCatalog(currentFilter, page);
    scrollToGrid();
  }

  function activateTab(selectedTab) {
    const filter = selectedTab.dataset.filter;
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
      var matchingCards = getMatchingCards(currentFilter);
      var totalPages = Math.ceil(matchingCards.length / PAGE_SIZE);
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

  var initialTab = tabs.filter(function (tab) { return tab.classList.contains('is-active'); })[0] || tabs[0];
  if (initialTab) renderCatalog(initialTab.dataset.filter, 1);

  /* ------------------------------------------------------------------------
     5. LINKS DO WHATSAPP
     O texto é montado a partir de data-product. Basta duplicar um card e
     alterar esse atributo que o link já sai com a mensagem correta.
     ------------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = '558399240346';

  function buildWhatsappLink(productName) {
    const message = 'Olá! Tenho interesse na peça ' + productName + ' da coleção de Natal!';
    return 'https://api.whatsapp.com/send/?phone=' + WHATSAPP_NUMBER +
      '&text=' + encodeURIComponent(message) +
      '&type=phone_number&app_absent=0&utm_source=ig';
  }

  document.querySelectorAll('a.whatsapp-link[data-product]').forEach(function (link) {
    link.href = buildWhatsappLink(link.dataset.product);
  });

  /* ------------------------------------------------------------------------
     6. ANIMAÇÃO DE ENTRADA AO ROLAR
     ------------------------------------------------------------------------ */
  const revealItems = document.querySelectorAll('.reveal');

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
});
