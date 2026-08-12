import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { BookDoc, Testament } from '../types/models';

export interface Book extends BookDoc {
  id: string;
}

let cachedBooks: Book[] | null = null;

async function getAllBooks(): Promise<Book[]> {
  if (cachedBooks) return cachedBooks;

  const snapshot = await getDocs(query(collection(db, 'books'), orderBy('order')));
  cachedBooks = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as BookDoc) }));
  return cachedBooks;
}

export async function getBooksByTestament(testament: Testament): Promise<Book[]> {
  const books = await getAllBooks();
  return books.filter((book) => book.testament === testament);
}

export async function getBookById(bookId: string): Promise<Book | undefined> {
  const books = await getAllBooks();
  return books.find((book) => book.id === bookId);
}
