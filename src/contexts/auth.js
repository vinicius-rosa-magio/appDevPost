import React, { useState, createContext, useEffect } from 'react';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({});

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [loadingAuth, setLoadingAuth] = useState(false);

    useEffect(() => {
        async function loadStoarge() {
            const storageUser = await AsyncStorage.getItem('@devapp');

            if (storageUser) {
                setUser(JSON.parse(storageUser))
                setLoading(false);
            }
        }

        loadStoarge(false);

    }, [])
    
    async function signUp(email, password, name) {
        setLoadingAuth(true)
        await auth().createUserWithEmailAndPassword(email, password)
            .then(async (value) => {
                let uid = value.user.uid;
                await firestore().collection('user')
                    .doc(uid).set({
                        nome: name,
                        createdAt: new Date(),
                    })
                    .then(() => {
                        let data = {
                            uid: uid,
                            nome: name,
                            email: value.user.email
                        }
                        setUser(data);
                        setLoadingAuth(false);
                    })
            })

            .catch((error) => {
                console.log(error);
                storageUser(data);
                setLoadingAuth(false);
            })
    }

    async function signIn(email, password) {
        setLoadingAuth(true)

        await auth().signInWithEmailAndPassword(email, password)
            .then(async (value) => {
                let uid = value.user.uid;

                const userProfile = await firestore().collection('user')
                    .doc(uid).get();

                console.log(userProfile.data().nome)
                let data = {
                    uid: uid,
                    nome: userProfile.data().nome,
                    email: value.user.email
                };

                setUser(data);
                storageUser(data);
                setLoadingAuth(false);
            })
            .catch((error) => {
                console.log(error);
                setLoadingAuth(false);
            })

    }
    
    async function signOut() {
        await auth().signOut();
        await AsyncStorage.clear()
            .then(() => {
                setUser(null);
            })
    }

    async function storageUser(data) {
        await AsyncStorage.setItem('@devapp', JSON.stringify(data))
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, signUp, signIn, loadingAuth, loading, signOut, user, setUser, storageUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider;