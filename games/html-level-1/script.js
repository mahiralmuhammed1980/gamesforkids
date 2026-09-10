(function () {
  "use strict";

  /* ================= DATA POOLS ================= */

  var WORD_BANK = [
    { tag: "h1", word: "شمس", emoji: "☀️" },
    { tag: "p", word: "قطة", emoji: "🐱" },
    { tag: "h2", word: "نجمة", emoji: "⭐" },
    { tag: "p", word: "كتاب", emoji: "📚" },
    { tag: "h1", word: "شجرة", emoji: "🌳" },
    { tag: "p", word: "وردة", emoji: "🌹" },
    { tag: "h2", word: "سمكة", emoji: "🐟" },
    { tag: "p", word: "قمر", emoji: "🌙" },
    { tag: "h1", word: "بيت", emoji: "🏠" },
    { tag: "p", word: "نحلة", emoji: "🐝" },
    { tag: "h3", word: "فراشة", emoji: "🦋" },
    { tag: "h3", word: "دب", emoji: "🐻" }
  ];

  var SIZE_VARIANTS = [
    { icons: ["🐘", "🐕", "🐭"] },
    { icons: ["🚌", "🚗", "🚲"] },
    { icons: ["🌳", "🌿", "🌱"] },
    { icons: ["🏔️", "🏕️", "🪨"] },
    { icons: ["☀️", "⭐", "✨"] }
  ];

  var STRUCT_VARIANTS = [
    { headingText: "قصة الأرنب 🐰", imageEmoji: "🖼️" },
    { headingText: "رحلة الفضاء 🚀", imageEmoji: "🪐" },
    { headingText: "عالم البحار 🌊", imageEmoji: "🐠" },
    { headingText: "غابة الحيوانات 🌲", imageEmoji: "🦉" },
    { headingText: "يوم بالحديقة 🌼", imageEmoji: "🌻" }
  ];

  /* ================= HELPERS ================= */

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pickIndex(poolLength, storageKey, excludeIndex) {
    var last = null;
    try {
      var raw = localStorage.getItem(storageKey);
      last = raw === null ? null : parseInt(raw, 10);
    } catch (e) {}

    var candidates = [];
    for (var i = 0; i < poolLength; i++) {
      if (i === last) continue;
      if (excludeIndex !== null && excludeIndex !== undefined && i === excludeIndex) continue;
      candidates.push(i);
    }
    if (candidates.length === 0) {
      candidates = [];
      for (var k = 0; k < poolLength; k++) {
        if (k !== last) candidates.push(k);
      }
    }
    if (candidates.length === 0) candidates = [0];

    var choice = candidates[Math.floor(Math.random() * candidates.length)];
    try {
      localStorage.setItem(storageKey, String(choice));
    } catch (e) {}
    return choice;
  }

  /* ================= UI HELPERS ================= */

  var STAGE = document.getElementById("stage");
  var mascotEl = document.getElementById("mascot");
  var toastEl = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1500);
  }

  function mascotHappy() {
    mascotEl.classList.remove("oops");
    mascotEl.classList.add("happy");
    setTimeout(function () {
      mascotEl.classList.remove("happy");
    }, 900);
  }

  function mascotOops() {
    mascotEl.classList.remove("happy");
    mascotEl.classList.add("oops");
    setTimeout(function () {
      mascotEl.classList.remove("oops");
    }, 450);
  }

  function updateProgressUI(currentIndex, doneIndexes) {
    var steps = document.querySelectorAll(".progress-track .step");
    steps.forEach(function (st, i) {
      st.classList.toggle("active", i === currentIndex);
      st.classList.toggle("done", doneIndexes.indexOf(i) > -1);
    });
  }

  function launchConfetti() {
    var colors = ["#428177", "#b9a779", "#054239", "#6b1f2a", "#edebe0"];
    for (var i = 0; i < 26; i++) {
      (function () {
        var c = document.createElement("div");
        c.className = "confetti";
        c.style.left = Math.random() * 100 + "vw";
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = 2 + Math.random() * 1.5 + "s";
        c.style.opacity = 0.7 + Math.random() * 0.3;
        document.body.appendChild(c);
        setTimeout(function () {
          c.remove();
        }, 4000);
      })();
    }
  }

  /* ================= DRAG ENGINE ================= */

  var ON_CORRECT = function () {};

  function makePieceDraggable(piece, tray) {
    piece.addEventListener("pointerdown", function (e) {
      if (piece.classList.contains("placed")) return;
      e.preventDefault();

      var startRect = piece.getBoundingClientRect();
      var offsetX = e.clientX - startRect.left;
      var offsetY = e.clientY - startRect.top;
      var startParent = piece.parentElement;
      var startNext = piece.nextSibling;

      try {
        piece.setPointerCapture(e.pointerId);
      } catch (err) {}

      piece.classList.add("dragging");
      piece.style.position = "fixed";
      piece.style.width = startRect.width + "px";
      piece.style.height = startRect.height + "px";
      piece.style.left = startRect.left + "px";
      piece.style.top = startRect.top + "px";
      piece.style.zIndex = 1000;

      function onMove(ev) {
        piece.style.left = ev.clientX - offsetX + "px";
        piece.style.top = ev.clientY - offsetY + "px";
      }

      function resetStyle() {
        piece.style.position = "";
        piece.style.left = "";
        piece.style.top = "";
        piece.style.width = "";
        piece.style.height = "";
        piece.style.zIndex = "";
        piece.classList.remove("dragging");
      }

      function returnToTray() {
        if (startNext) {
          startParent.insertBefore(piece, startNext);
        } else {
          startParent.appendChild(piece);
        }
      }

      function onUp(ev) {
        piece.removeEventListener("pointermove", onMove);
        piece.removeEventListener("pointerup", onUp);
        piece.removeEventListener("pointercancel", onUp);

        piece.style.visibility = "hidden";
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        piece.style.visibility = "";

        var slot = under ? under.closest(".slot") : null;

        if (slot && !slot.classList.contains("filled") && slot.dataset.id === piece.dataset.correct) {
          resetStyle();
          slot.appendChild(piece);
          piece.classList.add("placed");
          piece.classList.add("correct-pop");
          slot.classList.add("filled");
          if (piece.dataset.stretch === "true") {
            piece.style.width = "100%";
            piece.style.height = "100%";
          }
          setTimeout(function () {
            piece.classList.remove("correct-pop");
          }, 400);
          ON_CORRECT(slot, piece);
        } else if (slot && !slot.classList.contains("filled")) {
          resetStyle();
          returnToTray();
          piece.classList.add("wrong-shake");
          setTimeout(function () {
            piece.classList.remove("wrong-shake");
          }, 400);
          mascotOops();
        } else {
          resetStyle();
          returnToTray();
        }
      }

      piece.addEventListener("pointermove", onMove);
      piece.addEventListener("pointerup", onUp);
      piece.addEventListener("pointercancel", onUp);
    });
  }

  /* ================= GAME STATE ================= */

  var state = { index: 0, correctCount: 0, needed: 0, done: [] };

  function registerCorrect() {
    state.correctCount++;
    mascotHappy();
    if (state.correctCount >= state.needed) {
      state.done.push(state.index);
      updateProgressUI(state.index, state.done);
      showToast("أحسنت! 🎉");
      setTimeout(nextChallenge, 1000);
    }
  }

  function nextChallenge() {
    state.index++;
    if (state.index >= RENDERERS.length) {
      showComplete();
      return;
    }
    updateProgressUI(state.index, state.done);
    RENDERERS[state.index]();
  }

  /* ================= CHALLENGE 1 : horizontal build ================= */

  function renderChallenge1() {
    state.needed = 3;
    state.correctCount = 0;

    var idx = pickIndex(WORD_BANK.length, "mubarmij_html1_c1");
    var variant = WORD_BANK[idx];

    STAGE.innerHTML =
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">🧩 رتّب قطع الكود</h2>' +
      '<p class="challenge-hint">اسحب القطع الثلاث ورتبها بمكانها الصحيح</p>' +
      '<div class="code-strip">' +
      '<div class="slot" data-id="open"></div>' +
      '<div class="slot" data-id="content"></div>' +
      '<div class="slot" data-id="close"></div>' +
      "</div>" +
      '<div class="preview-panel">' +
      '<div class="preview-bar"><span></span><span></span><span></span></div>' +
      '<div class="preview-body" id="previewBody"><span class="placeholder">المعاينة هنا...</span></div>' +
      "</div>" +
      '<div class="tray" id="tray"></div>' +
      "</section>";

    var tray = document.getElementById("tray");
    var pieces = [
      { text: "<" + variant.tag + ">", cls: "piece-open", correct: "open" },
      { text: variant.word, cls: "piece-content", correct: "content" },
      { text: "</" + variant.tag + ">", cls: "piece-close", correct: "close" }
    ];
    shuffle(pieces);

    pieces.forEach(function (p) {
      var el = document.createElement("div");
      el.className = "piece " + p.cls;
      el.dataset.correct = p.correct;
      el.textContent = p.text;
      tray.appendChild(el);
      makePieceDraggable(el, tray);
    });

    ON_CORRECT = function () {
      updatePreview1(variant);
      registerCorrect();
    };

    updatePreview1(variant);
  }

  function updatePreview1(variant) {
    var body = document.getElementById("previewBody");
    if (!body) return;
    var openFilled = document.querySelector('.slot[data-id="open"]').classList.contains("filled");
    var contentFilled = document.querySelector('.slot[data-id="content"]').classList.contains("filled");
    var closeFilled = document.querySelector('.slot[data-id="close"]').classList.contains("filled");

    if (!contentFilled) {
      body.innerHTML = '<span class="placeholder">المعاينة هنا...</span>';
      return;
    }
    var cls = openFilled ? "rendered-" + variant.tag : "rendered-p";
    var span = document.createElement("span");
    span.className = cls + (closeFilled ? " sealed" : "");
    span.textContent = variant.word + " " + variant.emoji;
    body.innerHTML = "";
    body.appendChild(span);
  }

  /* ================= CHALLENGE 2 : vertical build ================= */

  function renderChallenge2() {
    var subtype = pickIndex(2, "mubarmij_html1_c2type");
    if (subtype === 0) {
      renderChallenge2Sizes();
    } else {
      renderChallenge2Struct();
    }
  }

  function renderChallenge2Sizes() {
    state.needed = 3;
    state.correctCount = 0;

    var idx = pickIndex(SIZE_VARIANTS.length, "mubarmij_html1_c2sizes");
    var variant = SIZE_VARIANTS[idx];

    STAGE.innerHTML =
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">📏 من الأكبر للأصغر</h2>' +
      '<p class="challenge-hint">حط كل شكل بالشريط المناسب لحجمه</p>' +
      '<div class="page-mock">' +
      '<div class="slot size-slot" data-id="rank0" data-rank="0"></div>' +
      '<div class="slot size-slot" data-id="rank1" data-rank="1"></div>' +
      '<div class="slot size-slot" data-id="rank2" data-rank="2"></div>' +
      "</div>" +
      '<div class="tray" id="tray"></div>' +
      "</section>";

    var tray = document.getElementById("tray");
    var pieces = [
      { icon: variant.icons[0], sizeCls: "icon-lg", correct: "rank0" },
      { icon: variant.icons[1], sizeCls: "icon-md", correct: "rank1" },
      { icon: variant.icons[2], sizeCls: "icon-sm", correct: "rank2" }
    ];
    shuffle(pieces);

    pieces.forEach(function (p) {
      var el = document.createElement("div");
      el.className = "piece " + p.sizeCls;
      el.dataset.correct = p.correct;
      el.textContent = p.icon;
      tray.appendChild(el);
      makePieceDraggable(el, tray);
    });

    ON_CORRECT = function () {
      registerCorrect();
    };
  }

  function renderChallenge2Struct() {
    state.needed = 3;
    state.correctCount = 0;

    var idx = pickIndex(STRUCT_VARIANTS.length, "mubarmij_html1_c2struct");
    var variant = STRUCT_VARIANTS[idx];

    STAGE.innerHTML =
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">📄 رتّب أجزاء الصفحة</h2>' +
      '<p class="challenge-hint">المتصفح يقرأ الصفحة من الأعلى للأسفل</p>' +
      '<div class="page-mock">' +
      '<div class="slot struct-slot" data-id="heading" data-kind="heading"></div>' +
      '<div class="slot struct-slot" data-id="image" data-kind="image"></div>' +
      '<div class="slot struct-slot" data-id="paragraph" data-kind="paragraph"></div>' +
      "</div>" +
      '<div class="tray" id="tray"></div>' +
      "</section>";

    var tray = document.getElementById("tray");
    var pieces = [
      { cls: "block-heading", text: variant.headingText, correct: "heading" },
      { cls: "block-image", text: variant.imageEmoji, correct: "image" },
      { cls: "block-paragraph", text: "ـــــ ـــــ ـــــ", correct: "paragraph" }
    ];
    shuffle(pieces);

    pieces.forEach(function (p) {
      var el = document.createElement("div");
      el.className = "piece " + p.cls;
      el.dataset.correct = p.correct;
      el.dataset.stretch = "true";
      el.textContent = p.text;
      tray.appendChild(el);
      makePieceDraggable(el, tray);
    });

    ON_CORRECT = function () {
      registerCorrect();
    };
  }

  /* ================= CHALLENGE 3 : missing piece ================= */

  function renderChallenge3() {
    state.needed = 1;
    state.correctCount = 0;

    var excludeC1 = null;
    try {
      var raw = localStorage.getItem("mubarmij_html1_c1");
      excludeC1 = raw === null ? null : parseInt(raw, 10);
    } catch (e) {}

    var idx = pickIndex(WORD_BANK.length, "mubarmij_html1_c3", excludeC1);
    var base = WORD_BANK[idx];
    var missing = Math.random() < 0.5 ? "open" : "close";
    var variant = { tag: base.tag, word: base.word, emoji: base.emoji, missing: missing };

    var order = ["open", "content", "close"];
    var stripHtml = "";
    order.forEach(function (part) {
      if (part === missing) {
        stripHtml += '<div class="slot gap" data-id="gap"></div>';
      } else if (part === "content") {
        stripHtml += '<div class="piece piece-content static">' + variant.word + "</div>";
      } else if (part === "open") {
        stripHtml += '<div class="piece piece-open static">&lt;' + variant.tag + "&gt;</div>";
      } else {
        stripHtml += '<div class="piece piece-close static">&lt;/' + variant.tag + "&gt;</div>";
      }
    });

    STAGE.innerHTML =
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">🔍 أكمل الكود الناقص</h2>' +
      '<p class="challenge-hint">اسحب القطعة الصحيحة للفراغ</p>' +
      '<div class="code-strip">' +
      stripHtml +
      "</div>" +
      '<div class="preview-panel">' +
      '<div class="preview-bar"><span></span><span></span><span></span></div>' +
      '<div class="preview-body" id="previewBody3"><span class="placeholder">؟</span></div>' +
      "</div>" +
      '<div class="tray" id="tray"></div>' +
      "</section>";

    var correctText = missing === "close" ? "</" + variant.tag + ">" : "<" + variant.tag + ">";
    var others = ["h1", "h2", "h3", "p"].filter(function (t) {
      return t !== variant.tag;
    });
    shuffle(others);

    var distractors;
    if (missing === "close") {
      distractors = ["<" + variant.tag + ">", "</" + others[0] + ">"];
    } else {
      distractors = ["</" + variant.tag + ">", "<" + others[0] + ">"];
    }

    var options = [
      { text: correctText, correct: "gap" },
      { text: distractors[0], correct: "none" },
      { text: distractors[1], correct: "none2" }
    ];
    shuffle(options);

    var tray = document.getElementById("tray");
    options.forEach(function (o) {
      var el = document.createElement("div");
      el.className = "piece piece-option";
      el.dataset.correct = o.correct;
      el.textContent = o.text;
      tray.appendChild(el);
      makePieceDraggable(el, tray);
    });

    ON_CORRECT = function () {
      var body = document.getElementById("previewBody3");
      var span = document.createElement("span");
      span.className = "rendered-" + variant.tag + " sealed";
      span.textContent = variant.word + " " + variant.emoji;
      body.innerHTML = "";
      body.appendChild(span);
      registerCorrect();
    };
  }

  /* ================= COMPLETE SCREEN ================= */

  function showComplete() {
    try {
      localStorage.setItem("mubarmij_html-level-1_completed", "true");
    } catch (e) {}

    document.querySelectorAll(".progress-track .step").forEach(function (s) {
      s.classList.add("done");
    });

    STAGE.innerHTML =
      '<div class="complete-screen">' +
      '<div class="stars">🌟🌟🌟</div>' +
      "<h2>رائع! بنيت صفحتك الأولى!</h2>" +
      "<p>تعلّمت شكل وسوم HTML الأساسية</p>" +
      '<div class="btn-row">' +
      '<button class="btn btn-primary" id="replayBtn">العب من جديد 🔁</button>' +
      '<a class="btn btn-secondary" href="../../index.html">رجوع للخريطة 🏠</a>' +
      "</div>" +
      "</div>";

    document.getElementById("replayBtn").addEventListener("click", startGame);
    launchConfetti();
  }

  /* ================= BOOT ================= */

  var RENDERERS = [renderChallenge1, renderChallenge2, renderChallenge3];

  function startGame() {
    state.index = 0;
    state.done = [];
    updateProgressUI(0, []);
    RENDERERS[0]();
  }

  startGame();
})();
