# Development Workflow

This document provides an exact, step-by-step integration flow for building a decentralized journal app using Next.js with TypeScript, following MVC (Model-View-Controller) program structure patterns. Models handle data entities and DA logic (Tableland), Views are React components for UI rendering, and Controllers are hooks/services orchestrating interactions. The flow assumes a fresh Next.js TS project (`npx create-next-app@latest my-journal-app --ts --eslint --tailwind --src-dir --app --import-alias "@/*"`), with dependencies installed (`npm install @privy-io/react-auth @siwe/viem viem @tableland/sdk @tanstack/react-query zustand`). Use Polygon Amoy testnet for Tableland. All file paths are relative to `my-journal-app/`. Run `npm run dev` throughout for live testing. Commit after each step with `git add . && git commit -m "Step X complete"`. Deploy to Vercel only at the end. Total time: ~4-6 hours.

## Step 1: Bootstrap Project Structure and Global State (MVC Infrastructure Layer - 20 mins)
1. **Create Directory Structure**:
   - Run `mkdir -p src/{lib,components,hooks,services}`.
   - Create empty files: `src/lib/store.ts`, `src/lib/types.ts`, `src/lib/auth.ts`, `src/lib/tableland.ts`, `src/components/AuthButton.tsx`, `src/components/NoteEditor.tsx`, `src/components/FolderTree.tsx`, `src/components/NoteList.tsx`, `src/hooks/useDb.ts`, `src/hooks/useNotes.ts`, `src/services/noteService.ts`.
2. **Set Up Global State (Model)**:
   - In `src/lib/store.ts`:
     ```ts
     import { create } from 'zustand';

     interface UserStore {
       address: `0x${string}` | null;
       setAddress: (address: `0x${string}`) => void;
     }

     export const useUserStore = create<UserStore>((set) => ({
       address: null,
       setAddress: (address) => set({ address }),
     }));
     ```
