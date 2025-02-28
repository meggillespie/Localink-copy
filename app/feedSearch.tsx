// app/feedSearch.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    getDoc,
    doc,
    limit,
} from 'firebase/firestore';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

// Define types
type Post = {
    id: string;
    ownerId: string;
    mediaType: 'image' | 'video';
    mediaUri: string;
    tags: string[];
    description: string;
    likes: string[];
    comments: any[];
    createdAt: any;
    aiScore?: number;
};

interface ProfileData {
    id?: string;
    profileType: 'personal' | 'business';
    fullName?: string;
    username?: string;
    businessName?: string;
    businessPhone?: string;
    businessEmail?: string;
    servicesOffered?: string[];
    age?: string;
    gender?: string;
    profilePicture?: string;
    city: string;
    state: string;
    zipCode: string;
    interests?: string[];
    shortDescription?: string;
    aiScore?: number;
}

// OpenAI Integration
const OPENAI_API_KEY = 'my-api-key'; // Replace with actual key
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const MAX_CACHE_SIZE = 1000;
const embeddingCache: { [key: string]: number[] } = {};

async function getOpenAIEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const uncachedTexts = texts.filter((text) => !embeddingCache[text]);
    if (uncachedTexts.length === 0) return texts.map((text) => embeddingCache[text]);

    try {
        const response = await fetch(OPENAI_EMBEDDING_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: uncachedTexts,
            }),
        });
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        const embeddings = data.data.map((d: any) => d.embedding);

        if (Object.keys(embeddingCache).length + uncachedTexts.length > MAX_CACHE_SIZE) {
            const keysToRemove = Object.keys(embeddingCache).slice(0, uncachedTexts.length);
            keysToRemove.forEach((key) => delete embeddingCache[key]);
        }
        uncachedTexts.forEach((text, i) => (embeddingCache[text] = embeddings[i]));
        return texts.map((text) => embeddingCache[text]);
    } catch (error) {
        console.error('Error fetching embeddings:', error);
        return texts.map(() => Array(1536).fill(0));
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return normA && normB ? dot / (normA * normB) : 0;
}

