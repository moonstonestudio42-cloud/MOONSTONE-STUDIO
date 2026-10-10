// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.menu-grid').forEach(g => {
        g.classList.remove('active');
    });

    document.querySelectorAll('.menu-tab').forEach(t => {
        t.classList.remove('active');
    });

    document.getElementById('tab-' + tab).classList.add('active');
    event.target.classList.add('active');
}


// Scroll reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});


// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');

    if (window.scrollY > 60) {
        nav.style.padding = '14px 60px';
        nav.style.boxShadow = '0 4px 30px rgba(46,31,23,0.08)';
    } else {
        nav.style.padding = '22px 60px';
        nav.style.boxShadow = 'none';
    }
});


// Booking form
function submitBooking() {
    const toast = document.getElementById('toast');

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}


// Mobile menu
function toggleMenu() {
    const links = document.querySelector('.nav-links');

    if (links.style.display === 'flex') {
        links.style.display = 'none';
    } else {
        links.style.cssText =
            'display:flex;flex-direction:column;position:fixed;top:70px;left:0;right:0;background:var(--ivory);padding:30px;gap:20px;border-bottom:1px solid var(--smoke);z-index:99;';
    }
}


// Gallery
const galleryImages = {
    bridal: [
       
    ],

    nails: [
       
    ],

    makeup: [
       
    ]
};


const titles = {
    bridal: "Bridal Artistry",
    nails: "Nail Art",
    makeup: "Makeup"
};


const lightbox = document.getElementById('lightbox');
const lightboxGrid = document.getElementById('lightboxGrid');
const lightboxTitle = document.getElementById('lightboxTitle');


document.querySelectorAll('.g-cell').forEach(cell => {

    cell.addEventListener('click', () => {

        const category = cell.dataset.category;

        const images = galleryImages[category] || [];

        lightboxTitle.textContent =
            titles[category] || category;

        lightboxGrid.innerHTML = images
            .map(src => `<img src="${src}" alt="${category} photo">`)
            .join('');

        lightbox.classList.add('active');
    });

});


document.getElementById('lightboxClose').addEventListener('click', () => {
    lightbox.classList.remove('active');
});


lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.classList.remove('active');
    }
});

function submitForm(id, title) {

  const f = document.getElementById(id);
  const isClass = id === "classForm";
  const url = isClass ? CLASS_SHEET_URL : APPOINTMENT_SHEET_URL;

  let ok = true;

  const data = {
    formType: title
  };

  const lines = [];

  f.querySelectorAll("input, select, textarea").forEach(el => {

    const label = el.closest(".fg").querySelector("label").textContent.trim();
    const value = el.value.trim();

    const optional = ["nt", "em", "ag"].includes(el.name);

    if (!value && !optional) {
      ok = false;
      el.style.borderColor = "#c0897a";
    } else {
      el.style.borderColor = "";
    }

    if (isClass) {

      if (el.name === "nm") data.fullName = value;
      if (el.name === "ph") data.phone = value;
      if (el.name === "em") data.email = value;
      if (el.name === "ag") data.age = value;
      if (el.name === "co") data.course = value;
      if (el.name === "lv") data.experienceLevel = value;
      if (el.name === "bt") data.preferredBatch = value;
      if (el.name === "sd") data.preferredStartDate = value;
      if (el.name === "nt") data.message = value;

    } else {

      if (el.name === "fn") data.firstName = value;
      if (el.name === "ln") data.lastName = value;
      if (el.name === "ph") data.phone = value;
      if (el.name === "sv") data.service = value;
      if (el.name === "dt") data.preferredDate = value;
      if (el.name === "tm") data.preferredTime = value;
      if (el.name === "nt") data.specialRequest = value;
    }

    if (value) {
      lines.push(label + ": " + value);
    }

  });

  if (!ok) {
    toast("Please fill in all required fields");
    return;
  }

  if (!url) {
    window.open(
      "https://wa.me/917358282937?text=" +
      encodeURIComponent(
        "*" + title + " - Moonstone Studio*\n" +
        lines.join("\n")
      ),
      "_blank"
    );

    toast("✦ " + title + " received — we'll confirm shortly!");

    f.querySelectorAll("input, select, textarea").forEach(el => {
      el.value = "";
    });

    return;
  }

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {

    console.log("Google Sheet response:", result);

    if (result.success) {

      toast("✦ " + title + " received — we'll confirm shortly!");

      f.querySelectorAll("input, select, textarea").forEach(el => {
        el.value = "";
      });

    } else {

      toast("Something went wrong: " + result.message);
      console.error(result);

    }

  })
  .catch(error => {

    console.error("Google Sheet Error:", error);
    toast("Unable to submit. Please try again.");

  });
}
