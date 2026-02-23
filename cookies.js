// ========== ZARZĄDZANIE COOKIES - RODO COMPLIANT ==========

var scriptElement = document.createElement("script");
scriptElement.src = "ga.js";

var scriptElement2 = document.createElement("script");
scriptElement2.src = "https://www.googletagmanager.com/gtag/js?id=G-EDQBFMHYGY";
scriptElement2.async = true;

// Podstawowe funkcje cookies
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

// Zapisz preferencje cookies
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

// Pobierz preferencje cookies
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

// Zastosuj preferencje cookies
function applyCookiePreferences(preferences) {
    // Zawsze ładujemy niezbędne cookies (już są w HTML)
    
    // Cookies analityczne (Google Analytics)
    if (preferences.analytics) {
        loadAnalytics();
    }
    
    // Cookies marketingowe (YouTube)
    if (preferences.marketing) {
        loadYouTube();
    }
}

// Załaduj Google Analytics
function loadAnalytics() {
    if (!document.querySelector('script[src*="gtag/js"]')) {
        document.head.appendChild(scriptElement2);
        
        // Inicjalizacja gtag
        var gtagInit = document.createElement('script');
        gtagInit.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EDQBFMHYGY');
        `;
        document.head.appendChild(gtagInit);
        document.head.appendChild(scriptElement);
    }
}

// Załaduj YouTube
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

// Akceptuj wszystkie cookies
function acceptAllCookies() {
    var prefs = saveCookiePreferences(true, true, true);
    applyCookiePreferences(prefs);
    document.getElementById("cookie-banner").classList.remove('active');
}

// Akceptuj tylko niezbędne cookies
function acceptNecessaryCookies() {
    saveCookiePreferences(true, false, false);
    document.getElementById("cookie-banner").classList.remove('active');
}

// Pokaż modal ustawień
function showCookieSettings() {
    document.getElementById("cookie-banner").classList.remove('active');
    document.getElementById("cookie-settings-modal").classList.add('active');
    
    // Załaduj obecne preferencje jeśli istnieją
    var prefs = getCookiePreferences();
    if (prefs) {
        document.getElementById('analytics-cookies').checked = prefs.analytics;
        document.getElementById('marketing-cookies').checked = prefs.marketing;
    }
}

// Zamknij modal ustawień
function closeCookieSettings() {
    document.getElementById("cookie-settings-modal").classList.remove('active');
    document.getElementById("cookie-banner").classList.add('active');
}

// Zapisz niestandardowe ustawienia
function saveCustomCookieSettings() {
    var analytics = document.getElementById('analytics-cookies').checked;
    var marketing = document.getElementById('marketing-cookies').checked;
    
    var prefs = saveCookiePreferences(true, analytics, marketing);
    applyCookiePreferences(prefs);
    
    document.getElementById("cookie-settings-modal").classList.remove('active');
}

// STARA FUNKCJA - dla kompatybilności wstecznej
function acceptCookies() {
    acceptAllCookies();
}

function declineCookies() {
    acceptNecessaryCookies();
}

// Inicjalizacja przy załadowaniu strony
window.onload = function () {
    var preferences = getCookiePreferences();
    
    // Jeśli brak preferencji, pokaż baner
    if (!preferences) {
        document.getElementById("cookie-banner").classList.add('active');
        
        // Pokaż info o YouTube
        var cookiesYoutube = document.getElementById("cookies-youtube");
        if (cookiesYoutube) {
            cookiesYoutube.classList.add('active');
        }
        var cookiesYoutubeDzieci = document.getElementById("cookies-youtube-dzieci");
        if (cookiesYoutubeDzieci) {
            cookiesYoutubeDzieci.classList.add('active');
        }
    } else {
        // Zastosuj zapisane preferencje
        applyCookiePreferences(preferences);
    }
};

