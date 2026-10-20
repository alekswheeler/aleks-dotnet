/* Software APS landing - DC runtime (React) - carregador SPA-safe.
 * Exposes:
 *   window.apsstudioInit(rootElement)  - loads React, ReactDOM and the aps-app runtime in order,
 *                                        then the runtime auto-boots: replaces <x-dc> with #dc-root
 *                                        and mounts the landing template.
 *   window.apsstudioDestroy()          - unmounts the captured React root, removes the 3 scripts
 *                                        and the styles injected by the runtime.
 * The react-dom.createRoot API is wrapped before the runtime loads so the mount handle is
 * captured for a clean unmount; the original reference is restored right after boot.
 */
(function () {
    var state = null;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = function () { resolve(s); };
            s.onerror = function () {
                if (s.parentNode) s.parentNode.removeChild(s);
                reject(new Error('[apsstudio] falha ao carregar ' + src));
            };
            document.head.appendChild(s);
        });
    }

    function removeStylesByFragment(fragment) {
        var nodes = [];
        try {
            nodes = Array.prototype.slice.call(document.head.querySelectorAll('style'));
        } catch (e) {
            nodes = [];
        }
        nodes.forEach(function (n) {
            var text = n.textContent || (n.firstChild && n.firstChild.nodeValue) || '';
            if (text.indexOf(fragment) !== -1 && n.parentNode) {
                n.parentNode.removeChild(n);
            }
        });
    }

    function collectRuntimeStyles() {
        var found = [];
        try {
            Array.prototype.slice.call(document.head.querySelectorAll('style')).forEach(function (n) {
                var text = n.textContent || '';
                if (text.indexOf('x-dc{display:none!important}') !== -1 ||
                    text.indexOf('sc-placeholder') !== -1) {
                    found.push(n);
                }
            });
        } catch (e) { }
        return found;
    }

    function destroy() {
        if (!state) return;
        var s = state;
        state = null;
        if (s.prevCreateRoot && window.ReactDOM) {
            try { window.ReactDOM.createRoot = s.prevCreateRoot; } catch (e) { }
        }
        s.roots.forEach(function (r) {
            try {
                if (r.unmount) r.unmount();
                else if (r.container) {
                    while (r.container.firstChild) r.container.removeChild(r.container.firstChild);
                }
            } catch (e) { }
        });
        s.scripts.forEach(function (n) {
            try { if (n && n.parentNode) n.parentNode.removeChild(n); } catch (e) { }
        });
        s.styles.forEach(function (n) {
            try { if (n && n.parentNode) n.parentNode.removeChild(n); } catch (e) { }
        });
    }

    async function init(rootEl) {
        if (state) destroy();

        var st = { scripts: [], roots: [], styles: [], prevCreateRoot: null };
        state = st;

        try {
            var react = await loadScript('./js/apsstudio/react.production.min.js');
            st.scripts.push(react);

            var reactDom = await loadScript('./js/apsstudio/react-dom.production.min.js');
            st.scripts.push(reactDom);

            var dom = window.ReactDOM;
            if (dom && typeof dom.createRoot === 'function') {
                var prev = dom.createRoot;
                st.prevCreateRoot = prev;
                dom.createRoot = function () {
                    var root = prev.apply(dom, arguments);
                    st.roots.push(root);
                    return root;
                };
            }

            var app = await loadScript('./js/apsstudio/aps-app.js');
            st.scripts.push(app);

            if (st.prevCreateRoot && dom && dom.createRoot !== prev) {
                dom.createRoot = prev;
                st.prevCreateRoot = null;
            }

            st.styles = collectRuntimeStyles();

            return rootEl;
        } catch (err) {
            destroy();
            throw err;
        }
    }

    window.apsstudioInit = init;
    window.apsstudioDestroy = destroy;
})();
