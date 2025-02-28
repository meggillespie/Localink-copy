// components/Gallery/EditPostModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

import { Post } from '@/types'; // Relative path

interface EditPostModalProps {
    visible: boolean;
    post: Post;
    onClose: () => void;
}

const categories = ['Travel', 'Food', 'Fashion', 'Sports', 'Music'];

const EditPostModal: React.FC<EditPostModalProps> = ({ visible, post, onClose }) => {
    const [description, setDescription] = useState(post.description);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(post.tags);

    const handleSave = async () => {
        try {
            await updateDoc(doc(db, 'posts', post.id), {
                description,
                tags: selectedCategories,
            });
            onClose();
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Edit Post</Text>
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
                        <Button title="Save" onPress={handleSave} />
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
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 10 },
    categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    categoryButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, margin: 5 },
    categorySelected: { backgroundColor: '#3498db', borderColor: '#3498db' },
    categoryText: { fontSize: 12 },
    categoryTextSelected: { color: '#fff' },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});

export default EditPostModal;