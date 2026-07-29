/** Firestore REST API의 최소 기능만 감싼 헬퍼. firebase-admin은 Node 전용이라 Workers에서 못 쓴다. */

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

function unwrap(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields);
  return undefined;
}

function unwrapFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!fields) return result;
  for (const [key, value] of Object.entries(fields)) {
    result[key] = unwrap(value);
  }
  return result;
}

function docId(doc: FirestoreDocument): string {
  const parts = doc.name.split('/');
  return parts[parts.length - 1];
}

export interface FirestoreClient {
  listDocuments(collectionId: string): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
  getDocument(collectionId: string, docId: string): Promise<Record<string, unknown> | null>;
  deleteDocument(collectionId: string, docId: string): Promise<void>;
}

export function createFirestoreClient(projectId: string, accessToken: string): FirestoreClient {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  return {
    async listDocuments(collectionId) {
      const results: Array<{ id: string; data: Record<string, unknown> }> = [];
      let pageToken: string | undefined;

      do {
        const url = new URL(`${base}/${collectionId}`);
        url.searchParams.set('pageSize', '300');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const response = await fetch(url.toString(), { headers: authHeaders });
        if (!response.ok) {
          throw new Error(`Firestore listDocuments 실패(${collectionId}): ${response.status} ${await response.text()}`);
        }
        const data = (await response.json()) as { documents?: FirestoreDocument[]; nextPageToken?: string };
        for (const doc of data.documents ?? []) {
          results.push({ id: docId(doc), data: unwrapFields(doc.fields) });
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      return results;
    },

    async getDocument(collectionId, id) {
      const response = await fetch(`${base}/${collectionId}/${id}`, { headers: authHeaders });
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Firestore getDocument 실패(${collectionId}/${id}): ${response.status} ${await response.text()}`);
      }
      const doc = (await response.json()) as FirestoreDocument;
      return unwrapFields(doc.fields);
    },

    async deleteDocument(collectionId, id) {
      const response = await fetch(`${base}/${collectionId}/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Firestore deleteDocument 실패(${collectionId}/${id}): ${response.status} ${await response.text()}`);
      }
    },
  };
}
