(function(){
  const readerEl = document.getElementById('reader');
  const resultBox = document.getElementById('result');
  const codeValue = document.getElementById('codeValue');
  const parsed = document.getElementById('parsed');

  function parseParamsFrom(urlOrCode){
    try{
      const u = new URL(urlOrCode);
      const code = u.searchParams.get('code');
      const place = u.searchParams.get('place');
      let out = '';
      if(code) out += `<p><strong>Code :</strong> ${code}</p>`;
      if(place) out += `<p><strong>Point de vente :</strong> ${place}</p>`;
      return out || '<em>Aucun paramètre ?code= ou ?place= détecté.</em>';
    }catch(e){
      return '<em>Texte simple détecté (pas une URL). Ce prototype valide tous les codes.</em>';
    }
  }

  function onScanSuccess(decodedText){
    codeValue.textContent = decodedText;
    parsed.innerHTML = parseParamsFrom(decodedText);
    resultBox.classList.remove('hidden');
  }

  if (window.Html5Qrcode && readerEl){
    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 260, height: 260 } };
    Html5Qrcode.getCameras().then(cams => {
      const cameraId = (cams && cams.length) ? cams[0].id : null;
      if(cameraId){
        html5QrCode.start(cameraId, config, onScanSuccess);
      }else{
        readerEl.innerHTML = '<p>Caméra indisponible. Utilisez la saisie manuelle ci-dessous.</p>';
      }
    }).catch(err => {
      readerEl.innerHTML = '<p>Accès caméra refusé. Utilisez la saisie manuelle ci-dessous.</p>';
    });
  }

  const form = document.getElementById('manual');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const val = document.getElementById('manualInput').value.trim();
      if(!val) return;
      onScanSuccess(val);
    });
  }
})();