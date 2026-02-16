const API = '/api';

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function show(id) {
  document.querySelectorAll('[id^="page"]').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function setNodeStatus(text, ok = true) {
  const el = document.getElementById('nodeStatus');
  if (el) el.textContent = text;
  el.style.color = ok ? '' : '#f85149';
}

document.getElementById('nodeStatus').textContent = 'Checking node…';
api('/status').then(d => {
  if (d.ok) setNodeStatus(`Node connected (block ${d.blockHeight})`);
  else setNodeStatus(d.error || 'Node error', false);
}).catch(() => setNodeStatus('Cannot reach node. Check RPC settings.', false));

async function refreshWalletInfo() {
  try {
    const info = await api('/wallet/info');
    if (info.hasSession) {
      document.getElementById('nav').classList.remove('hidden');
      document.getElementById('pageWelcome').classList.add('hidden');
      document.getElementById('dashboardAddress').textContent = info.address;
      document.getElementById('receiveAddress').textContent = info.address;
      const bal = await api('/wallet/balance');
      document.getElementById('balance').textContent = bal.balanceFormatted ?? '—';
      const balanceErr = document.getElementById('balanceError');
      if (bal.error) {
        balanceErr.textContent = bal.error;
        balanceErr.classList.remove('hidden');
      } else {
        balanceErr.classList.add('hidden');
      }
      show('pageDashboard');
    } else {
      document.getElementById('nav').classList.add('hidden');
      document.getElementById('pageWelcome').classList.remove('hidden');
      show('pageWelcome');
    }
  } catch (e) {
    document.getElementById('nav').classList.add('hidden');
    document.getElementById('pageWelcome').classList.remove('hidden');
    show('pageWelcome');
  }
}

document.querySelectorAll('nav a[data-page]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const page = a.getAttribute('data-page');
    if (page === 'dashboard') {
      show('pageDashboard');
      refreshWalletInfo();
    } else if (page === 'receive') {
      show('pageReceive');
      api('/wallet/receive').then(d => {
        document.getElementById('receiveAddress').textContent = d.address;
        const qr = document.getElementById('receiveQr');
        qr.innerHTML = '';
        if (d.qr) {
          const img = document.createElement('img');
          img.src = d.qr;
          img.alt = 'QR';
          qr.appendChild(img);
        }
      });
    } else if (page === 'send') {
      show('pageSend');
      document.getElementById('sendError').classList.add('hidden');
      document.getElementById('sendSuccess').classList.add('hidden');
    }
  });
});

document.getElementById('btnLogout').addEventListener('click', async () => {
  await api('/wallet/logout', { method: 'POST' });
  document.getElementById('nav').classList.add('hidden');
  document.getElementById('pageWelcome').classList.remove('hidden');
  document.getElementById('pageDashboard').classList.add('hidden');
  document.getElementById('pageReceive').classList.add('hidden');
  document.getElementById('pageSend').classList.add('hidden');
  show('pageWelcome');
});

document.getElementById('btnCreate').addEventListener('click', async () => {
  document.getElementById('welcomeError').classList.add('hidden');
  try {
    const d = await api('/wallet/create', { method: 'POST' });
    document.getElementById('newMnemonic').value = d.mnemonic;
    document.getElementById('pageWelcome').classList.add('hidden');
    show('pageCreate');
  } catch (e) {
    document.getElementById('welcomeError').textContent = e.message;
    document.getElementById('welcomeError').classList.remove('hidden');
  }
});

document.getElementById('btnRestore').addEventListener('click', async () => {
  document.getElementById('welcomeError').classList.add('hidden');
  const mnemonic = document.getElementById('restoreMnemonic').value.trim();
  if (!mnemonic) {
    document.getElementById('welcomeError').textContent = 'Enter your recovery phrase';
    document.getElementById('welcomeError').classList.remove('hidden');
    return;
  }
  try {
    await api('/wallet/restore', { method: 'POST', body: JSON.stringify({ mnemonic }) });
    refreshWalletInfo();
  } catch (e) {
    document.getElementById('welcomeError').textContent = e.message;
    document.getElementById('welcomeError').classList.remove('hidden');
  }
});

document.getElementById('btnImport').addEventListener('click', async () => {
  document.getElementById('welcomeError').classList.add('hidden');
  const wif = document.getElementById('importWif').value.trim();
  if (!wif) {
    document.getElementById('welcomeError').textContent = 'Paste your WIF private key (e.g. from ddacoin genaddress)';
    document.getElementById('welcomeError').classList.remove('hidden');
    return;
  }
  try {
    await api('/wallet/import', { method: 'POST', body: JSON.stringify({ wif }) });
    document.getElementById('importWif').value = '';
    refreshWalletInfo();
  } catch (e) {
    document.getElementById('welcomeError').textContent = e.message;
    document.getElementById('welcomeError').classList.remove('hidden');
  }
});

document.getElementById('btnGoDashboard').addEventListener('click', () => {
  show('pageDashboard');
  refreshWalletInfo();
});

document.getElementById('btnSend').addEventListener('click', async () => {
  const to = document.getElementById('sendTo').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  document.getElementById('sendError').classList.add('hidden');
  document.getElementById('sendSuccess').classList.add('hidden');
  if (!to || !amount) {
    document.getElementById('sendError').textContent = 'Enter address and amount';
    document.getElementById('sendError').classList.remove('hidden');
    return;
  }
  try {
    const d = await api('/wallet/send', {
      method: 'POST',
      body: JSON.stringify({ toAddress: to, amount }),
    });
    document.getElementById('sendSuccess').textContent = `Sent. TX: ${d.txid}`;
    document.getElementById('sendSuccess').classList.remove('hidden');
    document.getElementById('sendTo').value = '';
    document.getElementById('sendAmount').value = '';
    refreshWalletInfo();
  } catch (e) {
    document.getElementById('sendError').textContent = e.message;
    document.getElementById('sendError').classList.remove('hidden');
  }
});

refreshWalletInfo();
