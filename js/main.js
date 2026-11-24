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
     4. FILTRO DO CATÁLOGO EM TEMPO REAL
     Cada card define sua categoria em data-category. Para criar uma nova
     categoria, adicione um botão .tab com data-filter igual ao valor usado
     nos cards (ex.: data-filter="colares").
     ------------------------------------------------------------------------ */
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-filter]'));
  const cards = Array.prototype.slice.call(document.querySelectorAll('.product-card'));
  const emptyStates = Array.prototype.slice.call(document.querySelectorAll('.coming-soon[data-category]'));
  const grid = document.getElementById('grade-produtos');
  const productCount = document.getElementById('product-count');
  const countNumeric = document.querySelector('.catalog__count-numeric');
  const countSoon = document.querySelector('.catalog__count-soon');

  function activateTab(selectedTab) {
    tabs.forEach(function (tab) {
      const isActive = tab === selectedTab;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    const filter = selectedTab.dataset.filter;
    let visible = 0;

    cards.forEach(function (card) {
      const matches = filter === 'todos' || card.dataset.category === filter;
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    // As categorias sem peças mostram apenas o aviso "Novidades em breve".
    emptyStates.forEach(function (state) {
      state.hidden = filter === 'todos' || state.dataset.category !== filter;
    });

    if (grid) grid.setAttribute('aria-labelledby', selectedTab.id);
    if (productCount) productCount.textContent = String(visible);
    if (countNumeric && countSoon) {
      const showSoon = visible === 0 && filter !== 'todos';
      countNumeric.hidden = showSoon;
      countSoon.hidden = !showSoon;
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activateTab(tab); });

    // Navegação por teclado recomendada para o padrão de abas (setas, Home e End)
    tab.addEventListener('keydown', function (event) {
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      }
    });
  });

  /* ------------------------------------------------------------------------
     5. LINKS DO WHATSAPP
     O texto é montado a partir de data-product. Basta duplicar um card e
     alterar esse atributo que o link já sai com a mensagem correta.
     ------------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = '5583996158687';

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
