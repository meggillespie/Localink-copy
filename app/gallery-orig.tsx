//
// **Implement/Refactor the Gallery Page for a Social Interest & Location App**
//
// **Prompt Details:**
// Below is the current functionality and design requirement for the Gallery page in our application. Please use modern best practices (e.g., real-time data updates, and responsive design) when writing or refactoring the code.
//
// **Requirements:**
//
// 1. **Page Purpose & Functionality:**
// - **General Concept:**
// Create a Gallery page similar in functionality to Instagram. This page should update in real time and display posts from the currently signed-in user or another user.
// - **URL Behavior:**
// - When the URL is `/gallery`, the page shows the signed-in user’s own gallery.
// - When the URL is `/gallery?userId=${item.id}`, the page shows another user’s gallery.
// - **User Interaction Options:**
// - For the signed-in user’s own gallery: Allow creation, editing, and deletion of posts.
// - For another user’s gallery: Include a button to follow or unfollow that user.
//
// 2. **Post Structure & Interactions:**
// - **Post Content:**
// Each post must include:
//     - An image or video.
// - A text description.
// - One or more interest tags classifying the post’s topics.
// - **Post Interactivity:**
// - Display the number of likes and comments on each post.
// - Allow users to like/unlike a post.
// - Allow users to comment on a post.
// - Allow users to edit their own posts.
// - **Comment & Reply Features:**
// - Users can like/unlike comments.
// - Users can reply to any comment.
// - Users can like/unlike replies.
// - Users can edit or delete any comment or reply they have made.
// - Users can delete any comment on their own posts.
//
// 3. **User Profile Header:**
// - The header of the Gallery page should display:
//     - User profile picture.
// - Full name, username, and location.
// - A short user description.
// - User statistics, including post count, follower count, and following count.
//
// 4. **Real-Time Updates:**
// - Ensure that all interactions (e.g., likes, comments, edits, and follow/unfollow) are reflected in real time without needing a page refresh.
// - Use appropriate real-time Firebase solutions as per our application’s architecture.
//
// 5. **Coding Best Practices & Additional Notes:**
// - Write clean, maintainable code with proper documentation/comments.
// - Follow responsive design principles so the page works well on all devices.
// - Ensure security best practices (e.g., proper user authentication and authorization for editing/deleting content).
// - Utilize a modular architecture so that components (like posts, comments, and the header) can be reused across the application.
// - Include error handling and loading states for all asynchronous operations.
//
// **Output Expectations:**
// - Provide the fully written out, updated/refactored code.
//
// **Current Code For Galley Page is Below This Line...**
//
// // app/gallery.tsx
// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     TouchableOpacity,
//     FlatList,
//     Image,
//     Modal,
//     TextInput,
//     Alert,
//     Dimensions,
//     Button,
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import * as ImagePicker from 'expo-image-picker';
// import { auth, db, storage } from '@/firebaseConfig';
// import {
//     collection,
//     addDoc,
//     doc,
//     updateDoc,
//     deleteDoc,
//     onSnapshot,
//     query,
//     orderBy,
//     where,
//     serverTimestamp,
//     arrayUnion,
//     arrayRemove,
// } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
//
// // Define types
// type Reply = {
//     id: string;
//     userId: string;
//     text: string;
//     likes: string[];
//     createdAt: any;
// };
//
// type Comment = {
//     id: string;
//     userId: string;
//     text: string;
//     likes: string[];
//     replies: Reply[];
//     createdAt: any;
// };
//
// type Post = {
//     id: string;
//     ownerId: string;
//     mediaType: 'image' | 'video';
//     mediaUri: string;
//     tags: string[];
//     description: string;
//     likes: string[];
//     comments: Comment[];
//     createdAt: any;
// };
//
// interface ProfileData {
//     uid?: string;
//     profileType: 'personal' | 'business';
//     fullName?: string;
//     username?: string;
//     profilePicture?: string;
//     city: string;
//     state: string;
//     shortDescription?: string;
//     followers?: string[];
//     following?: string[];
// }
//
// const categories = ['Travel', 'Food', 'Fashion', 'Sports', 'Music'];
//
// const Gallery: React.FC = () => {
//     const router = useRouter();
//     const { userId } = useLocalSearchParams();
//     const currentUserId = auth.currentUser?.uid;
//     // If a userId is provided via query params, we view that profile; otherwise, use the current user's id.
//     const profileUserId: string = userId
//         ? (Array.isArray(userId) ? userId[0] : userId)
//         : currentUserId || '';
//
//     if (!currentUserId) return <Text>Please sign in to view the gallery.</Text>;
//     if (!profileUserId) return <Text>Loading...</Text>;
//
//     const isOwnProfile = profileUserId === currentUserId;
//
//     // States
//     const [posts, setPosts] = useState<Post[]>([]);
//     const [profileData, setProfileData] = useState<ProfileData | null>(null);
//     const [newPostModalVisible, setNewPostModalVisible] = useState(false);
//     const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
//     const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
//     const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//     const [description, setDescription] = useState('');
//     const [editModalVisible, setEditModalVisible] = useState(false);
//     const [editingPost, setEditingPost] = useState<Post | null>(null);
//     const [editDescription, setEditDescription] = useState('');
//     const [editCategories, setEditCategories] = useState<string[]>([]);
//     const [postDetailModalVisible, setPostDetailModalVisible] = useState(false);
//     const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
//     const [detailNewComment, setDetailNewComment] = useState('');
//     const [isFollowing, setIsFollowing] = useState(false);
//     const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
//     const [editingComment, setEditingComment] = useState<Comment | null>(null);
//     const [editCommentText, setEditCommentText] = useState('');
//     const [editingReply, setEditingReply] = useState<{ commentId: string; reply: Reply } | null>(null);
//     const [editReplyText, setEditReplyText] = useState('');
//
//     // Fetch posts with real-time updates based on the profileUserId
//     useEffect(() => {
//         const q = query(
//             collection(db, 'posts'),
//             where('ownerId', '==', profileUserId),
//             orderBy('createdAt', 'desc')
//         );
//         const unsubscribe = onSnapshot(
//             q,
//             (snapshot) => {
//                 const postsData: Post[] = snapshot.docs.map((docSnap) => ({
//                     id: docSnap.id,
//                     ...(docSnap.data() as Omit<Post, 'id'>),
//                     comments: (docSnap.data().comments || []).map((comment: Comment) => ({
//                         ...comment,
//                         replies: comment.replies || [],
//                     })),
//                 }));
//                 setPosts(postsData);
//                 // Update post detail if needed
//                 if (selectedPostDetail) {
//                     const updated = postsData.find((p) => p.id === selectedPostDetail.id);
//                     setSelectedPostDetail(updated || null);
//                     if (!updated) setPostDetailModalVisible(false);
//                 }
//             },
//             (error) => {
//                 console.error('Error fetching posts:', error);
//                 Alert.alert('Error', 'Failed to load posts.');
//                 setPosts([]);
//             }
//         );
//         return () => unsubscribe();
//     }, [profileUserId, selectedPostDetail]);
//
//     // Fetch profile data with real-time updates
//     useEffect(() => {
//         const profileRef = doc(db, 'users', profileUserId);
//         const unsubscribe = onSnapshot(
//             profileRef,
//             (docSnap) => {
//                 if (docSnap.exists()) {
//                     const data = docSnap.data() as ProfileData;
//                     setProfileData({
//                         uid: docSnap.id,
//                         profileType: data.profileType || 'personal',
//                         fullName: data.fullName || 'User Name',
//                         username: data.username || 'username',
//                         profilePicture: data.profilePicture || 'https://via.placeholder.com/150',
//                         city: data.city || 'City',
//                         state: data.state || 'State',
//                         shortDescription: data.shortDescription || 'This is a short description.',
//                         followers: data.followers || [],
//                         following: data.following || [],
//                     });
//                     // For other user's profile, update follow status
//                     if (currentUserId && !isOwnProfile) {
//                         setIsFollowing(data.followers?.includes(currentUserId) || false);
//                     }
//                 } else {
//                     console.error('Profile not found');
//                     setProfileData(null);
//                 }
//             },
//             (error) => {
//                 console.error('Error fetching profile:', error);
//                 Alert.alert('Error', 'Failed to load profile.');
//             }
//         );
//         return () => unsubscribe();
//     }, [profileUserId, currentUserId, isOwnProfile]);
//
//     // Follow / Unfollow for another user's profile
//     const handleToggleFollow = async () => {
//         if (!currentUserId || isOwnProfile) return;
//         const currentUserRef = doc(db, 'users', currentUserId);
//         const profileUserRef = doc(db, 'users', profileUserId);
//         try {
//             if (isFollowing) {
//                 await Promise.all([
//                     updateDoc(currentUserRef, { following: arrayRemove(profileUserId) }),
//                     updateDoc(profileUserRef, { followers: arrayRemove(currentUserId) }),
//                 ]);
//                 setIsFollowing(false);
//             } else {
//                 await Promise.all([
//                     updateDoc(currentUserRef, { following: arrayUnion(profileUserId) }),
//                     updateDoc(profileUserRef, { followers: arrayUnion(currentUserId) }),
//                 ]);
//                 setIsFollowing(true);
//             }
//         } catch (error) {
//             console.error('Error toggling follow:', error);
//             Alert.alert('Error', 'Failed to update follow status.');
//         }
//     };
//
//     // Image picker for creating a new post (only available for own profile)
//     const openImagePickerAsync = async () => {
//         if (!isOwnProfile) return;
//         const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//         if (!permissionResult.granted) {
//             Alert.alert('Permission required', 'You need permission to access media.');
//             return;
//         }
//         const pickerResult = await ImagePicker.launchImageLibraryAsync({
//             mediaTypes: ImagePicker.MediaTypeOptions.All,
//             allowsEditing: true,
//             aspect: [4, 3],
//             quality: 1,
//         });
//         if (!pickerResult.canceled && pickerResult.assets) {
//             const asset = pickerResult.assets[0];
//             setSelectedMedia(asset.uri);
//             setSelectedMediaType(asset.type === 'video' ? 'video' : 'image');
//         }
//     };
//
//     // Upload media to storage
//     const uploadMedia = async (): Promise<string | null> => {
//         if (!selectedMedia) return null;
//         try {
//             const response = await fetch(selectedMedia);
//             const blob = await response.blob();
//             const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
//             const storageRef = ref(storage, `posts/${filename}`);
//             await uploadBytes(storageRef, blob);
//             return await getDownloadURL(storageRef);
//         } catch (error) {
//             console.error('Error uploading media:', error);
//             Alert.alert('Error', 'Failed to upload media.');
//             return null;
//         }
//     };
//
//     // Create a new post (own posts only)
//     const handlePostCreation = async () => {
//         if (!isOwnProfile || !selectedMedia) return;
//         const mediaUrl = await uploadMedia();
//         if (!mediaUrl) return;
//         try {
//             await addDoc(collection(db, 'posts'), {
//                 ownerId: currentUserId,
//                 mediaType: selectedMediaType || 'image',
//                 mediaUri: mediaUrl,
//                 tags: selectedCategories,
//                 description,
//                 likes: [],
//                 comments: [],
//                 createdAt: serverTimestamp(),
//             });
//             setSelectedMedia(null);
//             setSelectedMediaType(null);
//             setSelectedCategories([]);
//             setDescription('');
//             setNewPostModalVisible(false);
//         } catch (error) {
//             console.error('Error creating post:', error);
//             Alert.alert('Error', 'Failed to create post.');
//         }
//     };
//
//     // Delete a post (own posts only)
//     const handleDeletePost = async (postId: string) => {
//         if (!isOwnProfile) return;
//         try {
//             await deleteDoc(doc(db, 'posts', postId));
//             if (selectedPostDetail?.id === postId) {
//                 setSelectedPostDetail(null);
//                 setPostDetailModalVisible(false);
//             }
//         } catch (error) {
//             console.error('Error deleting post:', error);
//             Alert.alert('Error', 'Failed to delete post.');
//         }
//     };
//
//     // Edit a post (own posts only)
//     const handleEditPost = async () => {
//         if (!isOwnProfile || !editingPost) return;
//         try {
//             await updateDoc(doc(db, 'posts', editingPost.id), {
//                 description: editDescription,
//                 tags: editCategories,
//             });
//             setEditingPost(null);
//             setEditModalVisible(false);
//         } catch (error) {
//             console.error('Error editing post:', error);
//             Alert.alert('Error', 'Failed to edit post.');
//         }
//     };
//
//     // Like or Unlike a comment (both own & other profiles)
//     const handleLikeComment = async (postId: string, comment: Comment) => {
//         if (!currentUserId || !selectedPostDetail) return;
//         try {
//             const updatedComments = selectedPostDetail.comments.map((c) => {
//                 if (c.id === comment.id) {
//                     const updatedLikes = c.likes.includes(currentUserId)
//                         ? c.likes.filter((id) => id !== currentUserId)
//                         : [...c.likes, currentUserId];
//                     return { ...c, likes: updatedLikes };
//                 }
//                 return c;
//             });
//             await updateDoc(doc(db, 'posts', postId), { comments: updatedComments });
//         } catch (error) {
//             console.error(`Error liking comment on post ${postId}:`, error);
//             Alert.alert('Error', 'Failed to like/unlike comment.');
//         }
//     };
//
//     // Like or Unlike a reply (both own & other profiles)
//     const handleLikeReply = async (postId: string, commentId: string, reply: Reply) => {
//         if (!currentUserId || !selectedPostDetail) return;
//         try {
//             const updatedComments = selectedPostDetail.comments.map((c) => {
//                 if (c.id === commentId) {
//                     const updatedReplies = c.replies.map((r) => {
//                         if (r.id === reply.id) {
//                             const updatedLikes = r.likes.includes(currentUserId)
//                                 ? r.likes.filter((id) => id !== currentUserId)
//                                 : [...r.likes, currentUserId];
//                             return { ...r, likes: updatedLikes };
//                         }
//                         return r;
//                     });
//                     return { ...c, replies: updatedReplies };
//                 }
//                 return c;
//             });
//             await updateDoc(doc(db, 'posts', postId), { comments: updatedComments });
//         } catch (error) {
//             console.error(`Error liking reply on post ${postId}:`, error);
//             Alert.alert('Error', 'Failed to like/unlike reply.');
//         }
//     };
//
//     // Add a comment in post detail (applies to both own & other user's posts)
//     const handleAddDetailComment = async () => {
//         if (!selectedPostDetail || !currentUserId || !detailNewComment.trim()) return;
//         try {
//             const newComment: Comment = {
//                 id: Date.now().toString(),
//                 userId: currentUserId,
//                 text: detailNewComment,
//                 likes: [],
//                 replies: [],
//                 createdAt: serverTimestamp(),
//             };
//             const updatedComments = [...selectedPostDetail.comments, newComment];
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//             setDetailNewComment('');
//         } catch (error) {
//             console.error(`Error adding comment to post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to add comment.');
//         }
//     };
//
//     // Add a reply to a comment (applies to both own & other user's posts)
//     const handleAddReply = async (commentId: string) => {
//         if (!selectedPostDetail || !currentUserId || !replyText[commentId]?.trim()) return;
//         try {
//             const newReply: Reply = {
//                 id: Date.now().toString(),
//                 userId: currentUserId,
//                 text: replyText[commentId],
//                 likes: [],
//                 createdAt: serverTimestamp(),
//             };
//             const updatedComments = selectedPostDetail.comments.map((c) => {
//                 if (c.id === commentId) {
//                     return { ...c, replies: [...c.replies, newReply] };
//                 }
//                 return c;
//             });
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//             setReplyText((prev) => ({ ...prev, [commentId]: '' }));
//         } catch (error) {
//             console.error(`Error adding reply to comment ${commentId} on post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to add reply.');
//         }
//     };
//
//     // Begin editing a comment (only own comments can be edited)
//     const handleEditComment = (comment: Comment) => {
//         if (comment.userId !== currentUserId) {
//             Alert.alert('Permission Denied', 'You can only edit your own comments.');
//             return;
//         }
//         setEditingComment(comment);
//         setEditCommentText(comment.text);
//     };
//
//     // Save the edited comment
//     const handleSaveEditComment = async () => {
//         if (!selectedPostDetail || !editingComment || !editCommentText.trim()) return;
//         try {
//             const updatedComments = selectedPostDetail.comments.map((c) =>
//                 c.id === editingComment.id ? { ...c, text: editCommentText } : c
//             );
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//             setEditingComment(null);
//             setEditCommentText('');
//         } catch (error) {
//             console.error(`Error editing comment on post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to edit comment.');
//         }
//     };
//
//     // Delete a comment. For own posts, the owner can delete any comment; for other user's posts, only own comments may be deleted.
//     const handleDeleteComment = async (commentId: string) => {
//         if (!selectedPostDetail || !currentUserId) return;
//         const comment = selectedPostDetail.comments.find((c) => c.id === commentId);
//         if (!comment || (comment.userId !== currentUserId && selectedPostDetail.ownerId !== currentUserId)) {
//             Alert.alert('Permission Denied', 'You can only delete your own comments or comments on your posts.');
//             return;
//         }
//         try {
//             const updatedComments = selectedPostDetail.comments.filter((c) => c.id !== commentId);
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//         } catch (error) {
//             console.error(`Error deleting comment ${commentId} on post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to delete comment.');
//         }
//     };
//
//     // Begin editing a reply (only own replies can be edited)
//     const handleEditReply = (commentId: string, reply: Reply) => {
//         if (reply.userId !== currentUserId) {
//             Alert.alert('Permission Denied', 'You can only edit your own replies.');
//             return;
//         }
//         setEditingReply({ commentId, reply });
//         setEditReplyText(reply.text);
//     };
//
//     // Save the edited reply
//     const handleSaveEditReply = async () => {
//         if (!selectedPostDetail || !editingReply || !editReplyText.trim()) return;
//         try {
//             const updatedComments = selectedPostDetail.comments.map((c) => {
//                 if (c.id === editingReply.commentId) {
//                     const updatedReplies = c.replies.map((r) =>
//                         r.id === editingReply.reply.id ? { ...r, text: editReplyText } : r
//                     );
//                     return { ...c, replies: updatedReplies };
//                 }
//                 return c;
//             });
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//             setEditingReply(null);
//             setEditReplyText('');
//         } catch (error) {
//             console.error(`Error editing reply on post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to edit reply.');
//         }
//     };
//
//     // Delete a reply (only own replies can be deleted)
//     const handleDeleteReply = async (commentId: string, replyId: string) => {
//         if (!selectedPostDetail || !currentUserId) return;
//         const comment = selectedPostDetail.comments.find((c) => c.id === commentId);
//         if (!comment) return;
//         const reply = comment.replies.find((r) => r.id === replyId);
//         if (!reply || reply.userId !== currentUserId) {
//             Alert.alert('Permission Denied', 'You can only delete your own replies.');
//             return;
//         }
//         try {
//             const updatedComments = selectedPostDetail.comments.map((c) => {
//                 if (c.id === commentId) {
//                     return { ...c, replies: c.replies.filter((r) => r.id !== replyId) };
//                 }
//                 return c;
//             });
//             await updateDoc(doc(db, 'posts', selectedPostDetail.id), { comments: updatedComments });
//         } catch (error) {
//             console.error(`Error deleting reply ${replyId} on post ${selectedPostDetail.id}:`, error);
//             Alert.alert('Error', 'Failed to delete reply.');
//         }
//     };
//
//     // Render a single post thumbnail with conditional actions
//     const renderPost = ({ item }: { item: Post }) => (
//         <TouchableOpacity
//             style={styles.postContainer}
//             onPress={() => {
//                 setSelectedPostDetail(item);
//                 setPostDetailModalVisible(true);
//             }}
//         >
//             <Image source={{ uri: item.mediaUri }} style={styles.postImage} />
//             {item.mediaType === 'video' && (
//                 <View style={styles.videoOverlay}>
//                     <Text style={styles.videoText}>Video</Text>
//                 </View>
//             )}
//             <View style={styles.actionOverlay}>
//                 <Text style={styles.actionText}>♥ {item.likes.length}</Text>
//                 <Text style={styles.actionText}>💬 {item.comments.length}</Text>
//                 {isOwnProfile && (
//                     <>
//                         <TouchableOpacity
//                             onPress={() => {
//                                 setEditingPost(item);
//                                 setEditDescription(item.description);
//                                 setEditCategories(item.tags);
//                                 setEditModalVisible(true);
//                             }}
//                         >
//                             <Text style={styles.actionText}>✏️</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
//                             <Text style={styles.actionText}>🗑️</Text>
//                         </TouchableOpacity>
//                     </>
//                 )}
//             </View>
//         </TouchableOpacity>
//     );
//
//     // Header section displays profile details, stats, and (if applicable) follow and new post buttons
//     const HeaderSection = () => (
//         <View style={styles.headerContainer}>
//             <View style={styles.headerTop}>
//                 <View style={styles.headerLeft}>
//                     <Image
//                         source={{ uri: profileData?.profilePicture || 'https://via.placeholder.com/150' }}
//                         style={styles.profilePicture}
//                     />
//                     <View style={styles.infoContainer}>
//                         <Text style={styles.fullName}>{profileData?.fullName || 'User Name'}</Text>
//                         <Text style={styles.usernameHeader}>@{profileData?.username || 'username'}</Text>
//                         <Text style={styles.shortDescription}>
//                             {profileData?.shortDescription || 'This is a short description.'}
//                         </Text>
//                         <Text style={styles.locationText}>
//                             {profileData?.city || 'City'}, {profileData?.state || 'State'}
//                         </Text>
//                     </View>
//                 </View>
//                 {!isOwnProfile && (
//                     <TouchableOpacity
//                         style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButton]}
//                         onPress={handleToggleFollow}
//                     >
//                         <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
//                     </TouchableOpacity>
//                 )}
//             </View>
//             <View style={styles.statsContainer}>
//                 <Text style={styles.statCount}>{posts.length} Posts</Text>
//                 <Text style={styles.statCount}>{profileData?.followers?.length || 0} Followers</Text>
//                 <Text style={styles.statCount}>{profileData?.following?.length || 0} Following</Text>
//             </View>
//             {isOwnProfile && (
//                 <TouchableOpacity style={styles.newPostButton} onPress={() => setNewPostModalVisible(true)}>
//                     <Text style={styles.newPostButtonText}>New Post</Text>
//                 </TouchableOpacity>
//             )}
//         </View>
//     );
//
//     // Render a comment along with its replies and actions (like, reply, edit, delete)
//     const renderComment = ({ item: comment }: { item: Comment }) => (
//         <View style={styles.commentContainer}>
//             <Text style={styles.commentText}>
//                 <Text style={{ fontWeight: 'bold' }}>{comment.userId}</Text>: {comment.text}
//             </Text>
//             <View style={styles.commentActions}>
//                 <TouchableOpacity onPress={() => handleLikeComment(selectedPostDetail!.id, comment)}>
//                     <Text style={styles.commentActionText}>♥ {comment.likes.length}</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     onPress={() =>
//                         setReplyText((prev) => ({ ...prev, [comment.id]: prev[comment.id] !== undefined ? prev[comment.id] : '' }))
//                     }
//                 >
//                     <Text style={styles.commentActionText}>Reply</Text>
//                 </TouchableOpacity>
//                 {(comment.userId === currentUserId || (isOwnProfile && selectedPostDetail?.ownerId === currentUserId)) && (
//                     <>
//                         {comment.userId === currentUserId && (
//                             <TouchableOpacity onPress={() => handleEditComment(comment)}>
//                                 <Text style={styles.commentActionText}>✏️</Text>
//                             </TouchableOpacity>
//                         )}
//                         <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
//                             <Text style={styles.commentActionText}>🗑️</Text>
//                         </TouchableOpacity>
//                     </>
//                 )}
//             </View>
//             {replyText[comment.id] !== undefined && (
//                 <View style={styles.replyInputContainer}>
//                     <TextInput
//                         style={styles.replyInput}
//                         placeholder="Reply..."
//                         value={replyText[comment.id]}
//                         onChangeText={(text) => setReplyText((prev) => ({ ...prev, [comment.id]: text }))}
//                     />
//                     <Button title="Send" onPress={() => handleAddReply(comment.id)} />
//                 </View>
//             )}
//             {comment.replies.map((reply) => (
//                 <View key={reply.id} style={styles.replyContainer}>
//                     <Text style={styles.replyText}>
//                         <Text style={{ fontWeight: 'bold' }}>{reply.userId}</Text>: {reply.text}
//                     </Text>
//                     <View style={styles.commentActions}>
//                         <TouchableOpacity onPress={() => handleLikeReply(selectedPostDetail!.id, comment.id, reply)}>
//                             <Text style={styles.commentActionText}>♥ {reply.likes.length}</Text>
//                         </TouchableOpacity>
//                         {reply.userId === currentUserId && (
//                             <>
//                                 <TouchableOpacity onPress={() => handleEditReply(comment.id, reply)}>
//                                     <Text style={styles.commentActionText}>✏️</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity onPress={() => handleDeleteReply(comment.id, reply.id)}>
//                                     <Text style={styles.commentActionText}>🗑️</Text>
//                                 </TouchableOpacity>
//                             </>
//                         )}
//                     </View>
//                 </View>
//             ))}
//         </View>
//     );
//
//     return (
//         <View style={styles.container}>
//             <HeaderSection />
//             <FlatList
//                 data={posts}
//                 keyExtractor={(item) => item.id}
//                 numColumns={3}
//                 renderItem={renderPost}
//                 contentContainerStyle={styles.flatListContent}
//             />
//
//             {/* New Post Modal (Own Profile Only) */}
//             <Modal visible={newPostModalVisible} animationType="slide" transparent={true}>
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Create New Post</Text>
//                         <TouchableOpacity style={styles.mediaButton} onPress={openImagePickerAsync}>
//                             <Text style={styles.mediaButtonText}>
//                                 {selectedMedia ? 'Change Media' : 'Select Media'}
//                             </Text>
//                         </TouchableOpacity>
//                         {selectedMedia && <Image source={{ uri: selectedMedia }} style={styles.previewImage} />}
//                         <TextInput
//                             style={styles.input}
//                             placeholder="Enter description..."
//                             value={description}
//                             onChangeText={setDescription}
//                             multiline
//                         />
//                         <Text style={styles.sectionTitle}>Select Interests</Text>
//                         <View style={styles.categoriesContainer}>
//                             {categories.map((category) => (
//                                 <TouchableOpacity
//                                     key={category}
//                                     style={[
//                                         styles.categoryButton,
//                                         selectedCategories.includes(category) && styles.categoryButtonSelected,
//                                     ]}
//                                     onPress={() =>
//                                         setSelectedCategories((prev) =>
//                                             prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
//                                         )
//                                     }
//                                 >
//                                     <Text
//                                         style={[
//                                             styles.categoryText,
//                                             selectedCategories.includes(category) && styles.categoryTextSelected,
//                                         ]}
//                                     >
//                                         {category}
//                                     </Text>
//                                 </TouchableOpacity>
//                             ))}
//                         </View>
//                         <View style={styles.modalActions}>
//                             <Button title="Post" onPress={handlePostCreation} />
//                             <Button
//                                 title="Cancel"
//                                 onPress={() => {
//                                     setSelectedMedia(null);
//                                     setSelectedMediaType(null);
//                                     setSelectedCategories([]);
//                                     setDescription('');
//                                     setNewPostModalVisible(false);
//                                 }}
//                             />
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//
//             {/* Edit Post Modal (Own Profile Only) */}
//             <Modal visible={editModalVisible} animationType="slide" transparent={true}>
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Edit Post</Text>
//                         <TextInput
//                             style={styles.input}
//                             placeholder="Edit description..."
//                             value={editDescription}
//                             onChangeText={setEditDescription}
//                             multiline
//                         />
//                         <Text style={styles.sectionTitle}>Edit Interests</Text>
//                         <View style={styles.categoriesContainer}>
//                             {categories.map((category) => (
//                                 <TouchableOpacity
//                                     key={category}
//                                     style={[
//                                         styles.categoryButton,
//                                         editCategories.includes(category) && styles.categoryButtonSelected,
//                                     ]}
//                                     onPress={() =>
//                                         setEditCategories((prev) =>
//                                             prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
//                                         )
//                                     }
//                                 >
//                                     <Text
//                                         style={[
//                                             styles.categoryText,
//                                             editCategories.includes(category) && styles.categoryTextSelected,
//                                         ]}
//                                     >
//                                         {category}
//                                     </Text>
//                                 </TouchableOpacity>
//                             ))}
//                         </View>
//                         <View style={styles.modalActions}>
//                             <Button title="Save" onPress={handleEditPost} />
//                             <Button
//                                 title="Cancel"
//                                 onPress={() => {
//                                     setEditingPost(null);
//                                     setEditModalVisible(false);
//                                 }}
//                             />
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//
//             {/* Edit Comment Modal */}
//             <Modal visible={!!editingComment} animationType="slide" transparent={true}>
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Edit Comment</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={editCommentText}
//                             onChangeText={setEditCommentText}
//                             multiline
//                         />
//                         <View style={styles.modalActions}>
//                             <Button title="Save" onPress={handleSaveEditComment} />
//                             <Button
//                                 title="Cancel"
//                                 onPress={() => {
//                                     setEditingComment(null);
//                                     setEditCommentText('');
//                                 }}
//                             />
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//
//             {/* Edit Reply Modal */}
//             <Modal visible={!!editingReply} animationType="slide" transparent={true}>
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Edit Reply</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={editReplyText}
//                             onChangeText={setEditReplyText}
//                             multiline
//                         />
//                         <View style={styles.modalActions}>
//                             <Button title="Save" onPress={handleSaveEditReply} />
//                             <Button
//                                 title="Cancel"
//                                 onPress={() => {
//                                     setEditingReply(null);
//                                     setEditReplyText('');
//                                 }}
//                             />
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//
//             {/* Post Detail Modal (For both own and other user's posts) */}
//             <Modal visible={postDetailModalVisible} animationType="slide" transparent={true}>
//                 <View style={styles.modalContainer}>
//                     <View style={[styles.modalContent, { maxHeight: Dimensions.get('window').height * 0.8 }]}>
//                         {selectedPostDetail && (
//                             <>
//                                 {selectedPostDetail.mediaType === 'image' ? (
//                                     <Image source={{ uri: selectedPostDetail.mediaUri }} style={styles.detailImage} />
//                                 ) : (
//                                     <View style={styles.detailImage}>
//                                         <Text style={{ color: '#fff', textAlign: 'center' }}>Video Placeholder</Text>
//                                     </View>
//                                 )}
//                                 <Text style={styles.postDescription}>{selectedPostDetail.description}</Text>
//                                 <Text style={styles.commentsHeading}>Comments</Text>
//                                 <FlatList
//                                     data={selectedPostDetail.comments}
//                                     keyExtractor={(item) => item.id}
//                                     renderItem={renderComment}
//                                     style={styles.commentsContainer}
//                                 />
//                                 <View style={styles.detailCommentInputContainer}>
//                                     <TextInput
//                                         style={styles.detailCommentInput}
//                                         placeholder="Add a comment..."
//                                         value={detailNewComment}
//                                         onChangeText={setDetailNewComment}
//                                     />
//                                     <Button title="Comment" onPress={handleAddDetailComment} />
//                                 </View>
//                             </>
//                         )}
//                         <Button
//                             title="Close"
//                             onPress={() => {
//                                 setSelectedPostDetail(null);
//                                 setDetailNewComment('');
//                                 setReplyText({});
//                                 setPostDetailModalVisible(false);
//                             }}
//                         />
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     );
// };
//
// export default Gallery;
//
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 160 },
//     flatListContent: { width: '80%', alignSelf: 'center', paddingBottom: 100 },
//     headerContainer: {
//         width: '100%',
//         height: 160,
//         backgroundColor: '#fff',
//         padding: 20,
//         position: 'absolute',
//         top: 0,
//         zIndex: 10,
//         elevation: 4,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//     },
//     headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//     headerLeft: { flexDirection: 'row', alignItems: 'center' },
//     infoContainer: { marginLeft: 12 },
//     profilePicture: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#e0e0e0' },
//     statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
//     statCount: { fontSize: 16, fontWeight: 'bold', color: '#333', marginHorizontal: 10 },
//     fullName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//     usernameHeader: { fontSize: 14, color: '#777' },
//     shortDescription: { fontSize: 12, color: '#555', marginTop: 4 },
//     locationText: { fontSize: 14, color: '#888' },
//     followButton: { backgroundColor: '#3498db', padding: 8, borderRadius: 20 },
//     unfollowButton: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 20 },
//     followButtonText: { color: '#fff', fontWeight: 'bold' },
//     newPostButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 20, alignSelf: 'center', marginTop: 10 },
//     newPostButtonText: { color: '#fff', fontWeight: 'bold' },
//     postContainer: {
//         width: (Dimensions.get('window').width * 0.8) / 3 - 4,
//         margin: 2,
//         aspectRatio: 1,
//         position: 'relative',
//     },
//     postImage: { width: '100%', height: '100%', borderRadius: 5 },
//     videoOverlay: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 3 },
//     videoText: { color: '#fff', fontSize: 10 },
//     actionOverlay: {
//         position: 'absolute',
//         bottom: 5,
//         right: 5,
//         backgroundColor: 'rgba(255,255,255,0.8)',
//         flexDirection: 'row',
//         borderRadius: 5,
//     },
//     actionText: { marginHorizontal: 5, fontSize: 12 },
//     modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
//     modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
//     modalTitle: { fontSize: 20, marginBottom: 15, textAlign: 'center', fontWeight: '600', color: '#333' },
//     mediaButton: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
//     mediaButtonText: { fontSize: 14, color: '#333' },
//     previewImage: { width: '100%', height: 200, marginBottom: 12, borderRadius: 8 },
//     input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: '#333' },
//     sectionTitle: { fontSize: 16, marginVertical: 12, fontWeight: '600', color: '#333' },
//     categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
//     categoryButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, marginRight: 6, marginBottom: 6 },
//     categoryButtonSelected: { backgroundColor: '#3498db', borderColor: '#3498db' },
//     categoryText: { fontSize: 12, color: '#333' },
//     categoryTextSelected: { color: '#fff' },
//     modalActions: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
//     detailImage: { width: '100%', height: 250, borderRadius: 8, marginBottom: 12, backgroundColor: '#000' },
//     postDescription: { fontSize: 14, padding: 8, color: '#333', marginBottom: 12 },
//     commentsHeading: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
//     commentsContainer: { maxHeight: 150, marginBottom: 12 },
//     commentContainer: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
//     commentText: { fontSize: 14, color: '#333' },
//     commentActions: { flexDirection: 'row', marginTop: 4 },
//     commentActionText: { marginHorizontal: 4, fontSize: 12 },
//     replyContainer: { marginLeft: 20, paddingVertical: 4 },
//     replyText: { fontSize: 12, color: '#555' },
//     replyInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
//     replyInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, fontSize: 12 },
//     detailCommentInputContainer: { flexDirection: 'row', alignItems: 'center' },
//     detailCommentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginRight: 10, fontSize: 14, color: '#333' },
// });
//
