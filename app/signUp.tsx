// app/signUp.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, provider, db } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    // New state for profile type
    const [profileType, setProfileType] = useState<'personal' | 'business'>('personal');
    const router = useRouter();

    const handleEmailSignUp = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Set an initial empty displayName and photoURL
            await updateProfile(user, { displayName: '', photoURL: '' });

            // Save new user document including the chosen profileType
            await setDoc(doc(db, 'users', user.uid), {
                username: '',
                fullName: '',
                email: user.email,
                // Storing a hashed password is preferred; here we leave it empty.
                password: '',
                profilePicture: '',
                city: '',
                state: '',
                zipCode: '',
                age: '',
                gender: '',
                interests: [],
                // Business-specific fields (empty by default)
                businessName: '',
                contactInformation: '',
                servicesOffered: '',
                established: '',
                interestCategories: '',
                // Save the profile type selected by the user
                profileType: profileType,
            });
            router.push('/profile');
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await signInWithPopup(auth, provider);
            router.push('/profile');
        } catch (error: any) {
            console.error(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.description}>
                Join Localink to connect with your community and discover local events tailored to your interests.
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

            <Text style={styles.label}>Select Profile Type:</Text>
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, profileType === 'personal' && styles.selectedButton]}
                    onPress={() => setProfileType('personal')}
                >
                    <Text style={[styles.toggleText, profileType === 'personal' && styles.selectedText]}>
                        Personal
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, profileType === 'business' && styles.selectedButton]}
                    onPress={() => setProfileType('business')}
                >
                    <Text style={[styles.toggleText, profileType === 'business' && styles.selectedText]}>
                        Business
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleEmailSignUp}>
                <Text style={styles.primaryButtonText}>Sign Up with Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogleSignUp}>
                <Text style={styles.secondaryButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signIn')}>
                <Text style={styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignUp;

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
    description: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
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
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    selectedButton: {
        backgroundColor: '#0088cc',
        borderColor: '#0088cc',
    },
    toggleText: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: '#fff',
        fontWeight: '600',
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
