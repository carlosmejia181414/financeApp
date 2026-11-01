/*
 * Capa de datos local de Mi Balance.
 * Reemplaza a server.js: mismas reglas, pero guarda db.json en el almacenamiento
 * privado de la app (Android/iOS). En un navegador normal usa localStorage (solo para pruebas).
 */
(function () {
  const DB_FILE = "db.json";
  const BAK_FILE = "db.bak.json";
  const LS_KEY = "mibalance_db";

  const SEED = {
    categories: [
      { id: "cat_salary", name: "Salario", kind: "income" },
      { id: "cat_extra_income", name: "Ingreso extra", kind: "income" },
      { id: "cat_rent", name: "Renta", kind: "fixed" },
      { id: "cat_internet", name: "Internet", kind: "fixed" },
      { id: "cat_phone", name: "Celular", kind: "fixed" },
      { id: "cat_food", name: "Comida", kind: "variable" },
      { id: "cat_transport", name: "Gasolina", kind: "variable" },
      { id: "cat_health", name: "Salud", kind: "variable" },
      { id: "4d23f23c-104b-4917-bc94-f6a92e5bc3c7", name: "Mascota", kind: "variable" }
    ],
    transactions: []
  };

  const isNative = () =>
    !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const FS = () => window.Capacitor.Plugins.Filesystem;

  const newId = () =>
    (crypto.randomUUID ? crypto.randomUUID() : "id_" + Date.now() + "_" + Math.random().toString(16).slice(2));

  let db = null;
  let queue = Promise.resolve();

  async function readFile(path) {
    const res = await FS().readFile({ path, directory: "DATA", encoding: "utf8" });
    return res.data;
  }

  async function writeFile(path, data) {
    await FS().writeFile({ path, directory: "DATA", encoding: "utf8", data, recursive: true });
  }

  function normalize(raw) {
    const out = {
      categories: Array.isArray(raw && raw.categories) ? raw.categories : JSON.parse(JSON.stringify(SEED.categories)),
      transactions: Array.isArray(raw && raw.transactions) ? raw.transactions : []
    };
    return out;
  }

  async function load() {
    if (db) return db;

    if (!isNative()) {
      try {
        const saved = localStorage.getItem(LS_KEY);
        db = saved ? normalize(JSON.parse(saved)) : JSON.parse(JSON.stringify(SEED));
      } catch (e) {
        db = JSON.parse(JSON.stringify(SEED));
      }
      return db;
    }

    for (const file of [DB_FILE, BAK_FILE]) {
      try {
        db = normalize(JSON.parse(await readFile(file)));
        return db;
      } catch (e) {
        /* intenta con el siguiente archivo */
      }
    }

    db = JSON.parse(JSON.stringify(SEED));
    await persist();
    return db;
  }

  // Guarda en cola (una escritura a la vez). Primero el respaldo y luego el archivo principal,
  // así siempre queda al menos una copia completa aunque el teléfono se apague a mitad de la escritura.
  function persist() {
    const snapshot = JSON.stringify(db, null, 2);
    queue = queue.then(async () => {
      if (!isNative()) {
        localStorage.setItem(LS_KEY, snapshot);
        return;
      }
      await writeFile(BAK_FILE, snapshot);
      await writeFile(DB_FILE, snapshot);
    });
    return queue;
  }

  const clone = obj => JSON.parse(JSON.stringify(obj));

  async function getDB() {
    return clone(await load());
  }

  async function createTransaction(t) {
    await load();
    const tx = {
      id: newId(),
      date: t.date,
      type: t.type,
      categoryId: t.categoryId,
      amount: Number(t.amount),
      description: t.description || "",
      parentRecurringId: t.parentRecurringId || null,
      overrideYear: Number.isInteger(t.overrideYear) ? t.overrideYear : null,
      overrideMonth: Number.isInteger(t.overrideMonth) ? t.overrideMonth : null
    };
    db.transactions.push(tx);
    await persist();
    return clone(tx);
  }

  async function updateTransaction(id, u) {
    await load();
    db.transactions = db.transactions.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        date: u.date,
        type: u.type,
        categoryId: u.categoryId,
        amount: Number(u.amount),
        description: u.description || "",
        parentRecurringId: u.parentRecurringId || t.parentRecurringId || null,
        overrideYear: Number.isInteger(u.overrideYear) ? u.overrideYear : (Number.isInteger(t.overrideYear) ? t.overrideYear : null),
        overrideMonth: Number.isInteger(u.overrideMonth) ? u.overrideMonth : (Number.isInteger(t.overrideMonth) ? t.overrideMonth : null)
      };
    });
    await persist();
    return clone(db.transactions.find(t => t.id === id));
  }

  async function deleteTransaction(id) {
    await load();
    db.transactions = db.transactions.filter(t => t.id !== id);
    await persist();
    return { success: true };
  }

  async function createCategory(c) {
    await load();
    if (!c.name || !c.name.trim() || !c.kind) {
      throw new Error("Debes ingresar nombre y tipo de categoría.");
    }
    const name = c.name.trim();
    const exists = db.categories.some(
      x => x.name.toLowerCase() === name.toLowerCase() && x.kind === c.kind
    );
    if (exists) throw new Error("Ya existe una categoría con ese nombre y tipo.");

    const cat = { id: newId(), name, kind: c.kind };
    db.categories.push(cat);
    await persist();
    return clone(cat);
  }

  async function updateCategory(id, u) {
    await load();
    if (!u.name || !u.name.trim() || !u.kind) {
      throw new Error("Debes ingresar nombre y tipo de categoría.");
    }
    const name = u.name.trim();
    const duplicate = db.categories.some(
      x => x.id !== id && x.name.toLowerCase() === name.toLowerCase() && x.kind === u.kind
    );
    if (duplicate) throw new Error("Ya existe otra categoría con ese nombre y tipo.");

    db.categories = db.categories.map(x => (x.id === id ? { ...x, name, kind: u.kind } : x));
    db.transactions = db.transactions.map(t => (t.categoryId === id ? { ...t, type: u.kind } : t));
    await persist();
    return clone(db.categories.find(x => x.id === id));
  }

  async function deleteCategory(id) {
    await load();
    if (db.transactions.some(t => t.categoryId === id)) {
      throw new Error("No puedes eliminar esta categoría porque tiene movimientos registrados.");
    }
    db.categories = db.categories.filter(x => x.id !== id);
    await persist();
    return { success: true };
  }

  // Reemplaza toda la base con un respaldo importado (valida la estructura primero).
  async function importDB(raw) {
    if (!raw || !Array.isArray(raw.categories) || !Array.isArray(raw.transactions)) {
      throw new Error("El archivo no tiene el formato de respaldo de Mi Balance.");
    }
    db = normalize(raw);
    await persist();
    return clone(db);
  }

  window.Data = {
    isNative,
    getDB,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    updateCategory,
    deleteCategory,
    importDB
  };
})();
