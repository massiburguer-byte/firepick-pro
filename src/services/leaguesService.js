import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

/**
 * Crea una nueva liga privada.
 */
export const createLeague = async (userId, name) => {
  if (!userId || !name) throw new Error("Faltan datos");

  // Generar código único aleatorio (FS-XXXXX)
  const code = `FS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const leagueData = {
    name,
    adminId: userId,
    code,
    members: [userId],
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'leagues'), leagueData);
  
  // Añadir la liga al perfil del usuario
  const userRef = doc(db, 'Users', userId);
  await updateDoc(userRef, {
    joinedLeagues: arrayUnion(docRef.id)
  });

  return { id: docRef.id, ...leagueData };
};

/**
 * Unirse a una liga existente mediante código.
 */
export const joinLeague = async (userId, code) => {
  if (!userId || !code) throw new Error("Faltan datos");

  const q = query(collection(db, 'leagues'), where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error("Código de liga no encontrado");

  const leagueDoc = snapshot.docs[0];
  const leagueId = leagueDoc.id;

  if (leagueDoc.data().members.includes(userId)) {
    throw new Error("Ya perteneces a esta liga");
  }

  // Actualizar la liga
  await updateDoc(doc(db, 'leagues', leagueId), {
    members: arrayUnion(userId)
  });

  // Actualizar el usuario
  await updateDoc(doc(db, 'Users', userId), {
    joinedLeagues: arrayUnion(leagueId)
  });

  return { id: leagueId, ...leagueDoc.data() };
};

/**
 * Obtener las ligas a las que pertenece el usuario.
 */
export const getUserLeagues = async (userId) => {
  if (!userId) return [];
  
  const q = query(collection(db, 'leagues'), where('members', 'array-contains', userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtener el ranking de una liga específica.
 */
export const getLeagueRanking = async (leagueId) => {
  const leagueSnap = await getDoc(doc(db, 'leagues', leagueId));
  if (!leagueSnap.exists()) return [];

  const memberIds = leagueSnap.data().members;
  if (memberIds.length === 0) return [];

  // Obtenemos los datos de todos los miembros
  // Nota: Si son muchos miembros (>10), Firestore requiere múltiples queries in
  const usersQ = query(collection(db, 'Users'), where('__name__', 'in', memberIds.slice(0, 10)));
  const usersSnap = await getDocs(usersQ);
  
  return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
