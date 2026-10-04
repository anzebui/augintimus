// Google Sheets nuoroda yra faile config.js, vertimai – faile lang.js


// =====================================================================
//  DEMONSTRACINĖS KORTELĖS
//  Nuotraukas įkelk į images/ (pupa.jpg, murkis.jpg, rudis.jpg, snaige.jpg, bosas.jpg).
//  Kiekvienas tekstas rašomas dviem kalbomis: [lietuviškai, angliškai].
// =====================================================================
const pets = [
  { name: 'Pupa',   age: 2, where: ['Šuo iš Kauno', 'Dog from Kaunas'],
    tags: [['Tinka su vaikais', 'Good with kids'], ['Sterilizuota', 'Spayed']],
    photo: 'images/pupa.jpg', emoji: '🐕', bg: '#FFB37A' },
  { name: 'Murkis', age: 5, where: ['Katinas iš Vilniaus', 'Cat from Vilnius'],
    tags: [['Ramus', 'Calm'], ['Mėgsta glostytis', 'Loves cuddles']],
    photo: 'images/murkis.jpg', emoji: '🐈', bg: '#C9B8FF' },
  { name: 'Rudis',  age: 8, where: ['Šuo iš Alytaus', 'Dog from Alytus'],
    tags: [['Senjoras', 'Senior'], ['Ieško ramių namų', 'Looking for a quiet home']],
    photo: 'images/rudis.jpg', emoji: '🐶', bg: '#FFE27A' },
  { name: 'Snaigė', age: 1, where: ['Katė iš Klaipėdos', 'Cat from Klaipėda'],
    tags: [['Žaisminga', 'Playful'], ['Tinka laikinai globai', 'Fine for fostering']],
    photo: 'images/snaige.jpg', emoji: '🐱', bg: '#9EE6C8' },
  { name: 'Bosas',  age: 4, where: ['Šuo iš Šiaulių', 'Dog from Šiauliai'],
    tags: [['Energingas', 'Energetic'], ['Mėgsta bėgioti', 'Loves running']],
    photo: 'images/bosas.jpg', emoji: '🦮', bg: '#FFC2DD' },
];

const L = pair => pair[currentLang === 'en' ? 1 : 0];   // pasirenka tekstą pagal kalbą

const deck = document.getElementById('deck');
const statusEl = document.getElementById('deckStatus');
const matchEl = document.getElementById('match');
const matchText = document.getElementById('matchText');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let index = 0;      // kuri kortelė viršuje
let likes = 0;
let busy = false;

function cardHTML(pet) {
  return `
    <div class="pet-fallback" style="background:${pet.bg}">${pet.emoji}</div>
    <img class="pet-photo" src="${pet.photo}" alt="" draggable="false" onerror="this.remove()">
    <span class="stamp stamp-yes">${currentLang === 'en' ? 'Yes!' : 'Taip!'}</span>
    <span class="stamp stamp-no">${currentLang === 'en' ? 'Nope' : 'Ne'}</span>
    <div class="pet-info">
      <p class="pet-name">${pet.name}, ${t('age', { n: pet.age })}</p>
      <p class="pet-where">${L(pet.where)}</p>
      <div class="pet-tags">${pet.tags.map(tag => `<span>${L(tag)}</span>`).join('')}</div>
    </div>`;
}

// Nupiešia 3 viršutines korteles
function renderDeck(firstTime) {
  deck.innerHTML = '';
  for (let depth = 2; depth >= 0; depth--) {
    const pet = pets[(index + depth) % pets.length];
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.dataset.depth = depth;
    card.innerHTML = cardHTML(pet);
    if (firstTime && !reduceMotion) {
      card.classList.add('dealing');
      setTimeout(() => card.classList.remove('dealing'), 150 + (2 - depth) * 140);
    }
    if (depth === 0) {
      card.classList.add('is-top');
      card.setAttribute('aria-label', `${pet.name}, ${t('age', { n: pet.age })}. ${L(pet.where)}.`);
      enableDrag(card);
    }
    deck.appendChild(card);
  }
}