3. **Configure Environment**:
   - In `.env.local`:
     ```
     NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here_from_privy_dashboard
     NEXT_PUBLIC_TABLELAND_CHAIN_ID=80002
     ```
   - Get `PRIVY_APP_ID` from [privy.io dashboard](https://privy.io).
4. **Test State**:
   - In `src/app/page.tsx`, replace default content:
     ```ts
     'use client';
     import { useUserStore } from '@/lib/store';

     export default function Home() {
       const { address, setAddress } = useUserStore();
       return (
         <main>
           <button onClick={() => setAddress('0x1234567890abcdef1234567890abcdef12345678')}>
             Set Mock Address
           </button>
           <p>Address: {address || 'Not set'}</p>
         </main>
       );
     }
     ```
   - Open `http://localhost:3000`, click button, verify address logs to console. Revert `page.tsx` to empty `<main></main>` after test.
5. **Commit**: `git commit -m "Step 1: Project setup and state"`.

## Step 2: Authentication (Auth Model and Controller - 45 mins)
1. **Set Up Privy Provider (Controller)**:
   - In `src/app/layout.tsx`:
     ```ts
     import type { Metadata } from 'next';
     import { Inter } from 'next/font/google';
     import './globals.css';
     import { PrivyProvider } from '@privy-io/react-auth';

     const inter = Inter({ subsets: ['latin'] });

     export const metadata: Metadata = {
       title: 'Journal App',
       description: 'Decentralized journal with MetaMask login',
     };

     export default function RootLayout({ children }: { children: React.ReactNode }) {
       return (
         <html lang="en">
           <body className={inter.className}>
             <PrivyProvider
               appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
               config={{ loginMethods: ['wallet'], appearance: { theme: 'light' } }}
             >
               {children}
             </PrivyProvider>
           </body>
         </html>
       );
     }
     ```
2. **Implement Privy/SIWE Toggle (Controller)**:
   - In `src/lib/auth.ts`:
     ```ts
     import { createWalletClient, custom } from 'viem';
     import { polygonAmoy } from 'viem/chains';
     import { generateNonce, SiweMessage } from 'siwe';

     export async function siweLogin(): Promise<{ address: `0x${string}` }> {
       const client = createWalletClient({ chain: polygonAmoy, transport: custom(window.ethereum!) });
       const [address] = await client.requestAddresses();
       const nonce = generateNonce();
       const message = new SiweMessage({
         domain: window.location.host,
         address,
         statement: 'Sign in to Journal App',
         uri: window.location.origin,
         version: '1',
         chainId: polygonAmoy.id,
         nonce,
       }).prepareMessage();
       await client.signMessage({ account: address, message });
       return { address };
     }
     ```
   - In `src/components/AuthButton.tsx`:
     ```ts
     'use client';
     import { usePrivy } from '@privy-io/react-auth';
     import { useState } from 'react';
     import { useUserStore } from '@/lib/store';
     import { siweLogin } from '@/lib/auth';

     export function AuthButton() {
       const { ready, authenticated, login } = usePrivy();
       const { setAddress } = useUserStore();
       const [useSiwe, setUseSiwe] = useState(false);

       const handleLogin = async () => {
         if (useSiwe) {
           const { address } = await siweLogin();
           setAddress(address);
         } else {
           login();
         }
       };

       if (!ready) return <div>Loading...</div>;
       if (authenticated || useUserStore.getState().address) return <div>Logged in</div>;
       return (
         <div className="p-4">
           <button
             className="px-4 py-2 bg-blue-500 text-white rounded"
             onClick={() => setUseSiwe(!useSiwe)}
           >
             Toggle to {useSiwe ? 'Privy' : 'SIWE'}
           </button>
           <button
             className="ml-4 px-4 py-2 bg-green-500 text-white rounded"
             onClick={handleLogin}
           >
             Login
           </button>
         </div>
       );
     }
     ```
3. **Wire Privy to Store**:
   - In `src/app/page.tsx`:
     ```ts
     'use client';
     import { usePrivy } from '@privy-io/react-auth';
     import { useEffect } from 'react';
     import { useUserStore } from '@/lib/store';
     import { AuthButton } from '@/components/AuthButton';

     export default function Home() {
       const { user } = usePrivy();
       const { setAddress } = useUserStore();

       useEffect(() => {
         if (user?.wallet?.address) {
           setAddress(user.wallet.address as `0x${string}`);
         }
       }, [user, setAddress]);

       return (
         <main className="flex min-h-screen flex-col items-center p-24">
           <AuthButton />
         </main>
       );
     }
     ```
4. **Test Auth**:
   - Load `http://localhost:3000`, toggle Privy/SIWE, login with MetaMask (Amoy testnet). Verify address in store (add `<p>Address: {useUserStore().address}</p>` temporarily). Remove debug `<p>` after test.
5. **Commit**: `git commit -m "Step 2: Authentication with Privy/SIWE"`.

## Step 3: Data Access Layer (DA Model - 1 hour)
1. **Define Data Models**:
   - In `src/lib/types.ts`:
     ```ts
     export interface Note {
       id: number;
       content: string;
       title: string;
       parentFolderId: string | null;
       createdAt: number;
     }
     export interface Folder {
       id: number;
       name: string;
       parentId: string | null;
       childrenIds: string[];
     }
     ```
2. **Initialize Tableland**:
   - In `src/lib/tableland.ts`:
     ```ts
     import { Database } from '@tableland/sdk';
     import { createWalletClient, custom } from 'viem';
     import { polygonAmoy } from 'viem/chains';

     export async function getDb(userAddress: `0x${string}`): Promise<Database> {
       const client = createWalletClient({ chain: polygonAmoy, transport: custom(window.ethereum!) });
       const signer = client.extend({ account: userAddress });
       return new Database({ signer });
     }

     export async function createTables(db: Database, userAddress: string) {
       await db
         .prepare(
           `CREATE TABLE notes_${userAddress} (id INTEGER PRIMARY KEY, content TEXT, title TEXT, parentFolderId TEXT, createdAt INTEGER)`
         )
         .run();
       await db
         .prepare(
           `CREATE TABLE folders_${userAddress} (id INTEGER PRIMARY KEY, name TEXT, parentId TEXT, childrenIds TEXT)`
         )
         .run();
     }
     ```
3. **Implement CRUD**:
   - Add to `src/lib/tableland.ts`:
     ```ts
     export async function createNote(db: Database, userAddress: string, note: Omit<Note, 'id' | 'createdAt'>) {
       await db
         .prepare(`INSERT INTO notes_${userAddress} (content, title, parentFolderId, createdAt) VALUES (?, ?, ?, ?)`)
         .bind(note.content, note.title, note.parentFolderId, Date.now())
         .run();
     }

     export async function getNotes(db: Database, userAddress: string, folderId: string | null): Promise<Note[]> {
       const { results } = await db
         .prepare(`SELECT * FROM notes_${userAddress} WHERE parentFolderId ${folderId ? '= ?' : 'IS NULL'}`)
         .bind(folderId)
         .all();
       return results as Note[];
     }

     export async function moveNote(db: Database, userAddress: string, noteId: number, newFolderId: string) {
       await db
         .prepare(`UPDATE notes_${userAddress} SET parentFolderId = ? WHERE id = ?`)
         .bind(newFolderId, noteId)
         .run();
     }

     export async function createFolder(db: Database, userAddress: string, folder: Omit<Folder, 'id' | 'childrenIds'>) {
       await db
         .prepare(`INSERT INTO folders_${userAddress} (name, parentId, childrenIds) VALUES (?, ?, ?)`)
         .bind(folder.name, folder.parentId, JSON.stringify([]))
         .run();
     }

     export async function getFolders(db: Database, userAddress: string): Promise<Folder[]> {
       const { results } = await db.prepare(`SELECT * FROM folders_${userAddress}`).all();
       return results.map((f: any) => ({ ...f, childrenIds: JSON.parse(f.childrenIds) })) as Folder[];
     }
     ```
4. **Test DA**:
   - In `src/app/page.tsx`, temporarily add:
     ```ts
     import { useUserStore } from '@/lib/store';
     import { getDb, createNote } from '@/lib/tableland';

     export default function Home() {
       const { address } = useUserStore();
       const handleTest = async () => {
         if (!address) return;
         const db = await getDb(address);
         await createNote(db, address, { content: 'Test note', title: 'Test', parentFolderId: null });
       };
       return <button onClick={handleTest}>Test Note</button>;
     }
     ```
   - Login, click button, check Tableland dashboard (tableland.xyz) for `notes_<address>` table with entry. Remove test code.
5. **Commit**: `git commit -m "Step 3: Tableland DA setup"`.

## Step 4: User Interface (View Layer - 1.5 hours)
1. **Note Editor Component**:
   - In `src/components/NoteEditor.tsx`:
     ```ts
     'use client';
     import { useState } from 'react';
     import type { Note } from '@/lib/types';

     interface Props {
       note?: Note;
       onSave: (content: string, title: string) => void;
     }

     export function NoteEditor({ note, onSave }: Props) {
       const [content, setContent] = useState(note?.content || '');
       const [title, setTitle] = useState(note?.title || '');

       return (
         <div className="p-4">
           <input
             className="w-full p-2 mb-2 border rounded"
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             placeholder="Note title"
           />
           <textarea
             className="w-full h-64 p-2 border rounded"
             value={content}
             onChange={(e) => setContent(e.target.value)}
             placeholder="Write your note..."
           />
           <button
             className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
             onClick={() => onSave(content, title)}
           >
             Save
           </button>
         </div>
       );
     }
     ```
   - Test: In `page.tsx`, render `<NoteEditor onSave={(c, t) => console.log(c, t)} />`, type, click save, verify console.
2. **Folder Tree Component**:
   - In `src/components/FolderTree.tsx`:
     ```ts
     'use client';
     import { useState } from 'react';
     import type { Folder } from '@/lib/types';

     interface Props {
       folders: Folder[];
       onSelect: (folderId: string) => void;
     }

     export function FolderTree({ folders, onSelect }: Props) {
       const [expanded, setExpanded] = useState<string[]>([]);

       return (
         <ul className="p-4">
           {folders.map((f) => (
             <li key={f.id}>
               <span
                 className="cursor-pointer text-blue-500"
                 onClick={() => {
                   onSelect(f.id.toString());
                   setExpanded((prev) =>
                     prev.includes(f.id.toString())
                       ? prev.filter((id) => id !== f.id.toString())
                       : [...prev, f.id.toString()]
                   );
                 }}
               >
                 {f.name}
               </span>
               {expanded.includes(f.id.toString()) && f.childrenIds.length > 0 && (
                 <FolderTree
                   folders={folders.filter((sub) => f.childrenIds.includes(sub.id.toString()))}
                   onSelect={onSelect}
                 />
               )}
             </li>
           ))}
         </ul>
       );
     }
     ```
   - Test: Pass mock folders `[{ id: 1, name: 'Root', parentId: null, childrenIds: ['2'] }, { id: 2, name: 'Sub', parentId: '1', childrenIds: [] }]`, click, verify selection.
3. **Note List Component**:
   - In `src/components/NoteList.tsx`:
     ```ts
     'use client';
     import type { Note } from '@/lib/types';

     interface Props {
       notes: Note[];
       onSelect: (noteId: number) => void;
     }

     export function NoteList({ notes, onSelect }: Props) {
       return (
         <ul className="p-4">
           {notes.map((n) => (
             <li
               key={n.id}
               className="cursor-pointer text-blue-500"
               onClick={() => onSelect(n.id)}
             >
               {n.title}
             </li>
           ))}
         </ul>
       );
     }
     ```
   - Test: Pass mock notes `[{ id: 1, title: 'Test', content: 'Content', parentFolderId: null, createdAt: Date.now() }]`, click, verify selection.
4. **Commit**: `git commit -m "Step 4: UI components"`.

## Step 5: Integration and Real-Time (Controller and Integration Layer - 1 hour)
1. **Wire DA to UI (Controller)**:
   - In `src/hooks/useDb.ts`:
     ```ts
     'use client';
     import { useEffect, useState } from 'react';
     import { Database } from '@tableland/sdk';
     import { getDb } from '@/lib/tableland';
     import { useUserStore } from '@/lib/store';

     export function useDb() {
       const { address } = useUserStore();
       const [db, setDb] = useState<Database | null>(null);

       useEffect(() => {
         if (!address) return;
         getDb(address).then(setDb);
       }, [address]);

       return db;
     }
     ```
   - In `src/hooks/useNotes.ts`:
     ```ts
     'use client';
     import { useQuery } from '@tanstack/react-query';
     import { getNotes } from '@/lib/tableland';
     import { useDb } from './useDb';
     import { useUserStore } from '@/lib/store';

     export function useNotes(folderId: string | null) {
       const db = useDb();
       const { address } = useUserStore();

       return useQuery({
         queryKey: ['notes', folderId, address],
         queryFn: async () => {
           if (!db || !address) return [];
           return getNotes(db, address, folderId);
         },
         enabled: !!db && !!address,
         refetchInterval: 5000, // Poll every 5s for real-time
       });
     }
     ```
2. **Note Service (Controller)**:
   - In `src/services/noteService.ts`:
     ```ts
     import { Database } from '@tableland/sdk';
     import { createNote, moveNote } from '@/lib/tableland';
     import type { Note } from '@/lib/types';

     export async function saveNote(db: Database, userAddress: string, note: Omit<Note, 'id' | 'createdAt'>) {
       await createNote(db, userAddress, note);
     }

     export async function moveNoteToFolder(db: Database, userAddress: string, noteId: number, folderId: string) {
       await moveNote(db, userAddress, noteId, folderId);
     }
     ```
3. **Integrate in Home Page**:
   - In `src/app/page.tsx`:
     ```ts
     'use client';
     import { usePrivy } from '@privy-io/react-auth';
     import { useEffect, useState } from 'react';
     import { useUserStore } from '@/lib/store';
     import { AuthButton } from '@/components/AuthButton';
     import { NoteEditor } from '@/components/NoteEditor';
     import { NoteList } from '@/components/NoteList';
     import { FolderTree } from '@/components/FolderTree';
     import { useDb } from '@/hooks/useDb';
     import { useNotes } from '@/hooks/useNotes';
     import { saveNote, moveNoteToFolder } from '@/services/noteService';
     import { createFolder, getFolders } from '@/lib/tableland';

     export default function Home() {
       const { user } = usePrivy();
       const { address, setAddress } = useUserStore();
       const db = useDb();
       const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
       const [selectedNote, setSelectedNote] = useState<number | null>(null);
       const { data: notes = [] } = useNotes(selectedFolder);
       const [folders, setFolders] = useState([]);

       useEffect(() => {
         if (user?.wallet?.address) setAddress(user.wallet.address as `0x${string}`);
         if (db && address) {
           getFolders(db, address).then(setFolders);
           createTables(db, address); // Run once per user
         }
       }, [user, db, address, setAddress]);

       const handleSaveNote = async (content: string, title: string) => {
         if (!db || !address) return;
         await saveNote(db, address, { content, title, parentFolderId: selectedFolder });
       };

       const handleCreateFolder = async () => {
         if (!db || !address) return;
         await createFolder(db, address, { name: `Folder ${Date.now()}`, parentId: selectedFolder });
         setFolders(await getFolders(db, address));
       };

       const handleMoveNote = async (noteId: number) => {
         if (!db || !address || !selectedFolder) return;
         await moveNoteToFolder(db, address, noteId, selectedFolder);
       };

       return (
         <main className="flex min-h-screen p-24">
           {!address ? (
             <AuthButton />
           ) : (
             <div className="flex w-full">
               <div className="w-1/4 border-r">
                 <button
                   className="m-4 px-4 py-2 bg-green-500 text-white rounded"
                   onClick={handleCreateFolder}
                 >
                   New Folder
                 </button>
                 <FolderTree folders={folders} onSelect={setSelectedFolder} />
               </div>
               <div className="w-3/4 p-4">
                 <NoteList notes={notes} onSelect={setSelectedNote} />
                 <NoteEditor
                   note={notes.find((n) => n.id === selectedNote)}
                   onSave={handleSaveNote}
                 />
                 {selectedNote && selectedFolder && (
                   <button
                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                     onClick={() => handleMoveNote(selectedNote)}
                   >
                     Move to Folder
                   </button>
                 )}
               </div>
             </div>
           )}
         </main>
       );
     }
     ```
4. **Test End-to-End**:
   - Load `http://localhost:3000`, login (Privy or SIWE), create folder, create note, select folder, move note, verify note appears under folder in Tableland dashboard and UI updates.
5. **Commit**: `git commit -m "Step 5: Integration and real-time"`.

## Step 6: Deploy (Integration Layer - 10 mins)
1. **Vercel Setup**:
   - Run `vercel login`, follow prompts.
   - Run `vercel --prod`.
2. **Verify**:
   - Open deployed URL, repeat end-to-end test: login, create/move note/folder, check real-time update.
3. **Commit**: `git push origin main`.

## Notes
- If errors occur, check console and Tableland dashboard. Common issues: Wrong chain (ensure Amoy), missing env vars, or MetaMask not connected.
- Styling is minimal (Tailwind); enhance post-MVP if time allows.
- Polling (5s) mimics real-time; add Tableland WebSocket listeners later for true real-time.