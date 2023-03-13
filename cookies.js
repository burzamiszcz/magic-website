var scriptElement = document.createElement("script");
scriptElement.src = "ga.js";


var scriptElement2 = document.createElement("script");
scriptElement2.src = "https://www.googletagmanager.com/gtag/js?id=G-EDQBFMHYGY";
scriptElement2.async = true;



function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
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
    document.cookie = name + '=; Max-Age=-99999999;';
}

function acceptCookies() {
    setCookie("cookies_accepted", true, 365);
    document.getElementById("cookie-banner").classList.remove('active');
    document.getElementById("cookies-youtube").classList.remove('active');

    var youtube = document.getElementById("youtube");
    youtube.src = "https://www.youtube.com/embed/Fh7-FLVOv_g"
  	document.head.appendChild(scriptElement);
    document.head.appendChild(scriptElement2);
}

function declineCookies() {
    document.getElementById("cookie-banner").classList.remove('active');

}

window.onload = function () {
    if (getCookie("cookies_accepted") == null) {
        document.getElementById("cookie-banner").classList.add('active');
        document.getElementById("cookies-youtube").classList.add('active');
    }
    else{
        var youtube = document.getElementById("youtube");
        youtube.src = "https://www.youtube.com/embed/Fh7-FLVOv_g"
        document.head.appendChild(scriptElement);
        document.head.appendChild(scriptElement2);


    }
};

