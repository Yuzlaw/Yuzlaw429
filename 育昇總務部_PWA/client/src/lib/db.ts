/**
 * IndexedDB 本地資料庫管理
 * 用於儲存筆記、資料夾、標籤等資料
 */

export interface Note {
  id?: number;
  title: string;
  content: string;
  folderId?: number;
  tags?: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id?: number;
  name: string;
  icon: string;
  createdAt: string;
}

export interface Tag {
  id?: number;
  name: string;
  color: string;
  createdAt: string;
}

class NotesDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'YuzXingDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 建立筆記表
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('folderId', 'folderId', { unique: false });
          notesStore.createIndex('isPinned', 'isPinned', { unique: false });
          notesStore.createIndex('isDeleted', 'isDeleted', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 建立資料夾表
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
        }

        // 建立標籤表
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // ===== 筆記操作 =====
  async getAllNotes(): Promise<Note[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onsuccess = () => {
        const allNotes = request.result as Note[];
        // 過濾掉已刪除的筆記
        const activeNotes = allNotes.filter(note => !note.isDeleted);
        resolve(activeNotes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getNote(id: number): Promise<Note | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addNote(note: Omit<Note, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.add(note);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateNote(id: number, note: Partial<Note>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingNote = getRequest.result;
        if (!existingNote) {
          reject(new Error('Note not found'));
          return;
        }

        const updatedNote = { ...existingNote, ...note, id, updatedAt: new Date().toISOString() };
        const updateRequest = store.put(updatedNote);

        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteNote(id: number): Promise<void> {
    // 軟刪除：標記為已刪除，不立即永久刪除
    if (!this.db) await this.init();
    return this.updateNote(id, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
  }

  async getDeletedNotes(): Promise<Note[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onsuccess = () => {
        const allNotes = request.result as Note[];
        const deletedNotes = allNotes.filter(note => note.isDeleted);
        resolve(deletedNotes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async restoreNote(id: number): Promise<void> {
    if (!this.db) await this.init();
    return this.updateNote(id, {
      isDeleted: false,
      deletedAt: undefined
    });
  }

  async permanentlyDeleteNote(id: number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async emptyTrash(): Promise<void> {
    if (!this.db) await this.init();
    const deletedNotes = await this.getDeletedNotes();
    for (const note of deletedNotes) {
      await this.permanentlyDeleteNote(note.id!);
    }
  }

  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    const lowerQuery = query.toLowerCase();
    return allNotes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }

  async importNotes(notes: Omit<Note, 'id'>[]): Promise<void> {
    if (!this.db) await this.init();
    for (const note of notes) {
      await this.addNote(note);
    }
  }

  // ===== 資料夾操作 =====
  async getAllFolders(): Promise<Folder[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['folders'], 'readonly');
      const store = transaction.objectStore('folders');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as Folder[]);
      request.onerror = () => reject(request.error);
    });
  }

  async addFolder(folder: Omit<Folder, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['folders'], 'readwrite');
      const store = transaction.objectStore('folders');
      const request = store.add(folder);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFolder(id: number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['folders'], 'readwrite');
      const store = transaction.objectStore('folders');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 標籤操作 =====
  async getAllTags(): Promise<Tag[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readonly');
      const store = transaction.objectStore('tags');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as Tag[]);
      request.onerror = () => reject(request.error);
    });
  }

  async addTag(tag: Omit<Tag, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');
      const request = store.add(tag);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTag(id: number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 匯出功能 =====
  async exportToJSON(): Promise<string> {
    if (!this.db) await this.init();
    const notes = await this.getAllNotes();
    const folders = await this.getAllFolders();
    const tags = await this.getAllTags();
    
    const data = {
      notes,
      folders,
      tags,
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  async exportNotesToArray(): Promise<Note[]> {
    if (!this.db) await this.init();
    return this.getAllNotes();
  }
}

export const notesDB = new NotesDB();
