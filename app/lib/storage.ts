import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase"; // Assuming firebase.ts exports 'app'

export async function uploadProjectThumbnail(uid: string, file: File): Promise<string> {
  const storage = getStorage(app);
  // Generate a random file ID
  const fileId = Math.random().toString(36).substring(2, 15);
  const storageRef = ref(storage, `users/${uid}/projects/${fileId}_${file.name}`);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get download URL
  return await getDownloadURL(storageRef);
}
