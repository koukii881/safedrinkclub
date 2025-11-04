// --------- CONFIG (temporaire pour tester) ---------
// ⚠️ Pour que ça marche tout de suite, colle tes vraies valeurs ici.
// (On masquera mieux plus tard.)
const SUPABASE_URL = "https://abcd1234.supabase.co"; // ex: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
// ---------------------------------------------------
const SUPABASE_URL = "https://abcd1234.supabase.co";
const SUPABASE_ANON_KEY = "eyJh...";

 // 👇 Tu colles ici, juste après cette ligne
// Connexion à la base Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fonction pour enregistrer un scan
async function saveScan(code) {
  const { data, error } = await supabase
    .from('Scan')
    .insert([{ code_qr: code }]);
  if (error) {
    console.error('Erreur lors de l’enregistrement :', error);
  } else {
    console.log('Scan enregistré avec succès !', data);
  }
}
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const codeEl = document.getElementById('codeValue');
const parsedEl = document.getElementById('parsed');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');

let CURRENT = {
  code: null,
  lat: null,
  lng: null,
  place: null
};

// 1) Récupère ?code=... et affiche
function initFromUrl() {
  const code = getQueryParam('code');
  if (code) {
    CURRENT.code = code.trim();
    codeEl.textContent = CURRENT.code;
    parsedEl.innerHTML = `<p><strong>Code détecté :</strong> ${CURRENT.code}</p>`;
  } else {
    parsedEl.innerHTML = `<p>Aucun code dans l'URL. Ajoute <code>?code=SDP001</code> par exemple.</p>`;
  }
}
initFromUrl();

// 2) Demande la géolocalisation
function askLocation() {
  if (!navigator.geolocation) {
    statusEl.textContent = "La géolocalisation n'est pas supportée sur cet appareil.";
    return;
  }
  statusEl.textContent = "Demande de géolocalisation…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      CURRENT.lat = pos.coords.latitude;
      CURRENT.lng = pos.coords.longitude;
      statusEl.textContent = "Position récupérée ✅";
      parsedEl.insertAdjacentHTML(
        'beforeend',
        `<p><strong>Position :</strong> ${CURRENT.lat.toFixed(5)}, ${CURRENT.lng.toFixed(5)}</p>`
      );
      saveBtn.disabled = false;
    },
    (err) => {
      statusEl.textContent = "Impossible d'obtenir la position (permission refusée ?)";
      saveBtn.disabled = true;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
askLocation();

// 3) Enregistre dans Supabase (table 'scans')
async function saveToSupabase() {
  if (!CURRENT.code) {
    statusEl.textContent = "Pas de code à enregistrer.";
    return;
  }
  statusEl.textContent = "Enregistrement…";

  const payload = {
    code_qr: CURRENT.code,
    latitude: CURRENT.lat,
    longitude: CURRENT.lng,
    place: CURRENT.place // reste null pour le moment
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const data = await res.json();
    statusEl.textContent = "Enregistré ✅";
    parsedEl.insertAdjacentHTML(
      'beforeend',
      `<p><em>Ligne Supabase créée (id: ${data[0]?.id ?? "?"}).</em></p>`
    );
  } catch (e) {
    statusEl.textContent = "Erreur d'enregistrement : " + e.message;
  }
}

if (saveBtn) {
  saveBtn.addEventListener('click', saveToSupabase);
}
