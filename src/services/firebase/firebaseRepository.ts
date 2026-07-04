import { User, onAuthStateChanged } from "firebase/auth";
import {
    CollectionReference,
    DocumentData,
    Firestore,
    collection,
    doc,
    getDocs,
    limit,
    query,
    runTransaction,
    where,
} from "firebase/firestore";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "../../firebase";

export type FirebaseCollectionName = "players" | "teams" | "games" | "gameTeams" | "rounds";

export const getRequiredFirebase = (): { db: Firestore } => {
    if (!isFirebaseConfigured || !firestoreDb) {
        throw new Error("Firebase is not configured. Set REACT_APP_FIREBASE_* env values before using firebase data mode.");
    }

    return { db: firestoreDb };
};

export const getFirebaseUser = async (): Promise<User> => {
    if (!firebaseAuth) {
        throw new Error("Firebase Auth is not configured.");
    }

    const auth = firebaseAuth;
    if (auth.currentUser) {
        return auth.currentUser;
    }

    return new Promise<User>((resolve, reject) => {
        let unsubscribe: () => void = () => undefined;
        const timeout = window.setTimeout(() => {
            unsubscribe();
            reject(new Error("No Firebase user is signed in."));
        }, 5000);

        unsubscribe = onAuthStateChanged(auth, (user) => {
            window.clearTimeout(timeout);
            unsubscribe();
            if (user) {
                resolve(user);
                return;
            }

            reject(new Error("No Firebase user is signed in."));
        }, reject);
    });
};

export const getCollection = <T = DocumentData>(name: FirebaseCollectionName): CollectionReference<T> => {
    const { db } = getRequiredFirebase();
    return collection(db, name) as CollectionReference<T>;
};

export const nextNumericId = async (name: FirebaseCollectionName): Promise<number> => {
    const { db } = getRequiredFirebase();
    const counterRef = doc(db, "metadata", `counter_${name}`);

    return runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const currentValue = Number(counterSnap.data()?.nextId ?? 1);
        const nextValue = Number.isFinite(currentValue) && currentValue > 0 ? currentValue : 1;
        transaction.set(counterRef, { nextId: nextValue + 1 }, { merge: true });
        return nextValue;
    });
};

export const getFirstByNumericId = async <T>(
    name: FirebaseCollectionName,
    id: number,
): Promise<{ docId: string; data: T } | undefined> => {
    const snapshot = await getDocs(query(getCollection<T>(name), where("id", "==", id), limit(1)));
    const firstDoc = snapshot.docs[0];

    if (!firstDoc) {
        return undefined;
    }

    return {
        docId: firstDoc.id,
        data: firstDoc.data(),
    };
};

export const getOwnedByNumericId = async <T extends { ownerUid: string }>(
    name: FirebaseCollectionName,
    id: number,
    ownerUid: string,
): Promise<{ docId: string; data: T } | undefined> => {
    const snapshot = await getDocs(query(
        getCollection<T>(name),
        where("id", "==", id),
        where("ownerUid", "==", ownerUid),
        limit(1),
    ));
    const firstDoc = snapshot.docs[0];

    if (!firstDoc) {
        return undefined;
    }

    return {
        docId: firstDoc.id,
        data: firstDoc.data(),
    };
};

export const getAllOwnedDocs = async <T extends { ownerUid: string }>(
    name: FirebaseCollectionName,
    ownerUid: string,
): Promise<T[]> => {
    const snapshot = await getDocs(query(getCollection<T>(name), where("ownerUid", "==", ownerUid)));
    return snapshot.docs.map((item) => item.data());
};
