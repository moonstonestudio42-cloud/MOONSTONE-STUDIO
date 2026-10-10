(function () {
  'use strict';

  /* ===== SETTINGS ===== */
  // Google Apps Script web-app URLs. Leave a URL empty ("") to send that form via WhatsApp instead.
  var APPOINTMENT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyR72x7cnF7FkHsb2IFh0prqLxcNfBSco7IRjnUg9N2KIpD4s_dXmlLp247OKwtNqY7/exec";
  var CLASS_SHEET_URL       = "https://script.google.com/macros/s/AKfycbxMl4_a-EsuY0egxUrTms3r4BGoSOatUDwxIuZ2qzaQEJ1cNY3vp_w_sB5NWpbxLPcb/exec";
  var WHATSAPP_NUMBER       = "917358282937";
  /* ==================== */

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // Service tabs
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.grid').forEach(function (g) { g.classList.remove('active'); });
      $$('.tab').forEach(function (x) { x.classList.remove('active'); });
      $('#tab-' + t.dataset.tab).classList.add('active');
      t.classList.add('active');
    });
  });

  // Scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  // Navbar shadow on scroll
  var nav = $('#navbar');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var burger = $('#hamburger'), links = $('#navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Toast
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4500);
  }

  // Block past dates in the date pickers
  var now = new Date();
  var today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  $$('input[type="date"]').forEach(function (d) { d.min = today; });

  // Field names -> keys expected by the Google Apps Script
  var FIELD_MAP = {
    apptForm:  { fn: 'firstName', ln: 'lastName', ph: 'phone', sv: 'service', dt: 'preferredDate', tm: 'preferredTime', nt: 'specialRequest' },
    classForm: { nm: 'fullName', ph: 'phone', em: 'email', ag: 'age', co: 'course', lv: 'experienceLevel', bt: 'preferredBatch', sd: 'preferredStartDate', nt: 'message' }
  };
  var OPTIONAL = ['nt', 'em', 'ag'];

  function clearForm(form) {
    form.querySelectorAll('input,textarea').forEach(function (el) { el.value = ''; });
    form.querySelectorAll('select').forEach(function (el) { el.selectedIndex = 0; });
  }

  function sendWhatsApp(title, lines) {
    var text = '*' + title + ' - Moonstone Studio*\n' + lines.join('\n');
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  function submitForm(id, title, btn) {
    var form = document.getElementById(id);
    var isClass = id === 'classForm';
    var url = isClass ? CLASS_SHEET_URL : APPOINTMENT_SHEET_URL;
    var map = FIELD_MAP[id];
    var data = { formType: title };
    var lines = [];
    var ok = true, firstBad = null, message = 'Please fill in all required fields';

    form.querySelectorAll('input,select,textarea').forEach(function (el) {
      var label = el.closest('.fg').querySelector('label').textContent.replace(/\s*\(optional\)/, '').trim();
      var value = el.value.trim();
      var bad = !value && OPTIONAL.indexOf(el.name) === -1;

      if (value && el.name === 'ph' && value.replace(/\D/g, '').length < 10) { bad = true; message = 'Please enter a valid phone number'; }
      if (value && el.name === 'em' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { bad = true; message = 'Please enter a valid email address'; }
      if (value && el.name === 'dt' && new Date(value + 'T00:00').getDay() === 0) { bad = true; message = "We're closed on Sundays. Please pick another date"; }

      el.classList.toggle('invalid', bad);
      if (bad) { ok = false; if (!firstBad) firstBad = el; }

      data[map[el.name]] = value;
      if (value) lines.push(label + ': ' + value);
    });

    if (!ok) { toast(message); if (firstBad) firstBad.focus(); return; }

    var success = function () {
      toast('✦ ' + title + ' received — we\'ll confirm shortly!');
      clearForm(form);
    };

    // No sheet URL set: send via WhatsApp
    if (!url) { sendWhatsApp(title, lines); success(); return; }

    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    // text/plain avoids a CORS preflight, which Google Apps Script does not support
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var result = null;
        try { result = JSON.parse(text); } catch (e) { /* non-JSON reply still counts as delivered */ }
        if (result && result.success === false) throw new Error(result.message || 'Rejected by sheet');
        success();
      })
      .catch(function (err) {
        console.error('Form submit error:', err);
        toast('Could not send online. Opening WhatsApp instead...');
        sendWhatsApp(title, lines);
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  $$('[data-submit]').forEach(function (btn) {
    btn.addEventListener('click', function () { submitForm(btn.dataset.submit, btn.dataset.title, btn); });
  });

  // Remove the red border as soon as a field is edited
  $$('.fg input,.fg select,.fg textarea').forEach(function (el) {
    ['input', 'change'].forEach(function (ev) { el.addEventListener(ev, function () { el.classList.remove('invalid'); }); });
  });
})();
