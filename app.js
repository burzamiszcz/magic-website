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
        header.style.backgroundColor = "#11041a99";
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

const images = document.querySelectorAll(".roll-elem");
let imgSrc;
// get images src onclick
images.forEach((img) => {
    img.addEventListener("click", (e) => {
        if (window.screen.width > 0) {
            console.log(e.target.outerHTML.slice(36, 62).replace(/'/g, " "))
            imgSrc = e.target.outerHTML.slice(36, 62).replace(/'/g, " ");
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
    //add the modal to the main section or the parent element
    document.querySelector("#photos").append(modal);
    //adding image to modal
    const newImage = document.createElement("img");
    newImage.setAttribute("src", src);
    modal.append(newImage)
    modal.onclick = () =>{
        modal.remove();
        main.style.overflow = "";
        header.style.display = ""
    }
};


const rollItem1 = document.getElementById('roll1');
console.log(rollItem.scrollHeight)
