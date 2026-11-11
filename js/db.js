/* طبقة التخزين المحلي (IndexedDB) — كل شيء يعمل بدون إنترنت */
(function () {
  const DB_NAME = 'maktaba-sunnah';
  const VERSION = 1;
  const USER_STORES = ['bookmarks', 'notes', 'comments', 'srs', 'review'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('items')) {
          const s = db.createObjectStore('items', { keyPath: 'id' });
          s.createIndex('bookId', 'bookId');
          s.createIndex('ref', 'ref', { multiEntry: true });     // روابط: شرح←حديث، تفسير←آية
          s.createIndex('narrators', 'narrators', { multiEntry: true });
        }
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        for (const name of USER_STORES) {
          if (!db.objectStoreNames.contains(name)) {
            const s = db.createObjectStore(name, { keyPath: 'id' });
            if (name !== 'srs' && name !== 'review') s.createIndex('itemId', 'itemId');
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function wrap(req) {
    return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  }

  async function tx(store, mode = 'readonly') {
    const db = await open();
    return db.transaction(store, mode).objectStore(store);
  }

  const DB = {
    open,
    async get(store, key) { return wrap((await tx(store)).get(key)); },
    async all(store) { return wrap((await tx(store)).getAll()); },
    async put(store, val) { return wrap((await tx(store, 'readwrite')).put(val)); },
    async del(store, key) { return wrap((await tx(store, 'readwrite')).delete(key)); },
    async byIndex(store, index, value) { return wrap((await tx(store)).index(index).getAll(value)); },
    async count(store, index, value) {
      const s = await tx(store);
      return wrap(index ? s.index(index).count(value) : s.count());
    },
    async putMany(store, list, onProgress) {
      const db = await open();
      const CHUNK = 2000;
      for (let i = 0; i < list.length; i += CHUNK) {
        await new Promise((res, rej) => {
          const t = db.transaction(store, 'readwrite');
          const s = t.objectStore(store);
          for (const v of list.slice(i, i + CHUNK)) s.put(v);
          t.oncomplete = res; t.onerror = () => rej(t.error);
        });
        onProgress && onProgress(Math.min(i + CHUNK, list.length), list.length);
      }
    },
    async deleteBook(bookId) {
      const db = await open();
      await new Promise((res, rej) => {
        const t = db.transaction(['items', 'books'], 'readwrite');
        const idx = t.objectStore('items').index('bookId');
        idx.openKeyCursor(IDBKeyRange.only(bookId)).onsuccess = e => {
          const c = e.target.result;
          if (c) { t.objectStore('items').delete(c.primaryKey); c.continue(); }
        };
        t.objectStore('books').delete(bookId);
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
      DB.invalidate();
    },
    // مرور على كل العناصر (للبحث)
    async each(store, fn) {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(store);
        const req = t.objectStore(store).openCursor();
        req.onsuccess = e => {
          const c = e.target.result;
          if (!c) return res();
          if (fn(c.value) === false) return res();
          c.continue();
        };
        req.onerror = () => rej(req.error);
      });
    },
    async setting(key, value) {
      if (value === undefined) { const r = await DB.get('settings', key); return r ? r.value : undefined; }
      return DB.put('settings', { key, value });
    },
    // فهرس البحث في الذاكرة (يبنى مرة واحدة ويحدث بعد الاستيراد)
    _index: null,
    invalidate() { DB._index = null; },
    async searchIndex() {
      if (DB._index) return DB._index;
      const idx = [];
      await DB.each('items', it => {
        const heavy = DB.HEAVY.includes(it.type);
        idx.push({
          id: it.id, bookId: it.bookId, type: it.type, heavy,
          n: heavy ? (it.n || '').slice(0, 300) : (it.n || ''), t: AR.normalize((it.title || '') + ' ' + (it.bab || '') + ' ' + (it.kitab || '') + ' ' + (it.topics || []).join(' ')),
          topics: it.topics || [], hukm: it.hukm || [], grade: it.gradeClass || '', pn: it.printedNum || 0, num: it.num || 0, narrators: it.narrators || [], schools: it.schools || []
        });
      });
      DB._index = idx;
      return idx;
    },
    USER_STORES,
    HEAVY: ['sharh', 'tafsir', 'section'],
    // بحث عميق داخل نصوص الكتب الكبيرة (الشروح والتفاسير والمطولات) — يمر على الكتب المحددة واحداً واحداً
    async deepScan(bookIds, test, onBook) {
      const db = await open(); const out = [];
      for (const bid of bookIds) {
        onBook && onBook(bid);
        await new Promise((res, rej) => {
          const req = db.transaction('items').objectStore('items').index('bookId').openCursor(IDBKeyRange.only(bid));
          req.onsuccess = e => { const c = e.target.result; if (!c) return res(); const sc = test(c.value); if (sc) out.push({ id: c.value.id, type: c.value.type, bookId: bid, score: sc }); c.continue(); };
          req.onerror = () => rej(req.error);
        });
      }
      return out;
    },
    async exportUserData() {
      const out = { app: 'maktaba-sunnah', kind: 'user-backup', date: new Date().toISOString() };
      for (const s of USER_STORES) out[s] = await DB.all(s);
      out.settings = await DB.all('settings');
      return out;
    },
    async importUserData(data) {
      for (const s of USER_STORES) if (Array.isArray(data[s])) await DB.putMany(s, data[s]);
      if (Array.isArray(data.settings)) await DB.putMany('settings', data.settings);
    }
  };

  window.DB = DB;
})();