// Tempimas pele arba pirštu
function enableDrag(card) {
  const yes = card.querySelector('.stamp-yes');
  const no = card.querySelector('.stamp-no');
  let startX = 0, startY = 0, dx = 0, dragging = false;

  card.addEventListener('pointerdown', e => {
    if (busy) return;
    dragging = true; dx = 0;
    startX = e.clientX; startY = e.clientY;
    card.setPointerCapture(e.pointerId);
    card.style.transition = 'none';
  });

  card.addEventListener('pointermove', e => {
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = (e.clientY - startY) * 0.25;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 16}deg)`;
    yes.style.opacity = Math.min(Math.max(dx / 90, 0), 1);
    no.style.opacity = Math.min(Math.max(-dx / 90, 0), 1);
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    card.style.transition = '';
    if (Math.abs(dx) > 100) {
      decide(dx > 0);
    } else {
      card.style.transform = '';
      yes.style.opacity = 0; no.style.opacity = 0;
    }
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

function decide(liked) {
  if (busy || !matchEl.hidden) return;
  busy = true;
  const card = deck.querySelector('.is-top');
  const pet = pets[index % pets.length];
  card.querySelector(liked ? '.stamp-yes' : '.stamp-no').style.opacity = 1;
  card.style.transform = `translateX(${liked ? 160 : -160}%) rotate(${liked ? 24 : -24}deg)`;
  card.style.opacity = 0;

  // likusios kortelės pasislenka į priekį
  deck.querySelectorAll('.pet-card:not(.is-top)').forEach(c => c.dataset.depth = c.dataset.depth - 1);

  if (liked) {
    likes++;
    statusEl.textContent = t('liked', { name: pet.name });
    if (likes % 2 === 0) {
      setTimeout(() => {
        matchText.textContent = t('match', { name: pet.name });
        matchEl.hidden = false;
        document.getElementById('matchClose').focus();
      }, 900);
    }
  } else {
    statusEl.textContent = t('nope');
  }

  setTimeout(() => {
    index++;
    renderDeck(false);
    busy = false;
  }, 360);
}

if (deck) {
  renderDeck(true);
  document.getElementById('btnNo').addEventListener('click', () => decide(false));
  document.getElementById('btnYes').addEventListener('click', () => decide(true));
  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') decide(true);
    if (e.key === 'ArrowLeft') decide(false);
  });
  document.getElementById('matchClose').addEventListener('click', () => {
    matchEl.hidden = true;
    statusEl.textContent = t('status_initial');
    deck.focus();
  });
}


// =====================================================================
//  „PRIDĖTI PRIE PRADŽIOS EKRANO“ INSTRUKCIJOS
// =====================================================================
const osButtons = document.querySelectorAll('.os-btn');
function showOs(os) {
  osButtons.forEach(b => b.classList.toggle('active', b.dataset.os === os));
  document.querySelectorAll('[data-os-steps]').forEach(list => list.hidden = list.dataset.osSteps !== os);
}
osButtons.forEach(b => b.addEventListener('click', () => showOs(b.dataset.os)));
if (/android/i.test(navigator.userAgent)) showOs('android');


// =====================================================================
//  REGISTRACIJA
// =====================================================================
const tabs = document.querySelectorAll('.choice-btn');
const forms = {
  adopter: document.getElementById('form-adopter'),
  shelter: document.getElementById('form-shelter'),
};
const thanks = document.getElementById('thanks');
const formError = document.getElementById('formError');
let lastThanksType = 'adopter';

function showTab(name) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  Object.entries(forms).forEach(([key, form]) => form.hidden = key !== name);
  thanks.hidden = true;
  formError.hidden = true;
}
tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));

Object.values(forms).forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const field = n => (form.elements[n] ? form.elements[n].value.trim() : '');
    if (field('website')) return; // apsauga nuo botų

    const button = form.querySelector('button[type=submit]');
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.textContent = t('sending');
    formError.hidden = true;

    const data = new URLSearchParams({
      type: form.dataset.type,
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
    });

    try {
      if (typeof SHEET_URL !== 'undefined' && SHEET_URL.startsWith('http')) {
        await fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: data });
      } else {
        console.warn('SHEET_URL neįklijuota faile config.js – duomenys niekur neišsiųsti.');
      }
      form.reset();
      form.hidden = true;
      lastThanksType = form.dataset.type;
      document.getElementById('thanksText').textContent = t('thanks_' + lastThanksType);
      thanks.hidden = false;
    } catch (err) {
      formError.hidden = false;
    } finally {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  });
});

document.getElementById('againBtn').addEventListener('click', () => {
  showTab(document.querySelector('.choice-btn.active').dataset.tab);
});


// =====================================================================
//  PASPAUDIMAI (veikia ir pakeitus kalbą)
// =====================================================================
const privacy = document.getElementById('privacy');
document.addEventListener('click', e => {
  const privacyLink = e.target.closest('.open-privacy');
  if (privacyLink) { e.preventDefault(); privacy.showModal(); return; }
  const choiceLink = e.target.closest('[data-choice]');
  if (choiceLink) showTab(choiceLink.dataset.choice);
});
document.getElementById('closePrivacy').addEventListener('click', () => privacy.close());
privacy.addEventListener('click', e => { if (e.target === privacy) privacy.close(); });

document.getElementById('year').textContent = new Date().getFullYear();


// =====================================================================
//  KALBOS PAKEITIMAS – atnaujina korteles ir pranešimus
// =====================================================================
document.addEventListener('langchange', () => {
  if (deck && !busy) renderDeck(false);
  statusEl.textContent = t('status_initial');
  if (!matchEl.hidden) matchEl.hidden = true;
  document.getElementById('thanksText').textContent = t('thanks_' + lastThanksType);
});
