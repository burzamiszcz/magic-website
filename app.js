const hamburger = document.querySelector('.header .nav-bar .nav-list .hamburger');
const mobile_menu = document.querySelector('.header .nav-bar .nav-list ul');
const menu_item = document.querySelectorAll('.header .nav-bar .nav-list ul li a');
const header = document.querySelector('.header.container');
const logo = document.querySelector('.header .logo');

const sparkleLayer = document.querySelector('.sparkle-layer');

function createSparkles() {
    if (!sparkleLayer) return;

    sparkleLayer.innerHTML = '';

    const sparkleCount = window.matchMedia('(max-width: 768px)').matches ? 22 : 40;

    for (let index = 0; index < sparkleCount; index += 1) {
        const sparkle = document.createElement('span');
        const size = 3 + Math.random() * 8;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const driftX = 12 + Math.random() * 28;
        const driftY = 16 + Math.random() * 44;
        const driftDirection = Math.random() > 0.5 ? 1 : -1;
        const duration = 8 + Math.random() * 10;
        const delay = -Math.random() * duration;
        const opacity = 0.4 + Math.random() * 0.5;

        sparkle.className = 'sparkle';
        sparkle.style.setProperty('--sparkle-size', `${size}px`);
        sparkle.style.setProperty('--sparkle-dx', `${driftX * driftDirection}px`);
        sparkle.style.setProperty('--sparkle-dy', `${driftY}px`);
        sparkle.style.setProperty('--sparkle-duration', `${duration}s`);
        sparkle.style.setProperty('--sparkle-delay', `${delay}s`);
        sparkle.style.setProperty('--sparkle-opacity', opacity.toFixed(2));
        sparkle.style.left = `${left}%`;
        sparkle.style.top = `${top}%`;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;

        sparkleLayer.appendChild(sparkle);
    }
}

createSparkles();

window.addEventListener('resize', () => {
    clearTimeout(window.__sparkleResizeTimer);
    window.__sparkleResizeTimer = setTimeout(createSparkles, 150);
});


hamburger.addEventListener('click', ()=>{
    hamburger.classList.toggle('active');
    mobile_menu.classList.toggle('active');
});

document.addEventListener('scroll',()=>{
    var scroll_position = window.scrollY;
    const headerElement = document.querySelector('#header');

    if(scroll_position > 50) {
        header.style.backgroundColor = "#11041a99";
        logo.style.opacity = "0";
        if(headerElement) {
            headerElement.classList.add('scrolled');
        }
    }else{
        header.style.backgroundColor = 'transparent';
        logo.style.opacity = "0.8";
        if(headerElement) {
            headerElement.classList.remove('scrolled');
        }
    }

});

menu_item.forEach((item) => {
	item.addEventListener('click', () => {
		hamburger.classList.toggle('active');
		mobile_menu.classList.toggle('active');
	});
});


// Carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    const items = document.querySelectorAll('.recommendation-item');
    const prevBtn = document.querySelector('.carousel-nav-left');
    const nextBtn = document.querySelector('.carousel-nav-right');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    if (!track || !items.length) return;
    
    let currentIndex = 0;
    const totalItems = items.length;
    let isAnimating = false;
    
    // Create indicators
    for (let i = 0; i < totalItems; i++) {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        indicatorsContainer.appendChild(indicator);
    }
    
    const indicators = document.querySelectorAll('.indicator');
    
    function updateCarousel() {
        // Get container and current item dimensions
        const container = document.querySelector('.carousel-container');
        const containerWidth = container.offsetWidth;
        const item = items[currentIndex];
        const itemStyle = window.getComputedStyle(item);
        const itemWidth = item.offsetWidth;
        const marginLeft = parseFloat(itemStyle.marginLeft);
        const marginRight = parseFloat(itemStyle.marginRight);
        
        // Total space one item takes (width + both margins)
        const itemTotalWidth = itemWidth + marginLeft + marginRight;
        
        // Calculate the exact center of the container
        const containerCenter = containerWidth / 2;
        
        // Calculate where the center of current item should be
        const itemCenter = itemWidth / 2;
        
        // Calculate how much to move: center of container minus (position of item + half item width)
        const currentItemPosition = (currentIndex * itemTotalWidth) + marginLeft + itemCenter;
        const offset = containerCenter - currentItemPosition;
        
        track.style.transform = `translateX(${offset}px)`;
        
        // Update active states
        items.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next');
            
            if (index === currentIndex) {
                item.classList.add('active');
            } else if (index === currentIndex - 1 || (currentIndex === 0 && index === totalItems - 1)) {
                item.classList.add('prev');
            } else if (index === currentIndex + 1 || (currentIndex === totalItems - 1 && index === 0)) {
                item.classList.add('next');
            }
        });
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }
    
    function goToSlide(index) {
        if (isAnimating || index === currentIndex) return;
        isAnimating = true;
        currentIndex = index;
        updateCarousel();
        setTimeout(() => {
            isAnimating = false;
        }, 700);
    }
    
    function nextSlide() {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
        setTimeout(() => {
            isAnimating = false;
        }, 700);
    }
    
    function prevSlide() {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
        setTimeout(() => {
            isAnimating = false;
        }, 700);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
    
    // Touch/Swipe support
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diffY = Math.abs(currentY - startY);
        
        // If vertical scroll is more significant, don't prevent it
        if (diffY > 10) {
            isDragging = false;
        }
    }, { passive: true });
    
    track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        isDragging = false;
    }, { passive: true });
    
    // Auto-play functionality
    let autoplayInterval;
    
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            nextSlide();
        }, 6000);
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }
    
    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }
    
    // Update event listeners to reset autoplay
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });
    }
    
    indicators.forEach((indicator) => {
        const originalClick = indicator.onclick;
        indicator.addEventListener('click', () => {
            resetAutoplay();
        });
    });
    
    track.addEventListener('touchstart', stopAutoplay);
    track.addEventListener('touchend', resetAutoplay);
    
    // Pause on hover
    const container = document.querySelector('.carousel-container');
    if (container) {
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);
    }
    
    // Initialize
    updateCarousel();
    startAutoplay();
    
    // Update on window resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateCarousel();
        }, 250);
    });
});

const images = document.querySelectorAll(".roll-elem");
let imgSrc;
let currentImageIndex = 0;
let allImageSources = [];

// Collect all image sources
images.forEach((img) => {
    const style = window.getComputedStyle(img);
    const backgroundImage = style.backgroundImage;
    const src = backgroundImage.replace('url(', '').replace(')', '').replace(/"/g, '');
    allImageSources.push(src);
});

// Get images src onclick
images.forEach((img, index) => {
    img.addEventListener("click", (e) => {
        if (window.screen.width > 0) {
            const style = window.getComputedStyle(e.target);
            const backgroundImage = style.backgroundImage;
            const imgSrc = backgroundImage.replace('url(', '').replace(')', '').replace(/"/g, '');
            currentImageIndex = index;
            imgModal(imgSrc);
        }
    });
});

const main = document.querySelector('*');
const rollItem = document.querySelector('.roll-elem');

let imgModal = (src) => {
    header.style.display = "none";
    const modal = document.createElement("div");
    modal.setAttribute("class", "modal");
    
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.setAttribute("class", "modal-close");
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeModal();
    };
    
    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.setAttribute("class", "modal-nav modal-prev");
    prevBtn.innerHTML = '&#8249;';
    prevBtn.onclick = (e) => {
        e.stopPropagation();
        navigateImage(-1);
    };
    
    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.setAttribute("class", "modal-nav modal-next");
    nextBtn.innerHTML = '&#8250;';
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        navigateImage(1);
    };
    
    // Image
    const newImage = document.createElement("img");
    newImage.setAttribute("src", src);
    newImage.setAttribute("id", "modal-image");
    
    modal.append(closeBtn);
    modal.append(prevBtn);
    modal.append(newImage);
    modal.append(nextBtn);
    document.querySelector("#photos").append(modal);
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyPress);
};

function navigateImage(direction) {
    currentImageIndex = (currentImageIndex + direction + allImageSources.length) % allImageSources.length;
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        // Add fade out
        modalImage.style.opacity = '0';
        
        // Change image and fade in after short delay
        setTimeout(() => {
            modalImage.src = allImageSources[currentImageIndex];
            setTimeout(() => {
                modalImage.style.opacity = '1';
            }, 50);
        }, 200);
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
    main.style.overflow = "";
    header.style.display = "";
    document.removeEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (e.key === 'Escape') {
        closeModal();
    } else if (e.key === 'ArrowLeft') {
        navigateImage(-1);
    } else if (e.key === 'ArrowRight') {
        navigateImage(1);
    }
}


const rollItem1 = document.getElementById('roll1');
console.log(rollItem.scrollHeight)

// Scroll reveal animation
const revealElements = () => {
    const reveals = document.querySelectorAll('#services .title, #services .service-item, #about .col-left, #about .col-right, #movie .movie .social-media-phone ul li, #movie .movie h1, #movie .movie .iframe-container, #photos .gallery h1, #photos .gallery h2, #photos .gallery .items .roll-elem');
    
    reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('reveal');
        }
    });
};

window.addEventListener('scroll', revealElements);
window.addEventListener('load', revealElements);

// YouTube Autoplay on Scroll
const youtubeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const iframe = entry.target.querySelector('iframe');
        if (!iframe || !iframe.src) return;
        
        if (entry.isIntersecting) {
            // Video is visible - ensure autoplay
            if (iframe.src && !iframe.src.includes('autoplay=1')) {
                const separator = iframe.src.includes('?') ? '&' : '?';
                iframe.src = iframe.src + separator + 'autoplay=1&mute=1';
            }
        } else {
            // Video is not visible - pause by removing autoplay
            if (iframe.src && iframe.src.includes('autoplay=1')) {
                iframe.src = iframe.src.replace(/[?&]autoplay=1/, '').replace(/&mute=1/, '');
            }
        }
    });
}, {
    threshold: 0.5 // Video needs to be 50% visible
});

// Observe iframe container
const iframeContainer = document.querySelector('.iframe-container');
if (iframeContainer) {
    youtubeObserver.observe(iframeContainer);
}

// Phone Click Tracking
const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
phoneLinks.forEach(link => {
    link.addEventListener('click', function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'phone_click', {
                'event_category': 'Contact',
                'event_label': 'Phone Number Click',
                'value': 1
            });
        }
    });
});

