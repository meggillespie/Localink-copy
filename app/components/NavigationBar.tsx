// app/components/NavigationBar.tsx
import React from 'react';
import { HStack, Pressable, Text, Icon, Center } from 'native-base';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavigationBar() {
    const router = useRouter();

    return (
        <HStack
            bg="white"
            borderTopWidth={1}
            borderColor="gray.200"
            py={2}
            justifyContent="space-around"
            alignItems="center"
        >
            <Pressable onPress={() => router.push('/notifications')}>
                <Center>
                    <Icon as={Ionicons} name="notifications-outline" size="lg" color="black" />
                    <Text fontSize="xs" color="black">Notifications</Text>
                </Center>
            </Pressable>
            <Pressable onPress={() => router.push('/feedSearch')}>
                <Center>
                    <Icon as={Ionicons} name="grid-outline" size="lg" color="black" />
                    <Text fontSize="xs" color="black">Feed</Text>
                </Center>
            </Pressable>
            {/* New Create Post Tab */}
            <Pressable onPress={() => router.push('/createPost')}>
                <Center>
                    <Icon as={Ionicons} name="add-circle-outline" size="lg" color="black" />
                    <Text fontSize="xs" color="black">Create</Text>
                </Center>
            </Pressable>
            <Pressable onPress={() => router.push('/gallery')}>
                <Center>
                    <Icon as={Ionicons} name="images-outline" size="lg" color="black" />
                    <Text fontSize="xs" color="black">Gallery</Text>
                </Center>
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
                <Center>
                    <Icon as={Ionicons} name="person-outline" size="lg" color="black" />
                    <Text fontSize="xs" color="black">Profile</Text>
                </Center>
            </Pressable>
        </HStack>
    );
}
