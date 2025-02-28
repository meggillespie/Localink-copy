// components/Gallery/PostThumbnail.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

import { Post } from '@/types'; // Relative path from components/Gallery to root

interface PostThumbnailProps {
    post: Post;
    isOwnProfile: boolean;
    onPress: (post: Post) => void;
    onEdit: (post: Post) => void;
    onDelete: (postId: string) => void;
}

const PostThumbnail: React.FC<PostThumbnailProps> = ({ post, isOwnProfile, onPress, onEdit, onDelete }) => {
    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, 'posts', post.id));
            onDelete(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress(post)}>
            <Image source={{ uri: post.mediaUri }} style={styles.image} />
            {post.mediaType === 'video' && (
                <View style={styles.videoOverlay}>
                    <Text style={styles.videoText}>Video</Text>
                </View>
            )}
            <View style={styles.actionOverlay}>
                <Text style={styles.actionText}>♥ {post.likes.length}</Text>
                <Text style={styles.actionText}>💬 {post.comments.length}</Text>
                {isOwnProfile && (
                    <>
                        <TouchableOpacity onPress={() => onEdit(post)}>
                            <Text style={styles.actionText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete}>
                            <Text style={styles.actionText}>🗑️</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '32%',
        margin: '0.66%',
        aspectRatio: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 2,
        borderRadius: 3,
    },
    videoText: {
        color: '#fff',
        fontSize: 10,
    },
    actionOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        flexDirection: 'row',
        borderRadius: 5,
        padding: 2,
    },
    actionText: {
        marginHorizontal: 3,
        fontSize: 12,
    },
});

export default PostThumbnail;