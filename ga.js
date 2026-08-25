// Google Consent Mode v2 + GA4 (G-EDQBFMHYGY)
// Ładować synchronicznie w <head> PRZED gtag/js — zanim użytkownik wyrazi zgodę.
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
});

// Returning user: od razu consent update z cookie_preferences (przed config)
(function () {
    var nameEQ = 'cookie_preferences=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) {
            try {
                var prefs = JSON.parse(c.substring(nameEQ.length));
                gtag('consent', 'update', {
                    analytics_storage: prefs.analytics ? 'granted' : 'denied',
                    ad_storage: prefs.marketing ? 'granted' : 'denied',
                    ad_user_data: prefs.marketing ? 'granted' : 'denied',
                    ad_personalization: prefs.marketing ? 'granted' : 'denied'
                });
            } catch (e) { /* ignore malformed cookie */ }
            break;
        }
    }
})();

gtag('js', new Date());
gtag('config', 'G-EDQBFMHYGY');
