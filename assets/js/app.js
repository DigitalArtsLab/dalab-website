/* DA Lab - site logic: rendering, modals, admin CMS with password, export */
(() => {
    'use strict';

    const $ = id => document.getElementById(id);

    // Escape user content before it ever touches innerHTML.
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    // ---------- Admin password ----------
    // SHA-256 hash of the admin password (so the password itself is not readable here).
    // Default password: "dalab2026" - CHANGE IT: run this in the browser console with
    // your new password, then paste the printed hash here:
    //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEUES-PASSWORT'))
    //     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
    const ADMIN_HASH = 'ff13ea153382f651ca7eca29cdb6f7de1f2996aee4906bf1bb168345f368b117';
    const AUTH_KEY = 'dalab_admin_ok';

    async function sha256Hex(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // ---------- Data ----------
    const STORAGE_KEY = 'dalab_standalone_data';
    // The data this browser's edits started from - needed to tell "what did I
    // change" from "what did somebody else publish meanwhile" when publishing.
    const BASE_KEY = 'dalab_edit_base';
    // What this browser last published. GitHub Pages serves the old file for up
    // to ~10 minutes after a publish; this stops the stale-copy warning from
    // firing in that window and lets us drop the local copy once the file
    // has caught up.
    const LAST_PUBLISHED_KEY = 'dalab_last_published';
    const HERO_DEFAULT_SRC = 'images/hero/DAlabLogo.png';

    // The file's own data, kept as a string so later edits can never mutate it.
    const fileJson = JSON.stringify(JSON.parse($('initial-data').textContent));
    const initialData = JSON.parse(fileJson);

    let allData;
    // True when the browser is showing a locally edited copy that no longer
    // matches the data in this file - i.e. after a new index.html was uploaded
    // but the old localStorage copy is still winning. The admin panel warns
    // about it, because otherwise an upload looks like it silently failed.
    let usingStaleLocalCopy = false;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const lastPublished = localStorage.getItem(LAST_PUBLISHED_KEY);
        if (stored && lastPublished && lastPublished === fileJson) {
            // The file now contains exactly what we published - the local
            // copy has done its job, back to a clean slate.
            [STORAGE_KEY, BASE_KEY, LAST_PUBLISHED_KEY].forEach(k => localStorage.removeItem(k));
            allData = JSON.parse(fileJson);
        } else if (stored) {
            allData = JSON.parse(stored);
            const storedJson = JSON.stringify(allData);
            usingStaleLocalCopy = storedJson !== fileJson && storedJson !== lastPublished;

            // Resume checking if we are waiting for a publish to go live
            if (lastPublished) {
                startLiveDeploymentCheck();
            }
        } else {
            allData = JSON.parse(fileJson);
        }
    } catch (err) {
        allData = JSON.parse(fileJson);
    }

    function persist() {
        try {
            // First edit in this browser: remember where it started from.
            if (!localStorage.getItem(BASE_KEY)) localStorage.setItem(BASE_KEY, fileJson);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
            return true;
        } catch (err) {
            toast('&#9888;&#65039; SPEICHERN FEHLGESCHLAGEN',
                'Der Browser-Speicher ist voll (meist wegen zu vieler hochgeladener Bilder). Tipp: Bilder in den images/-Ordner legen und den Bildpfad eintragen statt sie hochzuladen. Bitte exportiere jetzt, um nichts zu verlieren.',
                'bg-red-800');
            return false;
        }
    }

    // Controls a fixed banner at the top of the screen during deployment
    function updateDeployBanner(status) {
        let banner = document.getElementById('deploy-banner');
        const nav = document.querySelector('nav');

        if (status === 'hidden') {
            if (banner) banner.remove();
            if (nav) nav.style.top = '0';
            return;
        }

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'deploy-banner';
            // Removed uncompiled Tailwind classes and moved them to inline styles
            banner.className = 'fixed top-0 left-0 w-full text-white text-center py-2 text-xs font-din tracking-widest shadow-md transition-colors duration-500';
            banner.style.zIndex = '500'; // Bypasses Tailwind to guarantee it sits on top
            document.body.appendChild(banner);

            // Push the navigation bar down so it doesn't get covered
            if (nav) {
                nav.style.transition = 'top 0.3s ease';
                nav.style.top = '32px';
            }
        }

        if (status === 'progress') {
            banner.classList.remove('bg-green-800');
            banner.classList.add('bg-accent');
            banner.innerHTML = '&#8987; VER&Ouml;FFENTLICHUNG L&Auml;UFT ... GITHUB VERARBEITET DAS UPDATE';
        } else if (status === 'done') {
            banner.classList.remove('bg-accent');
            banner.classList.add('bg-green-800');
            banner.innerHTML = '&#9989; ONLINE! UPDATE ABGESCHLOSSEN.';

            // Hide the banner and restore the nav after 6 seconds
            setTimeout(() => {
                if (banner) banner.remove();
                if (nav) nav.style.top = '0';
            }, 6000);
        }
    }

    // Automatically polls the live site to check if GitHub Pages has finished deploying.
    function startLiveDeploymentCheck() {
        const lastPublished = localStorage.getItem(LAST_PUBLISHED_KEY);
        if (!lastPublished) return;

        // Show the progress banner immediately
        updateDeployBanner('progress');

        let attempts = 0;
        // Check every 30 seconds
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > 30) { // Give up after 15 minutes
                clearInterval(interval);
                updateDeployBanner('hidden');
                return;
            }
            try {
                // Aggressive cache-busting to bypass browser and CDN caches
                const url = window.location.href.split(/[?#]/)[0] + '?_bust=' + Date.now() + Math.random();
                const res = await fetch(url, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                if (!res.ok) return;

                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const tag = doc.querySelector('#initial-data');

                if (tag) {
                    // Normalize the live JSON exactly as we do on load
                    const liveJson = JSON.stringify(JSON.parse(tag.textContent));
                    if (liveJson === lastPublished) {
                        // GitHub Pages is fully updated!
                        [STORAGE_KEY, BASE_KEY, LAST_PUBLISHED_KEY].forEach(k => localStorage.removeItem(k));
                        usingStaleLocalCopy = false;
                        clearInterval(interval);

                        // Change the banner to success and clean up
                        updateDeployBanner('done');
                    }
                }
            } catch (err) {
                // Silently ignore network errors during background polling
            }
        }, 30000);
    }

    // ---------- Small UI helpers ----------
    function toast(titleHtml, textHtml, bgClass = 'bg-main') {
        const el = document.createElement('div');
        el.className = 'app-toast fixed top-8 left-1/2 -translate-x-1/2 z-[300] ' + bgClass +
            ' text-white p-6 shadow-2xl font-din tracking-widest text-sm text-center max-w-lg';
        el.innerHTML =
            '<h4 class="font-bold text-lg mb-2">' + titleHtml + '</h4>' +
            '<p class="font-sans text-xs opacity-90 leading-relaxed mb-4 normal-case">' + textHtml + '</p>' +
            '<button data-action="dismiss-toast" class="border border-white px-4 py-2 hover:bg-white hover:text-main transition-colors font-bold tracking-widest text-xs">OK</button>';
        document.body.appendChild(el);
    }

    function setImage(container, url, fallbackText, fallbackClass) {
        container.textContent = '';
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.className = 'w-full h-full object-cover';
            container.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = fallbackClass;
            span.textContent = fallbackText;
            container.appendChild(span);
        }
    }

    // Turn free-text input into a safe absolute URL ('' if empty).
    function normalizeUrl(u) {
        u = (u || '').trim();
        if (!u) return '';
        return /^https?:\/\//i.test(u) ? u : 'https://' + u;
    }

    // Accepts "10.1145/3816085", "doi:10.1145/..." or a full URL.
    function doiUrl(d) {
        d = (d || '').trim();
        if (!d) return '';
        if (/^https?:\/\//i.test(d)) return d;
        return 'https://doi.org/' + d.replace(/^doi:\s*/i, '');
    }

    // Shows a link button inside a detail modal - or removes it when no URL is set.
    function setDetailLink(afterElId, linkId, url, label) {
        let a = $(linkId);
        if (!url) {
            if (a) a.remove();
            return;
        }
        if (!a) {
            a = document.createElement('a');
            a.id = linkId;
            a.className = 'js-injected mt-12 inline-block border border-main px-8 py-4 font-din text-sm tracking-[0.2em] hover:bg-main hover:text-white transition-all interactive';
            a.target = '_blank';
            a.rel = 'noopener';
            $(afterElId).insertAdjacentElement('afterend', a);
        }
        a.href = url;
        a.textContent = label;
    }

    // ---------- Modals ----------
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    // A closed modal is visibility:hidden, so its children have no client rects -
    // that is what keeps them out of the tab order, and what filters them here.
    const focusablesIn = el => [...el.querySelectorAll(FOCUSABLE)].filter(n => n.getClientRects().length);

    let lastFocused = null;

    // Pure DOM: show/hide. The history is handled by the routing block below,
    // so nothing in here touches the address bar.
    function showModal(id) {
        const active = document.activeElement;
        // Remember where to hand focus back to - but never a control inside a
        // modal we are about to replace (login -> admin panel).
        if (active && active.closest && !active.closest('.modal')) lastFocused = active;
        const m = $(id);
        m.classList.add('active');
        document.body.classList.add('modal-open');
        const first = focusablesIn(m)[0];
        if (first) first.focus();
    }

    function hideModals(keepIds) {
        const keep = keepIds || [];
        const open = [...document.querySelectorAll('.modal.active')].filter(m => keep.indexOf(m.id) === -1);
        if (!open.length) return;
        open.forEach(m => m.classList.remove('active'));
        if (!document.querySelector('.modal.active')) document.body.classList.remove('modal-open');
        if (lastFocused && lastFocused.isConnected) lastFocused.focus();
        lastFocused = null;

        // Perform hard reload if the flag is set and the admin modal is no longer open
        if (needsReloadAfterClose && !$('admin-modal').classList.contains('active')) {
            window.location.reload(true);
        }
    }

    // ---------- Overlay routing ----------
    // Every overlay gets its own address and its own history entry, so the
    // browser's Back button closes it and single entries can be linked to.
    // Section anchors (#team, #projects, ...) are left alone: any hash that is
    // not a known overlay route simply closes whatever is open.
    const ROUTE_LISTS = { news: 'news', project: 'projects', person: 'team' };

    const slugify = s => String(s || '').toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Readable address for an entry - falls back to the id when the title is
    // empty or shared with another entry in the same list.
    function itemSlug(listName, item) {
        const base = slugify(item.title || item.name);
        if (!base) return item.id;
        const list = allData[listName] || [];
        const idx = list.indexOf(item);
        // Only a later duplicate gives up the readable address, so an entry
        // that was already shared keeps its link when a same-titled one is added.
        const taken = list.some((other, i) => i < idx && slugify(other.title || other.name) === base);
        return taken ? item.id : base;
    }

    const PLAIN_ROUTES = {
        'news-archive': () => showArchive('news'),
        'projects-archive': () => showArchive('projects'),
        'publications-archive': () => showModal('pubs-modal'),
        'imprint': () => showModal('imprint-modal'),
        'privacy': () => showModal('privacy-modal'),
        'contact': () => showModal('contact-modal')
    };

    function currentRoute() {
        const raw = location.hash.slice(1);
        try { return decodeURIComponent(raw); } catch (err) { return raw; }
    }

    let appliedRoute = null;

    // Brings the overlays in line with the address. Runs on load, on Back /
    // Forward and whenever the hash changes; guarded so the duplicate
    // popstate+hashchange pair a single Back produces only does the work once.
    function applyRoute() {
        const route = currentRoute();
        if (route === appliedRoute) return;
        appliedRoute = route;

        const slash = route.indexOf('/');
        const listName = slash > 0 ? ROUTE_LISTS[route.slice(0, slash)] : null;
        let item = null;
        if (listName) {
            const key = route.slice(slash + 1);
            const list = allData[listName] || [];
            item = list.find(i => itemSlug(listName, i) === key) || list.find(i => String(i.id) === key);
        }

        // A detail view can sit on top of an open archive - leave that one up.
        hideModals(item ? ['archive-modal'] : []);

        if (item) detailOpeners[listName](item);
        else if (PLAIN_ROUTES[route]) PLAIN_ROUTES[route]();
    }

    // Opens an overlay by pushing its address; applyRoute does the rest.
    // The state flag marks entries we created ourselves, so closing knows
    // whether going Back is safe or whether the page was opened from a link.
    function openRoute(route) {
        if (currentRoute() === route) { appliedRoute = null; applyRoute(); return; }
        try {
            history.pushState({ dalabOverlay: true }, '', '#' + route);
            applyRoute();
        } catch (err) {
            // Opened straight from the file system: file:// forbids pushState.
            // A plain hash change adds the same history entry and fires
            // hashchange - we only lose the marker used when closing.
            location.hash = '#' + route;
        }
    }

    // What CLOSE and Escape do.
    function closeModals() {
        const open = [...document.querySelectorAll('.modal.active')];
        if (!open.length) return;
        // The admin overlays are deliberately not in the history - close them
        // on their own and leave the address bar untouched.
        const admin = open.filter(m => m.id.indexOf('admin-') === 0);
        if (admin.length) {
            // Only the topmost admin overlay closes (the token dialog sits on
            // top of the panel) - everything else stays as it is.
            const top = admin[admin.length - 1];
            hideModals(open.filter(m => m !== top).map(m => m.id));
            const remaining = document.querySelector('.modal.active');
            if (remaining && !remaining.contains(document.activeElement)) {
                const f = focusablesIn(remaining)[0];
                if (f) f.focus();
            }
            return;
        }
        if (history.state && history.state.dalabOverlay) { history.back(); return; }
        if (location.hash) {
            try {
                // Opened straight from a shared link: drop the hash instead of
                // going back, which would leave the site.
                history.replaceState(null, '', location.pathname + location.search);
                appliedRoute = '';
            } catch (err) {
                // file:// again - going back is the best available option.
                history.back();
                return;
            }
        }
        hideModals();
    }

    window.addEventListener('popstate', applyRoute);
    window.addEventListener('hashchange', applyRoute);

    // Keep Tab inside the topmost open modal.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        const actives = [...document.querySelectorAll('.modal.active')];
        if (!actives.length) return;
        // Detail modals stack on top of the archive modal - highest z-index wins.
        const top = actives.sort((a, b) =>
            (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0)
        ).pop();
        const f = focusablesIn(top);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (!top.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // ---------- Mobile navigation ----------
    // The panel is CSS-hidden from lg upwards, so the .open class is harmless
    // on desktop - but aria-expanded is kept in sync all the same.
    function setNav(open) {
        $('mobile-nav').classList.toggle('open', open);
        $('nav-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    const closeNav = () => setNav(false);
    const toggleNav = () => setNav($('nav-toggle').getAttribute('aria-expanded') !== 'true');

    // ---------- Image compression (shared by hero logo + item images) ----------
    function compressImage(file, { maxDim = 1600, type = 'image/jpeg', quality = 0.82 } = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = e => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    let { width, height } = img;
                    const scale = Math.min(1, maxDim / Math.max(width, height));
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL(type, quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ---------- Public site rendering ----------
    const cardOverlay = '<div class="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>';

    function cardImage(item, placeholder) {
        return item.imageUrl
            ? '<img src="' + esc(item.imageUrl) + '" alt="" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">'
            : '<span class="text-[10px] font-din tracking-widest text-main/40 group-hover:opacity-0 transition-opacity">' + esc(placeholder) + '</span>';
    }

    // How many entries the front page shows per section; the rest moves into
    // a "VIEW ALL" archive modal so the page stays compact with many entries.
    const LIST_LIMITS = { news: 6, projects: 8 };

    function newsCard(n) {
        return `
            <div data-open="news" data-id="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(n.title)} - open news article" class="group border border-[#d1d1d1] bg-white overflow-hidden flex flex-col interactive cursor-pointer hover:shadow-lg transition-all duration-300">
                <div class="h-48 bg-[#e5e5e5] flex items-center justify-center relative overflow-hidden">
                    ${cardImage(n, 'IMG_NEWS')}${cardOverlay}
                </div>
                <div class="p-6 flex-grow relative">
                    <span class="text-[10px] font-din tracking-widest text-accent mb-2 block font-bold">${esc(n.date)}</span>
                    <h4 class="font-din font-bold text-lg mb-2 leading-tight">${esc(n.title)}</h4>
                    <p class="text-sm opacity-80 leading-relaxed font-light">${esc(n.shortDesc)}</p>
                </div>
            </div>`;
    }

    function projectCard(p) {
        return `
            <div data-open="projects" data-id="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(p.title)} - open project details" class="group border border-[#d1d1d1] bg-white overflow-hidden flex flex-col interactive cursor-pointer hover:shadow-lg transition-all duration-300 relative">
                <div class="h-48 bg-[#e5e5e5] flex items-center justify-center relative overflow-hidden">
                    ${cardImage(p, 'IMG_' + (p.title || '').toUpperCase())}${cardOverlay}
                </div>
                <div class="p-8 flex-grow">
                    <span class="text-[10px] font-din tracking-widest text-accent mb-3 block font-bold border-b border-accent/20 pb-2">${esc(p.status) || '&nbsp;'}</span>
                    <h4 class="font-din font-bold text-xl mb-3">${esc(p.title)}</h4>
                    <p class="text-sm opacity-80 leading-relaxed font-light">${esc(p.shortDesc)}</p>
                </div>
            </div>`;
    }

    // Injected below a grid when there are more entries than the front page shows.
    function updateViewAllButton(gridId, type, total, label) {
        const grid = $(gridId);
        let btn = grid.parentElement.querySelector('[data-action="open-route"]');
        if (total <= LIST_LIMITS[type]) {
            if (btn) btn.remove();
            return;
        }
        if (!btn) {
            btn = document.createElement('button');
            btn.dataset.action = 'open-route';
            btn.className = 'js-injected mt-12 border border-main px-8 py-4 font-din text-sm tracking-[0.2em] hover:bg-main hover:text-white transition-all interactive';
            grid.insertAdjacentElement('afterend', btn);
        }
        btn.dataset.route = type + '-archive';
        btn.textContent = label + ' (' + total + ')';
    }

    function ensureArchiveModal() {
        if ($('archive-modal')) return;
        const div = document.createElement('div');
        div.id = 'archive-modal';
        div.className = 'js-injected modal fixed inset-0 bg-bglight overflow-y-auto';
        div.style.zIndex = '95'; // below the detail modals, so cards can open on top
        div.setAttribute('role', 'dialog');
        div.setAttribute('aria-modal', 'true');
        div.innerHTML = `
            <div class="sticky top-0 w-full flex justify-between items-center p-6 z-10 bg-bglight/90 backdrop-blur-sm hairline-b gap-4">
                <button data-action="close-modal" class="font-din text-sm tracking-widest text-main hover:text-accent transition-colors interactive flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">&#8592;</span> BACK</button>
                <button data-action="close-modal" class="font-din text-sm tracking-widest btn-solid px-6 py-2 interactive flex items-center gap-2">CLOSE <span aria-hidden="true">&#10005;</span></button>
            </div>
            <div class="max-w-[1800px] mx-auto px-6 py-20">
                <h2 class="text-4xl md:text-6xl font-din font-bold mb-16 text-main flex items-center gap-6">
                    <span class="w-4 h-4 bg-accent block"></span> <span id="archive-modal-title">ARCHIVE</span>
                </h2>
                <div id="archive-modal-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
            </div>`;
        document.body.appendChild(div);
    }

    function showArchive(type) {
        ensureArchiveModal();
        $('archive-modal-title').textContent = type === 'news' ? 'NEWS ARCHIVE' : 'PROJECT ARCHIVE';
        $('archive-modal-grid').innerHTML = (allData[type] || [])
            .map(type === 'news' ? newsCard : projectCard).join('');
        showModal('archive-modal');
    }

    function renderNews() {
        $('dynamic-news-grid').innerHTML = allData.news.slice(0, LIST_LIMITS.news).map(newsCard).join('');
        updateViewAllButton('dynamic-news-grid', 'news', allData.news.length, 'VIEW ALL NEWS');
    }

    function renderProjects() {
        $('dynamic-projects-grid').innerHTML = allData.projects.slice(0, LIST_LIMITS.projects).map(projectCard).join('');
        updateViewAllButton('dynamic-projects-grid', 'projects', allData.projects.length, 'VIEW ALL PROJECTS');
    }

    // Placeholder for people without a photo: initials derived from the name
    // ("Jürgen Hagler" -> "JH"). The old `initials` field is ignored on purpose
    // - it only held dummy values and is no longer editable.
    function initialsOf(t) {
        const parts = String(t.name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    }

    function renderTeam() {
        // Four per row; an incomplete last row is centred (see .team-grid in
        // the stylesheet), so the portrait size stays the same for any team size.
        const grid = $('dynamic-team-grid');
        grid.className = 'team-grid';
        grid.innerHTML = allData.team.map(t => `
            <div data-open="team" data-id="${esc(t.id)}" role="button" tabindex="0" aria-label="${esc(t.name)} - open profile" class="group border border-[#d1d1d1] bg-white overflow-hidden flex flex-col interactive cursor-pointer text-center hover:border-accent hover:shadow-lg transition-all duration-300">
                <div class="w-1/2 mx-auto mt-8 aspect-square bg-[#e5e5e5] flex items-center justify-center relative overflow-hidden rounded-full border-2 border-transparent group-hover:border-accent transition-colors">
                    ${t.imageUrl
                        ? '<img src="' + esc(t.imageUrl) + '" alt="" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">'
                        : '<span class="text-4xl font-din font-bold text-main/20 transition-colors">' + esc(initialsOf(t)) + '</span>'}
                </div>
                <div class="p-6">
                    <h4 class="font-din font-bold text-lg mb-1">${esc(t.name)}</h4>
                    <span class="text-xs font-din tracking-widest text-accent block">${esc(t.role)}</span>
                </div>
            </div>`).join('');
    }

    function pubEntry(p, extraClass, showYear) {
        // Classic citation line: Authors - Venue, Volume/Issue/Pages details, DOI link.
        let meta = esc(p.authors) + ' &ndash; ' + esc(p.journal);
        if (p.details && p.details.trim()) meta += ', ' + esc(p.details.trim());
        const doi = doiUrl(p.doi);

        // Dynamically choose between an anchor tag or div, adding the 'block' class
        const tag = doi ? 'a' : 'div';
        const hrefAttr = doi ? `href="${esc(doi)}" target="_blank" rel="noopener"` : '';

        // Display the DOI text without nested anchor tags to keep HTML valid
        const doiHtml = doi
            ? `<p class="text-sm font-light mt-1 text-accent font-medium break-all">${esc(doi)}</p>`
            : '';

        return `
        <${tag} ${hrefAttr} class="group interactive relative block ${extraClass}">
            <div class="absolute left-0 top-0 h-full w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
            <div class="pl-4">
                <div class="flex flex-col md:flex-row md:items-baseline justify-between">
                    <h4 class="font-bold text-xl mb-1 text-main normal-case group-hover:text-accent transition-colors">${esc(p.title)}</h4>
                    ${showYear ? '<span class="text-sm font-din tracking-widest opacity-60">' + esc(p.year) + '</span>' : ''}
                </div>
                <p class="text-base text-main/70 font-light">${meta}</p>
                ${doiHtml}
            </div>
        </${tag}>`;
    }

    function renderPubs() {
        // Always newest year first, regardless of entry order in the admin.
        const pubs = [...allData.publications].sort(
            (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0)
        );
        $('dynamic-recent-pubs').innerHTML =
            pubs.slice(0, 3).map(p => pubEntry(p, 'hairline-b pb-6', true)).join('');

        let currentYear = null;
        const years = [];
        $('pubs-archive-list').innerHTML = pubs.map(p => {
            let heading = '';
            if (p.year !== currentYear) {
                currentYear = p.year;
                years.push({ year: currentYear, count: pubs.filter(q => q.year === currentYear).length });
                heading = '<h3 id="pub-year-' + esc(currentYear) + '" class="text-2xl font-din font-bold mt-12 mb-6 hairline-b pb-2 tracking-widest text-accent">' + esc(currentYear) + '</h3>';
            }
            return heading + pubEntry(p, 'mb-6', false);
        }).join('');

        // Year jump bar in the archive's sticky header - with many entries the
        // list gets long, this keeps every year one click away.
        $('pubs-year-nav').innerHTML = years.length > 1
            ? years.map(y => '<button data-action="jump-year" data-year="' + esc(y.year) + '" class="font-din text-xs tracking-widest border border-main/10 px-4 py-2 hover:border-accent hover:text-accent transition-colors interactive" title="' + y.count + ' Einträge">' + esc(y.year) + '</button>').join('')
            : '';
        $('pubs-count').textContent = pubs.length ? pubs.length + (pubs.length === 1 ? ' ENTRY' : ' ENTRIES') : '';
    }

    function initApp() {
        if (allData.heroImage) $('main-hero-img').src = allData.heroImage;
        renderNews();
        renderProjects();
        renderTeam();
        renderPubs();
    }

    // ---------- Detail modals ----------
    // Cards are role="button" divs, so they are opened by click as well as by
    // Enter/Space - both go through here. Opening navigates, so that Back
    // closes the overlay again.
    function openDetail(card) {
        const listName = card.dataset.open;
        const item = (allData[listName] || []).find(i => String(i.id) === card.dataset.id);
        if (!item) return;
        const kind = Object.keys(ROUTE_LISTS).find(k => ROUTE_LISTS[k] === listName);
        openRoute(kind + '/' + itemSlug(listName, item));
    }

    const detailOpeners = {
        news(n) {
            $('nm-title').textContent = n.title || '';
            $('nm-date').textContent = n.date || '';
            $('nm-content').textContent = n.content || '';
            setImage($('nm-img-container'), n.imageUrl, 'IMG_' + (n.title || '').toUpperCase(), 'text-main/40 font-din tracking-widest');
            setDetailLink('nm-content', 'nm-link', normalizeUrl(n.link), 'MORE INFORMATION ↗');
            showModal('news-modal');
        },
        projects(p) {
            $('pm-title').textContent = p.title || '';
            $('pm-status').textContent = p.status || '';
            $('pm-team').textContent = p.team || '';
            $('pm-partners').textContent = p.partners || '';
            $('pm-content').textContent = p.content || '';
            setImage($('pm-img-container'), p.imageUrl, 'IMG_' + (p.title || '').toUpperCase(), 'text-main/40 font-din tracking-widest');
            setDetailLink('pm-content', 'pm-link', normalizeUrl(p.link), 'VISIT PROJECT WEBSITE ↗');
            showModal('project-modal');
        },
        team(t) {
            $('tm-name').textContent = t.name || '';
            $('tm-role').textContent = t.role || '';
            $('tm-bio').textContent = t.bio || '';
            const email = $('tm-email');
            email.textContent = t.email || '';
            email.href = 'mailto:' + (t.email || '');
            // The whole CONTACT block disappears when there is no e-mail.
            $('tm-contact-block').classList.toggle('hidden', !t.email);
            // Profile links (Pure research portal, Google Scholar) - only the filled ones.
            const links = [
                ['Research Portal (Pure)', normalizeUrl(t.pure)],
                ['Google Scholar', normalizeUrl(t.scholar)]
            ].filter(([, url]) => url);
            $('tm-links').innerHTML = links.map(([label, url]) =>
                '<a href="' + esc(url) + '" target="_blank" rel="noopener" class="block font-medium text-lg text-accent hover:text-main transition-colors interactive">' + esc(label) + ' &#8599;</a>'
            ).join('');
            $('tm-links-block').classList.toggle('hidden', !links.length);
            setImage($('tm-img-container'), t.imageUrl, initialsOf(t), 'text-main/20 font-din font-bold text-6xl');
            showModal('team-modal');
        }
    };

    // ---------- Admin login ----------
    function requestAdmin() {
        if (sessionStorage.getItem(AUTH_KEY) === '1') { openAdminPanel(); return; }
        showModal('admin-login-modal');
        setTimeout(() => $('admin-password').focus(), 150);
    }

    const STALE_WARNED_KEY = 'dalab_stale_warned';

    function openAdminPanel() {
        $('admin-login-modal').classList.remove('active');
        showModal('admin-modal');
        switchTab('news');
        if (usingStaleLocalCopy && !sessionStorage.getItem(STALE_WARNED_KEY)) {
            sessionStorage.setItem(STALE_WARNED_KEY, '1');
            toast('&#8505;&#65039; DU SIEHST EINE LOKALE FASSUNG',
                'Dieser Browser zeigt Inhalte, die von der index.html abweichen &ndash; gespeicherte lokale &Auml;nderungen haben Vorrang. Wenn du gerade eine neue index.html hochgeladen hast und sie nicht siehst, klicke auf &bdquo;LOKALE &Auml;NDERUNGEN VERWERFEN&ldquo;.');
        }
    }

    async function tryLogin() {
        if (!window.crypto || !crypto.subtle) {
            toast('&#9888;&#65039; LOGIN NICHT M&Ouml;GLICH', 'Dieser Browser unterst&uuml;tzt die ben&ouml;tigte Verschl&uuml;sselung nicht (HTTPS erforderlich).', 'bg-red-800');
            return;
        }
        const input = $('admin-password');
        const ok = (await sha256Hex(input.value)) === ADMIN_HASH;
        if (ok) {
            sessionStorage.setItem(AUTH_KEY, '1');
            input.value = '';
            $('admin-login-error').classList.add('hidden');
            openAdminPanel();
        } else {
            $('admin-login-error').classList.remove('hidden');
            input.select();
        }
    }

    // ---------- Admin CMS ----------
    // One config object drives list labels, form fields and image support per section.
    const SECTIONS = {
        news: {
            display: 'title', hasImage: true,
            fields: [
                ['title', 'News Title'],
                ['date', 'Date (e.g. July 2026)'],
                ['link', 'External Link (optional, e.g. https://ars.electronica.art/...)'],
                ['shortDesc', 'Short Excerpt (Card)', 'area'],
                ['content', 'Full Content (Detailed View)', 'area']
            ]
        },
        projects: {
            display: 'title', hasImage: true,
            fields: [
                ['title', 'Project Title'],
                ['status', 'Status (e.g. ONGOING)'],
                ['team', 'Researchers (Comma separated)'],
                ['partners', 'Partners / Funding'],
                ['link', 'Project Website (optional, e.g. https://ludaviz.at)'],
                ['shortDesc', 'Short Description (Card)', 'area'],
                ['content', 'Full Content (Detailed View)', 'area']
            ]
        },
        team: {
            display: 'name', hasImage: true,
            fields: [
                ['name', 'Full Name'],
                ['role', 'Role (e.g. Researcher)'],
                ['email', 'Email Address'],
                ['pure', 'FH Research Portal – Pure (optional, e.g. https://pure.fh-ooe.at/de/persons/…)'],
                ['scholar', 'Google Scholar profile (optional, e.g. https://scholar.google.com/citations?user=…)'],
                ['bio', 'Biography / Details', 'area']
            ]
        },
        publications: {
            display: 'title', hasImage: false,
            fields: [
                ['title', 'Paper Title'],
                ['authors', 'Authors (e.g. Juergen Hagler and Celine Pham)'],
                ['year', 'Year (e.g. 2026)'],
                ['journal', 'Journal / Conference (e.g. Proc. ACM Comput. Graph. Interact. Tech.)'],
                ['details', 'Volume / Issue / Pages (optional, e.g. 9, 3, Article 40 (July 2026), 8 pages)'],
                ['doi', 'DOI (optional, e.g. 10.1145/3816085 or full doi.org URL)']
            ]
        }
    };

    let currentTab = 'news';
    let currentUploadedImage = null;

    function refreshHeroPreview() {
        $('admin-hero-preview').src = allData.heroImage || HERO_DEFAULT_SRC;
    }

    function switchTab(tab) {
        currentTab = tab;
        const isHero = tab === 'hero';
        $('admin-section-title').textContent = isHero ? 'HERO LOGO' : tab.toUpperCase();
        document.querySelectorAll('[data-action="admin-tab"]').forEach(b =>
            b.classList.toggle('text-accent', b.dataset.tab === tab));
        $('btn-add-new').classList.toggle('hidden', isHero);
        $('admin-hero-view').classList.toggle('hidden', !isHero);
        cancelEdit();
        if (isHero) {
            $('admin-list-view').classList.add('hidden');
            refreshHeroPreview();
        } else {
            renderAdminList();
        }
    }

    // The list order is the order on the page (news/projects: first entries
    // on the front page, team: left to right). Arrows move an entry by one.
    function renderAdminList() {
        const { display } = SECTIONS[currentTab];
        const list = allData[currentTab] || [];
        const hint = currentTab === 'publications'
            ? 'Sortierung auf der Seite: neuestes Jahr zuerst. Die Pfeile ordnen Einträge innerhalb eines Jahres.'
            : currentTab === 'team'
                ? 'Reihenfolge wie auf der Seite (links oben zuerst). Neue Personen werden hinten angefügt – mit den Pfeilen verschieben.'
                : 'Reihenfolge wie auf der Seite. Die Startseite zeigt die ersten ' + LIST_LIMITS[currentTab] + ' Einträge, der Rest steht im Archiv. Neue Einträge kommen automatisch nach oben.';
        $('admin-list-view').innerHTML =
            '<p class="text-xs text-gray-500 mb-4">' + hint + '</p>' +
            list.map((item, i) => `
            <div class="flex justify-between items-center p-4 bg-white border border-gray-200 gap-4">
                <span class="font-din text-xs text-gray-400 tracking-widest">${i + 1}</span>
                <span class="font-bold flex-grow">${esc(item[display])}${currentTab === 'publications' && item.year ? ' <span class="font-din text-xs text-gray-400 tracking-widest">' + esc(item.year) + '</span>' : ''}</span>
                <button data-action="move-up" data-id="${esc(item.id)}" class="font-din text-xs text-gray-500 hover:text-accent px-4 py-2 interactive${i === 0 ? ' opacity-30 cursor-default' : ''}" aria-label="nach oben" title="nach oben"${i === 0 ? ' disabled' : ''}>&#9650;</button>
                <button data-action="move-down" data-id="${esc(item.id)}" class="font-din text-xs text-gray-500 hover:text-accent px-4 py-2 interactive${i === list.length - 1 ? ' opacity-30 cursor-default' : ''}" aria-label="nach unten" title="nach unten"${i === list.length - 1 ? ' disabled' : ''}>&#9660;</button>
                <button data-action="edit-item" data-id="${esc(item.id)}" class="text-sm font-din tracking-widest text-accent hover:underline">EDIT</button>
            </div>`).join('');
    }

    function moveItem(id, delta) {
        const list = allData[currentTab] || [];
        const i = list.findIndex(x => String(x.id) === String(id));
        const j = i + delta;
        if (i < 0 || j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        persist();
        initApp();
        renderAdminList();
    }

    function setPreview(url) {
        const preview = $('admin-img-preview');
        preview.textContent = '';
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.className = 'w-full h-full object-cover';
            preview.appendChild(img);
        } else {
            preview.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';
        }
    }

    function buildForm(data = {}) {
        const section = SECTIONS[currentTab];
        $('image-upload-section').classList.toggle('hidden', !section.hasImage);
        // Publications: the DOI alone fetches title, authors, year, venue and
        // details - typing them by hand is the slow part of 20 papers a year.
        const doiBox = currentTab === 'publications'
            ? `<div class="bg-white border border-gray-200 p-4 mb-6">
                <label class="admin-label" for="doi-lookup-input">DOI eingeben und Felder automatisch füllen</label>
                <div class="flex flex-wrap gap-4">
                    <input type="text" id="doi-lookup-input" class="admin-input flex-grow" placeholder="10.1145/3816085 oder https://doi.org/…" value="${esc(data.doi)}">
                    <button type="button" data-action="doi-lookup" id="btn-doi-lookup" class="border border-main px-4 py-2 font-din tracking-widest text-xs hover:bg-main hover:text-white transition-colors interactive">FELDER FÜLLEN</button>
                </div>
                <p class="text-xs text-gray-500">Holt die Angaben von Crossref bzw. DataCite. Danach bitte kurz prüfen – vor allem Autorennamen und Venue.</p>
              </div>`
            : '';
        $('form-fields-container').innerHTML = doiBox + section.fields.map(([key, label, kind]) => kind === 'area'
            ? `<div><label class="admin-label" for="field-${key}">${esc(label)}</label><textarea id="field-${key}" class="admin-input admin-textarea">${esc(data[key])}</textarea></div>`
            : `<div><label class="admin-label" for="field-${key}">${esc(label)}</label><input type="text" id="field-${key}" class="admin-input" value="${esc(data[key])}"></div>`
        ).join('');
    }

    // ---------- DOI lookup (Crossref, fallback DataCite) ----------
    const cleanDoi = s => String(s || '').trim()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
        .replace(/^doi:\s*/i, '')
        .replace(/[.,;)\]]+$/, '');

    // "Juergen Hagler and Celine Pham" - matches how the first entries were written.
    function joinAuthors(names) {
        const n = names.filter(Boolean);
        if (n.length <= 1) return n.join('');
        if (n.length === 2) return n[0] + ' and ' + n[1];
        return n.slice(0, -1).join(', ') + ', and ' + n[n.length - 1];
    }

    async function lookupDoi(doi) {
        // Crossref first (ACM, IEEE, Springer, Elsevier ...), then DataCite
        // (Zenodo, OSF, institutional repositories).
        let res = await fetch('https://api.crossref.org/works/' + encodeURIComponent(doi), { headers: { Accept: 'application/json' } });
        if (res.ok) {
            const w = (await res.json()).message || {};
            const date = w['published-print'] || w['published-online'] || w.issued || w.created || {};
            const year = date['date-parts'] && date['date-parts'][0] ? date['date-parts'][0][0] : '';
            const venue = (w['container-title'] && w['container-title'][0]) || (w.event && w.event.name) || w.publisher || '';
            // "9, 3, Article 40" for journals with article numbers, "9, 3, pp. 1-8" otherwise.
            const pages = w['article-number'] ? 'Article ' + w['article-number']
                : w.page ? (w.page.indexOf('-') > -1 ? 'pp. ' + w.page : 'Article ' + w.page) : '';
            const details = [w.volume, w.issue, pages].filter(Boolean).join(', ');
            return {
                title: (w.title && w.title[0]) || '',
                authors: joinAuthors((w.author || []).map(a => a.given ? a.given + ' ' + a.family : (a.family || a.name || ''))),
                year: year ? String(year) : '',
                journal: venue,
                details
            };
        }
        res = await fetch('https://api.datacite.org/dois/' + encodeURIComponent(doi), { headers: { Accept: 'application/vnd.api+json' } });
        if (res.ok) {
            const a = ((await res.json()).data || {}).attributes || {};
            const t = (a.titles && a.titles[0] && a.titles[0].title) || '';
            return {
                title: t,
                authors: joinAuthors((a.creators || []).map(c => c.givenName ? c.givenName + ' ' + c.familyName : (c.name || ''))),
                year: a.publicationYear ? String(a.publicationYear) : '',
                journal: (a.container && a.container.title) || a.publisher || '',
                details: [a.container && a.container.volume, a.container && a.container.issue,
                    a.container && a.container.firstPage ? 'pp. ' + a.container.firstPage + (a.container.lastPage ? '-' + a.container.lastPage : '') : ''].filter(Boolean).join(', ')
            };
        }
        throw new Error(res.status === 404 ? 'DOI nicht gefunden.' : 'Abfrage fehlgeschlagen (' + res.status + ').');
    }

    async function doiLookupAction() {
        const input = $('doi-lookup-input');
        const btn = $('btn-doi-lookup');
        const doi = cleanDoi(input.value);
        if (!doi) { input.focus(); return; }
        btn.disabled = true;
        const label = btn.textContent;
        btn.textContent = '⏳ …';
        try {
            const r = await lookupDoi(doi);
            const filled = [];
            [['title', r.title], ['authors', r.authors], ['year', r.year], ['journal', r.journal], ['details', r.details], ['doi', doi]].forEach(([k, v]) => {
                const f = $('field-' + k);
                if (f && v) { f.value = v; filled.push(k); }
            });
            toast('&#9989; FELDER GEF&Uuml;LLT', 'Aus dem DOI &uuml;bernommen: ' + esc(filled.join(', ')) + '. Bitte pr&uuml;fen und dann SAVE klicken.');
        } catch (err) {
            toast('&#9888;&#65039; DOI-ABFRAGE', esc(err.message || String(err)) + ' Felder bitte von Hand ausf&uuml;llen.', 'bg-red-800');
        } finally {
            btn.disabled = false;
            btn.textContent = label;
        }
    }

    function openEditor({ item = null } = {}) {
        $('admin-list-view').classList.add('hidden');
        $('admin-editor-form').classList.remove('hidden');
        $('admin-form-title').textContent = (item ? 'Edit ' : 'Add New ') + currentTab;
        $('edit-id').value = item ? item.id : '';
        $('btn-delete').classList.toggle('hidden', !item);
        // Path-based image (recommended) vs uploaded base64 image
        const isPath = item && item.imageUrl && !item.imageUrl.startsWith('data:');
        $('image-path-input').value = isPath ? item.imageUrl : '';
        currentUploadedImage = (item && !isPath) ? (item.imageUrl || null) : null;
        setPreview(item ? item.imageUrl : null);
        $('image-upload-input').value = '';
        buildForm(item || {});
    }

    function cancelEdit() {
        $('admin-list-view').classList.toggle('hidden', currentTab === 'hero');
        $('admin-editor-form').classList.add('hidden');
    }

    function saveItem() {
        const id = $('edit-id').value;
        const section = SECTIONS[currentTab];
        const payload = {};
        section.fields.forEach(([key]) => { payload[key] = $('field-' + key).value; });
        if (section.hasImage) {
            const path = $('image-path-input').value.trim();
            // Always write the field: an empty path with no upload means the
            // image was removed, and the merge below would otherwise keep it.
            payload.imageUrl = path || currentUploadedImage || '';
        }

        const list = allData[currentTab];
        if (id) {
            const index = list.findIndex(i => i.id === id);
            if (index > -1) list[index] = { ...list[index], ...payload };
        } else {
            payload.id = 'id_' + Date.now();
            // News and projects: newest entries go to the top of the page -
            // the front page only shows the first few. Team members are
            // appended; their order is arranged with the arrows in the list.
            if (currentTab === 'news' || currentTab === 'projects') list.unshift(payload);
            else list.push(payload);
        }
        persist();
        initApp();
        renderAdminList();
        cancelEdit();
    }

    function deleteItem() {
        const id = $('edit-id').value;
        if (!id) return;
        allData[currentTab] = allData[currentTab].filter(i => i.id !== id);
        persist();
        initApp();
        renderAdminList();
        cancelEdit();
    }

    // ---------- Export ----------
    // Serialises data into the #initial-data tag. "<" is escaped so content
    // can never terminate the script tag.
    const dataTagContent = data => '\n' + JSON.stringify(data, null, 2).replace(/</g, '\\u003c') + '\n';

    // Writes the current data into the #initial-data JSON tag of a cleaned DOM clone.
    // No regex on source code - robust against any content.
    function buildExportHtml(data) {
        const clone = document.documentElement.cloneNode(true);

        clone.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        clone.querySelectorAll('.app-toast').forEach(t => t.remove());
        // Remove JS-injected elements (archive modal, view-all buttons) - they
        // are recreated on load and must not be baked into the export.
        clone.querySelectorAll('.js-injected').forEach(el => el.remove());
        clone.querySelector('body').classList.remove('modal-open');
        // An open mobile menu must not be baked into the export.
        clone.querySelector('#mobile-nav').classList.remove('open');
        clone.querySelector('#nav-toggle').setAttribute('aria-expanded', 'false');
        // Left-overs from the removed custom cursor in previously exported pages.
        ['cursor', 'cursor-follower'].forEach(id => {
            const c = clone.querySelector('#' + id);
            if (c) c.remove();
        });

        // Strip rendered content - rebuilt from data on load; uploaded base64
        // images inside cards would otherwise bloat the file.
        ['dynamic-news-grid', 'dynamic-projects-grid', 'dynamic-team-grid',
         'dynamic-recent-pubs', 'pubs-archive-list', 'pubs-year-nav', 'pubs-count',
         'admin-list-view', 'form-fields-container', 'tm-links'].forEach(id => {
            const el = clone.querySelector('#' + id);
            if (el) el.innerHTML = '';
        });
        // Detail modals keep the image of the last opened entry in their
        // container - reset them to their placeholder, otherwise that image
        // gets baked into every export.
        [['nm-img-container', 'text-main/40 font-din tracking-widest', 'NEWS_IMAGE'],
         ['pm-img-container', 'text-main/40 font-din tracking-widest', 'PROJECT_IMAGE'],
         ['tm-img-container', 'text-main/20 font-din font-bold text-6xl', 'XY']
        ].forEach(([id, cls, text]) => {
            const el = clone.querySelector('#' + id);
            if (el) {
                el.textContent = '';
                const span = el.ownerDocument.createElement('span');
                span.className = cls;
                span.textContent = text;
                el.appendChild(span);
            }
        });
        const heroImg = clone.querySelector('#main-hero-img');
        if (heroImg) heroImg.setAttribute('src', HERO_DEFAULT_SRC); // re-set from data on load
        // Profile overlay: back to its neutral state.
        const linksBlock = clone.querySelector('#tm-links-block');
        if (linksBlock) linksBlock.classList.add('hidden');
        const contactBlock = clone.querySelector('#tm-contact-block');
        if (contactBlock) contactBlock.classList.remove('hidden');
        ['tm-name', 'tm-role', 'tm-bio', 'tm-email'].forEach(id => { const el = clone.querySelector('#' + id); if (el) el.textContent = ''; });
        // renderTeam picks the column count per team size - keep the file stable.
        const teamGrid = clone.querySelector('#dynamic-team-grid');
        if (teamGrid) teamGrid.className = 'team-grid';
        const heroPrev = clone.querySelector('#admin-hero-preview');
        if (heroPrev) heroPrev.setAttribute('src', HERO_DEFAULT_SRC);
        // Admin panel always reopens on the news tab - don't bake a tab state in.
        const heroView = clone.querySelector('#admin-hero-view');
        if (heroView) heroView.classList.add('hidden');
        const listView = clone.querySelector('#admin-list-view');
        if (listView) listView.classList.remove('hidden');
        const addNew = clone.querySelector('#btn-add-new');
        if (addNew) addNew.classList.remove('hidden');
        clone.querySelectorAll('[data-action="admin-tab"]').forEach(b => b.classList.remove('text-accent'));
        const preview = clone.querySelector('#admin-img-preview');
        if (preview) preview.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';
        // A publish that is still running must not leave its button disabled.
        const pub = clone.querySelector('#btn-publish');
        if (pub) { pub.removeAttribute('disabled'); pub.textContent = '\u{1F680} VERÖFFENTLICHEN'; }

        clone.querySelector('#initial-data').textContent = dataTagContent(data);
        return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    function exportHtml() {
        const blob = new Blob([buildExportHtml(allData)], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast('&#9989; EXPORT ERFOLGREICH!',
            'Die heruntergeladene index.html enth&auml;lt alle aktuellen Inhalte. Ersetze damit die index.html im Website-Ordner (assets/ und images/ bleiben unver&auml;ndert).',
            'bg-green-800');
    }

    // ---------- Publish straight to GitHub ----------
    // Writes index.html into the repo through the GitHub contents API, using a
    // token the editor stores once in their own browser. The repo below must
    // match where the site lives - change it when the repo moves (e.g. into
    // an organisation).
    const PUBLISH = { owner: 'DigitalArtsLab', repo: 'dalab-website', branch: 'main', path: 'index.html' };
    const TOKEN_KEY = 'dalab_github_token';
    const apiUrl = () => 'https://api.github.com/repos/' + PUBLISH.owner + '/' + PUBLISH.repo +
        '/contents/' + PUBLISH.path;

    const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

    // UTF-8 <-> base64 (btoa/atob alone break on umlauts).
    function toBase64Utf8(str) {
        const bytes = new TextEncoder().encode(str);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
    }
    function fromBase64Utf8(b64) {
        const bin = atob(b64.replace(/\s/g, ''));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    function openTokenDialog(message) {
        const hint = $('admin-token-hint');
        hint.textContent = message || '';
        hint.classList.toggle('hidden', !message);
        $('admin-token-input').value = '';
        $('btn-clear-token').classList.toggle('hidden', !getToken());
        showModal('admin-token-modal');
        $('admin-token-input').focus();
    }

    // Three-way merge of one list, keyed by item id.
    //   base   = what this browser's edits started from
    //   mine   = this browser's current data
    //   theirs = what is in the repo right now
    // Result starts from theirs (so other people's work and order survive) and
    // replays only what changed here. An item touched on both sides is a
    // conflict - nothing gets published then, nobody's work is overwritten.
    function mergeList(listName, base, mine, theirs) {
        const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
        const keyOf = i => String(i && i.id != null ? i.id : JSON.stringify(i));
        const index = arr => new Map((arr || []).map(i => [keyOf(i), i]));
        const B = index(base), M = index(mine), T = index(theirs);
        const label = i => listName + ': „' + (i.title || i.name || keyOf(i)) + '“';

        const result = [...(theirs || [])];
        const conflicts = [];
        const stats = { added: 0, changed: 0, removed: 0 };

        // Deleted here.
        B.forEach((b, id) => {
            if (M.has(id) || !T.has(id)) return;
            if (same(T.get(id), b)) {
                result.splice(result.findIndex(i => keyOf(i) === id), 1);
                stats.removed++;
            } else {
                conflicts.push(label(b) + ' wurde hier gelöscht, aber inzwischen von jemand anderem geändert');
            }
        });

        // Added or changed here.
        M.forEach((m, id) => {
            const b = B.get(id), t = T.get(id);
            if (!b) {
                if (!t) {
                    // News/projects: newest on top - same rule as the editor uses.
                    if (listName === 'news' || listName === 'projects') result.unshift(m); else result.push(m);
                    stats.added++;
                } else if (!same(m, t)) {
                    conflicts.push(label(m) + ' wurde hier und von jemand anderem gleichzeitig neu angelegt');
                }
                return;
            }
            if (same(m, b)) return;          // untouched here
            if (!t) {
                conflicts.push(label(m) + ' wurde hier geändert, aber inzwischen von jemand anderem gelöscht');
            } else if (same(t, b)) {
                result[result.findIndex(i => keyOf(i) === id)] = m;
                stats.changed++;
            } else if (!same(t, m)) {
                conflicts.push(label(m) + ' wurde hier und von jemand anderem geändert');
            }
        });

        // Order. The result so far follows the repo's order; a re-sort done
        // here (arrows in the admin list) would be lost. Compare the order of
        // the entries both sides know: if only this side moved things, apply
        // this side's order; if the other side also re-sorted, theirs stays
        // and the caller reports it.
        const seq = (arr, other) => (arr || []).map(keyOf).filter(k => other.has(k)).join('|');
        const iReordered = seq(mine, B) !== seq(base, M);
        const theyReordered = seq(theirs, B) !== seq(base, T);
        let orderNote = '';
        if (iReordered && !theyReordered) {
            const pos = new Map((mine || []).map((item, i) => [keyOf(item), i]));
            // Entries this side knows follow this side's order; entries only
            // the repo knows (their additions) stay at the index they had -
            // appended stays appended, newest-on-top stays on top.
            const known = result.filter(i => pos.has(keyOf(i))).sort((a, b) => pos.get(keyOf(a)) - pos.get(keyOf(b)));
            const foreign = result.map((item, i) => ({ item, i })).filter(x => !pos.has(keyOf(x.item)));
            const ordered = [...known];
            foreign.forEach(f => ordered.splice(Math.min(f.i, ordered.length), 0, f.item));
            result.splice(0, result.length, ...ordered);
            stats.reordered = true;
        } else if (iReordered && theyReordered) {
            orderNote = listName + ': Reihenfolge wurde hier und im Repo geändert – die Reihenfolge aus dem Repo wurde beibehalten.';
        }

        return { result, conflicts, stats, orderNote };
    }

    function mergeData(base, mine, theirs) {
        const merged = JSON.parse(JSON.stringify(theirs));
        const conflicts = [];
        const summary = [];
        const notes = [];
        const keys = new Set([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)]);
        keys.forEach(key => {
            const b = base[key], m = mine[key], t = theirs[key];
            if (Array.isArray(m) || Array.isArray(t) || Array.isArray(b)) {
                const r = mergeList(key, b, m, t);
                merged[key] = r.result;
                conflicts.push(...r.conflicts);
                const parts = [];
                if (r.stats.added) parts.push('+' + r.stats.added);
                if (r.stats.changed) parts.push('~' + r.stats.changed);
                if (r.stats.removed) parts.push('-' + r.stats.removed);
                if (r.stats.reordered) parts.push('sortiert');
                if (parts.length) summary.push(key + ' ' + parts.join(' '));
                if (r.orderNote) notes.push(r.orderNote);
                return;
            }
            // Scalars (heroImage): mine wins if untouched on their side.
            if (JSON.stringify(m) === JSON.stringify(b)) return;
            if (JSON.stringify(t) === JSON.stringify(b) || JSON.stringify(t) === JSON.stringify(m)) {
                merged[key] = m;
                summary.push(key);
            } else {
                conflicts.push(key + ' wurde hier und von jemand anderem geändert');
            }
        });
        return { merged, conflicts, summary, notes };
    }

    async function fetchRemote(token) {
        const res = await fetch(apiUrl() + '?ref=' + encodeURIComponent(PUBLISH.branch), {
            headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token },
            cache: 'no-store'
        });
        if (!res.ok) throw Object.assign(new Error('GET ' + res.status), { status: res.status });
        const json = await res.json();
        const html = fromBase64Utf8(json.content);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tag = doc.querySelector('#initial-data');
        if (!tag) throw new Error('Die Datei im Repo enthält keinen Datenblock (#initial-data).');
        return { sha: json.sha, doc, data: JSON.parse(tag.textContent) };
    }

    let publishing = false;
    let needsReloadAfterClose = false;

    // ---------- Uploaded images -> files in the repo ----------
    // The CMS upload button embeds images as data URLs. Publishing turns each
    // of them into a real file under images/<section>/ (one commit per image)
    // and leaves only the path in the data - so index.html stays small and the
    // browser can cache the pictures. A failed publish later on does not redo
    // this: the path is persisted as soon as the file is in the repo.
    const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const fileSafe = s => String(s || '').replace(/^id_/, '').replace(/[^a-z0-9-]/gi, '');

    function embeddedImages() {
        const out = [];
        if (allData.heroImage && allData.heroImage.indexOf('data:') === 0) {
            out.push({ label: 'Hero-Logo', folder: 'hero', name: 'hero-' + Date.now(),
                get: () => allData.heroImage, set: v => { allData.heroImage = v; } });
        }
        ['news', 'projects', 'team'].forEach(list => (allData[list] || []).forEach(item => {
            if (!item.imageUrl || item.imageUrl.indexOf('data:') !== 0) return;
            const base = slugify(item.title || item.name) || 'image';
            out.push({ label: item.title || item.name || item.id, folder: list, name: base + '-' + (fileSafe(item.id) || Date.now()),
                get: () => item.imageUrl, set: v => { item.imageUrl = v; } });
        }));
        return out;
    }

    async function uploadEmbeddedImages(token, onProgress) {
        const imgs = embeddedImages();
        for (let i = 0; i < imgs.length; i++) {
            const im = imgs[i];
            onProgress(i + 1, imgs.length);
            const m = /^data:([^;,]+)[^,]*,(.*)$/.exec(im.get());
            if (!m) continue;
            const path = 'images/' + im.folder + '/' + im.name + '.' + (MIME_EXT[m[1]] || 'jpg');
            const url = 'https://api.github.com/repos/' + PUBLISH.owner + '/' + PUBLISH.repo + '/contents/' + path;
            const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
            const body = { message: 'CMS: Bild ' + path, content: m[2], branch: PUBLISH.branch };
            let res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
            if (res.status === 422) {
                // 422 without sha means a file with this name already exists -
                // either from an earlier publish attempt or because the image
                // of this entry is being REPLACED (the name is derived from the
                // entry, so it stays the same). Overwrite it: fetch its sha and
                // put again. Same content is harmless, new content is the fix.
                const head = await fetch(url + '?ref=' + encodeURIComponent(PUBLISH.branch), { headers, cache: 'no-store' });
                if (head.ok) {
                    body.sha = (await head.json()).sha;
                    res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
                }
            }
            if (!res.ok) throw Object.assign(new Error('Bild-Upload fehlgeschlagen: ' + path + ' (' + res.status + ')'), { status: res.status });
            im.set(path);
            persist();
        }
        if (imgs.length) { initApp(); if (currentTab === 'hero') refreshHeroPreview(); }
        return imgs.length;
    }

    async function publish() {
        if (publishing) return;
        const token = getToken();
        if (!token) { openTokenDialog(); return; }

        const btn = $('btn-publish');
        publishing = true;
        btn.disabled = true;
        btn.textContent = '⏳ VERÖFFENTLICHE …';
        const done = () => { publishing = false; btn.disabled = false; btn.textContent = '\u{1F680} VERÖFFENTLICHEN'; };

        try {
            const uploaded = await uploadEmbeddedImages(token, (i, n) => { btn.textContent = '⏳ BILD ' + i + '/' + n + ' …'; });
            btn.textContent = '⏳ VERÖFFENTLICHE …';
            const remote = await fetchRemote(token);
            const baseJson = localStorage.getItem(BASE_KEY) || fileJson;
            const { merged, conflicts, summary, notes } = mergeData(JSON.parse(baseJson), allData, remote.data);

            if (conflicts.length) {
                toast('&#9888;&#65039; KONFLIKT &ndash; NICHTS VER&Ouml;FFENTLICHT',
                    'Seit du angefangen hast, hat jemand anderes dieselben Eintr&auml;ge ge&auml;ndert:<br><br>' +
                    conflicts.map(c => '&bull; ' + esc(c)).join('<br>') +
                    '<br><br>Vorgehen: EXPORTIEREN als Sicherung, dann &bdquo;Lokale &Auml;nderungen verwerfen&ldquo;, ' +
                    'die Eintr&auml;ge neu bearbeiten und erneut ver&ouml;ffentlichen.' +
                    (uploaded ? '<br><br>(' + uploaded + ' hochgeladene Bilddatei(en) liegen bereits im Repo und k&ouml;nnen per Pfad weiterverwendet werden.)' : ''),
                    'bg-red-800');
                return;
            }
            if (JSON.stringify(merged) === JSON.stringify(remote.data)) {
                toast('&#8505;&#65039; NICHTS ZU VER&Ouml;FFENTLICHEN', 'Der Stand im Repo entspricht bereits deinen Inhalten.');
                return;
            }

            // The remote file is the shell - so a newer index.html in the repo
            // (design or code changes) is never overwritten by an older copy
            // that happens to be open in this browser. Only the data block
            // changes. Also reset anything the DOMParser might carry over.
            const doc = remote.doc;
            doc.querySelector('#initial-data').textContent = dataTagContent(merged);
            const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

            const res = await fetch(apiUrl(), {
                method: 'PUT',
                headers: {
                    Accept: 'application/vnd.github+json',
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'CMS: ' + (summary.join(', ') || 'Inhalte aktualisiert'),
                    content: toBase64Utf8(html),
                    sha: remote.sha,
                    branch: PUBLISH.branch
                })
            });
            if (res.status === 409) {
                toast('&#9888;&#65039; GLEICHZEITIG VER&Ouml;FFENTLICHT',
                    'Jemand anderes hat in genau diesem Moment ver&ouml;ffentlicht. Bitte noch einmal auf VER&Ouml;FFENTLICHEN klicken &ndash; deine &Auml;nderungen werden dann zusammengef&uuml;hrt.',
                    'bg-red-800');
                return;
            }
            if (!res.ok) throw Object.assign(new Error('PUT ' + res.status), { status: res.status });
            const result = await res.json();

            // From now on this browser's edits start from what was just published.
            allData = merged;
            const mergedJson = JSON.stringify(merged);
            localStorage.setItem(STORAGE_KEY, mergedJson);
            localStorage.setItem(BASE_KEY, mergedJson);
            localStorage.setItem(LAST_PUBLISHED_KEY, mergedJson);
            usingStaleLocalCopy = false;
            initApp();
            renderAdminList();

            const commitUrl = result.commit && result.commit.html_url;
            toast('&#9989; VER&Ouml;FFENTLICHT!',
                (uploaded ? uploaded + (uploaded === 1 ? ' Bild wurde' : ' Bilder wurden') + ' als Datei ins Repo geladen. ' : '') +
                'Die &Auml;nderungen sind im Repo. Die Live-Seite zeigt sie nach etwa einer Minute' +
                ' (GitHub kann die alte Fassung bis zu 10 Minuten zwischenspeichern &ndash; einfach sp&auml;ter neu laden).' +
                (notes.length ? '<br><br>' + notes.map(esc).join('<br>') : '') +
                (commitUrl ? '<br><br><a href="' + esc(commitUrl) + '" target="_blank" rel="noopener" class="hover:underline font-bold">Commit auf GitHub ansehen &#8599;</a>' : ''),
                'bg-green-800');

            // Start monitoring GitHub Pages in the background
            startLiveDeploymentCheck();
        } catch (err) {
            const s = err && err.status;
            if (s === 401) {
                openTokenDialog('Das gespeicherte Token wird von GitHub nicht akzeptiert (abgelaufen oder widerrufen). Bitte ein neues eintragen.');
            } else if (s === 404 || s === 403) {
                openTokenDialog('GitHub verweigert den Zugriff auf ' + PUBLISH.owner + '/' + PUBLISH.repo +
                    '. Meist fehlt dem Token der Zugriff auf dieses Repo oder das Schreibrecht auf Inhalte (Contents: Read and write). Bitte Token prüfen oder neu anlegen.');
            } else {
                toast('&#9888;&#65039; VER&Ouml;FFENTLICHEN FEHLGESCHLAGEN',
                    esc(err && err.message ? err.message : String(err)) +
                    '<br><br>Deine &Auml;nderungen sind weiterhin lokal gespeichert. Zur Not: EXPORTIEREN und die Datei von Hand ins Repo laden.',
                    'bg-red-800');
            }
        } finally {
            done();
        }
    }

    // ---------- Events (one delegated listener instead of inline onclick) ----------
    const actions = {
        'close-modal': closeModals,
        'dismiss-toast': el => el.closest('.app-toast').remove(),
        'open-route': el => openRoute(el.dataset.route),
        'toggle-nav': toggleNav,
        'admin-tab': el => switchTab(el.dataset.tab),
        'add-new': () => openEditor(),
        'jump-year': el => {
            const h = document.getElementById('pub-year-' + el.dataset.year);
            if (!h) return;
            // The modal is its own scroll container; leave room for the sticky bar.
            const m = $('pubs-modal');
            m.scrollTo({ top: h.offsetTop - 110, behavior: 'smooth' });
        },
        'doi-lookup': doiLookupAction,
        'move-up': el => moveItem(el.dataset.id, -1),
        'move-down': el => moveItem(el.dataset.id, 1),
        'edit-item': el => openEditor({ item: (allData[currentTab] || []).find(i => i.id === el.dataset.id) }),
        'clear-image': () => {
            currentUploadedImage = null;
            $('image-path-input').value = '';
            $('image-upload-input').value = '';
            setPreview(null);
        },
        'save-item': saveItem,
        'cancel-edit': cancelEdit,
        'delete-item': deleteItem,
        'upload-hero': () => $('hero-logo-upload').click(),
        'reset-hero': () => {
            allData.heroImage = HERO_DEFAULT_SRC;
            $('main-hero-img').src = HERO_DEFAULT_SRC;
            refreshHeroPreview();
            if (persist()) toast('&#9989; STANDARD-LOGO', 'Die Seite nutzt wieder images/hero/DAlabLogo.png. Mit VER&Ouml;FFENTLICHEN geht es online.');
        },
        'export': exportHtml,
        'publish': publish,
        'edit-token': () => openTokenDialog(),
        'save-token': () => {
            const t = $('admin-token-input').value.trim();
            if (!t) { $('admin-token-input').focus(); return; }
            localStorage.setItem(TOKEN_KEY, t);
            $('admin-token-input').value = '';
            closeModals();                      // closes only the token dialog
            toast('&#9989; TOKEN GESPEICHERT',
                'Es bleibt nur in diesem Browser gespeichert. Du kannst jetzt direkt auf VER&Ouml;FFENTLICHEN klicken.');
        },
        'clear-token': () => {
            localStorage.removeItem(TOKEN_KEY);
            $('admin-token-input').value = '';
            closeModals();
            toast('&#8505;&#65039; TOKEN ENTFERNT', 'Zum Ver&ouml;ffentlichen muss wieder eines eingetragen werden.');
        },
        'discard-local': () => {
            if (!confirm('Alle lokal in diesem Browser gespeicherten Änderungen verwerfen?\n\n'
                + 'Danach siehst du wieder genau den Stand, der in der index.html steht. '
                + 'Noch nicht exportierte Änderungen gehen dabei verloren.')) return;
            [STORAGE_KEY, BASE_KEY, LAST_PUBLISHED_KEY].forEach(k => localStorage.removeItem(k));
            sessionStorage.removeItem(STALE_WARNED_KEY);
            location.reload();
        }
    };

    document.addEventListener('click', e => {
        const actionEl = e.target.closest('[data-action]');
        if (actionEl) {
            e.preventDefault();
            const fn = actions[actionEl.dataset.action];
            if (fn) fn(actionEl);
            return;
        }
        const card = e.target.closest('[data-open]');
        if (card) openDetail(card);
    });

    // Jumping to a section should close the mobile panel behind it.
    $('mobile-nav').addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
    // Keep aria-expanded honest when the panel is resized out of existence.
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) closeNav(); });

    // ---------- Hidden admin access ----------
    // No visible ADMIN link. Access: type "admin" on the keyboard.
    // Also removes the old ADMIN link from previously exported pages.
    document.querySelectorAll('[data-action="open-admin"]').forEach(el => el.remove());

    // Design revision: remove the decorative vertical hairline on the left
    // (also cleans it out of previously exported pages).
    document.querySelectorAll('body > div.fixed.w-px').forEach(el => el.remove());

    let keyBuffer = '';
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModals(); closeNav(); return; }
        const t = e.target;
        if (e.key === 'Enter' && t && t.id === 'doi-lookup-input') { e.preventDefault(); doiLookupAction(); return; }
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        // Keyboard equivalent of clicking a card (Space would scroll otherwise).
        if (e.key === 'Enter' || e.key === ' ') {
            const card = t && t.closest && t.closest('[data-open]');
            if (card) { e.preventDefault(); openDetail(card); return; }
        }
        if (e.key && e.key.length === 1) {
            keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-5);
            if (keyBuffer === 'admin') { keyBuffer = ''; requestAdmin(); }
        }
    });

    // (The former "tap the footer logo 5x" shortcut was removed on purpose -
    // the admin is reached by typing "admin" on a keyboard only.)

    $('admin-login-form').addEventListener('submit', e => {
        e.preventDefault();
        tryLogin();
    });
    $('admin-token-form').addEventListener('submit', e => {
        e.preventDefault();
        actions['save-token']();
    });

    $('image-path-input').addEventListener('input', e => {
        setPreview(e.target.value.trim() || currentUploadedImage);
    });

    $('hero-logo-upload').addEventListener('change', async e => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
            const dataUrl = await compressImage(file, { type: 'image/png', maxDim: 800 }); // Logo rendert max. 260px breit
            allData.heroImage = dataUrl;
            $('main-hero-img').src = dataUrl;
            refreshHeroPreview();
            if (persist()) {
                toast('&#9989; LOGO &Uuml;BERNOMMEN',
                    'Es ist jetzt lokal gespeichert &ndash; mit VER&Ouml;FFENTLICHEN geht es online. Tipp: Sauberer ist es, die Datei images/hero/DAlabLogo.png im Repo auszutauschen.');
            }
        } catch (err) {
            toast('&#9888;&#65039; UPLOAD FEHLGESCHLAGEN', 'Das Bild konnte nicht gelesen werden.', 'bg-red-800');
        }
    });

    $('image-upload-input').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            currentUploadedImage = await compressImage(file); // JPEG, max 1600px - gross genug fuer die Detail-Ansicht auch auf Retina
            $('image-path-input').value = '';
            setPreview(currentUploadedImage);
        } catch (err) {
            toast('&#9888;&#65039; UPLOAD FEHLGESCHLAGEN', 'Das Bild konnte nicht gelesen werden.', 'bg-red-800');
        }
    });

    initApp();
    // Opens the right overlay when the page was reached through a shared link.
    applyRoute();
})();
