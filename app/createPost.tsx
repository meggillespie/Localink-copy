import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ScrollView,
    Button
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '@/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const categories = ['Travel', 'Food', 'Fashion', 'Sports', 'Music'];

const CreatePost: React.FC = () => {
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
    const [description, setDescription] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return <Text>Loading...</Text>;

    const openImagePickerAsync = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'You need permission to access media.');
            return;
        }
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) return;
        const asset = pickerResult.assets[0];
        setSelectedMedia(asset.uri);
        setSelectedMediaType(asset.type === 'video' ? 'video' : 'image');
    };

    const uploadMedia = async (): Promise<string | null> => {
        if (!selectedMedia) return null;
        try {
            const response = await fetch(selectedMedia);
            const blob = await response.blob();
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const storageRef = ref(storage, `posts/${filename}`);
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);
            return downloadUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Upload Error', 'Failed to upload media.');
            return null;
        }
    };

    const handlePostCreation = async () => {
        if (!selectedMedia) {
            Alert.alert('No media selected', 'Please select an image or video.');
            return;
        }
        const mediaUrl = await uploadMedia();
        if (!mediaUrl) return;
        const newPostData = {
            ownerId: currentUserId,
            mediaType: selectedMediaType || 'image',
            mediaUri: mediaUrl,
            tags: selectedCategories,
            description,
            likes: [] as string[],
            comments: [] as any[], // empty array for comments
            createdAt: serverTimestamp(),
        };
        try {
            await addDoc(collection(db, 'posts'), newPostData);
            Alert.alert('Success', 'Post created successfully!');
            setSelectedMedia(null);
            setSelectedMediaType(null);
            setSelectedCategories([]);
            setDescription('');
        } catch (error) {
            console.error('Error adding post:', error);
            Alert.alert('Error', 'Failed to add post.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create New Post</Text>
            <TouchableOpacity style={styles.mediaButton} onPress={openImagePickerAsync}>
                <Text style={styles.mediaButtonText}>
                    {selectedMedia ? 'Change Media' : 'Select Media'}
                </Text>
            </TouchableOpacity>
            {selectedMedia && <Image source={{ uri: selectedMedia }} style={styles.previewImage} />}
            <TextInput
                style={styles.input}
                placeholder="Enter description..."
                value={description}
                onChangeText={setDescription}
                multiline
            />
            <Text style={styles.sectionTitle}>Select Categories</Text>
            <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategories.includes(category) && styles.categoryButtonSelected,
                        ]}
                        onPress={() => {
                            if (selectedCategories.includes(category)) {
                                setSelectedCategories(selectedCategories.filter((c) => c !== category));
                            } else {
                                setSelectedCategories([...selectedCategories, category]);
                            }
                        }}
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
            <View style={styles.buttonContainer}>
                <Button title="Post" onPress={handlePostCreation} />
            </View>
        </ScrollView>
    );
};

export default CreatePost;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333333',
    },
    mediaButton: {
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    mediaButtonText: {
        fontSize: 14,
        color: '#333333',
    },
    previewImage: {
        width: '100%',
        height: 200,
        marginBottom: 12,
        borderRadius: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
        color: '#333333',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 12,
        color: '#333333',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryButton: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
    },
    categoryButtonSelected: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    categoryText: {
        fontSize: 12,
        color: '#333333',
    },
    categoryTextSelected: {
        color: '#ffffff',
    },
    buttonContainer: {
        marginTop: 20,
    },
});
