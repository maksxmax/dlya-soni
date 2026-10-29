/* ============================================================
   Любовная открытка «Для Сонечки» — логика
   Фон, конверт, сюрпризы, галерея, лайтбокс, секреты
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ============================================================
     1. Фон: падающие лепестки и искорки (canvas)
     ============================================================ */
  var canvas = document.getElementById("bg-canvas");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1, running = true, rafId = null;
  var petals = [], sparks = [];

  function initParticles() {
    var petalCount = W < 480 ? 20 : 32;
    var sparkCount = W < 480 ? 14 : 22;
    var i;
    petals = [];
    sparks = [];
    for (i = 0; i < petalCount; i++) {
      petals.push({
        x: rand(0, W),
        y: rand(-H, H),
        r: rand(5, 11),
        speed: rand(0.25, 0.8),
        sway: rand(0.3, 1.1),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.012, 0.012),
        hue: Math.random() < 0.5 ? "255,122,162" : "255,201,107",
        alpha: rand(0.16, 0.4)
      });
    }
    for (i = 0; i < sparkCount; i++) {
      sparks.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.8, 2.2),
        speed: rand(0.15, 0.5),
        alpha: rand(0.25, 0.7),
        tw: rand(0, Math.PI * 2)
      });
    }
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // бережём батарею iPhone
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
    if (prefersReduced) drawFrame();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    var i, p, s, a;
    for (i = 0; i < petals.length; i++) {
      p = petals[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = "rgba(" + p.hue + "," + p.alpha + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < sparks.length; i++) {
      s = sparks[i];
      a = s.alpha * (0.6 + 0.4 * Math.sin(s.tw));
      ctx.fillStyle = "rgba(255,220,160," + a + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function updateParticles() {
    var i, p, s;
    for (i = 0; i < petals.length; i++) {
      p = petals[i];
      p.y += p.speed;
      p.phase += 0.01;
      p.x += Math.sin(p.phase) * p.sway * 0.35;
      p.rot += p.rotSpeed;
      if (p.y > H + 24) { p.y = -24; p.x = rand(0, W); }
      if (p.x > W + 24) p.x = -24;
      if (p.x < -24) p.x = W + 24;
    }
    for (i = 0; i < sparks.length; i++) {
      s = sparks[i];
      s.y -= s.speed;
      s.tw += 0.03;
      if (s.y < -12) { s.y = H + 12; s.x = rand(0, W); }
    }
  }

  function loop() {
    if (!running) return;
    updateParticles();
    drawFrame();
    rafId = requestAnimationFrame(loop);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  if (!prefersReduced) {
    loop();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else {
        running = true;
        loop();
      }
    });
  }

  /* ============================================================
     2. Взрыв сердечек
     ============================================================ */
  var BURST_EMOJI = ["❤️", "💖", "💗", "✨", "💛", "🌸", "🧡"];

  function burst(x, y, count) {
    if (prefersReduced) return;
    count = count || 14;
    for (var i = 0; i < count; i++) {
      var el = document.createElement("span");
      el.className = "burst";
      el.textContent = BURST_EMOJI[Math.floor(Math.random() * BURST_EMOJI.length)];
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 140;
      el.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      el.style.setProperty("--dy", (Math.sin(angle) * dist - 45) + "px");
      el.style.setProperty("--rot", (Math.random() * 260 - 130) + "deg");
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.fontSize = (15 + Math.random() * 20) + "px";
      el.style.animationDuration = (0.8 + Math.random() * 0.7) + "s";
      document.body.appendChild(el);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1700);
      })(el);
    }
  }

  function burstFromEl(el, count) {
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  function vibrate(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  /* ============================================================
     3. Конверт / обложка
     ============================================================ */
  var cover = document.getElementById("cover");
  var envelope = document.getElementById("envelope");
  var openBtn = document.getElementById("open-btn");
  var opened = false;

  function openCard() {
    if (opened) return;
    opened = true;
    vibrate(15);
    envelope.classList.add("open");
    burstFromEl(envelope, 24);
    setTimeout(function () {
      cover.classList.add("hidden");
      document.body.classList.remove("locked");
    }, prefersReduced ? 250 : 1300);
  }

  openBtn.addEventListener("click", openCard);
  envelope.addEventListener("click", openCard);

  /* ============================================================
     4. Сюрпризы: переворот карточек
     ============================================================ */
  var flipCards = document.querySelectorAll(".flip-card");
  Array.prototype.forEach.call(flipCards, function (card) {
    card.addEventListener("click", function (ev) {
      card.classList.toggle("flipped");
      vibrate(10);
      burst(ev.clientX, ev.clientY, 12);
    });
  });

  /* ============================================================
     5. Галерея (собирается из js/photos.js)
     ============================================================ */
  var grid = document.getElementById("gallery-grid");
  var photos = (typeof PHOTOS !== "undefined" && PHOTOS.length) ? PHOTOS : [];

  photos.forEach(function (p, i) {
    var figure = document.createElement("figure");
    figure.className = "gallery-item reveal" + (p.wide ? " wide" : "") + (p.tall ? " tall" : "");
    figure.setAttribute("data-index", i);

    var img = document.createElement("img");
    img.src = p.src;
    img.alt = p.caption || ("Фото " + (i + 1));
    img.loading = i === 0 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("error", function () {
      figure.classList.add("img-missing");
      img.style.display = "none";
    });

    var cap = document.createElement("figcaption");
    cap.textContent = p.caption || "";

    figure.appendChild(img);
    figure.appendChild(cap);
    figure.addEventListener("click", function () { openLightbox(i); });
    grid.appendChild(figure);
  });

  /* ============================================================
     6. Лайтбокс смахивание пальцем
     ============================================================ */
  var lightbox = document.getElementById("lightbox");
  var lbMedia = document.getElementById("lb-media");
  var lbImg = document.getElementById("lb-img");
  var lbCaption = document.getElementById("lb-caption");
  var lbCounter = document.getElementById("lb-counter");
  var lbClose = document.getElementById("lb-close");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var lbIndex = 0;

  function showAt(i) {
    if (!photos.length) return;
    lbIndex = (i + photos.length) % photos.length;
    lbImg.style.opacity = "0";
    lbImg.style.transform = "scale(0.96)";
    setTimeout(function () {
      lbImg.src = photos[lbIndex].src;
      lbImg.alt = photos[lbIndex].caption || "";
      lbCaption.textContent = photos[lbIndex].caption || "";
      lbCounter.textContent = (lbIndex + 1) + " / " + photos.length;
      lbImg.style.opacity = "1";
      lbImg.style.transform = "none";
    }, prefersReduced ? 0 : 140);
  }

  function openLightbox(i) {
    showAt(i);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", function (e) { e.stopPropagation(); showAt(lbIndex - 1); });
  lbNext.addEventListener("click", function (e) { e.stopPropagation(); showAt(lbIndex + 1); });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* --- Свайпы (работает и без интернета, прямо на iPhone) --- */
  var tsX = 0, tsY = 0, tX = 0, tY = 0, dragging = false, moved = false;

  lbMedia.addEventListener("touchstart", function (e) {
    var t = e.touches[0];
    dragging = true;
    moved = false;
    tX = tY = 0;
    tsX = t.clientX;
    tsY = t.clientY;
    lbImg.style.transition = "none";
  }, { passive: true });

  lbMedia.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    var t = e.touches[0];
    tX = t.clientX - tsX;
    tY = t.clientY - tsY;
    if (Math.abs(tX) > Math.abs(tY)) {
      e.preventDefault(); // горизонтальный свайп — листаем фото
      lbImg.style.transform = "translateX(" + tX + "px)";
    } else {
      lbImg.style.transform = "translateY(" + (tY * 0.55) + "px)";
      lbImg.style.opacity = String(Math.max(0.4, 1 - Math.abs(tY) / 520));
    }
    if (Math.abs(tX) > 7 || Math.abs(tY) > 7) moved = true;
  }, { passive: false });

  lbMedia.addEventListener("touchend", function () {
    lbImg.style.transition = "";
    lbImg.style.opacity = "1";
    lbImg.style.transform = "";
    if (Math.abs(tX) > 60 && Math.abs(tX) > Math.abs(tY)) {
      showAt(lbIndex + (tX < 0 ? 1 : -1));
    } else if (tY > 110) {
      closeLightbox(); // свайп вниз закрывает
    } else if (!moved) {
      closeLightbox(); // простое касание тоже закрывает
    }
    dragging = false;
    tX = tY = 0;
  });

  /* --- Клавиатура (для удобства на десктопе) --- */
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showAt(lbIndex - 1);
    if (e.key === "ArrowRight") showAt(lbIndex + 1);
  });

  /* ============================================================
     7. Секретное солнышко (3 нажатия)
     ============================================================ */
  var sunBtn = document.getElementById("sun-btn");
  var sunProgress = document.getElementById("sun-progress");
  var secretOverlay = document.getElementById("secret-overlay");
  var secretClose = document.getElementById("secret-close");
  var sunTaps = 0;

  sunBtn.addEventListener("click", function (ev) {
    sunTaps++;
    vibrate(12);
    burst(ev.clientX, ev.clientY, 10);
    sunBtn.classList.remove("wiggle");
    void sunBtn.offsetWidth; // перезапуск анимации
    sunBtn.classList.add("wiggle");

    if (sunTaps === 1) {
      sunProgress.textContent = "ещё пару раз…";
    } else if (sunTaps === 2) {
      sunProgress.textContent = "ещё чуть-чуть…";
    } else {
      sunProgress.textContent = "";
      secretOverlay.classList.add("show");
      secretOverlay.setAttribute("aria-hidden", "false");
      burst(window.innerWidth / 2, window.innerHeight / 2, 28);
    }
  });

  function closeSecret() {
    secretOverlay.classList.remove("show");
    secretOverlay.setAttribute("aria-hidden", "true");
  }
  secretClose.addEventListener("click", closeSecret);
  secretOverlay.addEventListener("click", function (e) {
    if (e.target === secretOverlay) closeSecret();
  });

  /* ============================================================
     8. Финал: кнопка любви
     ============================================================ */
  var loveBtn = document.getElementById("love-btn");
  var loveResponse = document.getElementById("love-response");
  var loveMsgs = [
    "Я знал! ❤️ Ты только что сделала мой день.",
    "Снова? 😍 Мне нравится эта игра…",
    "Каждое нажатие — ещё одна причина любить тебя.",
    "Моё сердце уже переполнено 🥹",
    "Ладно, всё — ты победила, я весь твой ❤️"
  ];
  var loveTaps = 0;

  loveBtn.addEventListener("click", function (ev) {
    vibrate(20);
    burst(ev.clientX, ev.clientY, 28);
    loveResponse.textContent = loveMsgs[Math.min(loveTaps, loveMsgs.length - 1)];
    loveResponse.classList.add("show");
    if (loveTaps === 0) loveBtn.textContent = "Нажми ещё раз 😉";
    loveTaps++;
  });

  /* ============================================================
     9. Появление блоков при скролле
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -4% 0px" });

    Array.prototype.forEach.call(revealEls, function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.09 + "s";
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add("visible");
    });
  }
})();
