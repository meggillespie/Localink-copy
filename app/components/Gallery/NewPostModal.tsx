// components/Gallery/NewPostModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    Image,
    Button,
    StyleSheet,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/firebaseConfig';
import { Post } from '@/types'; // Relative path

interface NewPostModalProps {
    visible: boolean;
    onClose: () => void;
}

const categories = ['Travel', 'Food', 'Fashion', 'Sports', 'Music'];

const NewPostModal: React.FC<NewPostModalProps> = ({ visible, onClose }) => {
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [description, setDescription] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const pickMedia = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert('Permission required', 'Please grant media access.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled && result.assets) {
            const asset = result.assets[0];
            setMediaUri(asset.uri);
            setMediaType(asset.type === 'video' ? 'video' : 'image');
        }
    };

    const uploadMedia = async (): Promise<string | null> => {
        if (!mediaUri) return null;
        const response = await fetch(mediaUri);
        const blob = await response.blob();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const storageRef = ref(storage, `posts/${filename}`);
        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    const handleCreatePost = async () => {
        if (!mediaUri || !auth.currentUser) return;
        const mediaUrl = await uploadMedia();
        if (!mediaUrl) return;

        try {
            await addDoc(collection(db, 'posts'), {
                ownerId: auth.currentUser.uid,
                mediaType: mediaType || 'image',
                mediaUri: mediaUrl,
                tags: selectedCategories,
                description,
                likes: [],
                comments: [],
                createdAt: serverTimestamp(),
            });
            onClose();
            setMediaUri(null);
            setMediaType(null);
            setDescription('');
            setSelectedCategories([]);
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Create New Post</Text>
                    <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                        <Text style={styles.mediaButtonText}>{mediaUri ? 'Change Media' : 'Select Media'}</Text>
                    </TouchableOpacity>
                    {mediaUri && <Image source={{ uri: mediaUri }} style={styles.preview} />}
                    <TextInput
                        style={styles.input}
                        placeholder="Description..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <View style={styles.categoriesContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryButton,
                                    selectedCategories.includes(category) && styles.categorySelected,
                                ]}
                                onPress={() =>
                                    setSelectedCategories((prev) =>
                                        prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        selectedCategories.includes(category) && styles.categoryTextSelected,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.actions}>
                        <Button title="Post" onPress={handleCreatePost} />
                        <Button title="Cancel" onPress={onClose} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    mediaButton: { backgroundColor: '#e0e0e0', padding: 10, borderRadius: 5, alignItems: 'center' },
    mediaButtonText: { fontSize: 14, color: '#333' },
    preview: { width: '100%', height: 200, marginVertical: 10, borderRadius: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 10 },
    categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    categoryButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, margin: 5 },
    categorySelected: { backgroundColor: '#3498db', borderColor: '#3498db' },
    categoryText: { fontSize: 12 },
    categoryTextSelected: { color: '#fff' },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});

export default NewPostModal;