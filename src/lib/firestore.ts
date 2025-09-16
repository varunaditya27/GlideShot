import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const saveScore = async (userId: string, levelId: string, strokes: number) => {
  try {
    const scoreRef = doc(db, 'users', userId, 'scores', levelId);
    await setDoc(scoreRef, {
      strokes: strokes,
      par: 3, // Assuming par is 3 for now
      timestamp: serverTimestamp(),
    });
    console.log('Score saved successfully!');
  } catch (error) {
    console.error('Error saving score: ', error);
  }
};
