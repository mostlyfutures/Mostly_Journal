import { Database } from "@tableland/sdk";
import { Note, Folder, CreateNoteInput, CreateFolderInput, UpdateNoteInput } from "./types";

// Initialize Tableland database connection
export const db = new Database({
  chainId: parseInt(process.env.NEXT_PUBLIC_TABLELAND_CHAIN_ID || "80002"),
});

// Table names will be dynamically generated based on user address
export const getTableNames = (address: `0x${string}`) => ({
  notes: `notes_${address.slice(2).toLowerCase()}`,
  folders: `folders_${address.slice(2).toLowerCase()}`,
});

// Create tables for a new user
export const createUserTables = async (address: `0x${string}`) => {
  const tableNames = getTableNames(address);

  // Create notes table
  const notesStatement = `
    CREATE TABLE ${tableNames.notes} (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      folder_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      owner_address TEXT NOT NULL
    );
  `;

  // Create folders table
  const foldersStatement = `
    CREATE TABLE ${tableNames.folders} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT NOT NULL,
      owner_address TEXT NOT NULL
    );
  `;

  try {
    await db.prepare(notesStatement).run();
    await db.prepare(foldersStatement).run();
    console.log("Tables created successfully for user:", address);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

// Notes CRUD operations
export const notesService = {
  // Get all notes for a user
  async getNotes(address: `0x${string}`): Promise<Note[]> {
    const { notes } = getTableNames(address);
    const { results } = await db.prepare(`SELECT * FROM ${notes} ORDER BY updated_at DESC`).all();
    return results as Note[];
  },

  // Get notes in a specific folder
  async getNotesByFolder(address: `0x${string}`, folderId: string | null): Promise<Note[]> {
    const { notes } = getTableNames(address);
    const condition = folderId ? `folder_id = '${folderId}'` : `folder_id IS NULL`;
    const { results } = await db.prepare(`SELECT * FROM ${notes} WHERE ${condition} ORDER BY updated_at DESC`).all();
    return results as Note[];
  },

  // Create a new note
  async createNote(address: `0x${string}`, noteData: CreateNoteInput): Promise<Note> {
    const { notes } = getTableNames(address);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const note: Note = {
      id,
      title: noteData.title,
      content: noteData.content,
      folder_id: noteData.folder_id,
      created_at: now,
      updated_at: now,
      owner_address: address,
    };

    await db.prepare(`
      INSERT INTO ${notes} (id, title, content, folder_id, created_at, updated_at, owner_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(note.id, note.title, note.content, note.folder_id, note.created_at, note.updated_at, note.owner_address).run();

    return note;
  },

  // Update a note
  async updateNote(address: `0x${string}`, updateData: UpdateNoteInput): Promise<Note> {
    const { notes } = getTableNames(address);
    const now = new Date().toISOString();
    
    const updateFields = [];
    const values = [];
    
    if (updateData.title !== undefined) {
      updateFields.push("title = ?");
      values.push(updateData.title);
    }
    if (updateData.content !== undefined) {
      updateFields.push("content = ?");
      values.push(updateData.content);
    }
    if (updateData.folder_id !== undefined) {
      updateFields.push("folder_id = ?");
      values.push(updateData.folder_id);
    }
    
    updateFields.push("updated_at = ?");
    values.push(now);
    values.push(updateData.id);

    await db.prepare(`
      UPDATE ${notes} SET ${updateFields.join(", ")} WHERE id = ?
    `).bind(...values).run();

    // Return updated note
    const { results } = await db.prepare(`SELECT * FROM ${notes} WHERE id = ?`).bind(updateData.id).all();
    return results[0] as Note;
  },

  // Delete a note
  async deleteNote(address: `0x${string}`, noteId: string): Promise<void> {
    const { notes } = getTableNames(address);
    await db.prepare(`DELETE FROM ${notes} WHERE id = ?`).bind(noteId).run();
  },
};

// Folders CRUD operations
export const foldersService = {
  // Get all folders for a user
  async getFolders(address: `0x${string}`): Promise<Folder[]> {
    const { folders } = getTableNames(address);
    const { results } = await db.prepare(`SELECT * FROM ${folders} ORDER BY name ASC`).all();
    return results as Folder[];
  },

  // Create a new folder
  async createFolder(address: `0x${string}`, folderData: CreateFolderInput): Promise<Folder> {
    const { folders } = getTableNames(address);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const folder: Folder = {
      id,
      name: folderData.name,
      parent_id: folderData.parent_id,
      created_at: now,
      owner_address: address,
    };

    await db.prepare(`
      INSERT INTO ${folders} (id, name, parent_id, created_at, owner_address)
      VALUES (?, ?, ?, ?, ?)
    `).bind(folder.id, folder.name, folder.parent_id, folder.created_at, folder.owner_address).run();

    return folder;
  },

  // Delete a folder (and move its contents to parent or root)
  async deleteFolder(address: `0x${string}`, folderId: string): Promise<void> {
    const { folders, notes } = getTableNames(address);
    
    // Get folder to be deleted
    const { results } = await db.prepare(`SELECT * FROM ${folders} WHERE id = ?`).bind(folderId).all();
    const folder = results[0] as Folder;
    
    if (!folder) return;

    // Move notes from this folder to its parent (or root if no parent)
    await db.prepare(`
      UPDATE ${notes} SET folder_id = ? WHERE folder_id = ?
    `).bind(folder.parent_id, folderId).run();

    // Move subfolders to parent (or root if no parent)
    await db.prepare(`
      UPDATE ${folders} SET parent_id = ? WHERE parent_id = ?
    `).bind(folder.parent_id, folderId).run();

    // Delete the folder
    await db.prepare(`DELETE FROM ${folders} WHERE id = ?`).bind(folderId).run();
  },
};
