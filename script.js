// =====================================================================
//  ČIA ĮKLIJUOK SAVO GOOGLE APPS SCRIPT NUORODĄ (žr. instrukcijas)
// =====================================================================
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwTN1kDa_5JhrMIckoXCoP8w46DRGC9ktL8rxd5c8zxFWdeBWuEJ2bGP-4SCXiBEZO10w/exec';


// ---------- Demo gyvūnai kortelėje (galima keisti) ----------
const pets = [
  { name: 'Pupa',   emoji: '🐕', meta: 'Šuo · 2 m. · Vidutinė', tags: ['Tinka su vaikais', 'Sterilizuota'], color: ['#F6A15B', '#E9743A'] },
  { name: 'Murkis', emoji: '🐈', meta: 'Katinas · 5 m.',         tags: ['Ramus', 'Mėgsta glostytis'],     color: ['#C9A27E', '#9C7655'] },
  { name: 'Rudis',  emoji: '🐶', meta: 'Šuo · 8 m. · Didelis',   tags: ['Senjoras', 'Ieško ramių namų'],  color: ['#F2C26B', '#DE9A34'] },
  { name: 'Snaigė', emoji: '🐱', meta: 'Katė · 1 m.',            tags: ['Žaisminga', 'Tinka laikinai globai'], color: ['#B9C7D9', '#8597B0'] },
];

const stack = document.getElementById('cardStack');
const likeCountEl = document.getElementById('likeCount');
const matchPop = document.getElementById('matchPop');
let current = 0;
let likes = 0;
let busy = false;

function makeCard(pet) {
  const card = document.createElement('div');
  card.className = 'pet-card';
  card.style.background = `linear-gradient(160deg, ${pet.color[0]}, ${pet.color[1]})`;
  card.innerHTML = `
    <div class="pet-emoji">${pet.emoji}</div>
    <div class="pet-info">
      <h4>${pet.name}</h4>
      <div class="pet-meta">${pet.meta}</div>
      <div class="tags">${pet.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>`;
  return card;
}

function renderCards() {
  stack.innerHTML = '';
  const next = makeCard(pets[(current + 1) % pets.length]);
  next.classList.add('behind');
  const top = makeCard(pets[current % pets.length]);
  stack.append(next, top);
}

function decide(liked) {
  if (busy) return;
  busy = true;
  const top = stack.lastElementChild;
  const behind = stack.firstElementChild;
  top.classList.add(liked ? 'out-right' : 'out-left');
  behind.classList.remove('behind');
  if (liked) {
    likes++;
    likeCountEl.textContent = likes;
    matchPop.classList.add('show');
    setTimeout(() => matchPop.classList.remove('show'), 900);
  }
  setTimeout(() => {
    current++;
    renderCards();
    busy = false;
  }, 450);
}

if (stack) {
  renderCards();
  document.getElementById('btnNo').addEventListener('click', () => decide(false));
  document.getElementById('btnYes').addEventListener('click', () => decide(true));
}


// ---------- Animacija slenkant + skaičiai ----------
function animateCount(el) {
  const target = +el.dataset.target;
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    entry.target.querySelectorAll('.count').forEach(animateCount);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


// ---------- Ekranų slankiklio taškeliai (telefone) ----------
const screens = document.getElementById('screens');
const dotsBox = document.getElementById('screenDots');
if (screens && dotsBox) {
  const items = screens.querySelectorAll('.screen');
  items.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dotsBox.appendChild(dot);
  });
  screens.addEventListener('scroll', () => {
    const index = Math.round(screens.scrollLeft / (items[0].offsetWidth + 24));
    dotsBox.querySelectorAll('span').forEach((d, i) => d.classList.toggle('active', i === index));
  });
}


// ---------- Registracijos pasirinkimas ----------
const tabs = document.querySelectorAll('.choice-btn');
const forms = {
  adopter: document.getElementById('form-adopter'),
  shelter: document.getElementById('form-shelter'),
};
const thanks = document.getElementById('thanks');
const formError = document.getElementById('formError');

function showTab(name) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  Object.entries(forms).forEach(([key, form]) => form.hidden = key !== name);
  thanks.hidden = true;
  formError.hidden = true;
}
tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

// Mygtukai su data-choice atidaro reikiamą formą
document.querySelectorAll('[data-choice]').forEach(link => {
  link.addEventListener('click', () => showTab(link.dataset.choice));
});


// ---------- Formų siuntimas į Google Sheets ----------
Object.values(forms).forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const field = n => (form.elements[n] ? form.elements[n].value.trim() : '');
    if (field('website')) return; // apsauga nuo botų

    const button = form.querySelector('button[type=submit]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Siunčiama...';
    formError.hidden = true;

    const data = new URLSearchParams({
      type: form.dataset.type,
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
    });

    try {
      if (SHEET_URL.startsWith('http')) {
        await fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: data });
      } else {
        console.warn('SHEET_URL dar neįklijuota – duomenys niekur neišsiųsti.');
      }
      form.reset();
      form.hidden = true;
      document.getElementById('thanksText').textContent =
        form.dataset.type === 'shelter'
          ? 'Gavome jūsų kontaktus – netrukus susisieksime!'
          : 'Pranešime, kai Augintimus startuos. 🐶🐱';
      thanks.hidden = false;
    } catch (err) {
      formError.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});

document.getElementById('againBtn').addEventListener('click', () => {
  showTab(document.querySelector('.choice-btn.active').dataset.tab);
});


// ---------- Privatumo langas ----------
const privacy = document.getElementById('privacy');
document.querySelectorAll('.open-privacy').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); privacy.showModal(); });
});
document.getElementById('closePrivacy').addEventListener('click', () => privacy.close());
privacy.addEventListener('click', e => { if (e.target === privacy) privacy.close(); });


// ---------- Metai poraštėje ----------
document.getElementById('year').textContent = new Date().getFullYear();


// ---------- „Pridėti prie pradžios ekrano“ instrukcijos ----------
const osButtons = document.querySelectorAll('.os-btn');
function showOs(os) {
  osButtons.forEach(b => b.classList.toggle('active', b.dataset.os === os));
  document.querySelectorAll('[data-os-steps]').forEach(list => list.hidden = list.dataset.osSteps !== os);
}
osButtons.forEach(b => b.addEventListener('click', () => showOs(b.dataset.os)));
// Automatiškai parodo Android instrukcijas Android telefonuose
if (/android/i.test(navigator.userAgent)) showOs('android');
