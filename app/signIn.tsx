// app/signIn.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebaseConfig';
import { useRouter } from 'expo-router';

const SignIn: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    const handleEmailSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/feedSearch');
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            // signInWithPopup works on web. For iOS/Android, consider expo-auth-session.
            await signInWithPopup(auth, provider);
            router.push('/feedSearch');
        } catch (error: any) {
            console.error(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
                Sign in to connect with your local community.
            </Text>

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleEmailSignIn}>
                <Text style={styles.primaryButtonText}>Sign In with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogleSignIn}>
                <Text style={styles.secondaryButtonText}>Sign In with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signUp')}>
                <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignIn;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        height: 48,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#0088cc',
        paddingVertical: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#eee',
        paddingVertical: 15,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#0088cc',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        textAlign: 'center',
        color: '#0088cc',
        fontSize: 16,
        marginTop: 10,
    },
});
