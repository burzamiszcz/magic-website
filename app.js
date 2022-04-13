const hamburger = document.querySelector('.header .nav-bar .nav-list .hamburger');
const mobile_menu = document.querySelector('.header .nav-bar .nav-list ul');
const menu_item = document.querySelectorAll('.header .nav-bar .nav-list ul li a');
const header = document.querySelector('.header.container');

hamburger.addEventListener('click', ()=>{
    hamburger.classList.toggle('active');
    mobile_menu.classList.toggle('active');
});

document.addEventListener('scroll',()=>{
    var scroll_position = window.scrollY;
    if(scroll_position > 50) {
        header.style.backgroundColor = "#11041a";
    }else{
        header.style.backgroundColor = 'transparent'
    }
});

menu_item.forEach((item) => {
	item.addEventListener('click', () => {
		hamburger.classList.toggle('active');
		mobile_menu.classList.toggle('active');
	});
});


var slides = document.querySelector('.recommendation .items').children;
var nextSlide = document.querySelector(".recommendation .items .right-slide");
var prevSlide = document.querySelector(".recommendation .items .left-slide");
var totalSlides = slides.length - 1;
var index = 1

nextSlide.onclick = function () {
    next("next");
}

prevSlide.onclick = function () {
    next("prev");
}

function next(direction) {

    if (direction=="next"){
        index++;
        if (index == totalSlides){
            index = 1;
        }
    }
    else{
       if(index == 1){
           index = totalSlides - 1; 
       }
       else{
           index--;
       }
    }

    for (i=1; i < slides.length; i++){
        slides[i].classList.remove("active");
    }
    slides[index].classList.add("active");
}


var photos = document.querySelector('.photos .all-photos').children;
var allPhotos = photos.length;
var dispPhoto = 0


function change(){
    dispPhoto ++;
    if (dispPhoto == allPhotos){
        dispPhoto = 0;
    }
    for (i=0; i < allPhotos; i++){
        photos[i].classList.remove("active")
    }

    photos[dispPhoto].classList.add("active")

}

window.onload = function(){
    setInterval(change, 6000)
}