// Service tiles modal
const serviceDetailsByIcon = {
    'service-celebrations.svg': {
        lead: 'Pokaz dopasowany do charakteru uroczystości, od kameralnych spotkań po większe przyjęcia.',
        details: 'Występ łączy klasyczną iluzję z humorem i interakcją z gośćmi. Możemy zagrać na scenie albo podejść do stołów, tak by magia naturalnie wpasowała się w przebieg wieczoru.',
        points: [
            'Czas trwania dopasowany do eventu (zwykle 20-45 min)',
            'Forma sceniczna lub magia z bliska między gośćmi',
            'Program zrozumiały i angażujący dla różnych grup wiekowych'
        ],
        prefill: 'Interesuje mnie pokaz na uroczystość.'
    },
    'service-birthday.svg': {
        lead: 'Urodziny z iluzjonistą to gotowa atrakcja, która trzyma uwagę gości od pierwszej do ostatniej minuty.',
        details: 'Pokaz buduję pod wiek solenizanta i atmosferę imprezy. Inaczej wygląda występ dla dzieci, inaczej set dla dorosłych. Magia, śmiech i wspólne "jak on to zrobił?" gwarantowane.',
        points: [
            'Program dopasowany do wieku urodzinowiczów',
            'Dużo interakcji i udziału publiczności',
            'Świetnie działa zarówno w domu, jak i w sali lub lokalu'
        ],
        prefill: 'Interesuje mnie magik na urodziny.'
    },
    'service-company.svg': {
        lead: 'Iluzja na firmówce to sposób, by integracja albo gala nie skończyła się na samym networkingu.',
        details: 'Pokaz firmowy mogę dopasować do tonu wydarzenia: lekki i zabawny albo bardziej widowiskowy. Magia świetnie rozbija lody, angażuje zespół i zostaje w rozmowach długo po evencie.',
        points: [
            'Idealny na integracje, gale i eventy firmowe',
            'Możliwość magii z bliska podczas cocktailu lub bankietu',
            'Czas i forma występu dopasowane do programu eventu'
        ],
        prefill: 'Interesuje mnie iluzjonista na imprezę firmową.'
    },
    'service-outside.svg': {
        lead: 'Pikniki, festyny i eventy plenerowe. Magia działa też na świeżym powietrzu.',
        details: 'W plenerze stawiam na wyraźne efekty, energię i kontakt z przechodzącą publicznością. Pokaz można zaplanować jako punkt programu albo jako atrakcję krążącą po terenie wydarzenia.',
        points: [
            'Sprawdza się na festynach, piknikach i eventach miejskich',
            'Format sceniczny lub pokaz w tłumie',
            'Elastyczny czas i lokalizacja występu'
        ],
        prefill: 'Interesuje mnie pokaz na imprezę plenerową.'
    },
    'service-special.svg': {
        lead: 'Promocje, targi i eventy handlowe zyskują atrakcję, która realnie zatrzymuje uwagę.',
        details: 'Pokaz specjalny mogę zbudować wokół Twojej marki lub akcji promocyjnej. Magia przyciąga ludzi do stoiska i buduje pozytywne skojarzenie z firmą.',
        points: [
            'Galerie, targi, otwarcia, promocje produktowe',
            'Możliwość kilku krótszych setów w ciągu dnia',
            'Efekt wow, który naturalnie zbiera tłum'
        ],
        prefill: 'Interesuje mnie pokaz specjalny / promocyjny.'
    },
    'service-wedding.svg': {
        lead: 'Magia na weselu to świetny sposób, by wyróżnić przyjęcie i zaangażować gości.',
        details: 'Najczęściej sprawdzają się występy między stołami w trakcie bankietu albo krótki pokaz sceniczny. Iluzje dobieram tak, by pasowały do klimatu wesela i nie kolidowały z innymi punktami programu.',
        points: [
            'Magia z bliska przy stołach lub krótki pokaz sceniczny',
            'Możliwość zaangażowania Pary Młodej',
            'Termin występu dopasowany do przebiegu wesela'
        ],
        prefill: 'Interesuje mnie iluzjonista na wesele.'
    }
};

const serviceFallbackDetails = {
    lead: 'Profesjonalny pokaz iluzji dopasowany do charakteru Twojego wydarzenia.',
    details: 'Każdy występ buduję pod konkretną okazję: długość, formę i poziom interakcji z gośćmi. Napisz kilka słów o evencie, a zaproponuję najlepszy wariant.',
    points: [
        'Program szyty na miarę wydarzenia',
        'Forma sceniczna lub magia z bliska',
        'Termin i szczegóły ustalamy indywidualnie'
    ],
    prefill: 'Interesuje mnie pokaz iluzji.'
};

function getServiceIconKey(imgSrc) {
    if (!imgSrc) return '';
    const fileName = imgSrc.split('/').pop() || '';
    return fileName.split('?')[0];
}

