import initSqlJs from "sql.js";

const DB_NAME = "PetAdoptionSQLiteDB";
const STORE_NAME = "sqlite_files";
const DB_KEY = "pets.sqlite";

/**
 * Save SQLite binary array to IndexedDB
 */
function saveDbToIndexedDB(uint8Array) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(uint8Array, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

/**
 * Load SQLite binary array from IndexedDB
 */
function loadDbFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(DB_KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = (err) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

let dbInstance = null;

/**
 * Initialize SQLite Wasm database
 */
export async function initDatabase(seedPets = []) {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    });

    const savedData = await loadDbFromIndexedDB();
    if (savedData && savedData.length > 0) {
      dbInstance = new SQL.Database(savedData);
    } else {
      dbInstance = new SQL.Database();
    }

    // Create pets table if it doesn't exist
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        photo TEXT,
        video TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check row count
    const stmt = dbInstance.prepare("SELECT COUNT(*) as count FROM pets");
    let count = 0;
    if (stmt.step()) {
      count = stmt.getAsObject().count;
    }
    stmt.free();

    // Seed data if empty
    if (count === 0 && seedPets.length > 0) {
      const insertStmt = dbInstance.prepare(`
        INSERT INTO pets (id, name, category, status, description, photo, video)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const pet of seedPets) {
        insertStmt.run([
          pet.id,
          pet.name,
          pet.category,
          pet.status,
          pet.description,
          pet.photo || null,
          pet.video || null,
        ]);
      }
      insertStmt.free();
      await saveDatabase();
    }

    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize SQLite database:", error);
    throw error;
  }
}

/**
 * Export database instance to persistent IndexedDB storage
 */
export async function saveDatabase() {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  await saveDbToIndexedDB(binaryArray);
}

/**
 * Query all pets from SQLite table
 */
export function getAllPetsFromDB() {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(
    "SELECT id, name, category, status, description, photo, video FROM pets ORDER BY created_at DESC"
  );
  const pets = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    pets.push(row);
  }
  stmt.free();
  return pets;
}

/**
 * Insert new pet row into SQLite table
 */
export async function addPetToDB(pet) {
  if (!dbInstance) return;
  const stmt = dbInstance.prepare(`
    INSERT OR REPLACE INTO pets (id, name, category, status, description, photo, video)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    pet.id,
    pet.name,
    pet.category,
    pet.status,
    pet.description,
    pet.photo || null,
    pet.video || null,
  ]);
  stmt.free();
  await saveDatabase();
}

/**
 * Update existing pet row in SQLite table
 */
export async function updatePetInDB(pet) {
  if (!dbInstance) return;
  const stmt = dbInstance.prepare(`
    UPDATE pets
    SET name = ?, category = ?, status = ?, description = ?, photo = ?, video = ?
    WHERE id = ?
  `);
  stmt.run([
    pet.name,
    pet.category,
    pet.status,
    pet.description,
    pet.photo || null,
    pet.video || null,
    pet.id,
  ]);
  stmt.free();
  await saveDatabase();
}

/**
 * Delete pet row from SQLite table
 */
export async function deletePetFromDB(id) {
  if (!dbInstance) return;
  const stmt = dbInstance.prepare("DELETE FROM pets WHERE id = ?");
  stmt.run([id]);
  stmt.free();
  await saveDatabase();
}

/**
 * Reset database to seed pets
 */
export async function resetDatabase(seedPets = []) {
  if (!dbInstance) return;
  dbInstance.run("DROP TABLE IF EXISTS pets;");
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      photo TEXT,
      video TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  if (seedPets.length > 0) {
    const insertStmt = dbInstance.prepare(`
      INSERT INTO pets (id, name, category, status, description, photo, video)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const pet of seedPets) {
      insertStmt.run([
        pet.id,
        pet.name,
        pet.category,
        pet.status,
        pet.description,
        pet.photo || null,
        pet.video || null,
      ]);
    }
    insertStmt.free();
  }
  await saveDatabase();
}
