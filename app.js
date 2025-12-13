const hamburger = document.querySelector('.header .nav-bar .nav-list .hamburger');
const mobile_menu = document.querySelector('.header .nav-bar .nav-list ul');
const menu_item = document.querySelectorAll('.header .nav-bar .nav-list ul li a');
const header = document.querySelector('.header.container');
const logo = document.querySelector('.header .logo');


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
        }, 600);
    }
    
    function nextSlide() {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
        setTimeout(() => {
            isAnimating = false;
        }, 600);
    }
    
    function prevSlide() {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
        setTimeout(() => {
            isAnimating = false;
        }, 600);
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
        }, 5000);
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
    const reveals = document.querySelectorAll('#services .title, #services .service-item, #about .col-left, #about .col-right, #movie .movie .social-media-phone ul li, #movie .movie h1, #movie .movie .iframe-container, #photos .gallery h1, #photos .gallery .items .roll-elem');
    
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
        
        fetch('sendmail.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
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