async function getSimilarityScore(text1: string, text2: string): Promise<number> {
    if (!text1 || !text2) return 0.5;
    const [embedding1, embedding2] = await getOpenAIEmbeddingsBatch([text1, text2]);
    return cosineSimilarity(embedding1, embedding2);
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

// Filtering functions
const filterPosts = async (
    posts: Post[],
    filters: any,
    currentUser: ProfileData,
    userCache: { [key: string]: ProfileData }
): Promise<Post[]> => {
    const filteredPosts = await Promise.all(
        posts.map(async (post) => {
            const searchTextLower = filters.searchText?.toLowerCase() || '';
            const matchesSearch = searchTextLower
                ? post.description.toLowerCase().includes(searchTextLower)
                : true;
            const matchesInterests =
                filters.interests.length > 0
                    ? filters.interests.some((interest: string) => post.tags.includes(interest))
                    : true;
            const notOwnPost = post.ownerId !== auth.currentUser?.uid;

            let owner: ProfileData | undefined = userCache[post.ownerId];
            if (!owner) {
                const ownerDoc = await getDoc(doc(db, 'users', post.ownerId));
                owner = ownerDoc.exists() ? (ownerDoc.data() as ProfileData) : undefined;
                if (owner) userCache[post.ownerId] = owner;
            }

            const cityLower = filters.city?.toLowerCase() || '';
            const matchesCity = cityLower
                ? owner?.city?.toLowerCase().includes(cityLower) || false
                : true;
            const stateLower = filters.state?.toLowerCase() || '';
            const matchesState = stateLower
                ? owner?.state?.toLowerCase().includes(stateLower) || false
                : true;
            const genderLower = filters.gender?.toLowerCase().trim() || '';
            const matchesGender = genderLower
                ? owner?.gender?.toLowerCase().trim() === genderLower
                : true;
            const age = parseInt(owner?.age || '0', 10);
            const minAge = parseInt(filters.ageMin, 10) || 0;
            const maxAge = parseInt(filters.ageMax, 10) || Infinity;
            const matchesAge = age >= minAge && (maxAge === Infinity || age <= maxAge);

            return (
                matchesSearch &&
                matchesInterests &&
                notOwnPost &&
                matchesCity &&
                matchesState &&
                matchesGender &&
                matchesAge
            )
                ? post
                : null;
        })
    );

    return filteredPosts.filter((post): post is Post => post !== null);
};

const filterUsers = (users: ProfileData[], filters: any, currentUser: ProfileData): ProfileData[] => {
    return users.filter((user) => {
        const searchTextLower = filters.searchText?.toLowerCase() || '';
        const matchesSearch = searchTextLower
            ? (user.fullName?.toLowerCase().includes(searchTextLower) ||
                user.username?.toLowerCase().includes(searchTextLower))
            : true;
        const matchesInterests =
            filters.interests.length > 0
                ? user.interests?.some((interest) => filters.interests.includes(interest))
                : true;
        const cityLower = filters.city?.toLowerCase() || '';
        const matchesCity = cityLower ? user.city?.toLowerCase().includes(cityLower) : true;
        const stateLower = filters.state?.toLowerCase() || '';
        const matchesState = stateLower ? user.state?.toLowerCase().includes(stateLower) : true;
        const genderLower = filters.gender?.toLowerCase().trim() || '';
        const matchesGender = genderLower
            ? user.gender?.toLowerCase().trim() === genderLower
            : true;
        const age = parseInt(user.age || '0', 10);
        const minAge = parseInt(filters.ageMin, 10) || 0;
        const maxAge = parseInt(filters.ageMax, 10) || Infinity;
        const matchesAge = age >= minAge && (maxAge === Infinity || age <= maxAge);
        const notCurrentUser = user.username !== currentUser.username;

        return (
            matchesSearch &&
            matchesInterests &&
            matchesCity &&
            matchesState &&
            matchesGender &&
            matchesAge &&
            notCurrentUser
        );
    });
};

// AI Scoring functions
const scorePostAdvanced = async (
    post: Post,
    currentUser: ProfileData,
    filters: any,
    userCache: { [key: string]: ProfileData },
    weights = { interests: 15, engagement: 0.5, location: 20, demographics: 10, nlp: 100 }
): Promise<number> => {
    let baseScore = 0;

    const engagementScore = (post.likes.length + post.comments.length) * weights.engagement;

    const relevantInterests = filters.interests.length > 0 ? filters.interests : currentUser.interests || [];
    if (relevantInterests.length > 0) {
        relevantInterests.forEach((interest) => {
            if (post.tags.includes(interest)) baseScore += weights.interests;
            if (post.description.toLowerCase().includes(interest.toLowerCase()))
                baseScore += weights.interests / 3;
        });
    }

    let owner: ProfileData | undefined = userCache[post.ownerId];
    if (!owner) {
        const ownerDoc = await getDoc(doc(db, 'users', post.ownerId));
        owner = ownerDoc.exists() ? (ownerDoc.data() as ProfileData) : undefined;
        if (owner) userCache[post.ownerId] = owner;
    }

    if (owner) {
        if (
            owner.city.toLowerCase() === (filters.city?.toLowerCase() || currentUser.city.toLowerCase())
        )
            baseScore += weights.location;
        if (
            owner.state.toLowerCase() ===
            (filters.state?.toLowerCase() || currentUser.state.toLowerCase())
        )
            baseScore += weights.location / 2;

        if (filters.gender) {
            if (owner.gender?.toLowerCase().trim() === filters.gender.toLowerCase().trim())
                baseScore += weights.demographics;
        }
        if (filters.ageMin || filters.ageMax) {
            const age = parseInt(owner.age || '0', 10);
            const minAge = parseInt(filters.ageMin, 10) || 0;
            const maxAge = parseInt(filters.ageMax, 10) || Infinity;
            if (age >= minAge && (maxAge === Infinity || age <= maxAge))
                baseScore += weights.demographics;
        }
    }

    const nlpScore = await getSimilarityScore(post.description, currentUser.shortDescription || '');
    return baseScore + engagementScore + nlpScore * weights.nlp;
};

const scoreUserAdvanced = async (
    user: ProfileData,
    currentUser: ProfileData,
    weights = { interests: 15, location: 20, nlp: 100 }
): Promise<number> => {
    let baseScore = 0;
    if (currentUser.profileType === 'personal' && user.interests && currentUser.interests) {
        const common = user.interests.filter((i) => currentUser.interests!.includes(i));
        baseScore += common.length * weights.interests;
    } else if (user.servicesOffered && currentUser.servicesOffered) {
        const commonServices = user.servicesOffered.filter((s) =>
            currentUser.servicesOffered!.includes(s)
        );
        baseScore += commonServices.length * weights.interests;
    }
    if (user.city.toLowerCase() === currentUser.city.toLowerCase()) baseScore += weights.location;
    if (user.state.toLowerCase() === currentUser.state.toLowerCase())
        baseScore += weights.location / 2;
    const nlpScore = await getSimilarityScore(
        user.shortDescription || '',
        currentUser.shortDescription || ''
    );
    return baseScore + nlpScore * weights.nlp;
};

const applyAIRecommendationsToPosts = async (
    posts: Post[],
    currentUser: ProfileData,
    filters: any,
    userCache: { [key: string]: ProfileData }
): Promise<Post[]> => {
    const postsWithScores = await Promise.all(
        posts.map(async (post) => ({
            ...post,
            aiScore: await scorePostAdvanced(post, currentUser, filters, userCache),
        }))
    );
    return postsWithScores.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
};

const applyAIRecommendationsToUsers = async (
    users: ProfileData[],
    currentUser: ProfileData
): Promise<ProfileData[]> => {
    const usersWithScores = await Promise.all(
        users.map(async (user) => ({
            ...user,
            aiScore: await scoreUserAdvanced(user, currentUser),
        }))
    );
    return usersWithScores.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
};

// Memoized ListHeader Component
const ListHeader = React.memo(
    ({
         activeTab,
         setActiveTab,
         searchText,
         setSearchText,
         filterInterests,
         setFilterInterests,
         filterCity,
         setFilterCity,
         filterState,
         setFilterState,
         ageRange,
         setAgeRange,
         filterGender,
         setFilterGender,
         clearFilters,
     }: {
        activeTab: 'posts' | 'users';
        setActiveTab: (tab: 'posts' | 'users') => void;
        searchText: string;
        setSearchText: (text: string) => void;
        filterInterests: string[];
        setFilterInterests: (interests: string[]) => void;
        filterCity: string;
        setFilterCity: (city: string) => void;
        filterState: string;
        setFilterState: (state: string) => void;
        ageRange: [number, number];
        setAgeRange: (range: [number, number]) => void;
        filterGender: string;
        setFilterGender: (gender: string) => void;
        clearFilters: () => void;
    }) => {
        const [filtersVisible, setFiltersVisible] = useState(false);
        const availableInterests = [
            'Travel',
            'Food',
            'Fashion',
            'Sports',
            'Music',
            'Fitness',
            'Coding',
            'MMA',
            'Hiking',
        ];

        return (
            <View style={styles.headerContainer}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Text style={styles.tabButtonText}>Posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]}
                        onPress={() => setActiveTab('users')}
                    >
                        <Text style={styles.tabButtonText}>Users</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.filterHeader}
                    onPress={() => setFiltersVisible(!filtersVisible)}
                >
                    <Text style={styles.filterHeaderText}>
                        {filtersVisible ? 'Hide Filters' : 'Show Filters'}
                    </Text>
                </TouchableOpacity>
                {filtersVisible && (
                    <ScrollView style={styles.filterContent}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search..."
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <View style={styles.filterContainer}>
                            <Text style={styles.filterLabel}>Interests</Text>
                            <View style={styles.filterOptions}>
                                {availableInterests.map((interest) => (
                                    <TouchableOpacity
                                        key={interest}
                                        style={[
                                            styles.filterButton,
                                            filterInterests.includes(interest) && styles.filterButtonActive,
                                        ]}
                                        onPress={() =>
                                            setFilterInterests((prev) =>
                                                prev.includes(interest)
                                                    ? prev.filter((i) => i !== interest)
                                                    : [...prev, interest]
                                            )
                                        }
                                    >
                                        <Text style={styles.filterButtonText}>{interest}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.filterContainer}>
                            <Text style={styles.filterLabel}>Location</Text>
                            <View style={styles.locationFilters}>
                                <TextInput
                                    style={styles.locationInput}
                                    placeholder="City"
                                    value={filterCity}
                                    onChangeText={setFilterCity}
                                />
                                <TextInput
                                    style={styles.locationInput}
                                    placeholder="State"
                                    value={filterState}
                                    onChangeText={setFilterState}
                                />
                            </View>
                        </View>
                        <View style={styles.filterContainer}>
                            <Text style={styles.filterLabel}>Age Range: {ageRange[0]} - {ageRange[1]}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={100}
                                step={1}
                                value={ageRange[0]}
                                onValueChange={(value) => setAgeRange([Math.round(value), ageRange[1]])}
                                minimumTrackTintColor="#3498db"
                                thumbTintColor="#3498db"
                            />
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={100}
                                step={1}
                                value={ageRange[1]}
                                onValueChange={(value) => setAgeRange([ageRange[0], Math.round(value)])}
                                minimumTrackTintColor="#3498db"
                                thumbTintColor="#3498db"
                            />
                        </View>
                        <View style={styles.filterContainer}>
                            <Text style={styles.filterLabel}>Gender</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={filterGender}
                                    onValueChange={(itemValue) => setFilterGender(itemValue as string)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="All" value="" />
                                    <Picker.Item label="Male" value="male" />
                                    <Picker.Item label="Female" value="female" />
                                    <Picker.Item label="Non-binary" value="non-binary" />
                                </Picker>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Text style={styles.clearButtonText}>Clear Filters</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>
        );
    }
);

const FeedSearch: React.FC = () => {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
    const [isLoading, setIsLoading] = useState(false);
    const [userCache] = useState<{ [key: string]: ProfileData }>({}); // Cache for owner profiles

    const [searchText, setSearchText] = useState('');
    const [filterInterests, setFilterInterests] = useState<string[]>([]);
    const [filterCity, setFilterCity] = useState('');
    const [filterState, setFilterState] = useState('');
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
    const [filterGender, setFilterGender] = useState('');

    const debouncedSearchText = useDebounce(searchText, 300);
    const debouncedFilterCity = useDebounce(filterCity, 300);
    const debouncedFilterState = useDebounce(filterState, 300);
    const debouncedAgeMin = useDebounce(ageRange[0].toString(), 300);
    const debouncedAgeMax = useDebounce(ageRange[1].toString(), 300);
    const debouncedFilterGender = useDebounce(filterGender, 300);

    const [rawPosts, setRawPosts] = useState<Post[]>([]);
    const [rawUsers, setRawUsers] = useState<ProfileData[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<ProfileData[]>([]);

    useEffect(() => {
        const fetchProfile = async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setUserProfile(docSnap.data() as ProfileData);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!userProfile?.interests?.length || !auth.currentUser?.uid) return;
        const postsQuery = query(
            collection(db, 'posts'),
            where('tags', 'array-contains-any', userProfile.interests),
            where('ownerId', '!=', auth.currentUser.uid),
            orderBy('ownerId'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        const unsubscribe = onSnapshot(
            postsQuery,
            (snapshot) => {
                const postsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Post[];
                setRawPosts(postsData);
            },
            (error) => console.error('Error fetching posts:', error)
        );
        return () => unsubscribe();
    }, [userProfile]);

    useEffect(() => {
        if (!userProfile?.username) return;
        const usersQuery = query(
            collection(db, 'users'),
            where('username', '!=', userProfile.username),
            limit(500)
        );
        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const usersData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as ProfileData[];
                setRawUsers(usersData);
            },
            (error) => console.error('Error fetching users:', error)
        );
        return () => unsubscribe();
    }, [userProfile]);

    const filters = useMemo(() => ({
        searchText: debouncedSearchText,
        interests: filterInterests,
        city: debouncedFilterCity,
        state: debouncedFilterState,
        gender: debouncedFilterGender,
        ageMin: debouncedAgeMin,
        ageMax: debouncedAgeMax,
    }), [
        debouncedSearchText,
        filterInterests,
        debouncedFilterCity,
        debouncedFilterState,
        debouncedFilterGender,
        debouncedAgeMin,
        debouncedAgeMax,
    ]);

    useEffect(() => {
        if (!userProfile) return;
        const processData = async () => {
            setIsLoading(true);
            const filteredPostsData = await filterPosts(rawPosts, filters, userProfile, userCache);
            const filteredUsersData = filterUsers(rawUsers, filters, userProfile);
            const [sortedPosts, sortedUsers] = await Promise.all([
                applyAIRecommendationsToPosts(filteredPostsData, userProfile, filters, userCache),
                applyAIRecommendationsToUsers(filteredUsersData, userProfile),
            ]);
            setFilteredPosts(sortedPosts);
            setFilteredUsers(sortedUsers);
            setIsLoading(false);
        };
        processData();
    }, [rawPosts, rawUsers, filters, userProfile]);

    const clearFilters = useCallback(() => {
        setSearchText('');
        setFilterInterests([]);
        setFilterCity('');
        setFilterState('');
        setAgeRange([0, 100]);
        setFilterGender('');
    }, []);

    const renderPostItem = ({ item }: { item: Post }) => (
        <TouchableOpacity style={styles.postGridItem}>
            <Image source={{ uri: item.mediaUri }} style={styles.postGridImage} />
            {item.likes.length + item.comments.length > 20 && (
                <View style={styles.trendingBadge}>
                    <Text style={styles.trendingText}>Trending</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderUserItem = ({ item }: { item: ProfileData }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => router.push(`/gallery?userId=${item.id}`)}
        >
            <Image
                source={{ uri: item.profilePicture || 'https://via.placeholder.com/150' }}
                style={styles.userImage}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName || item.username}</Text>
                <Text style={styles.userLocation}>
                    {item.city}, {item.state}
                </Text>
                <Text style={styles.userInterests}>
                    {item.interests?.length
                        ? `Interests: ${item.interests.join(', ')}`
                        : 'No interests listed'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const dataToRender = activeTab === 'posts' ? filteredPosts : filteredUsers;
    const renderItem = activeTab === 'posts' ? renderPostItem : renderUserItem;
    const numColumns = activeTab === 'posts' ? 3 : 1;

    return (
        <FlatList
            data={dataToRender}
            keyExtractor={(item) => item.id || ''}
            renderItem={renderItem}
            numColumns={numColumns}
            contentContainerStyle={styles.listContainer}
            key={numColumns.toString()}
            ListHeaderComponent={
                <ListHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    filterInterests={filterInterests}
                    setFilterInterests={setFilterInterests}
                    filterCity={filterCity}
                    setFilterCity={setFilterCity}
                    filterState={filterState}
                    setFilterState={setFilterState}
                    ageRange={ageRange}
                    setAgeRange={setAgeRange}
                    filterGender={filterGender}
                    setFilterGender={setFilterGender}
                    clearFilters={clearFilters}
                />
            }
            stickyHeaderIndices={[0]}
            ListFooterComponent={
                isLoading ? <ActivityIndicator size="small" color="#3498db" /> : null
            }
            ListEmptyComponent={
                isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3498db" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No results found.</Text>
                )
            }
        />
    );
};

export default FeedSearch;

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    headerContainer: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#ddd',
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeTabButton: {
        backgroundColor: '#3498db',
    },
    tabButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterHeader: {
        padding: 10,
        backgroundColor: '#3498db',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    filterHeaderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    filterContent: {
        flexGrow: 0,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    filterContainer: {
        marginBottom: 15,
    },
    filterLabel: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        margin: 3,
    },
    filterButtonActive: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    filterButtonText: {
        color: '#333',
        fontSize: 12,
    },
    locationFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    locationInput: {
        flex: 0.48,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    picker: {
        height: 40,
        width: '100%',
    },
    clearButton: {
        padding: 10,
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingBottom: 100,
    },
    postGridItem: {
        flex: 1,
        margin: 2,
        aspectRatio: 1,
    },
    postGridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    trendingBadge: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: 'red',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    trendingText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    userItem: {
        backgroundColor: '#fff',
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userLocation: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    userInterests: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#777',
        marginTop: 20,
    },
});