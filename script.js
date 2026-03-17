// =============================================
//  CONFIGURE YOUR USERNAMES HERE
// =============================================
const CP_USERNAMES = {
    leetcode: 'Lokesh-123_',      // LeetCode username
    codechef: 'kit27cse25',       // CodeChef username
    codeforces: 'Lokeshr_2006',     // Codeforces handle
};
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Toggle for Mobile ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close menu when link clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // --- Active Link on Scroll ---
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinksItems.forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('href').includes(current)) {
                li.classList.add('active');
            }
        });

        // Navbar Scrolled Effect
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(8, 10, 12, 0.97)';
            navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.4)';
        } else {
            navbar.style.background = 'rgba(8, 10, 12, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in, .fade-in-left, .fade-in-right');
    animatedElements.forEach(el => observer.observe(el));

    // --- Custom Cursor ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (window.matchMedia("(min-width: 992px)").matches) {
        window.addEventListener('mousemove', (e) => {
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;
            cursorOutline.animate({
                left: `${e.clientX}px`,
                top: `${e.clientY}px`
            }, { duration: 500, fill: 'forwards' });
        });

        const interactiveElements = document.querySelectorAll('a, button, .project-card, input, textarea');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '50px';
                cursorOutline.style.height = '50px';
                cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '30px';
                cursorOutline.style.height = '30px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

    // =============================================
    //  REAL-TIME COMPETITIVE PROGRAMMING STATS
    // =============================================

    // Update profile links based on configured usernames
    document.getElementById('lc-link').href = `https://leetcode.com/u/${CP_USERNAMES.leetcode}`;
    document.getElementById('cc-link').href = `https://www.codechef.com/users/${CP_USERNAMES.codechef}`;
    document.getElementById('cf-link').href = `https://codeforces.com/profile/${CP_USERNAMES.codeforces}`;

    /**
     * Animate a number from 0 to target value
     */
    function animateNumber(el, target, duration = 1200) {
        const start = performance.now();
        const from = 0;
        const update = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    /**
     * Format the "last updated" timestamp
     */
    function setLastUpdated(id) {
        const el = document.getElementById(id);
        if (el) {
            const now = new Date();
            el.textContent = `Updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Show data state for a card
     */
    function showData(prefix) {
        document.getElementById(`${prefix}-loading`).style.display = 'none';
        document.getElementById(`${prefix}-data`).style.display = 'block';
        document.getElementById(`${prefix}-error`).style.display = 'none';
    }

    function showError(prefix, msg) {
        document.getElementById(`${prefix}-loading`).style.display = 'none';
        document.getElementById(`${prefix}-data`).style.display = 'none';
        const errEl = document.getElementById(`${prefix}-error`);
        errEl.style.display = 'block';
        errEl.textContent = msg || '⚠ Could not load data';
    }

    // ── localStorage Cache Helpers ──────────────────────
    // Saves the last successful API result so it can be
    // shown if the API is down on the next page load.
    // ---------------------------------------------------
    function saveCache(key, payload) {
        try {
            localStorage.setItem(`cp_cache_${key}`, JSON.stringify({
                data: payload,
                savedAt: new Date().toISOString()
            }));
        } catch (_) { /* storage might be full or disabled */ }
    }

    function loadCache(key) {
        try {
            const raw = localStorage.getItem(`cp_cache_${key}`);
            if (!raw) return null;
            return JSON.parse(raw);   // { data, savedAt }
        } catch (_) { return null; }
    }

    function setCachedTimestamp(updatedElId, isoString) {
        const el = document.getElementById(updatedElId);
        if (!el) return;
        const d = new Date(isoString);
        el.textContent = `Cached: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        el.style.color = '#f59e0b';   // amber — signals cached, not live
        el.title = 'API unavailable — showing last successfully fetched data';
    }

    // --------------------------------------------------
    //  LEETCODE — via alfa-leetcode-api (no auth needed)
    //  Docs: https://alfa-leetcode-api.onrender.com/
    // --------------------------------------------------
    async function fetchLeetCode() {
        const username = CP_USERNAMES.leetcode;
        try {
            // Fetch profile info and solved stats in parallel
            const [profileRes, solvedRes] = await Promise.all([
                fetch(`https://alfa-leetcode-api.onrender.com/${username}`),
                fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`)
            ]);

            if (!profileRes.ok || !solvedRes.ok) throw new Error('API error');

            const profile = await profileRes.json();
            const solved = await solvedRes.json();

            const rating = profile.ranking || 0;
            const totalSolved = solved.solvedProblem || 0;
            const topPercentage = profile.ranking
                ? `Top ${((profile.ranking / 700000) * 100).toFixed(1)}% Globally`
                : 'Global Rank: ' + (profile.ranking || '--');
            const badges = profile.badges?.length || 0;

            showData('lc');
            const ratingEl = document.getElementById('lc-rating');
            animateNumber(ratingEl, rating);
            document.getElementById('lc-rank').textContent = topPercentage;
            const solvedEl = document.getElementById('lc-solved');
            solvedEl.textContent = '-- Problems Solved';
            setTimeout(() => animateNumber(solvedEl, totalSolved, 1000), 200);
            solvedEl.textContent = '0 Problems Solved';

            const extra = document.getElementById('lc-extra');
            extra.innerHTML = `<span class="cp-badge-pill">🏅 ${badges} Badge${badges !== 1 ? 's' : ''} Earned</span>`;

            setLastUpdated('lc-updated');

        } catch (err) {
            console.error('LeetCode fetch error:', err);
            showError('lc', '⚠ Could not load LeetCode data');
        }
    }

    // --------------------------------------------------
    //  CODECHEF — via codechef-api.vercel.app (unofficial)
    //  Docs: https://codechef-api.vercel.app/
    // --------------------------------------------------
    async function fetchCodeChef() {
        const username = CP_USERNAMES.codechef;
        try {
            const res = await fetch(`https://codechef-api.vercel.app/handle/${username}`);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();

            if (!data || data.success === false) throw new Error('User not found');

            const rating = parseInt(data.currentRating) || 0;
            const stars = data.stars || '--';
            const globalRank = data.globalRank || '--';
            const problemsSolved = parseInt(data.totalProblemsSolved) || 0;

            showData('cc');
            animateNumber(document.getElementById('cc-rating'), rating);
            document.getElementById('cc-rank').textContent = `${stars} ⭐ | Global Rank: ${globalRank}`;
            const solvedEl = document.getElementById('cc-solved');
            solvedEl.textContent = '0 Problems Solved';
            setTimeout(() => animateNumber(solvedEl, problemsSolved, 1000), 200);

            const extra = document.getElementById('cc-extra');
            const highestRating = data.highestRating || rating;
            extra.innerHTML = `<span class="cp-badge-pill">🏆 Highest: ${highestRating}</span>`;

            setLastUpdated('cc-updated');

        } catch (err) {
            console.error('CodeChef fetch error:', err);
            showError('cc', '⚠ Could not load CodeChef data');
        }
    }

    // --------------------------------------------------
    //  CODEFORCES — Official public API (no key needed)
    //  Docs: https://codeforces.com/apiHelp
    // --------------------------------------------------
    async function fetchCodeforces() {
        const username = CP_USERNAMES.codeforces;
        try {
            // user.info gives rating + rank
            // user.status gives all submissions to count solved
            const [infoRes, statusRes] = await Promise.all([
                fetch(`https://codeforces.com/api/user.info?handles=${username}`),
                fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`)
            ]);

            if (!infoRes.ok || !statusRes.ok) throw new Error('API error');

            const infoData = await infoRes.json();
            const statusData = await statusRes.json();

            if (infoData.status !== 'OK') throw new Error(infoData.comment || 'API error');

            const user = infoData.result[0];
            const rating = user.rating || 0;
            const maxRating = user.maxRating || rating;
            const rank = user.rank
                ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1)
                : 'Unrated';

            // Count unique problems (id = contestId + index) solved with OK verdict
            const solvedSet = new Set();
            if (statusData.status === 'OK') {
                statusData.result.forEach(sub => {
                    if (sub.verdict === 'OK') {
                        solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
                    }
                });
            }
            const solved = solvedSet.size;

            showData('cf');
            animateNumber(document.getElementById('cf-rating'), rating);
            document.getElementById('cf-rank').textContent = `Rank: ${rank}`;
            const solvedEl = document.getElementById('cf-solved');
            solvedEl.textContent = '0 Problems Solved';
            setTimeout(() => animateNumber(solvedEl, solved, 1000), 200);

            const extra = document.getElementById('cf-extra');
            extra.innerHTML = `<span class="cp-badge-pill">📈 Best Rating: ${maxRating}</span>`;

            setLastUpdated('cf-updated');

        } catch (err) {
            console.error('Codeforces fetch error:', err);
            showError('cf', '⚠ Could not load Codeforces data');
        }
    }

    // Special handler: animate solved number separately after rating
    function animateSolvedSeparately(prefix, count) {
        const el = document.getElementById(`${prefix}-solved`);
        animateNumber(el, count, 1000);
        // Override textContent manipulation from animateNumber
        el.dataset.suffix = ' Problems Solved';
    }

    // Override animateNumber to support suffix for solved counts
    const _origAnimate = animateNumber;
    window._animateSolved = function (elId, count) {
        const el = document.getElementById(elId);
        const start = performance.now();
        const duration = 1000;
        const update = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(count * eased).toLocaleString()} Problems Solved`;
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };

    // Patch fetch functions to use the suffix-aware animate
    // --------------------------------------------------
    //  LEETCODE — Show verified data instantly; silently
    //             try API refresh in the background.
    // --------------------------------------------------
    async function fetchLeetCodePatched() {
        const username = CP_USERNAMES.leetcode;
        const encodedUser = encodeURIComponent(username);

        // ── Verified snapshot (update these when your stats change) ──
        const VERIFIED = {
            contestRating: 1476,        // ← contest rating
            totalSolved: 304,         // ← total problems solved
            easySolved: 216,
            mediumSolved: 86,
            hardSolved: 2,
            ranking: 431387,      // ← global rank
            lastVerified: 'Mar 2026'
        };

        // Render data into the LeetCode card
        function renderLeetCode(d, isLive) {
            const rating = d.contestRating || VERIFIED.contestRating;
            const rankLine = d.topPct
                || (d.ranking ? `Global Rank: #${Number(d.ranking).toLocaleString()}` : 'Unranked');

            showData('lc');
            animateNumber(document.getElementById('lc-rating'), rating);
            document.getElementById('lc-rank').textContent = rankLine;
            document.getElementById('lc-solved').textContent = `${d.totalSolved} Problems Solved`;
            document.getElementById('lc-extra').innerHTML =
                `<span class="cp-badge-pill">🟢 ${d.easySolved}E &nbsp;🟡 ${d.mediumSolved}M &nbsp;🔴 ${d.hardSolved}H</span>`;

            const updEl = document.getElementById('lc-updated');
            if (updEl) updEl.textContent = isLive
                ? `Updated: ${new Date().toLocaleTimeString()}`
                : `Verified: ${d.lastVerified || VERIFIED.lastVerified}`;
        }

        // 1. Check localStorage cache first (most recent successful fetch)
        const cached = loadCache('leetcode');
        if (cached) {
            renderLeetCode(cached.data, false);
            setCachedTimestamp('lc-updated', cached.savedAt);
        } else {
            // No cache yet — show hardcoded snapshot so card is never blank
            renderLeetCode(VERIFIED, false);
        }

        // 2. Silently try faisalshohag API in the background
        //    (Only this one — alfa-leetcode-api was causing 429 rate limits)
        try {
            const res = await fetch(
                `https://leetcode-api-faisalshohag.vercel.app/${encodedUser}`,
                { signal: AbortSignal.timeout(15000) }
            );
            if (res.ok) {
                const json = await res.json();
                if (json && json.totalSolved !== undefined) {
                    const fresh = {
                        contestRating: VERIFIED.contestRating, // API doesn't return contest rating
                        totalSolved: json.totalSolved || VERIFIED.totalSolved,
                        easySolved: json.easySolved || VERIFIED.easySolved,
                        mediumSolved: json.mediumSolved || VERIFIED.mediumSolved,
                        hardSolved: json.hardSolved || VERIFIED.hardSolved,
                        ranking: json.ranking || VERIFIED.ranking,
                        topPct: json.ranking
                            ? `Global Rank: #${Number(json.ranking).toLocaleString()}`
                            : '',
                    };
                    saveCache('leetcode', fresh);   // save for next visit
                    renderLeetCode(fresh, true);    // update card with live data
                }
            }
        } catch (_) {
            // Silent — verified snapshot or cache is already showing
        }
    }

    // --------------------------------------------------
    //  CODECHEF — Show verified data instantly; silently
    //             try API refresh in the background.
    // --------------------------------------------------
    async function fetchCodeChefPatched() {
        const username = CP_USERNAMES.codechef;

        // ── Verified snapshot (update this manually when needed) ──
        const VERIFIED = {
            rating: 1390,
            stars: 1,
            globalRank: 47576,
            countryRank: 44379,
            participation: 91,
            lastVerified: 'Mar 2026'
        };

        // Render data into the card
        function renderCodeChef(d, isLive) {
            const starStr = '⭐'.repeat(Math.min(d.stars, 7));
            showData('cc');
            animateNumber(document.getElementById('cc-rating'), d.rating);
            document.getElementById('cc-rank').textContent =
                `${starStr} | Global Rank: ${Number(d.globalRank).toLocaleString()}`;
            document.getElementById('cc-solved').textContent =
                `${d.participation} Contests Participated`;
            document.getElementById('cc-extra').innerHTML =
                `<span class="cp-badge-pill">🌍 Country Rank: ${Number(d.countryRank).toLocaleString()}</span>`;
            const updEl = document.getElementById('cc-updated');
            if (updEl) updEl.textContent = isLive
                ? `Updated: ${new Date().toLocaleTimeString()}`
                : `Verified: ${d.lastVerified}`;
        }

        // Show snapshot immediately — card is never blank
        renderCodeChef(VERIFIED, false);

        // ── Silently try to fetch fresh data via CORS proxies ──
        // (Direct call to cp-rating-api is skipped — no CORS headers on that API)
        const targetUrl = `https://cp-rating-api.vercel.app/codechef/${username}`;
        const sources = [
            () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
                { signal: AbortSignal.timeout(10000) }),
            () => fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
                { signal: AbortSignal.timeout(10000) }),
        ];

        for (const tryFetch of sources) {
            try {
                const res = await tryFetch();
                if (!res.ok) continue;
                const json = await res.json();
                if (json && json.rating) {
                    const fresh = {
                        rating: parseInt(json.rating) || VERIFIED.rating,
                        stars: json.stars || VERIFIED.stars,
                        globalRank: json.globalRank || VERIFIED.globalRank,
                        countryRank: json.countryRank || VERIFIED.countryRank,
                        participation: json.participation || VERIFIED.participation,
                    };
                    saveCache('codechef', fresh);   // ← save to cache
                    renderCodeChef(fresh, true);
                    return;
                }
            } catch (_) { /* silent */ }
        }

        // ── All API sources failed: try localStorage cache ──
        const cached = loadCache('codechef');
        if (cached) {
            renderCodeChef(cached.data, false);
            setCachedTimestamp('cc-updated', cached.savedAt);
        }
        // If no cache either, VERIFIED snapshot is already showing — nothing more to do
    }

    async function fetchCodeforcesPatched() {
        const username = CP_USERNAMES.codeforces;
        try {
            const [infoRes, statusRes] = await Promise.all([
                fetch(`https://codeforces.com/api/user.info?handles=${username}`),
                fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`)
            ]);
            if (!infoRes.ok || !statusRes.ok) throw new Error('API error');
            const infoData = await infoRes.json();
            const statusData = await statusRes.json();
            if (infoData.status !== 'OK') throw new Error(infoData.comment);

            const user = infoData.result[0];
            const rating = user.rating || 0;
            const maxRating = user.maxRating || rating;
            const rank = user.rank
                ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1)
                : 'Unrated';

            const solvedSet = new Set();
            if (statusData.status === 'OK') {
                statusData.result.forEach(sub => {
                    if (sub.verdict === 'OK') {
                        solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
                    }
                });
            }

            const cfData = { rating, rank, solved: solvedSet.size, maxRating };
            saveCache('codeforces', cfData);   // ← save to cache

            showData('cf');
            animateNumber(document.getElementById('cf-rating'), rating);
            document.getElementById('cf-rank').textContent = `Rank: ${rank}`;
            window._animateSolved('cf-solved', solvedSet.size);
            document.getElementById('cf-extra').innerHTML =
                `<span class="cp-badge-pill">📈 Best Rating: ${maxRating}</span>`;
            setLastUpdated('cf-updated');
        } catch (err) {
            console.error('Codeforces fetch error:', err);
            // ── API failed: try localStorage cache ──
            const cached = loadCache('codeforces');
            if (cached) {
                const d = cached.data;
                showData('cf');
                animateNumber(document.getElementById('cf-rating'), d.rating);
                document.getElementById('cf-rank').textContent = `Rank: ${d.rank}`;
                window._animateSolved('cf-solved', d.solved);
                document.getElementById('cf-extra').innerHTML =
                    `<span class="cp-badge-pill">📈 Best Rating: ${d.maxRating}</span>`;
                setCachedTimestamp('cf-updated', cached.savedAt);
            } else {
                showError('cf', '⚠ Could not load Codeforces data');
            }
        }
    }

    // Kick off all 3 fetches in parallel on page load
    fetchLeetCodePatched();
    fetchCodeChefPatched();
    fetchCodeforcesPatched();

});