function ensureServiceModal() {
    let modal = document.getElementById('service-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'service-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'service-modal-title');
    modal.innerHTML = `
        <div class="service-modal-dialog">
            <button type="button" class="service-modal-close" aria-label="Zamknij">&times;</button>
            <img class="service-modal-icon" alt="" src="">
            <h3 id="service-modal-title"></h3>
            <p class="service-modal-lead"></p>
            <p class="service-modal-details"></p>
            <ul class="service-modal-list"></ul>
            <button type="button" class="service-modal-cta">Umów termin</button>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

let activeServicePrefill = '';
let lastFocusedServiceItem = null;

function openServiceModal(serviceItem) {
    const title = (serviceItem.querySelector('h3')?.textContent || '').trim();
    const iconEl = serviceItem.querySelector('img');
    const iconSrc = iconEl?.getAttribute('src') || '';
    const iconKey = getServiceIconKey(iconSrc);
    const details = serviceDetailsByIcon[iconKey] || serviceFallbackDetails;
    const modal = ensureServiceModal();

    lastFocusedServiceItem = serviceItem;
    activeServicePrefill = details.prefill;

    const modalIcon = modal.querySelector('.service-modal-icon');
    modalIcon.src = iconSrc;
    modalIcon.alt = iconEl?.getAttribute('alt') || title;

    modal.querySelector('#service-modal-title').textContent = title;
    modal.querySelector('.service-modal-lead').textContent = details.lead;
    modal.querySelector('.service-modal-details').textContent = details.details;

    const list = modal.querySelector('.service-modal-list');
    list.innerHTML = details.points.map((point) => `<li>${point}</li>`).join('');

    modal.classList.add('active');
    document.body.classList.add('service-modal-open');
    modal.querySelector('.service-modal-cta').focus();

    if (typeof gtag !== 'undefined') {
        gtag('event', 'service_click', {
            event_category: 'Services',
            event_label: title,
            value: 1
        });
    }
}

function closeServiceModal() {
    const modal = document.getElementById('service-modal');
    if (!modal || !modal.classList.contains('active')) return;

    modal.classList.remove('active');
    document.body.classList.remove('service-modal-open');

    if (lastFocusedServiceItem) {
        lastFocusedServiceItem.focus();
    }
}

function goToContactFromService() {
    const prefill = activeServicePrefill;
    const serviceTitle = document.getElementById('service-modal-title')?.textContent || '';

    closeServiceModal();

    const descriptionField = document.getElementById('description');
    if (descriptionField && prefill) {
        const current = descriptionField.value.trim();
        if (!current) {
            descriptionField.value = prefill;
        } else if (!current.includes(prefill)) {
            descriptionField.value = `${prefill} ${current}`;
        }
    }

    if (typeof gtag !== 'undefined') {
        gtag('event', 'service_cta_click', {
            event_category: 'Services',
            event_label: serviceTitle,
            value: 1
        });
    }

    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            const focusTarget = document.getElementById('name') || descriptionField;
            if (focusTarget) focusTarget.focus({ preventScroll: true });
        }, 450);
    }
}

(function initServiceModal() {
    const serviceItems = document.querySelectorAll('#services .service-item');
    if (!serviceItems.length) return;

    const modal = ensureServiceModal();

    serviceItems.forEach((item) => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        const title = (item.querySelector('h3')?.textContent || 'usłudze').trim();
        item.setAttribute('aria-label', `Więcej o pokazie: ${title}`);

        item.addEventListener('click', () => openServiceModal(item));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openServiceModal(item);
            }
        });
    });

    modal.querySelector('.service-modal-close').addEventListener('click', closeServiceModal);
    modal.querySelector('.service-modal-cta').addEventListener('click', goToContactFromService);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeServiceModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeServiceModal();
    });
})();

// Contact Form Handler
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Wysyłanie...';
        
        fetch('/sendmail.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Track form submission conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'Contact',
                        'event_label': 'Contact Form Submission',
                        'value': 1
                    });
                }
                
                // Hide form and show success message
                document.getElementById('form-content').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';
                
                // Scroll to success message
                document.getElementById('success-message').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            // Re-enable button on error
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            alert('Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie lub skontaktuj się telefonicznie.');
            console.error('Error:', error);
        });
    });
}

