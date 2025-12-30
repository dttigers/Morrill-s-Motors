const filterButtons = document.querySelectorAll('.filter-btn');
const galleryCards = document.querySelectorAll('.gallery-card');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const yearEl = document.getElementById('year');
const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
const submitButtonLabel = submitButton ? submitButton.textContent : '';

const cart = [];

if (filterButtons.length && galleryCards.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galleryCards.forEach((card) => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;
        card.style.display = show ? 'block' : 'none';
      });
    });
  });
}

if (galleryCards.length && lightbox && lightboxImage && lightboxCaption) {
  galleryCards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const caption = card.querySelector('h3').textContent;
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightboxCaption.textContent = caption;
      lightbox.removeAttribute('hidden');
    });
  });
}

if (lightbox && lightboxImage) {
  lightbox.addEventListener('click', (event) => {
    if (event.target.dataset.close === 'lightbox' || event.target === lightbox) {
      lightbox.setAttribute('hidden', '');
      lightboxImage.src = '';
    }
  });
}

if (lightbox && lightboxImage) {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
      lightbox.setAttribute('hidden', '');
      lightboxImage.src = '';
    }
  });
}

function updateCart() {
  if (!cartItemsEl || !cartTotalEl) {
    return;
  }
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No items yet. Tap a product to begin.';
    cartItemsEl.appendChild(li);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${item.name}</span><span>$${item.price.toFixed(2)}</span>`;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.type = 'button';
      removeBtn.textContent = 'remove';
      removeBtn.addEventListener('click', () => {
        cart.splice(index, 1);
        updateCart();
      });
      li.appendChild(removeBtn);
      cartItemsEl.appendChild(li);
    });
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

const addToCartButtons = document.querySelectorAll('.add-to-cart');
if (addToCartButtons.length) {
  addToCartButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      if (!card) {
        return;
      }
      cart.push({
        sku: card.dataset.sku,
        name: card.dataset.name,
        price: Number(card.dataset.price),
      });
      updateCart();
      btn.textContent = 'Added';
      setTimeout(() => {
        btn.textContent = 'Add to request';
      }, 1200);
    });
  });
}

if (contactForm && formStatus) {
  const formFields = contactForm.querySelectorAll('input, select, textarea');
  formFields.forEach((field) => {
    field.addEventListener('input', () => {
      field.classList.remove('invalid');
    });
    field.addEventListener('change', () => {
      field.classList.remove('invalid');
    });
  });
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      contactForm.querySelectorAll(':invalid').forEach((field) => {
        field.classList.add('invalid');
      });
      formStatus.textContent = 'Please complete the required fields.';
      formStatus.style.color = '#ff9b8a';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButtonLabel;
      }
      return;
    }
    
    const formData = new FormData(contactForm);
    fetch('https://formspree.io/f/mdaorbqj', {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => {
        if (response.ok) {
          formStatus.textContent = "Thanks! We'll get back to you within 1 business day.";
          formStatus.style.color = '#7fd7b0';
          contactForm.reset();
        } else {
          formStatus.textContent = 'Error sending message. Please try again.';
          formStatus.style.color = '#ff9b8a';
        }
      })
      .catch(() => {
        formStatus.textContent = 'Error sending message. Please try again.';
        formStatus.style.color = '#ff9b8a';
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButtonLabel;
        }
      });
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
updateCart();
