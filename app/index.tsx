// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Localink</Text>
            <Text style={styles.subtitle}>
                {/*Connect with your local community. Discover events, share experiences, and build meaningful relationships with people that share your interests.*/}
                Connect with your local community. Discover events, share experiences, and build meaningful relationships with people nearby.
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => router.push('/signIn')}
                >
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => router.push('/signUp')}
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20
    },
    subtitle: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%'
    },
    signInButton: {
        backgroundColor: '#3498db',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    signUpButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginLeft: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
