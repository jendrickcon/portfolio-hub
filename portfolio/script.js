// Automatically strip 'index.html' from browser address bar
if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('index.html')) {
  const cleanPath = (window.location.pathname.replace(/\/index\.html$/, '/') || '/') + window.location.search + window.location.hash;
  window.history.replaceState(null, '', cleanPath);
}

const p1 = document.querySelector(".p1");
const box1 = document.querySelector(".box1");
const p2 = document.querySelector(".p2");
const box2 = document.querySelector(".box2");
const p3 = document.querySelector(".p3");
const box3 = document.querySelector(".box3");
const p4 = document.querySelector(".p4");
const box4 = document.querySelector(".box4");
const p5 = document.querySelector(".p5");
const box5 = document.querySelector(".box5");

function setupCard(trigger, overlay) {
  if (!trigger || !overlay) return;
  trigger.addEventListener("click", () => {
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
    overlay.classList.remove("show");
  });
}

setupCard(p1, box1);
setupCard(p2, box2);
setupCard(p3, box3);
setupCard(p4, box4);
setupCard(p5, box5);

function changeImage() {
var image = document.querySelector(".me");
if (image.src.match("me2.png")) {
image.src = "./images/me.jpg";
} else {
image.src = "./images/me2.png";
}
requestAnimationFrame(syncPanelHeights);
}

// Synchronize .projects panel height to match .aboutme panel exactly on desktop
const projectsPanel = document.querySelector(".projects");
const aboutmePanel = document.querySelector(".aboutme");

function syncPanelHeights() {
  if (!projectsPanel || !aboutmePanel) return;
  if (window.innerWidth > 900) {
    projectsPanel.style.height = `${aboutmePanel.offsetHeight}px`;
  } else {
    projectsPanel.style.height = "";
  }
}

if (aboutmePanel && window.ResizeObserver) {
  const ro = new ResizeObserver(() => syncPanelHeights());
  ro.observe(aboutmePanel);
}

window.addEventListener("resize", syncPanelHeights);
window.addEventListener("load", syncPanelHeights);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(syncPanelHeights);
}
syncPanelHeights();


const video = document.querySelector(".m4");

if (video) {
  video.addEventListener('mousedown', () => {
    video.play();
  });

  video.addEventListener('mouseup', () => {
    video.pause();
  });

  video.addEventListener('mouseleave', () => {
    video.pause();
  });

  // touch support so the "hold to view" interaction also works on mobile
  video.addEventListener('touchstart', (event) => {
    event.preventDefault();
    video.play();
  });

  video.addEventListener('touchend', () => {
    video.pause();
  });
}

const contactForm = document.getElementById("contact-form");
const contactFormStatus = document.getElementById("contact-form-status");

if (contactForm && contactFormStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactFormStatus.textContent = "This legacy HCI coursework form is a static demo and does not send messages.";
    contactFormStatus.hidden = false;
    contactForm.reset();
    requestAnimationFrame(syncPanelHeights);
  });
}