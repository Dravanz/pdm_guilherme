import { auth } from "@/firebase/FirebaseInit";
import { Credentials } from "@/model/types";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { createContext } from "react";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }: any) => {
	async function signIn(credencial: Credentials): Promise<string> {
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				credencial.email,
				credencial.password
			);
			console.log(userCredential.user);
			console.log(userCredential.user.email);
			return "ok";
		} catch (error: any) {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
			return "erro";
		}
	}

	return (
		<AuthContext.Provider value={{ signIn }}>{children}</AuthContext.Provider>
	);
};