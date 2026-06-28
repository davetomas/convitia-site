/* ============================================================
   CONVITIA — main.js
   Vanilla JS, IIFE pattern, no build step. Every init is wrapped
   in safe() so one failure can't break the rest of the page.
   ============================================================ */
(function(){
  "use strict";

  function safe(fn, name){
    try{ fn(); }
    catch(err){ console.warn("[Convitia] init failed:", name, err); }
  }

  /* ---------- Header scroll state ---------- */
  function initHeader(){
    var header = document.querySelector(".site-header");
    if(!header) return;
    function onScroll(){
      if(window.scrollY > 24) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  /* ---------- Mobile nav drawer ---------- */
  function initMobileNav(){
    var toggle = document.querySelector(".nav-toggle");
    var drawer = document.querySelector(".mobile-nav");
    if(!toggle || !drawer) return;
    toggle.addEventListener("click", function(){
      drawer.classList.toggle("open");
    });
    drawer.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ drawer.classList.remove("open"); });
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  function initActiveNav(){
    var links = Array.prototype.slice.call(document.querySelectorAll(".main-nav a[href^='#']"));
    var sections = links.map(function(l){ return document.querySelector(l.getAttribute("href")); }).filter(Boolean);
    if(!sections.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          links.forEach(function(l){ l.classList.remove("active"); });
          var match = links.find(function(l){ return l.getAttribute("href") === "#" + entry.target.id; });
          if(match) match.classList.add("active");
        }
      });
    }, { rootMargin:"-45% 0px -45% 0px" });
    sections.forEach(function(s){ io.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal(){
    var items = document.querySelectorAll(".reveal");
    if(!items.length) return;
    var seen = new Set();
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          seen.add(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.05 });
    items.forEach(function(el){ io.observe(el); });
    /* 6s safety net: if observer/JS misbehaves, force everything visible */
    setTimeout(function(){
      items.forEach(function(el){ el.classList.add("is-visible"); });
    }, 6000);
  }

  /* ---------- Animated stat counters ---------- */
  function initCounters(){
    var counters = document.querySelectorAll("[data-count]");
    if(!counters.length) return;
    var done = new WeakSet();
    function run(el){
      if(done.has(el)) return;
      done.add(el);
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1400, start = null;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target % 1 === 0 ? Math.round(target * eased) : (target * eased).toFixed(1);
        el.textContent = val + suffix;
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){ if(entry.isIntersecting) run(entry.target); });
    }, { threshold:0.4 });
    counters.forEach(function(el){ io.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq(){
    var items = document.querySelectorAll(".faq-item");
    if(!items.length) return;
    items.forEach(function(item){
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if(!q || !a) return;
      q.addEventListener("click", function(){
        var isOpen = item.classList.contains("open");
        items.forEach(function(other){
          other.classList.remove("open");
          var otherA = other.querySelector(".faq-a");
          if(otherA) otherA.style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Language toggle (ES default / EN) ----------
     [data-en] nodes ship with the `hidden` attribute in HTML so Spanish
     is correct even without JS. Toggling just flips `hidden` + persists
     the choice for next visit. */
  function initLangToggle(){
    var groups = document.querySelectorAll(".lang-toggle");
    if(!groups.length) return;
    var saved = null;
    try{ saved = localStorage.getItem("convitia-lang"); }catch(e){}
    function apply(lang){
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-es]").forEach(function(el){ el.hidden = (lang === "en"); });
      document.querySelectorAll("[data-en]").forEach(function(el){ el.hidden = (lang !== "en"); });
      groups.forEach(function(group){
        group.querySelectorAll("button").forEach(function(b){
          b.classList.toggle("active", b.getAttribute("data-lang-btn") === lang);
        });
      });
      try{ localStorage.setItem("convitia-lang", lang); }catch(e){}
    }
    groups.forEach(function(group){
      group.querySelectorAll("button").forEach(function(btn){
        btn.addEventListener("click", function(){ apply(btn.getAttribute("data-lang-btn")); });
      });
    });
    apply(saved === "en" ? "en" : "es");
  }

  /* ---------- Copy email to clipboard (used on /contacto/) ---------- */
  function initCopyEmail(){
    var buttons = document.querySelectorAll("[data-copy-email]");
    if(!buttons.length) return;
    buttons.forEach(function(btn){
      var email = btn.getAttribute("data-copy-email");
      var labelEs = btn.querySelector("[data-es]");
      var labelEn = btn.querySelector("[data-en]");
      var originalEs = labelEs ? labelEs.textContent : null;
      var originalEn = labelEn ? labelEn.textContent : null;
      btn.addEventListener("click", function(){
        function done(){
          if(labelEs) labelEs.textContent = "¡Copiado!";
          if(labelEn) labelEn.textContent = "Copied!";
          setTimeout(function(){
            if(labelEs && originalEs) labelEs.textContent = originalEs;
            if(labelEn && originalEn) labelEn.textContent = originalEn;
          }, 2200);
        }
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(email).then(done).catch(function(){
            window.location.href = "mailto:" + email;
          });
        }else{
          window.location.href = "mailto:" + email;
        }
      });
    });
  }

  /* ---------- Custom cursor (fine-pointer devices only) ---------- */
  function initCustomCursor(){
    if(!window.matchMedia || !window.matchMedia("(pointer:fine)").matches) return;
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop(){
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, .work-tile, .book-card").forEach(function(el){
      el.addEventListener("mouseenter", function(){ ring.classList.add("hover"); });
      el.addEventListener("mouseleave", function(){ ring.classList.remove("hover"); });
    });
    document.addEventListener("mouseleave", function(){ dot.style.opacity = "0"; ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", function(){ dot.style.opacity = "1"; ring.style.opacity = ".55"; });
  }

  /* ---------- Magnetic buttons (fine-pointer only) ---------- */
  function initMagneticButtons(){
    if(!window.matchMedia || !window.matchMedia("(pointer:fine)").matches) return;
    document.querySelectorAll(".btn-primary, .btn-ghost").forEach(function(el){
      el.addEventListener("mousemove", function(e){
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + (x * 0.18) + "px," + (y * 0.3) + "px)";
      });
      el.addEventListener("mouseleave", function(){ el.style.transform = ""; });
    });
  }

  /* ---------- Work-tile cursor tilt (fine-pointer only) ---------- */
  function initTileTilt(){
    if(!window.matchMedia || !window.matchMedia("(pointer:fine)").matches) return;
    document.querySelectorAll(".work-tile").forEach(function(tile){
      tile.addEventListener("mousemove", function(e){
        var r = tile.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tile.style.transform = "rotateX(" + (py * -6) + "deg) rotateY(" + (px * 6) + "deg)";
      });
      tile.addEventListener("mouseleave", function(){ tile.style.transform = ""; });
    });
  }

  /* ---------- Splash / entry gate (home only) ----------
     Full-screen gate covering the page on load: soft paper-cream bg,
     only the terracotta logo centered. Reuses the same .cg-card
     design-trail visuals/logic as initCursorGallery below, but
     spawns cards across the whole gate on mousemove. A click anywhere
     fades the gate out, unlocks scrolling, and removes it from the
     DOM — its mousemove listener goes with it, so the trail doesn't
     carry over into the page underneath. */
  function initSplashGate(){
    var gate = document.getElementById("splash-gate");
    if(!gate) return;
    document.body.classList.add("splash-active");

    /* Card-spawn trail: built unconditionally (not just on fine pointers)
       so touch devices get the same visual via finger-drag, see below. */
    var designs = [
      { style:"real",    seal:"C", name:"Quimey &amp; Nacho",    venue:"Bariloche, Arg.",                  tag:"Caso real" },
      { style:"clasica", seal:"C", name:"Valentina &amp; Bruno", venue:"Est. Las Magnolias, Córdoba",       tag:"Clásica Elegante" },
      { style:"moderna", seal:"C", name:"Julia &amp; Martín",    venue:"Espacio Darwin, Bs. As.",           tag:"Moderna Minimal" },
      { style:"boho",    seal:"C", name:"Coti &amp; Iván",       venue:"Finca Las Acacias, Córdoba",        tag:"Boho Romántico" }
    ];
    var idx = 0, travel = 0, lastX = null, lastY = null;

    function spawn(x, y){
      var d = designs[idx];
      idx = (idx + 1) % designs.length;
      var card = document.createElement("div");
      card.className = "cg-card style-" + d.style;
      card.style.left = x + "px";
      card.style.top = y + "px";
      card.innerHTML =
        '<div class="seal">' + d.seal + '</div>' +
        '<h4>' + d.name + '</h4>' +
        '<div class="cg-venue">' + d.venue + '</div>' +
        '<span class="cg-tag">' + d.tag + '</span>';
      gate.appendChild(card);
      requestAnimationFrame(function(){ card.classList.add("cg-in"); });
      setTimeout(function(){ card.classList.remove("cg-in"); card.classList.add("cg-out"); }, 550);
      setTimeout(function(){ if(card.parentNode) card.parentNode.removeChild(card); }, 1150);
    }

    function trackMove(x, y){
      if(lastX !== null){
        travel += Math.hypot(x - lastX, y - lastY);
        if(travel > 130){ travel = 0; spawn(x, y); }
      }else{
        spawn(x, y);
      }
      lastX = x; lastY = y;
    }

    if(window.matchMedia && window.matchMedia("(pointer:fine)").matches){
      gate.addEventListener("mousemove", function(e){
        trackMove(e.clientX, e.clientY);
      });
    }else{
      /* Touch devices: a finger drag across the splash stands in for the
         mouse trail. touchstart seeds the first card immediately (like
         the first mousemove does on desktop); touchmove keeps it going. */
      gate.addEventListener("touchstart", function(e){
        var t = e.touches[0];
        if(t) trackMove(t.clientX, t.clientY);
      }, { passive:true });
      gate.addEventListener("touchmove", function(e){
        var t = e.touches[0];
        if(t) trackMove(t.clientX, t.clientY);
      }, { passive:true });
    }

    gate.addEventListener("click", function(){
      gate.classList.add("splash-hidden");
      document.body.classList.remove("splash-active");
      setTimeout(function(){ if(gate.parentNode) gate.parentNode.removeChild(gate); }, 650);
    });
  }

  /* ---------- Cursor design trail (hero, fine-pointer only) ----------
     As the mouse moves inside the hero, a card pops in just to the right
     of the cursor (not centered on it) every ~130px of movement, then
     fades out on its own — leaving a trail of designs behind the
     pointer as it moves. Cycles through Convitia's real case + 3
     sample styles, showing the variety of wedding-invitation designs
     the service offers. Built entirely from data here (no images),
     reusing the same couple names/venues already used on /disenos/
     for consistency. Each card is its own fixed-position element,
     spawned on demand and removed once its fade-out finishes. */
  function initCursorGallery(){
    if(!window.matchMedia || !window.matchMedia("(pointer:fine)").matches) return;
    /* Homepage already shows this trail on the splash gate before the
       click; once past it, the real Hero should stay clean — skip
       attaching it here when the splash markup is present on the page. */
    if(document.getElementById("splash-gate")) return;
    var hero = document.querySelector(".hero-giant");
    if(!hero) return;

    var designs = [
      { style:"real",    seal:"C", name:"Quimey &amp; Nacho",    venue:"Bariloche, Arg.",                  tag:"Caso real" },
      { style:"clasica", seal:"C", name:"Valentina &amp; Bruno", venue:"Est. Las Magnolias, Córdoba",       tag:"Clásica Elegante" },
      { style:"moderna", seal:"C", name:"Julia &amp; Martín",    venue:"Espacio Darwin, Bs. As.",           tag:"Moderna Minimal" },
      { style:"boho",    seal:"C", name:"Coti &amp; Iván",       venue:"Finca Las Acacias, Córdoba",        tag:"Boho Romántico" }
    ];

    var idx = 0, travel = 0, lastX = null, lastY = null;

    function spawn(x, y){
      var d = designs[idx];
      idx = (idx + 1) % designs.length;

      var card = document.createElement("div");
      card.className = "cg-card style-" + d.style;
      card.style.left = x + "px";
      card.style.top = y + "px";
      card.innerHTML =
        '<div class="seal">' + d.seal + '</div>' +
        '<h4>' + d.name + '</h4>' +
        '<div class="cg-venue">' + d.venue + '</div>' +
        '<span class="cg-tag">' + d.tag + '</span>';
      hero.appendChild(card);

      requestAnimationFrame(function(){ card.classList.add("cg-in"); });
      setTimeout(function(){
        card.classList.remove("cg-in");
        card.classList.add("cg-out");
      }, 550);
      setTimeout(function(){
        if(card.parentNode) card.parentNode.removeChild(card);
      }, 1150);
    }

    hero.addEventListener("mousemove", function(e){
      if(lastX !== null){
        travel += Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if(travel > 130){
          travel = 0;
          spawn(e.clientX, e.clientY);
        }
      }else{
        spawn(e.clientX, e.clientY);
      }
      lastX = e.clientX; lastY = e.clientY;
    });
    hero.addEventListener("mouseleave", function(){
      lastX = null; lastY = null; travel = 0;
    });
  }

  /* ---------- Designs — flat drag-fan, spins forever, seam hidden at zero-opacity ----------
     Visually this matches the reference: all 4 cards flat, tilted via
     rotateY, edge to edge, NONE ever hidden behind another (that was
     the 3D-ring version this replaces — technically seamless, but it
     tucked one card behind another for an instant, which read wrong
     once compared side by side with the reference's flat look).
     With only 4 real cards and none spare waiting off to the side, a
     flat layout that spins forever has exactly one unavoidable seam
     per card per revolution — there is no shared parent to spin as a
     rigid piece this time, since each card's tilt/position has to be
     its own number, not a rotation of the whole deck. The fix: each
     card's position is `(i - spin) mod n`, recentred to [-n/2, n/2) in
     card-slot units, and its opacity is `cos(slot * 45°)` — which lands
     on exactly 0 right at slot = ±n/2, precisely where the mod wraps it
     from one edge to the other. So the one moment a card's position
     ever jumps, it's fully transparent — nothing visible actually
     moves. Position, tilt and stacking are pure functions of that one
     card's own slot value (no per-frame sort, no shared "anchor" card,
     no card ever consulting another's position), so there's no way for
     two cards to fight over order the way the old flat/accordion model
     did before the ring. Dragging adds directly to `spin` (in
     card-slot units, no snapping on release), and releasing keeps it
     coasting at the drag's last velocity before decaying to a stop —
     like a flicked wheel. Built on Pointer Events so mouse, touch and
     pen all work the same way. */
  function initDesignsBook(){
    var deck = document.querySelector(".book-deck");
    var track = deck && deck.querySelector(".book-track");
    if(!deck || !track) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll(".book-card"));
    var n = cards.length;
    if(n < 2) return;

    var HALF = n / 2; /* slot range is [-HALF, HALF) — the seam sits at ±HALF */
    var PX_PER_SLOT = 260; /* drag distance, in px, for one card-step of spin */
    var ANGLE_MAX = 90; /* deg — tilt at the (invisible) seam itself */
    var EDGE_FADE = 0.35; /* slot-units of fade-out room right before the seam */
    var cardW = cards[0].offsetWidth || 230;
    var SLOT_DX_FACTOR = 0.64; /* px of horizontal travel per 1 slot-unit, as a fraction of card width */
    var slotDX = cardW * SLOT_DX_FACTOR;

    var spin = 0.5; /* default: lands the 4 cards symmetrically at -1.5..1.5, real-case card near centre */
    var dragging = false, startX = 0, startSpin = 0, dx = 0, suppressClick = false;

    /* Momentum: while dragging we buffer recent (time, spin) samples; on
       release that recent history gives a release velocity that keeps
       spinning the deck, decaying toward zero like a flicked wheel
       coasting to a stop — this is what makes the release feel
       continuous/alive instead of just freezing in place. */
    var velocity = 0, coastRAF = null;

    function measure(){
      cardW = cards[0].offsetWidth || cardW;
      slotDX = cardW * SLOT_DX_FACTOR;
    }

    /* Floor-mod, not JS `%` (which keeps the sign of its left operand
       and would put the seam in the wrong place for negative raw
       values) — recentred so the result always lands in [-HALF, HALF). */
    function slotOf(i){
      var raw = i - spin;
      return ((raw + HALF) % n + n) % n - HALF;
    }

    /* Every card's transform, opacity and stacking are recomputed each
       frame straight from its own slot value — no card ever looks at
       another's position, so there's nothing left to disagree about. */
    function render(){
      cards.forEach(function(card, i){
        var s = slotOf(i);
        var angle = (s / HALF) * ANGLE_MAX;
        var opacity = Math.min(1, Math.max(0, (HALF - Math.abs(s)) / EDGE_FADE));
        var z = Math.round((HALF - Math.abs(s)) * 100);
        card.style.transform = "translate(-50%, -50%) translateX(" + (s * slotDX).toFixed(2) + "px) rotateY(" + angle.toFixed(2) + "deg)";
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(z);
        card.style.pointerEvents = opacity < 0.04 ? "none" : "";
      });
    }

    render();

    window.addEventListener("resize", function(){ measure(); render(); });

    /* Listen on the deck for pointerdown (drag must start on the deck),
       but track move/up/cancel on window instead of the deck itself —
       more robust than relying solely on setPointerCapture when the
       down-target is a link. */
    /* Trailing-window velocity buffer: every pointermove pushes a
       {t, spin} sample; on release we measure from the OLDEST sample
       still inside a short trailing window (~100ms) to the newest,
       instead of from a single last-instant delta. A real human flick
       almost always decelerates slightly right as the finger lifts —
       a last-delta-only measurement (the previous approach) samples
       exactly that decelerated instant and systematically under-reads
       the actual flick speed, which is what made the release feel weak
       or inconsistent instead of like a real flicked wheel. Averaging
       over a trailing window is the standard fix used by native
       momentum-scroll and swiper implementations. */
    var VELOCITY_WINDOW_MS = 100;
    var history = [];

    deck.addEventListener("pointerdown", function(e){
      if(coastRAF){ cancelAnimationFrame(coastRAF); coastRAF = null; }
      dragging = true;
      deck.classList.add("is-dragging");
      startX = e.clientX;
      startSpin = spin;
      dx = 0;
      velocity = 0;
      history = [{ t: performance.now(), spin: spin }];
      e.preventDefault(); /* stop native link/text drag from hijacking the gesture */
      try{ deck.setPointerCapture(e.pointerId); }catch(err){}
    });

    window.addEventListener("pointermove", function(e){
      if(!dragging) return;
      dx = e.clientX - startX;
      spin = startSpin + dx / PX_PER_SLOT;
      render();
      if(Math.abs(dx) > 6) suppressClick = true;

      var now = performance.now();
      history.push({ t: now, spin: spin });
      while(history.length > 2 && now - history[0].t > VELOCITY_WINDOW_MS){
        history.shift();
      }
    });

    function coast(){
      spin += velocity * 16; /* ~one frame at 60fps */
      velocity *= 0.94; /* decay — bigger friction than a real flywheel so it settles quickly */
      render();
      if(Math.abs(velocity) > 0.00005){
        coastRAF = requestAnimationFrame(coast);
      }else{
        coastRAF = null;
        deck.classList.remove("is-dragging"); /* re-enable the CSS transition only once fully at rest */
      }
    }

    function endDrag(){
      if(!dragging) return;
      dragging = false;

      /* Release velocity = (newest - oldest) sample still in the trailing
         window, NOT a single last-instant delta — see the history buffer
         comment above pointerdown for why. */
      velocity = 0;
      if(history.length >= 2){
        var oldest = history[0], newest = history[history.length - 1];
        var span = newest.t - oldest.t;
        if(span > 4){ /* guard against a near-zero time span blowing up the division */
          velocity = (newest.spin - oldest.spin) / span;
        }
      }

      /* Deliberately NOT removing "is-dragging" here even though the drag
         itself is over — that class is what keeps the CSS transform
         transition disabled (see .book-deck.is-dragging .book-card in
         styles.css). If we removed it immediately, every coast frame
         below would fight a .5s CSS transition racing toward a target
         that's already moved again 16ms later, turning the flick into a
         laggy crawl instead of a real coast. It only comes back off once
         coast() finishes (or never goes on the snapping path at all). */
      if(Math.abs(velocity) > 0.00005){
        coastRAF = requestAnimationFrame(coast);
      }else{
        deck.classList.remove("is-dragging");
      }
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    deck.addEventListener("click", function(e){
      if(suppressClick){
        e.preventDefault();
        suppressClick = false;
      }
    });

    console.log("[Convitia] designsBook ready —", n, "cards, drag listeners attached");
  }

  /* ---------- Hero parallax — idle float (CSS) + scroll fade + mouse depth ----------
     Writes --px/--py custom properties (read by the float-blob keyframe in CSS)
     so idle motion and parallax compose instead of overwriting each other.
     Leaves the giant word's inline style untouched at scrollY 0 so the
     entrance .reveal fade-in is never short-circuited. */
  function initHeroParallax(){
    var hero = document.querySelector(".hero-giant");
    if(!hero) return;
    var blobs = Array.prototype.slice.call(hero.querySelectorAll(".hero-bg-blob"));
    var word = hero.querySelector(".giant-word");
    var fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
    var mx = 0, my = 0, ticking = false;

    function render(){
      var y = window.scrollY;
      var heroH = hero.offsetHeight || 800;
      var p = Math.min(y / heroH, 1);
      blobs.forEach(function(b, i){
        var depth = (i + 1) * 16;
        var sy = y * (0.18 + i * 0.08);
        b.style.setProperty("--px", (mx * depth) + "px");
        b.style.setProperty("--py", (sy + my * depth) + "px");
      });
      if(word){
        if(y > 0){
          word.style.opacity = String(1 - p * 0.55);
          word.style.transform = "translateY(" + (y * 0.1) + "px) scale(" + (1 - p * 0.04) + ")";
        }else{
          word.style.opacity = "";
          word.style.transform = "";
        }
      }
      ticking = false;
    }
    function request(){ if(!ticking){ requestAnimationFrame(render); ticking = true; } }

    window.addEventListener("scroll", request, { passive:true });
    if(fine){
      hero.addEventListener("mousemove", function(e){
        var r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        request();
      });
      hero.addEventListener("mouseleave", function(){ mx = 0; my = 0; request(); });
    }
    render();
  }

  /* ---------- Hero right panel — interactive image accordion ----------
     Replaces the earlier Three.js flying-card scene: Dave pointed at a
     different 21st.dev reference (interactive-image-accordion) and asked
     to match that effect instead — a row of panels where hovering/tapping
     one expands it (CSS flex-grow transition in styles.css) while the
     others collapse back to a narrow vertical-label strip. All the
     content/colors are real (Quimey & Nacho + the 3 sample designs),
     same fallback Dave already approved in place of a literal screenshot.
     This JS only has one job: keep exactly one .acc-panel marked
     .active at a time. */
  function initAccGallery(){
    var stage = document.querySelector(".acc-stage");
    var panels = stage && stage.querySelectorAll(".acc-panel");
    if(!stage || !panels || !panels.length) return;

    function setActive(panel){
      for(var i = 0; i < panels.length; i++){
        if(panels[i] !== panel) panels[i].classList.remove("active");
      }
      panel.classList.add("active");
    }

    for(var i = 0; i < panels.length; i++){
      (function(panel){
        panel.addEventListener("mouseenter", function(){ setActive(panel); });
        panel.addEventListener("focus", function(){ setActive(panel); });
        panel.addEventListener("click", function(){ setActive(panel); });
      })(panels[i]);
    }
  }

  /* ---------- Style stack cards (/disenos/ — 4 style picker) ----------
     Same one-active-at-a-time pattern as initAccGallery above, but
     targeting the .stack-card row instead of .acc-panel. */
  function initStyleStack(){
    var stage = document.querySelector(".stack-cards");
    var cards = stage && stage.querySelectorAll(".stack-card");
    if(!stage || !cards || !cards.length) return;

    function setActive(card){
      for(var i = 0; i < cards.length; i++){
        if(cards[i] !== card) cards[i].classList.remove("active");
      }
      card.classList.add("active");
    }

    for(var i = 0; i < cards.length; i++){
      (function(card){
        card.addEventListener("mouseenter", function(){ setActive(card); });
        card.addEventListener("focus", function(){ setActive(card); });
        card.addEventListener("click", function(){ setActive(card); });
      })(cards[i]);
    }
  }

  /* ---------- Marquee speeds up / reverses with scroll velocity ---------- */
  function initMarqueeScrollSpeed(){
    var tracks = document.querySelectorAll(".marquee");
    if(!tracks.length) return;
    var lastY = window.scrollY;
    window.addEventListener("scroll", function(){
      var y = window.scrollY;
      var velocity = y - lastY;
      lastY = y;
      var extra = Math.max(-18, Math.min(18, velocity * 0.6));
      tracks.forEach(function(t){
        t.style.animationDuration = (26 - Math.abs(extra)) + "s";
        t.style.animationDirection = extra < 0 ? "reverse" : "normal";
      });
    }, { passive:true });
  }

  /* ---------- Smooth anchor scroll (native, offset for fixed header) ---------- */
  function initAnchors(){
    var header = document.querySelector(".site-header");
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener("click", function(e){
        var id = a.getAttribute("href");
        if(id.length < 2) return;
        var target = document.querySelector(id);
        if(!target) return;
        e.preventDefault();
        var offset = header ? header.offsetHeight + 10 : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top:top, behavior:"smooth" });
      });
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    safe(initSplashGate, "splashGate");
    safe(initHeader, "header");
    safe(initMobileNav, "mobileNav");
    safe(initActiveNav, "activeNav");
    safe(initReveal, "reveal");
    safe(initCounters, "counters");
    safe(initFaq, "faq");
    safe(initLangToggle, "langToggle");
    safe(initCopyEmail, "copyEmail");
    safe(initCustomCursor, "customCursor");
    safe(initMagneticButtons, "magneticButtons");
    safe(initTileTilt, "tileTilt");
    safe(initCursorGallery, "cursorGallery");
    safe(initDesignsBook, "designsBook");
    safe(initHeroParallax, "heroParallax");
    safe(initAccGallery, "accGallery");
    safe(initStyleStack, "styleStack");
    safe(initMarqueeScrollSpeed, "marqueeScrollSpeed");
    safe(initAnchors, "anchors");
  });
})();
