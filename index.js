(function () {
  'use strict';

  /* ---------- helpers ------------------------------------------------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initStickyHeader();
    initGallery();
    initCarousel();
    initProcessTabs();
    initFAQ();
    initForms();
    initNavbarBehavior();
    initMobileMenu();
    initSmoothScroll();
    initContactModal();
    initQuoteModal();  // <-- FIX: Added this line to initialize the modal
  }

  /* =========================================================================
     1. STICKY HEADER  (appears above navbar past first fold; hides on scroll up)
     ========================================================================= */
  function initStickyHeader() {
    const stickyBar  = $('#stickyBar');
    const navbar     = $('#navbar');
    const hero       = $('#hero');
    const mainImg    = $('#galleryMainImg');
    const thumbInBar = $('#stickyBarThumb');
    if (!stickyBar || !navbar || !hero) return;

    /* keep the small thumb in sticky bar synced with current main image */
    if (mainImg && thumbInBar) {
      thumbInBar.src = mainImg.src;
      const obs = new MutationObserver(() => { thumbInBar.src = mainImg.src; });
      obs.observe(mainImg, { attributes: true, attributeFilter: ['src'] });
    }

    let lastY    = window.scrollY;
    let ticking  = false;
    const trigger = () => Math.max(hero.offsetTop + hero.offsetHeight - 200, 400);

    const update = () => {
      const y          = window.scrollY;
      const scrollDown = y > lastY;
      const pastFold   = y > trigger();

      if (pastFold && scrollDown) {
        show();
      } else if (!pastFold || !scrollDown) {
        hide();
      }
      if (y < 80) hide();

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    function show() {
      if (stickyBar.classList.contains('is-visible')) return;
      stickyBar.classList.add('is-visible');
      stickyBar.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sticky-on');
    }
    function hide() {
      if (!stickyBar.classList.contains('is-visible')) return;
      stickyBar.classList.remove('is-visible');
      stickyBar.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sticky-on');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================================================================
     2. GALLERY  +  HOVER ZOOM (magnifier lens + side-panel preview)
     ========================================================================= */
 function initGallery() {
  const main     = $('#galleryMain');
  const mainImg  = $('#galleryMainImg');
  const lens     = $('#zoomLens');
  const result   = $('#zoomResult');
  const prevBtn  = $('#galleryPrev');
  const nextBtn  = $('#galleryNext');
  const thumbs   = $$('#galleryThumbs .gallery__thumb');
  
  if (!main || !mainImg) return;

  // Image pool
  const images = [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=900&q=85',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=85',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=85',
  ];

  let current = 0;

  function setImage(index) {
    current = (index + images.length) % images.length;
    mainImg.src = images[current];
    
    // Update thumbnails
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === current);
      const img = t.querySelector('img');
      if (img && images[i]) {
        img.src = images[i];
        img.alt = `Thumbnail ${i + 1}`;
      }
    });
    
    // Update zoom result background
    if (result) {
      result.style.backgroundImage = `url("${images[current]}")`;
    }
  }

  // Initialize thumbnails
  thumbs.forEach((thumb, i) => {
    const img = thumb.querySelector('img');
    if (img && images[i]) {
      img.src = images[i];
      img.alt = `Thumbnail ${i + 1}`;
    }
    thumb.addEventListener('click', () => setImage(i));
  });

  // Set initial image
  setImage(0);

  // Previous button click handler
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      setImage(current - 1);
    });
  }

  // Next button click handler
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      setImage(current + 1);
    });
  }

  // ========== ZOOM FUNCTIONALITY - ALWAYS ENABLED ==========
  if (lens && result) {
    let lensW = 0, lensH = 0;
    let bgW = 0, bgH = 0;

    function recalcSize() {
      const mainRect = main.getBoundingClientRect();
      const resultRect = result.getBoundingClientRect();
      const zoom = 2.5;
      lensW = resultRect.width / zoom;
      lensH = resultRect.height / zoom;
      lens.style.width = lensW + 'px';
      lens.style.height = lensH + 'px';
      bgW = mainRect.width * zoom;
      bgH = mainRect.height * zoom;
      result.style.backgroundSize = `${bgW}px ${bgH}px`;
    }

    function onEnter(e) {
      recalcSize();
      lens.style.display = 'block';
      result.classList.add('is-active');
      main.classList.add('is-zooming');
      // Update position on enter
      onMove(e);
    }

    function onLeave() {
      lens.style.display = 'none';
      result.classList.remove('is-active');
      main.classList.remove('is-zooming');
    }

    function onMove(e) {
      const rect = main.getBoundingClientRect();
      let x = e.clientX - rect.left - lensW / 2;
      let y = e.clientY - rect.top - lensH / 2;
      x = Math.max(0, Math.min(x, rect.width - lensW));
      y = Math.max(0, Math.min(y, rect.height - lensH));
      lens.style.left = x + 'px';
      lens.style.top = y + 'px';
      const px = (x / (rect.width - lensW)) * 100;
      const py = (y / (rect.height - lensH)) * 100;
      result.style.backgroundPosition = `${px}% ${py}%`;
    }

    main.addEventListener('mouseenter', onEnter);
    main.addEventListener('mouseleave', onLeave);
    main.addEventListener('mousemove', onMove);
  }
}

  /* =========================================================================
     3. APPLICATIONS CAROUSEL
     ========================================================================= */
  function initCarousel() {
    const viewport = $('#appCarouselViewport');
    const row      = $('#appCardsRow');
    const prevBtn  = $('#appPrev');
    const nextBtn  = $('#appNext');
    if (!viewport || !row || !prevBtn || !nextBtn) return;

    let offset = 0;

    function getStep() {
      const card = row.querySelector('.app-card');
      if (!card) return 400;
      const cardWidth = card.getBoundingClientRect().width;
      const styles    = getComputedStyle(row);
      const gap       = parseFloat(styles.gap) || 22;
      return cardWidth + gap;
    }

    function getMaxOffset() {
      const rowWidth = row.scrollWidth;
      const vpWidth  = viewport.clientWidth;
      return Math.max(0, rowWidth - vpWidth + 32);
    }

    function move(delta) {
      const step = getStep();
      offset = Math.min(getMaxOffset(), Math.max(0, offset + delta * step));
      row.style.transform = `translateX(${-offset}px)`;
      updateArrowState();
    }

    function updateArrowState() {
      prevBtn.style.opacity   = offset <= 0                 ? '0.45' : '1';
      nextBtn.style.opacity   = offset >= getMaxOffset()    ? '0.45' : '1';
      prevBtn.style.pointerEvents = offset <= 0              ? 'none' : 'auto';
      nextBtn.style.pointerEvents = offset >= getMaxOffset() ? 'none' : 'auto';
    }

    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move( 1));
    window.addEventListener('resize', () => {
      offset = Math.min(getMaxOffset(), offset);
      row.style.transform = `translateX(${-offset}px)`;
      updateArrowState();
    });

    updateArrowState();
  }

  /* =========================================================================
     4. PROCESS TABS
     ========================================================================= */
  function initProcessTabs() {
    const tabs   = $$('.process__tab');
    const panels = $$('.process__panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        panels.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
      });
    });
  }

   // Process Tabs Manager
  class ProcessTabs {
    constructor() {
      this.tabsMobile = document.querySelectorAll('.process__tab-mobile');
      this.tabsDesktop = document.querySelectorAll('.process__tab-desktop');
      this.panels = document.querySelectorAll('.process__panel');
      this.navPrevBtns = document.querySelectorAll('.process__nav-btn--prev');
      this.navNextBtns = document.querySelectorAll('.process__nav-btn--next');
      this.currentTab = 'raw';
      this.tabs = ['raw', 'extrusion', 'cooling', 'sizing', 'quality', 'marking', 'cutting', 'packaging'];
 
      this.init();
    }
 
    init() {
      // Mobile tabs
      this.tabsMobile.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabName = e.currentTarget.dataset.tab;
          this.switchTab(tabName);
        });
      });
 
      // Desktop tabs
      this.tabsDesktop.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabName = e.currentTarget.dataset.tab;
          this.switchTab(tabName);
        });
      });
 
      // Navigation buttons
      this.navPrevBtns.forEach(btn => {
        btn.addEventListener('click', () => this.previousTab());
      });
 
      this.navNextBtns.forEach(btn => {
        btn.addEventListener('click', () => this.nextTab());
      });
    }
 
    switchTab(tabName) {
      // Remove active class from all tabs
      this.tabsMobile.forEach(tab => tab.classList.remove('active'));
      this.tabsDesktop.forEach(tab => tab.classList.remove('active'));
      this.panels.forEach(panel => panel.classList.remove('active'));
 
      // Add active class to selected tab and panel
      document.querySelector(`[data-tab="${tabName}"].process__tab-mobile`)?.classList.add('active');
      document.querySelector(`[data-tab="${tabName}"].process__tab-desktop`)?.classList.add('active');
      document.getElementById(`panel-${tabName}`)?.classList.add('active');
 
      this.currentTab = tabName;
    }
 
    previousTab() {
      const currentIndex = this.tabs.indexOf(this.currentTab);
      if (currentIndex > 0) {
        this.switchTab(this.tabs[currentIndex - 1]);
      }
    }
 
    nextTab() {
      const currentIndex = this.tabs.indexOf(this.currentTab);
      if (currentIndex < this.tabs.length - 1) {
        this.switchTab(this.tabs[currentIndex + 1]);
      }
    }
  }
 
  // Initialize
  new ProcessTabs();

  /* =========================================================================
     5. FAQ (one open at a time)
     ========================================================================= */
  function initFAQ() {
    const items = $$('.faq-item');
    items.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach(other => { if (other !== item) other.open = false; });
        }
      });
    });
  }

  /* =========================================================================
     6. FORMS  (catalogue + contact)
     ========================================================================= */
  function initForms() {
    const cat = $('#catalogueForm');
    if (cat) {
      cat.addEventListener('submit', e => {
        e.preventDefault();
        const input = cat.querySelector('.input-email');
        if (!input.value || !/.+@.+\..+/.test(input.value)) {
          toast('Please enter a valid email address.', 'error');
          return;
        }
        toast(`Catalogue requested for ${input.value} ✓`);
        input.value = '';
      });
    }

    /* =========================================================================
   11. CONTACT US MODAL
   ========================================================================= */


    const contact = $('#contactForm');
    if (contact) {
      contact.addEventListener('submit', e => {
        e.preventDefault();
        const inputs = contact.querySelectorAll('[required]');
        let valid = true;
        inputs.forEach(i => { if (!i.value.trim()) valid = false; });
        if (!valid) { toast('Please fill all required fields.', 'error'); return; }
        toast('Quote request submitted! We will contact you shortly.');
        contact.reset();
      });
    }
  }

  /* =========================================================================
     7. NAVBAR SCROLL STATE (subtle shadow on scroll) + dropdown
     ========================================================================= */
  function initNavbarBehavior() {
    const navbar = $('#navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Dropdown click-toggle (in addition to hover for desktop) */
    const dropdown = $('.navbar__dropdown');
    const dropBtn  = $('.navbar__dropdown-btn');
    if (dropdown && dropBtn) {
      dropBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('is-open');
        dropBtn.setAttribute('aria-expanded', dropdown.classList.contains('is-open'));
      });
      document.addEventListener('click', e => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('is-open');
          dropBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* =========================================================================
     8. MOBILE MENU
     ========================================================================= */
  function initMobileMenu() {
    const btn = $('#hamburger');
    const nav = $('.navbar__nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-mobile-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* =========================================================================
     9. SMOOTH SCROLL for in-page anchors
     ========================================================================= */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }


  // ===============================
  // Application Carousel Functionality
  const appCarouselViewport = document.getElementById('appCarouselViewport');
  const appCardsRow = document.getElementById('appCardsRow');
  const appPrevBtn = document.getElementById('appPrev');
  const appNextBtn = document.getElementById('appNext');
 
  let appScrollPosition = 0;
 
  appPrevBtn.addEventListener('click', () => {
    const cardWidth = appCardsRow.querySelector('.app-card').offsetWidth + 24; // Including gap
    appScrollPosition = Math.max(appScrollPosition - cardWidth, 0);
    appCardsRow.style.transform = `translateX(-${appScrollPosition}px)`;
  });
 
  appNextBtn.addEventListener('click', () => {
    const cardWidth = appCardsRow.querySelector('.app-card').offsetWidth + 24;
    const maxScroll = appCardsRow.scrollWidth - appCarouselViewport.offsetWidth;
    appScrollPosition = Math.min(appScrollPosition + cardWidth, maxScroll);
    appCardsRow.style.transform = `translateX(-${appScrollPosition}px)`;
  });

  /* =========================================================================
     10. TOAST notifications
     ========================================================================= */
  function toast(message, type = 'success') {
    const container = $('#toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.classList.add('is-leaving'), 2600);
    setTimeout(() => el.remove(), 3000);
  }


    // Testimonial Carousel Functionality
  const testimonialCarouselViewport = document.getElementById('testimonialCarouselViewport');
  const testimonialCardsRow = document.getElementById('testimonialCardsRow');
  const testPrevBtn = document.getElementById('testPrev');
  const testNextBtn = document.getElementById('testNext');
 
  let testimonialScrollPosition = 0;
 
  testPrevBtn.addEventListener('click', () => {
    const cardWidth = testimonialCardsRow.querySelector('.testimonial-card').offsetWidth + 24; // Including gap
    testimonialScrollPosition = Math.max(testimonialScrollPosition - cardWidth, 0);
    testimonialCardsRow.style.transform = `translateX(-${testimonialScrollPosition}px)`;
  });
 
  testNextBtn.addEventListener('click', () => {
    const cardWidth = testimonialCardsRow.querySelector('.testimonial-card').offsetWidth + 24;
    const maxScroll = testimonialCardsRow.scrollWidth - testimonialCarouselViewport.offsetWidth;
    testimonialScrollPosition = Math.min(testimonialScrollPosition + cardWidth, maxScroll);
    testimonialCardsRow.style.transform = `translateX(-${testimonialScrollPosition}px)`;
  });


   // Global Modal Controller
  class GlobalModal {
    constructor() {
      this.modal = document.getElementById('globalModal');
      this.overlay = document.getElementById('modalOverlay');
      this.closeBtn = document.getElementById('modalClose');
      this.titleEl = document.getElementById('modalTitle');
      this.descriptionEl = document.getElementById('modalDescription');
      this.actionsEl = document.getElementById('modalActions');
      this.primaryBtn = document.getElementById('modalPrimaryBtn');
      this.secondaryBtn = document.getElementById('modalSecondaryBtn');
 
      this.init();
    }
 
    init() {
      // Close button
      this.closeBtn.addEventListener('click', () => this.close());
      
      // Overlay click
      this.overlay.addEventListener('click', () => this.close());
      
      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('modal--active')) {
          this.close();
        }
      });
    }
 
    open(options = {}) {
      const {
        title = 'Modal Title',
        description = 'Modal content goes here',
        primaryBtnText = 'Continue',
        secondaryBtnText = 'Cancel',
        primaryBtnCallback = null,
        secondaryBtnCallback = null,
        showSecondaryBtn = true,
        onClose = null
      } = options;
 
      // Set content
      this.titleEl.textContent = title;
      this.descriptionEl.textContent = description;
      this.primaryBtn.textContent = primaryBtnText;
      this.secondaryBtn.textContent = secondaryBtnText;
 
      // Show/hide secondary button
      if (showSecondaryBtn) {
        this.secondaryBtn.style.display = 'block';
      } else {
        this.secondaryBtn.style.display = 'none';
      }
 
      // Remove old event listeners
      this.primaryBtn.onclick = null;
      this.secondaryBtn.onclick = null;
 
      // Add new callbacks
      if (primaryBtnCallback) {
        this.primaryBtn.addEventListener('click', () => {
          primaryBtnCallback();
          this.close();
        });
      } else {
        this.primaryBtn.addEventListener('click', () => this.close());
      }
 
      if (secondaryBtnCallback) {
        this.secondaryBtn.addEventListener('click', () => {
          secondaryBtnCallback();
          this.close();
        });
      } else {
        this.secondaryBtn.addEventListener('click', () => this.close());
      }
 
      // Store close callback
      this.onCloseCallback = onClose;
 
      // Show modal
      this.modal.classList.add('modal--active');
      document.body.style.overflow = 'hidden';
    }
 
    close() {
      this.modal.classList.remove('modal--active');
      document.body.style.overflow = 'auto';
 
      // Call close callback if provided
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    }
 
    // Quick methods for common use cases
    success(title, description, callback) {
      this.open({
        title,
        description,
        primaryBtnText: 'OK',
        showSecondaryBtn: false,
        primaryBtnCallback: callback
      });
    }
 
    error(title, description, callback) {
      this.open({
        title,
        description,
        primaryBtnText: 'OK',
        showSecondaryBtn: false,
        primaryBtnCallback: callback
      });
    }
 
    confirm(title, description, onConfirm, onCancel) {
      this.open({
        title,
        description,
        primaryBtnText: 'Confirm',
        secondaryBtnText: 'Cancel',
        primaryBtnCallback: onConfirm,
        secondaryBtnCallback: onCancel,
        showSecondaryBtn: true
      });
    }
 
    custom(title, description, primaryBtnText, secondaryBtnText, onPrimary, onSecondary) {
      this.open({
        title,
        description,
        primaryBtnText,
        secondaryBtnText,
        primaryBtnCallback: onPrimary,
        secondaryBtnCallback: onSecondary,
        showSecondaryBtn: true
      });
    }
  }

  function initContactModal() {
    const modal     = document.getElementById('contactModal');
    const overlay   = document.getElementById('contactModalOverlay');
    const closeBtn  = document.getElementById('contactModalClose');
    const openBtn   = document.getElementById('contactUsBtn');
    const form      = document.getElementById('contactModalForm');
    if (!modal || !openBtn) return;

    function openModal() {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => modal.querySelector('.modal__input').focus(), 100);
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nameInput  = document.getElementById('modalName');
      const emailInput = document.getElementById('modalEmail');
      let valid = true;

      [nameInput, emailInput].forEach(i => i.classList.remove('is-error'));

      if (!nameInput.value.trim()) { nameInput.classList.add('is-error'); valid = false; }
      if (!emailInput.value || !/.+@.+\..+/.test(emailInput.value)) { emailInput.classList.add('is-error'); valid = false; }
      if (!valid) return;

      toast(`Thanks ${nameInput.value.split(' ')[0]}! We'll be in touch soon.`);
      form.reset();
      closeModal();
    });
  } 
  
  function initQuoteModal() {
    const modal     = document.getElementById('quoteModal');
    const overlay   = document.getElementById('quoteModalOverlay');
    const closeBtn  = document.getElementById('quoteModalClose');
    const openBtn   = document.getElementById('quoteBtn');
    const form      = document.getElementById('quoteModalForm');
    if (!modal || !openBtn) return;

    function openModal() {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => modal.querySelector('.modal__input').focus(), 100);
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nameInput  = document.getElementById('modalName');
      const emailInput = document.getElementById('modalEmail');
      let valid = true;

      [nameInput, emailInput].forEach(i => i.classList.remove('is-error'));

      if (!nameInput.value.trim()) { nameInput.classList.add('is-error'); valid = false; }
      if (!emailInput.value || !/.+@.+\..+/.test(emailInput.value)) { emailInput.classList.add('is-error'); valid = false; }
      if (!valid) return;

      toast(`Thanks ${nameInput.value.split(' ')[0]}! We'll be in touch soon.`);
      form.reset();
      closeModal();
    });
  }
 
  // Initialize global modal
  const globalModal = new GlobalModal();
 
  // Export to window for global use
  window.Modal = globalModal;

})();