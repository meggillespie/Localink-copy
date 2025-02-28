// components/Gallery/Header.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { ProfileData } from '@/types'; // Relative path

interface HeaderProps {
    profileData: ProfileData | null;
    postsCount: number;
    isOwnProfile: boolean;
    isFollowing: boolean;
    onToggleFollow: () => void;
    onNewPost: () => void;
}

const Header: React.FC<HeaderProps> = ({
                                           profileData,
                                           postsCount,
                                           isOwnProfile,
                                           isFollowing,
                                           onToggleFollow,
                                           onNewPost,
                                       }) => (
    <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
                <Image
                    source={{ uri: profileData?.profilePicture || 'https://via.placeholder.com/150' }}
                    style={styles.profilePicture}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.fullName}>{profileData?.fullName || 'User Name'}</Text>
                    <Text style={styles.username}>@{profileData?.username || 'username'}</Text>
                    <Text style={styles.shortDescription}>
                        {profileData?.shortDescription || 'This is a short description.'}
                    </Text>
                    <Text style={styles.location}>
                        {profileData?.city || 'City'}, {profileData?.state || 'State'}
                    </Text>
                </View>
            </View>
            {!isOwnProfile && (
                <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.unfollowButton]}
                    onPress={onToggleFollow}
                >
                    <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
                </TouchableOpacity>
            )}
        </View>
        <View style={styles.statsContainer}>
            <Text style={styles.statCount}>{postsCount} Posts</Text>
            <Text style={styles.statCount}>{profileData?.followers?.length || 0} Followers</Text>
            <Text style={styles.statCount}>{profileData?.following?.length || 0} Following</Text>
        </View>
        {isOwnProfile && (
            <TouchableOpacity style={styles.newPostButton} onPress={onNewPost}>
                <Text style={styles.newPostButtonText}>New Post</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    headerContainer: {
        position: 'absolute',
        top: 0,
        width: '100%',
        backgroundColor: '#fff',
        padding: 20,
        zIndex: 10,
        elevation: 4,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    profilePicture: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#e0e0e0' },
    infoContainer: { marginLeft: 12 },
    fullName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    username: { fontSize: 14, color: '#777' },
    shortDescription: { fontSize: 12, color: '#555', marginTop: 4 },
    location: { fontSize: 14, color: '#888' },
    followButton: { backgroundColor: '#3498db', padding: 8, borderRadius: 20 },
    unfollowButton: { backgroundColor: '#e74c3c' },
    followButtonText: { color: '#fff', fontWeight: 'bold' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statCount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    newPostButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 20, alignSelf: 'center', marginTop: 10 },
    newPostButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default Header;