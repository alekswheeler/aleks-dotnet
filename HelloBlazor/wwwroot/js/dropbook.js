/* DropBook landing interactions (Blazor SPA-safe).
 * Classic script that also works when lazy-loaded via JS module `import`
 * (side-effect import assigns the globals below).
 * Exposes:
 *   window.dropbookInit(rootElement) - wire up reveal, FAQ, navbar/progress, parallax/tilt/spotlight.
 *   window.dropbookDestroy()          - disconnect observers, remove listeners, cancel rAF.
 * Preserves original behaviour: honours prefers-reduced-motion and only enables
 * tilt/parallax when the pointer is fine.
 */
(function () {
    var state = null;

    function init(root) {
        destroy();
        if (!root) root = document;

        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var fine = window.matchMedia('(pointer: fine)').matches;

        // Reveal gating class lives on the component root (scoped CSS uses
        // `.dropbook-page.dropbook-js [data-reveal]`), so the global app CSS
        // and other routes are never affected.
        if (root.classList) root.classList.add('dropbook-js');

        // Smooth anchor scrolling for this page only (replaces the old global
        // `html { scroll-behavior: smooth }` rule, which we must not leak).
        var docEl = document.documentElement;
        var prevScrollBehavior = docEl.style.scrollBehavior;
        if (!reduced) docEl.style.scrollBehavior = 'smooth';

        var s = {
            root: root,
            reduced: reduced,
            observer: null,
            onScroll: null,
            onPointerMove: null,
            rafId: 0,
            cancelled: false,
            faqHandlers: [],
            anchorHandlers: [],
            tiltEls: [],
            parEls: [],
            prevScrollBehavior: prevScrollBehavior
        };

        // ---- Scroll reveal ----
        var items = root.querySelectorAll('[data-reveal]');
        if ('IntersectionObserver' in window && !reduced) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
            items.forEach(function (el) { io.observe(el); });
            s.observer = io;
        } else {
            items.forEach(function (el) { el.classList.add('in'); });
        }

        // ---- FAQ accordion (one open at a time) ----
        root.querySelectorAll('.faq-item').forEach(function (item) {
            var btn = item.querySelector('.faq-q');
            var body = item.querySelector('.faq-a');
            if (!btn || !body) return;
            var handler = function () {
                var isOpen = item.classList.contains('open');
                root.querySelectorAll('.faq-item.open').forEach(function (other) {
                    other.classList.remove('open');
                    var ob = other.querySelector('.faq-a');
                    var oq = other.querySelector('.faq-q');
                    if (ob) ob.style.maxHeight = '';
                    if (oq) oq.setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    item.classList.add('open');
                    body.style.maxHeight = body.scrollHeight + 'px';
                    btn.setAttribute('aria-expanded', 'true');
                }
            };
            btn.addEventListener('click', handler);
            s.faqHandlers.push({ btn: btn, handler: handler });
        });

        // ---- Navbar state + progress bar + active link ----
        var nav = root.querySelector('.navbar');
        var bar = root.querySelector('#navProgress');
        var links = Array.prototype.slice.call(root.querySelectorAll('[data-nav]'));
        var sections = links.map(function (a) {
            try { return document.querySelector(a.getAttribute('href')); }
            catch (err) { return null; }
        }).filter(Boolean);
        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                if (s.cancelled) { ticking = false; return; }
                var y = window.scrollY || 0;
                if (nav) nav.classList.toggle('scrolled', y > 8);
                if (bar) {
                    var h = document.documentElement.scrollHeight - window.innerHeight;
                    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
                }
                var current = null;
                sections.forEach(function (sec) {
                    if (sec.getBoundingClientRect().top <= 120) current = '#' + sec.id;
                });
                links.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === current);
                });
                ticking = false;
            });
        }
        s.onScroll = onScroll;
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // ---- Pointer: parallax + tilt + spotlight (single lerped rAF loop) ----
        if (!reduced && fine) {
            var px = 0.5, py = 0.5, tx = 0.5, ty = 0.5;
            s.tiltEls = Array.prototype.slice.call(root.querySelectorAll('[data-tilt]'));
            s.parEls = Array.prototype.slice.call(root.querySelectorAll('[data-parallax]'));
            var onPointerMove = function (e) {
                tx = e.clientX / window.innerWidth;
                ty = e.clientY / window.innerHeight;
                var spot = e.target && e.target.closest
                    ? e.target.closest('[data-spot], .diff-card, .step-card, .problem-icon, .hero-cta, .navbar-cta, .cta-giant, .faq-q')
                    : null;
                if (spot && root.contains(spot)) {
                    var r = spot.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        spot.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
                        spot.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
                    }
                }
            };
            s.onPointerMove = onPointerMove;
            window.addEventListener('pointermove', onPointerMove, { passive: true });
            (function loop() {
                if (s.cancelled) return;
                px += (tx - px) * 0.08;
                py += (ty - py) * 0.08;
                s.parEls.forEach(function (el) {
                    var d = parseFloat(el.getAttribute('data-parallax')) || 0.03;
                    var x = (px - 0.5) * 2 * d * 500;
                    var y = (py - 0.5) * 2 * d * 500;
                    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
                });
                s.tiltEls.forEach(function (el) {
                    var max = parseFloat(el.getAttribute('data-tilt')) || 6;
                    var rx = (0.5 - py) * 2 * max;
                    var ry = (px - 0.5) * 2 * max;
                    el.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
                });
                s.rafId = requestAnimationFrame(loop);
            })();
        }

        state = s;
    }

    function destroy() {
        if (!state) return;
        var s = state;
        state = null;
        s.cancelled = true;
        try {
            if (s.observer) s.observer.disconnect();
            if (s.onScroll) window.removeEventListener('scroll', s.onScroll);
            if (s.onPointerMove) window.removeEventListener('pointermove', s.onPointerMove);
            if (s.rafId) cancelAnimationFrame(s.rafId);
            s.faqHandlers.forEach(function (f) {
                try { f.btn.removeEventListener('click', f.handler); } catch (e) { /* noop */ }
            });
            s.tiltEls.forEach(function (el) { el.style.transform = ''; });
            s.parEls.forEach(function (el) { el.style.transform = ''; });
            document.documentElement.style.scrollBehavior = s.prevScrollBehavior || '';
            if (s.root && s.root.classList) s.root.classList.remove('dropbook-js');
        } catch (e) { /* never break SPA navigation on cleanup */ }
    }

    window.dropbookInit = init;
    window.dropbookDestroy = destroy;
})();
