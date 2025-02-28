// app/notifications.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

type Notification = {
    id: string;
    type: 'post_like' | 'comment_like' | 'new_comment';
    fromUserId: string;
    postId?: string;
    message: string;
    createdAt: any;
    read: boolean;
};

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const currentUserId = auth.currentUser?.uid;
    const router = useRouter();

    useEffect(() => {
        if (!currentUserId) return;
        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', currentUserId),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Notification, 'id'>),
            }));
            setNotifications(notifs);
        });
        return () => unsubscribe();
    }, [currentUserId]);

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>{item.message}</Text>
            <Text style={styles.notificationTime}>
                {new Date(item.createdAt.seconds * 1000).toLocaleString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

export default Notifications;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 100,
    },
    notificationItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    notificationText: {
        fontSize: 16,
        color: '#333',
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
});
