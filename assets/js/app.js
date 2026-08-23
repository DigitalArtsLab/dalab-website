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
    const HERO_DEFAULT_SRC = 'images/hero/DAlabLogo.png';
    const initialData = JSON.parse($('initial-data').textContent);

    let allData;
    // True when the browser is showing a locally edited copy that no longer
    // matches the data in this file - i.e. after a new index.html was uploaded
    // but the old localStorage copy is still winning. The admin panel warns
    // about it, because otherwise an upload looks like it silently failed.
    let usingStaleLocalCopy = false;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            allData = JSON.parse(stored);
            usingStaleLocalCopy = JSON.stringify(allData) !== JSON.stringify(initialData);
        } else {
            allData = initialData;
        }
    } catch (err) {
        allData = initialData;
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
            return true;
        } catch (err) {
            toast('&#9888;&#65039; SPEICHERN FEHLGESCHLAGEN',
                'Der Browser-Speicher ist voll (meist wegen zu vieler hochgeladener Bilder). Tipp: Bilder in den images/-Ordner legen und den Bildpfad eintragen statt sie hochzuladen. Bitte exportiere jetzt, um nichts zu verlieren.',
                'bg-red-800');
            return false;
        }
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
            hideModals(open.filter(m => m.id.indexOf('admin-') !== 0).map(m => m.id));
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
    function compressImage(file, { maxDim = 800, type = 'image/jpeg', quality = 0.7 } = {}) {
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
                <div class="h-40 bg-[#e5e5e5] flex items-center justify-center relative overflow-hidden">
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
                    <span class="text-[10px] font-din tracking-widest text-accent mb-3 block font-bold border-b border-accent/20 pb-2">${esc(p.status)}</span>
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
            <div class="sticky top-0 w-full flex justify-end p-6 z-10 bg-bglight/90 backdrop-blur-sm hairline-b">
                <button data-action="close-modal" class="font-din text-sm tracking-widest border border-main px-6 py-2 hover:bg-main hover:text-white transition-colors interactive flex items-center gap-2">CLOSE <span aria-hidden="true">&#10005;</span></button>
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

    function renderTeam() {
        $('dynamic-team-grid').innerHTML = allData.team.map(t => `
            <div data-open="team" data-id="${esc(t.id)}" role="button" tabindex="0" aria-label="${esc(t.name)} - open profile" class="group border border-[#d1d1d1] bg-white overflow-hidden flex flex-col interactive cursor-pointer text-center hover:border-accent hover:shadow-lg transition-all duration-300">
                <div class="w-1/2 mx-auto mt-8 aspect-square bg-[#e5e5e5] flex items-center justify-center relative overflow-hidden rounded-full border-2 border-transparent group-hover:border-accent transition-colors">
                    ${t.imageUrl
                        ? '<img src="' + esc(t.imageUrl) + '" alt="" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">'
                        : '<span class="text-4xl font-din font-bold text-main/20 transition-colors">' + esc(t.initials || 'XY') + '</span>'}
                </div>
                <div class="p-6">
                    <h4 class="font-din font-bold text-lg mb-1">${esc(t.name)}</h4>
                    <span class="text-xs font-din tracking-widest text-accent block">${esc(t.role)}</span>
                </div>
            </div>`).join('');
    }

    function pubEntry(p, extraClass) {
        // Classic citation line: Authors - Venue, Volume/Issue/Pages details, DOI link.
        let meta = esc(p.authors) + ' &ndash; ' + esc(p.journal);
        if (p.details && p.details.trim()) meta += ', ' + esc(p.details.trim());
        const doi = doiUrl(p.doi);
        const doiHtml = doi
            ? `<a href="${esc(doi)}" target="_blank" rel="noopener" class="text-accent hover:text-main transition-colors interactive font-medium break-all">${esc(doi)}</a>`
            : '';
        return `
            <div class="group interactive relative ${extraClass}">
                <div class="absolute left-0 top-0 h-full w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                <div class="pl-4">
                    <div class="flex flex-col md:flex-row md:items-baseline justify-between">
                        <h4 class="font-bold text-xl mb-1 text-main group-hover:text-accent transition-colors">${esc(p.title)}</h4>
                        <span class="text-sm font-din tracking-widest opacity-60">${esc(p.year)}</span>
                    </div>
                    <p class="text-base text-main/70 font-light">${meta}</p>
                    ${doiHtml ? '<p class="text-sm font-light mt-1">' + doiHtml + '</p>' : ''}
                </div>
            </div>`;
    }

    function renderPubs() {
        // Always newest year first, regardless of entry order in the admin.
        const pubs = [...allData.publications].sort(
            (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0)
        );
        $('dynamic-recent-pubs').innerHTML =
            pubs.slice(0, 3).map(p => pubEntry(p, 'hairline-b pb-6')).join('');

        let currentYear = null;
        $('pubs-archive-list').innerHTML = pubs.map(p => {
            let heading = '';
            if (p.year !== currentYear) {
                currentYear = p.year;
                heading = '<h3 class="text-2xl font-din font-bold mt-12 mb-6 hairline-b pb-2 tracking-widest text-accent">' + esc(currentYear) + '</h3>';
            }
            return heading + pubEntry(p, 'mb-6');
        }).join('');
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
            setImage($('tm-img-container'), t.imageUrl, t.initials || 'XY', 'text-main/20 font-din font-bold text-6xl');
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
                ['initials', 'Initials (e.g. XY)'],
                ['role', 'Role (e.g. Researcher)'],
                ['email', 'Email Address'],
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

    function switchTab(tab) {
        currentTab = tab;
        $('admin-section-title').textContent = tab.toUpperCase();
        cancelEdit();
        renderAdminList();
    }

    function renderAdminList() {
        const { display } = SECTIONS[currentTab];
        $('admin-list-view').innerHTML = (allData[currentTab] || []).map(item => `
            <div class="flex justify-between items-center p-4 bg-white border border-gray-200">
                <span class="font-bold">${esc(item[display])}</span>
                <button data-action="edit-item" data-id="${esc(item.id)}" class="text-sm font-din tracking-widest text-accent hover:underline">EDIT</button>
            </div>`).join('');
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
        $('form-fields-container').innerHTML = section.fields.map(([key, label, kind]) => kind === 'area'
            ? `<div><label class="admin-label" for="field-${key}">${esc(label)}</label><textarea id="field-${key}" class="admin-input" style="height: 120px">${esc(data[key])}</textarea></div>`
            : `<div><label class="admin-label" for="field-${key}">${esc(label)}</label><input type="text" id="field-${key}" class="admin-input" value="${esc(data[key])}"></div>`
        ).join('');
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
        $('admin-list-view').classList.remove('hidden');
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
            // News: newest entries go to the top of the page.
            if (currentTab === 'news') list.unshift(payload);
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
    // Writes the current data into the #initial-data JSON tag of a cleaned DOM clone.
    // No regex on source code - robust against any content.
    function exportHtml() {
        const clone = document.documentElement.cloneNode(true);

        clone.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        clone.querySelectorAll('.app-toast').forEach(t => t.remove());
        // Remove JS-injected elements (archive modal, view-all buttons) - they
        // are recreated on load and must not be baked into the export.
        clone.querySelectorAll('.js-injected').forEach(el => el.remove());
        // Strip live cursor state so exports work cleanly on touch devices too.
        const body = clone.querySelector('body');
        body.classList.remove('modal-open', 'has-custom-cursor');
        // An open mobile menu must not be baked into the export.
        clone.querySelector('#mobile-nav').classList.remove('open');
        clone.querySelector('#nav-toggle').setAttribute('aria-expanded', 'false');
        ['cursor', 'cursor-follower'].forEach(id => {
            const c = clone.querySelector('#' + id);
            if (c) { c.removeAttribute('style'); c.classList.remove('cursor-hover'); }
        });

        // Strip rendered content - rebuilt from data on load; uploaded base64
        // images inside cards would otherwise bloat the file.
        ['dynamic-news-grid', 'dynamic-projects-grid', 'dynamic-team-grid',
         'dynamic-recent-pubs', 'pubs-archive-list', 'admin-list-view',
         'form-fields-container'].forEach(id => {
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
        const preview = clone.querySelector('#admin-img-preview');
        if (preview) preview.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';

        // "<" escaped so content can never terminate the script tag.
        clone.querySelector('#initial-data').textContent =
            '\n' + JSON.stringify(allData, null, 2).replace(/</g, '\\u003c') + '\n';

        const blob = new Blob(['<!DOCTYPE html>\n' + clone.outerHTML], { type: 'text/html' });
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

    // ---------- Events (one delegated listener instead of inline onclick) ----------
    const actions = {
        'close-modal': closeModals,
        'dismiss-toast': el => el.closest('.app-toast').remove(),
        'open-route': el => openRoute(el.dataset.route),
        'toggle-nav': toggleNav,
        'admin-tab': el => switchTab(el.dataset.tab),
        'add-new': () => openEditor(),
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
        'export': exportHtml,
        'discard-local': () => {
            if (!confirm('Alle lokal in diesem Browser gespeicherten Änderungen verwerfen?\n\n'
                + 'Danach siehst du wieder genau den Stand, der in der index.html steht. '
                + 'Noch nicht exportierte Änderungen gehen dabei verloren.')) return;
            localStorage.removeItem(STORAGE_KEY);
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
    // No visible ADMIN link. Access: type "admin" on the keyboard (desktop),
    // or tap the footer logo 5x in quick succession (touch devices).
    // Also removes the old ADMIN link from previously exported pages.
    document.querySelectorAll('[data-action="open-admin"]').forEach(el => el.remove());

    // Design revision: remove the decorative vertical hairline on the left
    // (also cleans it out of previously exported pages).
    document.querySelectorAll('body > div.fixed.w-px').forEach(el => el.remove());

    let keyBuffer = '';
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModals(); closeNav(); return; }
        const t = e.target;
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

    const footerBrand = document.querySelector('footer a.interactive');
    if (footerBrand) {
        let taps = 0, tapTimer = null;
        footerBrand.addEventListener('click', e => {
            taps++;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { taps = 0; }, 1500);
            // Only swallow the click that actually opens the admin - otherwise
            // the logo stays an ordinary "back to top" link.
            if (taps >= 5) { taps = 0; e.preventDefault(); requestAdmin(); }
        });
    }

    $('admin-login-form').addEventListener('submit', e => {
        e.preventDefault();
        tryLogin();
    });

    $('image-path-input').addEventListener('input', e => {
        setPreview(e.target.value.trim() || currentUploadedImage);
    });

    $('hero-logo-upload').addEventListener('change', async e => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
            const dataUrl = await compressImage(file, { type: 'image/png' });
            allData.heroImage = dataUrl;
            $('main-hero-img').src = dataUrl;
            if (persist()) {
                toast('&#9989; LOGO GESPEICHERT',
                    "Bitte klicke jetzt noch auf 'EXPORTIEREN', um es dauerhaft in die Datei zu &uuml;bernehmen. Tipp: Alternativ die Datei images/hero/DAlabLogo.png im Website-Ordner direkt austauschen.");
            }
        } catch (err) {
            toast('&#9888;&#65039; UPLOAD FEHLGESCHLAGEN', 'Das Bild konnte nicht gelesen werden.', 'bg-red-800');
        }
    });

    $('image-upload-input').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            currentUploadedImage = await compressImage(file); // JPEG, max 800px
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
