/**
 * Firebase Service - Configuração e Funções do Firebase
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXkQPRRGrYa0bHrvK4KICRgMopeNkZMPw",
    authDomain: "catecismo-9565d.firebaseapp.com",
    projectId: "catecismo-9565d",
    storageBucket: "catecismo-9565d.firebasestorage.app",
    messagingSenderId: "706368409154",
    appId: "1:706368409154:web:8f577fb195e839644967db",
    measurementId: "G-1Y3JSRPLKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Exportar para uso global
window.db = db;
window.firebase = {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
};

// Funções utilitárias do Firebase
export const firebaseService = {
    // Adicionar documento
    async add(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Erro ao adicionar:", error);
            throw error;
        }
    },

    // Obter documentos
    async getAll(collectionName, orderField = 'createdAt', orderDir = 'desc') {
        try {
            const q = query(collection(db, collectionName), orderBy(orderField, orderDir));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Erro ao obter documentos:", error);
            throw error;
        }
    },

    // Atualizar documento
    async update(collectionName, id, data) {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            throw error;
        }
    },

    // Excluir documento
    async delete(collectionName, id) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (error) {
            console.error("Erro ao excluir:", error);
            throw error;
        }
    },

    // Adicionar comentário
    async addComment(parentCollection, parentId, commentData) {
        try {
            await addDoc(collection(db, parentCollection, parentId, 'comentarios'), {
                ...commentData,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Erro ao adicionar comentário:", error);
            throw error;
        }
    },

    // Obter comentários
    async getComments(parentCollection, parentId) {
        try {
            const q = query(
                collection(db, parentCollection, parentId, 'comentarios'),
                orderBy('createdAt', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Erro ao obter comentários:", error);
            throw error;
        }
    },

    // Listen em tempo real para comentários
    listenComments(parentCollection, parentId, callback) {
        const q = query(
            collection(db, parentCollection, parentId, 'comentarios'),
            orderBy('createdAt', 'asc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(comments);
        });
    }
};

export default firebaseService;