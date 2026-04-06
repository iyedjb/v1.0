import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDtvwvN6iZzmkx7gLE7PUrzhY4hp-Aeq_0",
  authDomain: "vuro-1efe4.firebaseapp.com",
  databaseURL: "https://vuro-1efe4-default-rtdb.firebaseio.com",
  projectId: "vuro-1efe4",
  storageBucket: "vuro-1efe4.firebasestorage.app",
  messagingSenderId: "744316137588",
  appId: "1:744316137588:web:43e1bd0b2bfc1cca8e6121"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence);

const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export const resetPassword = (email: string) => 
  sendPasswordResetEmail(auth, email);

export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  const fileRef = storageRef(storage, `profile-photos/${userId}`);
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL: downloadURL });
  }
  
  return downloadURL;
};

export { onAuthStateChanged, updateProfile, type User };
