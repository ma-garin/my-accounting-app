(function (window) {
  const APP_VERSION = 'v2.16';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HISTORY_LIMIT = 50;

  const KEYS = {
    profiles: 'store_profiles',
    activeProfileId: 'active_store_profile_id',
    session: 'active_visit_session',
    history: 'accounting_history',
    simulations: 'saved_simulations',
    preferences: 'app_preferences',
  };

  const defaultProfile = {
    id: 'default_lounge',
    name: '標準ラウンジ',
    setMinutes: 40,
    firstSetPrice: 2500,
    extensionSetPrice: 3000,
    serviceRate: 0.10,
    taxRate: 0.10,
    drinks: [
      { id: 'ldrink', name: 'Lドリンク', price: 1700, type: 'main', note: '' },
      { id: 'megadrink', name: 'メガドリンク', price: 3700, type: 'main', note: '' },
      { id: 'shot', name: 'SHOT', price: 1500, type: 'other', note: '' },
      { id: 'guestshot', name: 'ゲストSHOT', price: 1000, type: 'other', note: '' },
      { id: 'karaoke', name: 'カラオケ5曲', price: 1000, type: 'other', note: '' },
    ],
    champagnes: [
      { id: 'ldc', name: 'LDC シャンパン', price: 20000, note: '' },
      { id: 'ldc_hikari', name: 'LDC 光シャンパン', price: 50000, note: '' },
      { id: 'veuve_y', name: 'ヴーヴクリコ イエロー', price: 26000, note: '' },
      { id: 'veuve_w', name: 'ヴーヴクリコ ホワイト', price: 28000, note: '' },
      { id: 'veuve_r', name: 'ヴーヴクリコ リッチ', price: 37000, note: '' },
      { id: 'veuve_r0', name: 'ヴーヴクリコ リッチゼロ', price: 40000, note: '' },
      { id: 'lambo_y', name: 'ランボルギーニ イエロー', price: 25000, note: '' },
      { id: 'lambo_o', name: 'ランボルギーニ オレンジ', price: 45000, note: '' },
      { id: 'lambo_p', name: 'ランボルギーニ プラチナ', price: 65000, note: '' },
      { id: 'lambo_l', name: 'ランボルギーニ ルミナス', price: 120000, note: '' },
      { id: 'moet_ice', name: 'モエシャンドン アイス', price: 30000, note: '' },
      { id: 'moet_rose', name: 'モエシャンドン アイスロゼ', price: 35000, note: '' },
      { id: 'armand', name: 'アルマンド ゴールド', price: 150000, note: '' },
      { id: 'soumai', name: 'ソウメイ 白', price: 65000, note: '' },
      { id: 'angel_b', name: 'エンジェル ブラック', price: 120000, note: '' },
      { id: 'angel_w', name: 'エンジェル ホワイト', price: 200000, note: '' },
      { id: 'belle', name: 'ペリエジュエベルエポック 白', price: 80000, note: '' },
      { id: 'diva', name: 'ディーバ ピーチ／ベリー', price: 10000, note: '' },
      { id: 'non_1688', name: 'ノンアルコール 1688', price: 20000, note: '' },
      { id: 'non_shanmei', name: 'ノンアルコール シャンメイ', price: 10000, note: '' },
    ],
    updatedAt: Date.now(),
    revisions: [],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function mergeProfile(profile) {
    const merged = Object.assign(clone(defaultProfile), profile || {});
    merged.drinks = Array.isArray(profile && profile.drinks) ? profile.drinks : clone(defaultProfile.drinks);
    merged.champagnes = Array.isArray(profile && profile.champagnes) ? profile.champagnes : clone(defaultProfile.champagnes);
    merged.revisions = Array.isArray(profile && profile.revisions) ? profile.revisions : [];
    return merged;
  }

  function ensureProfiles() {
    let profiles = read(KEYS.profiles, null);
    if (!Array.isArray(profiles) || profiles.length === 0) {
      profiles = [clone(defaultProfile)];
      write(KEYS.profiles, profiles);
    } else {
      profiles = profiles.map(mergeProfile);
      write(KEYS.profiles, profiles);
    }
    if (!localStorage.getItem(KEYS.activeProfileId)) {
      localStorage.setItem(KEYS.activeProfileId, profiles[0].id);
    }
    return profiles;
  }

  function getProfiles() {
    return ensureProfiles();
  }

  function saveProfiles(profiles) {
    write(KEYS.profiles, profiles.map(mergeProfile));
  }

  function getActiveProfile() {
    const profiles = ensureProfiles();
    const activeId = localStorage.getItem(KEYS.activeProfileId);
    return profiles.find(p => p.id === activeId) || profiles[0];
  }

  function setActiveProfile(id) {
    localStorage.setItem(KEYS.activeProfileId, id);
  }

  function snapshotProfile(profile) {
    const p = mergeProfile(profile || getActiveProfile());
    return {
      id: p.id,
      name: p.name,
      setMinutes: p.setMinutes,
      firstSetPrice: p.firstSetPrice,
      extensionSetPrice: p.extensionSetPrice,
      serviceRate: p.serviceRate,
      taxRate: p.taxRate,
      drinks: clone(p.drinks),
      champagnes: clone(p.champagnes),
      capturedAt: Date.now(),
    };
  }

  function calculateBill(profile, setCount, quantities, customDefs, champagneQuantities) {
    const p = mergeProfile(profile);
    const sets = Math.max(0, setCount || 0);
    const setTotal = sets >= 1 ? p.firstSetPrice + Math.max(0, sets - 1) * p.extensionSetPrice : 0;
    let drinkTotal = 0;
    const rows = [];

    p.drinks.forEach(d => {
      const qty = Math.max(0, quantities && quantities[d.id] ? quantities[d.id] : 0);
      if (qty > 0) rows.push({ id: d.id, name: d.name, price: d.price, qty, kind: 'drink' });
      drinkTotal += d.price * qty;
    });
    Object.values(customDefs || {}).forEach(d => {
      const qty = Math.max(0, quantities && quantities[d.id] ? quantities[d.id] : 0);
      const price = Math.max(0, Number(d.price) || 0);
      if (qty > 0) rows.push({ id: d.id, name: d.name || 'カスタム', price, qty, kind: 'custom' });
      drinkTotal += price * qty;
    });
    p.champagnes.forEach(ch => {
      const qty = Math.max(0, champagneQuantities && champagneQuantities[ch.id] ? champagneQuantities[ch.id] : 0);
      if (qty > 0) rows.push({ id: ch.id, name: ch.name, price: ch.price, qty, kind: 'champagne' });
      drinkTotal += ch.price * qty;
    });

    const subtotal = setTotal + drinkTotal;
    const service = Math.floor(subtotal * p.serviceRate);
    const tax = Math.floor((subtotal + service) * p.taxRate);
    const total = Math.round((subtotal + service + tax) / 100) * 100;
    return { total, setTotal, drinkTotal, subtotal, service, tax, setCount: sets, rows };
  }

  function migrateHistory() {
    const raw = read(KEYS.history, []);
    if (!Array.isArray(raw)) return [];
    const migrated = raw.map(rec => {
      if (rec && rec.version === APP_VERSION) return rec;
      return {
        id: rec.id || `hist_${rec.timestamp || Date.now()}_${Math.random().toString(16).slice(2)}`,
        version: APP_VERSION,
        timestamp: rec.timestamp || Date.now(),
        total: Number(rec.total) || 0,
        predictedTotal: Number(rec.predictedTotal || rec.total) || 0,
        actualTotal: Number(rec.actualTotal || rec.total) || 0,
        difference: Number(rec.difference) || 0,
        sets: Number(rec.sets || rec.setCount) || 0,
        drinkTotal: Number(rec.drinkTotal) || 0,
        storeName: rec.storeName || (rec.profileSnapshot && rec.profileSnapshot.name) || '未設定',
        castName: rec.castName || '',
        nominated: Boolean(rec.nominated),
        satisfaction: rec.satisfaction || '',
        memo: rec.memo || '',
        profileSnapshot: rec.profileSnapshot || snapshotProfile(),
        items: rec.items || [],
      };
    }).slice(-HISTORY_LIMIT);
    write(KEYS.history, migrated);
    return migrated;
  }

  function saveSession(session) {
    write(KEYS.session, Object.assign({}, session, { savedAt: Date.now(), version: APP_VERSION }));
  }

  function loadSession() {
    const session = read(KEYS.session, null);
    if (!session || !session.savedAt || Date.now() - session.savedAt > DAY_MS) return null;
    return session;
  }

  function clearSession() {
    localStorage.removeItem(KEYS.session);
  }

  function getPreferences() {
    const prefs = read(KEYS.preferences, {});
    return Object.assign({ theme: 'lounge-dark', launchView: 'accounting', privateNotesCollapsed: true }, prefs || {});
  }

  window.AppCore = {
    APP_VERSION,
    KEYS,
    DAY_MS,
    HISTORY_LIMIT,
    defaultProfile,
    read,
    write,
    clone,
    getProfiles,
    saveProfiles,
    getActiveProfile,
    setActiveProfile,
    snapshotProfile,
    calculateBill,
    migrateHistory,
    saveSession,
    loadSession,
    clearSession,
    getPreferences,
  };
})(window);
