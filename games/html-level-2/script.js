(function () {
  "use strict";

  /* ================= DATA ================= */

  var WORD_BANK = [
    { word: "مهم", emoji: "❗" },
    { word: "قوي", emoji: "💪" },
    { word: "سريع", emoji: "⚡" },
    { word: "ذكي", emoji: "🧠" },
    { word: "شجاع", emoji: "🦁" },
    { word: "لطيف", emoji: "🌸" },
    { word: "جميل", emoji: "✨" },
    { word: "كبير", emoji: "🐘" },
    { word: "صغير", emoji: "🐭" },
    { word: "سعيد", emoji: "😊" },
    { word: "هادئ", emoji: "🍃" },
    { word: "مرح", emoji: "🎈" }
  ];

  var CH_META = [
    { id: 1, icon: "📦", title: "ابنِ الصندوقين", desc: "رتب الوسوم لتصنع صندوقًا داخل صندوق" },
    { id: 2, icon: "🔑", title: "وصّل القفل بمفتاحه", desc: "وصل كل إغلاق بوسمه الصحيح" },
    { id: 3, icon: "🧩", title: "أوقف الصندوق المكسور", desc: "أصلح ترتيب الإغلاق المتشابك" }
  ];

  var PROGRESS_KEY = "mbarmij_html_level2_progress";

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

  function pickIndex(poolLength, storageKey) {
    var last = null;
    try {
      var raw = localStorage.getItem(storageKey);
      last = raw === null ? null : parseInt(raw, 10);
    } catch (e) {}

    var candidates = [];
    for (var i = 0; i < poolLength; i++) {
      if (i !== last) candidates.push(i);
    }
    if (candidates.length === 0) candidates = [0];

    var choice = candidates[Math.floor(Math.random() * candidates.length)];
    try {
      localStorage.setItem(storageKey, String(choice));
    } catch (e) {}
    return choice;
  }

  function loadProgress() {
    var def = { "1": false, "2": false, "3": false };
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return def;
      var parsed = JSON.parse(raw);
      return {
        "1": !!parsed["1"],
        "2": !!parsed["2"],
        "3": !!parsed["3"]
      };
    } catch (e) {
      return def;
    }
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  /* ================= UI HELPERS ================= */

  var STAGE = document.getElementById("stage");
  var mascotEl = document.getElementById("mascot");
  var toastEl = document.getElementById("toast");
  var counterBadge = document.getElementById("counterBadge");
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

  function updateCounterBadge(progress) {
    var n = 0;
    CH_META.forEach(function (m) {
      if (progress[String(m.id)]) n++;
    });
    counterBadge.textContent = "✅ " + n + "/3";
  }

  function launchConfetti() {
    var colors = ["#5cb894", "#e2688c", "#4fb0d8", "#b9a779", "#edebe0"];
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

  /* ================= GENERIC DRAG ENGINE (tray -> slot) ================= */

  var ON_CORRECT = function () {};

  function makePieceDraggable(piece) {
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

  var state = { activeChallenge: null, correctCount: 0, needed: 0 };

  function registerCorrect() {
    state.correctCount++;
    mascotHappy();
    if (state.correctCount >= state.needed) {
      setTimeout(completeActiveChallenge, 500);
    }
  }

  function completeActiveChallenge() {
    var id = state.activeChallenge;
    var progress = loadProgress();
    progress[String(id)] = true;
    saveProgress(progress);
    updateCounterBadge(progress);
    showToast("أحسنت! 🎉");
    launchConfetti();
    setTimeout(renderHub, 1400);
  }

  /* ================= HUB ================= */

  function renderHub() {
    state.activeChallenge = null;
    var progress = loadProgress();
    updateCounterBadge(progress);

    var cardsHtml = CH_META.map(function (m) {
      var done = progress[String(m.id)];
      return (
        '<div class="hub-card' +
        (done ? " done" : "") +
        '" data-ch="' +
        m.id +
        '">' +
        '<div class="icon">' +
        m.icon +
        "</div>" +
        '<div class="info"><h3>' +
        m.title +
        "</h3><p>" +
        m.desc +
        "</p></div>" +
        '<div class="status">' +
        (done ? "⭐" : "▶️") +
        "</div>" +
        "</div>"
      );
    }).join("");

    var allDone = CH_META.every(function (m) {
      return progress[String(m.id)];
    });

    STAGE.innerHTML =
      '<div class="hub-intro"><h1>📦 صناديق متداخلة</h1><p>اختر تحديًا والعب بالترتيب اللي يعجبك</p></div>' +
      '<div class="hub-grid" id="hubGrid">' +
      cardsHtml +
      "</div>" +
      (allDone
        ? '<div class="parent-banner"><p>قول لبابا وماما: أنا فهمت كيف تتعشش الأكواد ببعضها 📦 — مستوى ٢</p></div>'
        : "");

    document.querySelectorAll(".hub-card").forEach(function (card) {
      card.addEventListener("click", function () {
        startChallenge(parseInt(card.dataset.ch, 10));
      });
    });
  }

  function startChallenge(id) {
    state.activeChallenge = id;
    state.correctCount = 0;
    if (id === 1) renderChallenge1();
    else if (id === 2) renderChallenge2();
    else renderChallenge3();
  }

  function backLink() {
    return '<a class="challenge-back" id="backToHub">→ رجوع للقائمة</a>';
  }

  function wireBackLink() {
    var el = document.getElementById("backToHub");
    if (el) el.addEventListener("click", renderHub);
  }

  /* ================= CHALLENGE 1: build the two boxes ================= */

  var ch1Variant = null;

  function isFilled(id) {
    var el = document.querySelector('.slot[data-id="' + id + '"]');
    return !!el && el.classList.contains("filled");
  }

  function renderChallenge1() {
    state.needed = 5;
    state.correctCount = 0;

    var idx = pickIndex(WORD_BANK.length, "mbarmij_html2_c1");
    ch1Variant = WORD_BANK[idx];

    STAGE.innerHTML =
      backLink() +
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">📦 ابنِ الصندوقين</h2>' +
      '<p class="challenge-hint">رتب القطع الخمس: صندوق صغير جوه صندوق كبير</p>' +
      '<div class="code-strip">' +
      '<div class="slot" data-id="open-p"></div>' +
      '<div class="slot" data-id="open-strong"></div>' +
      '<div class="slot" data-id="content"></div>' +
      '<div class="slot" data-id="close-strong"></div>' +
      '<div class="slot" data-id="close-p"></div>' +
      "</div>" +
      '<div class="preview-panel">' +
      '<div class="preview-bar"><span></span><span></span><span></span></div>' +
      '<div class="preview-body" id="previewBody"><span class="placeholder">المعاينة هنا...</span></div>' +
      "</div>" +
      '<div class="tray" id="tray"></div>' +
      "</section>";

    wireBackLink();

    var tray = document.getElementById("tray");
    var pieces = [
      { text: "<p>", cls: "piece-p-open", correct: "open-p" },
      { text: "<strong>", cls: "piece-strong-open", correct: "open-strong" },
      { text: ch1Variant.word, cls: "piece-content", correct: "content" },
      { text: "</strong>", cls: "piece-strong-close", correct: "close-strong" },
      { text: "</p>", cls: "piece-p-close", correct: "close-p" }
    ];
    shuffle(pieces);

    pieces.forEach(function (p) {
      var el = document.createElement("div");
      el.className = "piece " + p.cls;
      el.dataset.correct = p.correct;
      el.textContent = p.text;
      tray.appendChild(el);
      makePieceDraggable(el);
    });

    ON_CORRECT = function () {
      updatePreview1();
      registerCorrect();
    };

    updatePreview1();
  }

  function updatePreview1() {
    var body = document.getElementById("previewBody");
    if (!body) return;

    var openP = isFilled("open-p");
    var openS = isFilled("open-strong");
    var content = isFilled("content");
    var closeS = isFilled("close-strong");
    var closeP = isFilled("close-p");

    if (!content) {
      body.innerHTML = '<span class="placeholder">المعاينة هنا...</span>';
      return;
    }

    var sealedInner = openS && closeS;
    var inner = document.createElement(sealedInner ? "strong" : "span");
    inner.className = "box-inner" + (sealedInner ? " sealed-inner" : "");
    inner.textContent = ch1Variant.word + " " + ch1Variant.emoji;

    if (openP) {
      var outer = document.createElement("p");
      outer.className = "box-outer" + (closeP ? " sealed-outer" : "");
      outer.appendChild(inner);
      body.replaceChildren(outer);
    } else {
      body.replaceChildren(inner);
    }
  }

  /* ================= CHALLENGE 2: lock & key ================= */

  function renderChallenge2() {
    state.needed = 3;
    state.correctCount = 0;

    var locks = [
      { tag: "<p>", cls: "lock-p", id: "lock-p" },
      { tag: "<strong>", cls: "lock-strong", id: "lock-strong" },
      { tag: "<h2>", cls: "lock-h2", id: "lock-h2" }
    ];
    var keys = [
      { text: "</p>", correct: "lock-p", cls: "piece-p-close" },
      { text: "</strong>", correct: "lock-strong", cls: "piece-strong-close" },
      { text: "</h2>", correct: "lock-h2", cls: "piece-h2-close" }
    ];
    shuffle(locks);
    shuffle(keys);

    STAGE.innerHTML =
      backLink() +
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">🔑 وصّل القفل بمفتاحه</h2>' +
      '<p class="challenge-hint">اسحب كل مفتاح إغلاق لقفله الصحيح</p>' +
      '<div class="lockkey-board">' +
      '<div class="lock-col" id="lockCol"></div>' +
      '<div class="key-col" id="keyCol"></div>' +
      "</div>" +
      "</section>";

    wireBackLink();

    var lockCol = document.getElementById("lockCol");
    locks.forEach(function (l) {
      var el = document.createElement("div");
      el.className = "slot lock-slot " + l.cls;
      el.dataset.id = l.id;

      var tagSpan = document.createElement("span");
      tagSpan.textContent = l.tag;
      var holeSpan = document.createElement("span");
      holeSpan.className = "keyhole";
      holeSpan.textContent = "🔒";

      el.appendChild(tagSpan);
      el.appendChild(holeSpan);
      lockCol.appendChild(el);
    });

    var keyCol = document.getElementById("keyCol");
    keys.forEach(function (k) {
      var el = document.createElement("div");
      el.className = "piece " + k.cls;
      el.dataset.correct = k.correct;
      el.textContent = k.text;
      keyCol.appendChild(el);
      makePieceDraggable(el);
    });

    ON_CORRECT = function (slot, piece) {
      var hole = slot.querySelector(".keyhole");
      if (hole) hole.textContent = "🔓";
      var label = slot.querySelector("span:not(.keyhole)");
      if (label) label.style.display = "none";
      piece.style.width = "auto";
      piece.style.maxWidth = "78%";
      piece.style.fontSize = "12px";
      piece.style.padding = "6px 10px";
      registerCorrect();
    };
  }

  /* ================= CHALLENGE 3: fix the tangled box ================= */

  function makeSwapDraggable(piece) {
    piece.addEventListener("pointerdown", function (e) {
      e.preventDefault();

      var startRect = piece.getBoundingClientRect();
      var offsetX = e.clientX - startRect.left;
      var offsetY = e.clientY - startRect.top;
      var sourceSlot = piece.parentElement;

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

      function onUp(ev) {
        piece.removeEventListener("pointermove", onMove);
        piece.removeEventListener("pointerup", onUp);
        piece.removeEventListener("pointercancel", onUp);

        piece.style.visibility = "hidden";
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        piece.style.visibility = "";

        var targetSlot = under ? under.closest(".swap-target") : null;

        resetStyle();

        if (targetSlot && targetSlot !== sourceSlot) {
          var occupant = targetSlot.firstElementChild;
          targetSlot.appendChild(piece);
          if (occupant) sourceSlot.appendChild(occupant);
          checkSwapResult();
        } else {
          sourceSlot.appendChild(piece);
        }
      }

      piece.addEventListener("pointermove", onMove);
      piece.addEventListener("pointerup", onUp);
      piece.addEventListener("pointercancel", onUp);
    });
  }

  function checkSwapResult() {
    var slotInner = document.querySelector('.swap-target[data-id="close-strong-slot"]');
    var slotOuter = document.querySelector('.swap-target[data-id="close-p-slot"]');
    if (!slotInner || !slotOuter) return;

    var innerPiece = slotInner.firstElementChild;
    var outerPiece = slotOuter.firstElementChild;
    if (!innerPiece || !outerPiece) return;

    var correct = innerPiece.dataset.correct === "close-strong" && outerPiece.dataset.correct === "close-p";

    if (correct) {
      innerPiece.classList.add("correct-pop");
      outerPiece.classList.add("correct-pop");
      var illo = document.getElementById("nestIllo");
      if (illo) {
        illo.classList.remove("tangled");
        illo.classList.add("fixed");
      }
      registerCorrect();
    }
  }

  function renderChallenge3() {
    state.needed = 1;
    state.correctCount = 0;

    var idx = pickIndex(WORD_BANK.length, "mbarmij_html2_c3");
    var variant = WORD_BANK[idx];

    STAGE.innerHTML =
      backLink() +
      '<section class="challenge-card">' +
      '<h2 class="challenge-title">🧩 أوقف الصندوق المكسور</h2>' +
      '<p class="challenge-hint">الترتيب متشابك! اسحب قطعتي الإغلاق لتبديل مكانهما</p>' +
      '<div class="nest-illustration tangled" id="nestIllo">' +
      '<div class="nest-outer"></div>' +
      '<div class="nest-inner">' + variant.emoji + "</div>" +
      "</div>" +
      '<div class="swap-strip">' +
      '<div class="piece static piece-p-open">&lt;p&gt;</div>' +
      '<div class="piece static piece-strong-open">&lt;strong&gt;</div>' +
      '<div class="piece static piece-content">' +
      variant.word +
      "</div>" +
      '<div class="slot swap-target" data-id="close-strong-slot"></div>' +
      '<div class="slot swap-target" data-id="close-p-slot"></div>' +
      "</div>" +
      "</section>";

    wireBackLink();

    var slotInner = document.querySelector('.swap-target[data-id="close-strong-slot"]');
    var slotOuter = document.querySelector('.swap-target[data-id="close-p-slot"]');

    var wrongInInner = document.createElement("div");
    wrongInInner.className = "piece piece-p-close";
    wrongInInner.dataset.correct = "close-p";
    wrongInInner.textContent = "</p>";
    slotInner.appendChild(wrongInInner);
    slotInner.classList.add("filled");
    makeSwapDraggable(wrongInInner);

    var wrongInOuter = document.createElement("div");
    wrongInOuter.className = "piece piece-strong-close";
    wrongInOuter.dataset.correct = "close-strong";
    wrongInOuter.textContent = "</strong>";
    slotOuter.appendChild(wrongInOuter);
    slotOuter.classList.add("filled");
    makeSwapDraggable(wrongInOuter);
  }

  /* ================= BOOT ================= */

  updateCounterBadge(loadProgress());
  renderHub();
})();
