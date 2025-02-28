// app/gallery.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '@/firebaseConfig';
import usePosts from '@/hooks/usePosts';
import useProfile from '@/hooks/useProfile';
import Header from '../app/components/Gallery/Header';
import PostThumbnail from '../app/components/Gallery/PostThumbnail';
import PostDetailModal from '../app/components/Gallery/PostDetailModal';
import NewPostModal from '../app/components/Gallery/NewPostModal';
import EditPostModal from '../app/components/Gallery/EditPostModal';
import { Post, ProfileData } from '@/types'; // Relative path

// Rest of the component remains the same
// Types remain the same as in your original code
// (Moved to a separate types file in a real project)

const Gallery: React.FC = () => {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const currentUserId = auth.currentUser?.uid;
    const profileUserId = (Array.isArray(userId) ? userId[0] : userId) || currentUserId || '';
    const isOwnProfile = profileUserId === currentUserId;

    if (!currentUserId) return <Text>Please sign in to view the gallery.</Text>;

    // Custom hooks for data fetching
    const { posts, setPosts } = usePosts(profileUserId);
    const { profileData, isFollowing, toggleFollow } = useProfile(profileUserId, currentUserId, isOwnProfile);

    // Modal states
    const [newPostModalVisible, setNewPostModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [postDetailModalVisible, setPostDetailModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setEditModalVisible(true);
    };

    const handlePostSelect = (post: Post) => {
        setSelectedPost(post);
        setPostDetailModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Header
                profileData={profileData}
                postsCount={posts.length}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onToggleFollow={toggleFollow}
                onNewPost={() => setNewPostModalVisible(true)}
            />
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={({ item }) => (
                    <PostThumbnail
                        post={item}
                        isOwnProfile={isOwnProfile}
                        onPress={handlePostSelect}
                        onEdit={handleEditPost}
                        onDelete={(postId) => setPosts(posts.filter((p) => p.id !== postId))}
                    />
                )}
                contentContainerStyle={styles.flatListContent}
            />

            {isOwnProfile && (
                <NewPostModal
                    visible={newPostModalVisible}
                    onClose={() => setNewPostModalVisible(false)}
                />
            )}

            {isOwnProfile && editingPost && (
                <EditPostModal
                    visible={editModalVisible}
                    post={editingPost}
                    onClose={() => {
                        setEditingPost(null);
                        setEditModalVisible(false);
                    }}
                />
            )}

            {selectedPost && (
                <PostDetailModal
                    visible={postDetailModalVisible}
                    post={selectedPost}
                    isOwnProfile={isOwnProfile}
                    currentUserId={currentUserId}
                    onClose={() => {
                        setSelectedPost(null);
                        setPostDetailModalVisible(false);
                    }}
                    onUpdate={(updatedPost) => {
                        setPosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
                        setSelectedPost(updatedPost);
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    flatListContent: {
        width: '80%',
        alignSelf: 'center',
        paddingTop: 170,
        paddingBottom: 100,
    },
});

export default Gallery;