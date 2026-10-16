// ========== ZARZĄDZANIE COOKIES - RODO + Google Consent Mode v2 ==========
// gtag.js ładuje się zawsze z <head> (ga.js). Tu tylko: baner, consent update, Clarity, YouTube.

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
}

function saveCookiePreferences(necessary, analytics, marketing) {
    var preferences = {
        necessary: necessary,
        analytics: analytics,
        marketing: marketing,
        timestamp: new Date().toISOString()
    };
    setCookie("cookie_preferences", JSON.stringify(preferences), 365);
    return preferences;
}

function getCookiePreferences() {
    var prefs = getCookie("cookie_preferences");
    if (prefs) {
        try {
            return JSON.parse(prefs);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function updateGtagConsent(preferences) {
    if (typeof gtag !== 'function') return;

    gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied'
    });
}

function applyCookiePreferences(preferences) {
    updateGtagConsent(preferences);

    if (preferences.analytics) {
        loadClarity();
    }

    if (preferences.marketing) {
        loadYouTube();
        loadMetaPixel();
    } else {
        showYouTubePlaceholder();
    }
}

// Meta Pixel — tylko po zgodzie marketing (RODO). ID: 945480924987687
var META_PIXEL_ID = '945480924987687';

function loadMetaPixel() {
    if (window.fbq) {
        return;
    }

    !function(f,b,e,v,n,t,s){
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
    }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
}

function trackMeta(eventName, params) {
    var prefs = getCookiePreferences();
    if (!prefs || !prefs.marketing) return;
    if (!window.fbq) loadMetaPixel();
    if (typeof fbq === 'function') {
        fbq('track', eventName, params || {});
    }
}

window.trackMeta = trackMeta;

function loadClarity() {
    if (window.clarity || document.querySelector('script[src*="clarity.ms/tag"]')) {
        return;
    }

    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "xrizye2hoe");
}

function loadYouTube() {
    var cookiesYoutube = document.getElementById("cookies-youtube");
    if (cookiesYoutube) {
        cookiesYoutube.classList.remove('active');
    }

    var cookiesYoutubeDzieci = document.getElementById("cookies-youtube-dzieci");
    if (cookiesYoutubeDzieci) {
        cookiesYoutubeDzieci.classList.remove('active');
    }

    var youtube = document.getElementById("youtube");
    var youtubeDzieci = document.getElementById("youtube-dzieci");

    if (youtubeDzieci) {
        youtubeDzieci.src = "https://www.youtube.com/embed/v75OTeV5Jy8?si=1k5ybYjbJoonA5xJ&autoplay=1&mute=1";
    } else if (youtube) {
        youtube.src = "https://www.youtube.com/embed/Fh7-FLVOv_g?autoplay=1&mute=1";
    }
}

function showYouTubePlaceholder() {
    var cookiesYoutube = document.getElementById("cookies-youtube");
    if (cookiesYoutube) {
        cookiesYoutube.classList.add('active');
    }

    var cookiesYoutubeDzieci = document.getElementById("cookies-youtube-dzieci");
    if (cookiesYoutubeDzieci) {
        cookiesYoutubeDzieci.classList.add('active');
    }

    var youtube = document.getElementById("youtube");
    if (youtube) {
        youtube.src = "about:blank";
    }

    var youtubeDzieci = document.getElementById("youtube-dzieci");
    if (youtubeDzieci) {
        youtubeDzieci.src = "about:blank";
    }
}

function acceptAllCookies() {
    var prefs = saveCookiePreferences(true, true, true);
    applyCookiePreferences(prefs);
    var banner = document.getElementById("cookie-banner");
    if (banner) banner.classList.remove('active');
}

function acceptNecessaryCookies() {
    var prefs = saveCookiePreferences(true, false, false);
    applyCookiePreferences(prefs);
    var banner = document.getElementById("cookie-banner");
    if (banner) banner.classList.remove('active');
}

function showCookieSettings() {
    document.getElementById("cookie-banner").classList.remove('active');
    document.getElementById("cookie-settings-modal").classList.add('active');

    var prefs = getCookiePreferences();
    if (prefs) {
        document.getElementById('analytics-cookies').checked = prefs.analytics;
        document.getElementById('marketing-cookies').checked = prefs.marketing;
    }
}

function closeCookieSettings() {
    document.getElementById("cookie-settings-modal").classList.remove('active');
    document.getElementById("cookie-banner").classList.add('active');
}

function saveCustomCookieSettings() {
    var analytics = document.getElementById('analytics-cookies').checked;
    var marketing = document.getElementById('marketing-cookies').checked;

    var prefs = saveCookiePreferences(true, analytics, marketing);
    applyCookiePreferences(prefs);

    document.getElementById("cookie-settings-modal").classList.remove('active');
}

function acceptCookies() {
    acceptAllCookies();
}

function declineCookies() {
    acceptNecessaryCookies();
}

function initCookieBanner() {
    var preferences = getCookiePreferences();

    if (!preferences) {
        var banner = document.getElementById("cookie-banner");
        if (banner) banner.classList.add('active');
        showYouTubePlaceholder();
    } else {
        applyCookiePreferences(preferences);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
} else {
    initCookieBanner();
}
