import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppContext } from '../../context/AppContext'
import { getAccessToken } from '../utils/secureStorage'
import { Ionicons, Feather } from '@expo/vector-icons'
import { API_URL } from '../utils/config'
import { getPrivateChats, getUnreadMessages, inhaleTokens } from '../utils/api'
import { StatusBar } from 'expo-status-bar'
import { forEach, gt } from 'lodash'
import { getAllStoredKeys, getCache, setCache } from '../utils/cache'
import { checkNetStatus } from '../utils/netStatus'

const Chat = ({ navigation }) => {
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastMessages, setLastMessages] = useState({})

  useEffect(() => {
    // First fetch current user, then fetch all users
    const initializeData = async () => {
      try {
        setLoading(true);
        const user = await getCache('user')
        if(user){
          setCurrentUser(user)
          console.log('Found cached current user:', user.email);
        }
        
        await fetchUsers()
        // await fetchUnreadMessages()
      } catch (error) {
        console.error('Error initializing data:', error)
        setError('Failed to load chat data')
      } finally {
        setLoading(false)
        await fetchUnreadMessages()
      }
    }

    initializeData()
  }, [])

  // When current user or all users change, filter the user list
  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
      // Filter out the current user from the list
      const filtered = allUsers.filter(user => user.id !== currentUser.id)
      setFilteredUsers(filtered)
    }
  }, [currentUser, allUsers])

  // Filter users based on search query
  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
      const filtered = allUsers.filter(user => {
        // Filter out current user
        if (user.id === currentUser.id) return false
        
        // If no search query, include all users
        if (!searchQuery.trim()) return true
        
        // Search by name or email
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
        const email = user.email.toLowerCase()
        const query = searchQuery.toLowerCase()
        
        return fullName.includes(query) || email.includes(query)
      })
      
      setFilteredUsers(filtered)
    }
  }, [searchQuery, currentUser, allUsers])

  // const fetchCurrentUser = async (retry=true) => {
  //   try {
  //     const token = await getAccessToken()
  //     const response = await fetch(`${API_URL}/get-me/`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     })

  //     if (response.status === 401 && retry) {
  //       console.log('Token expired, refreshing...')
  //       await inhaleTokens(); 
  //       fetchCurrentUser(false);
  //       fetchUsers(false);
  //       return; 
  //     }

  //     const data = await response.json()
  //     if (data.success) {
  //       setCurrentUser(data.user)
  //       console.log('Current user fetched:', data.user.email)
  //     } else {
  //       console.error('Failed to fetch current user:', data)
  //     }
  //   } catch (error) {
  //     console.error('Error fetching current user:', error)
  //     throw error
  //   }
  // }

  const fetchUsers = async (retry = true) => {
    const netStatus = await checkNetStatus()
    if(!netStatus) return

    try {
      // Check cache first
      const cachedUsers = await getCache('all_users');
      
      if (cachedUsers) {
        console.log('Using cached users data:', cachedUsers.length);
        setAllUsers(cachedUsers);
        // Add this to force the filteredUsers update
        setFilteredUsers(cachedUsers.filter(user => user.id !== currentUser?.id));
        
        return;
      }

      // If no cache, fetch from API
      const token = await getAccessToken()
      const response = await fetch(`${API_URL}/get-all-users/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        console.log('API fetched users:', data.users.length);
        setAllUsers(data.users)
        // Add this to force the filteredUsers update
        setFilteredUsers(data.users.filter(user => user.id !== currentUser?.id));
        // Cache the users data
        await setCache('all_users', data.users)
        console.log('All users fetched and cached:', data.users.length)
      } else {
        console.error('Failed to fetch users:', data)
        setError('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
      throw error
    }
  }


  const fetchUnreadMessages = async () => { 
    // // Check if we have internet connection
    // const isOnline = navigator.onLine;
    // if (!isOnline) {
    //   console.log('No internet connection, skipping unread messages fetch');
    //   return;
    // }

    const netStatus = await checkNetStatus()
    if(!netStatus) return

    try {
      const unreadData = await getUnreadMessages()
 
      if (unreadData.success) {
        console.log('unreadData-->', unreadData)
        const unreadMessages = unreadData.unread_messages
        
        unreadMessages.forEach(async (message) => {
          const roomName = message.room_name
          const cachedMessages = await getCache(`private_chats_${roomName}`)
          console.log('cachedMessages-->',cachedMessages)
          if (cachedMessages) {
            // Create a Set of existing message IDs
            const ids = new Set(cachedMessages.map(msg => msg.id))
            
            // Only add the new message if its ID isn't in the cached messages
            const merged = ids.has(message.id) 
              ? cachedMessages 
              : [...cachedMessages, message]
            
            await setCache(`private_chats_${roomName}`, merged)
            console.log('cache updated and appended with roomName-->', roomName)
          } else {
            // If no cache exists, create new cache with just this message
            await setCache(`private_chats_${roomName}`, [message])
            console.log('new cache created for roomName-->', roomName)
          }
        })
      }else{
        console.log('No unread messages found')
      }
      
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  }

  const handleUserPress = async (user) => {
    if (!currentUser) return;
    
    // Generate room name based on user IDs
    const roomName = `chat_${Math.min(currentUser.id, user.id)}_${Math.max(currentUser.id, user.id)}`;

    try {
      // Check cache first
      const cachedMessages = await getCache(`private_chats_${roomName}`);
      
      if (cachedMessages) {
        console.log(`we have found cached messages for this ${roomName}, so we are not calling the api`)
        // If we have cached messages, use them directly
        navigation.navigate('Inbox', {
          user,
          roomName,
          currentUser,
          privateChats: cachedMessages
        });
      } else {
        // If no cache exists, fetch from API
        const privateChats = await getPrivateChats(user.id, roomName);
        if (privateChats.success) {
          navigation.navigate('Inbox', {
            user,
            roomName,
            currentUser,
            privateChats: privateChats.messages
          });
        }
      }
    } catch (error) {
      console.error('Error navigating to inbox:', error);
    }
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return '?';
  }

  const getRandomStatus = () => {
    const statuses = ['Online', 'Last seen 2h ago', 'Last seen yesterday', 'Offline'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  // Add this function to fetch last messages for all users
  const fetchLastMessages = async () => {
    const messages = {};
    for (const user of filteredUsers) {
      const roomName = `chat_${Math.min(currentUser.id, user.id)}_${Math.max(currentUser.id, user.id)}`;
      const cachedMessages = await getCache(`private_chats_${roomName}`);
      if (cachedMessages && cachedMessages.length > 0) {
        messages[user.id] = cachedMessages[0].message;
      }
    }
    setLastMessages(messages);
  };

  // Add this effect to fetch last messages when users are loaded
  useEffect(() => {
    if (filteredUsers.length > 0 && currentUser) {
      fetchLastMessages();
    }
  }, [filteredUsers, currentUser]);

  const renderUserItem = ({ item }) => {
    // Generate avatar color based on user id
    const colorIndex = item.id % 4;
    const colors = ['#643bc5', '#9bcfab', '#eedd70', '#ff7eb6'];
    const avatarColor = colors[colorIndex];
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          {item.profile_pic ? (
            <Image 
              source={{ uri: `${API_URL}/media/${item.profile_pic}` }} 
              style={styles.avatar}
              defaultSource={require('../assets/profile.webp')}
            />
          ) : (
            <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(item)}</Text>
            </View>
          )}
          <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>
              {item.first_name && item.last_name 
                ? `${item.first_name} ${item.last_name}` 
                : item.username}
            </Text>
            {item.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastActive}>Active now</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#643bc5" />
          <Text style={styles.loadingText}>Loading your chats...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#eedd70" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true)
              setError(null)
              fetchUsers().finally(() => setLoading(false))
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Add debug logging
  console.log('Render state:', {
    allUsersCount: allUsers.length,
    filteredUsersCount: filteredUsers.length,
    hasCurrentUser: !!currentUser
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#1c1835' />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Chats</Text>
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

export default Chat

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#1c1835',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 59, 197, 0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#eedd70',
    letterSpacing: 0.5,
  },
  listContainer: {
    padding: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(100, 59, 197, 0.08)',
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.12)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1c1835',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  levelBadge: {
    backgroundColor: 'rgba(238, 221, 112, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238, 221, 112, 0.3)',
  },
  levelText: {
    color: '#eedd70',
    fontSize: 12,
    fontWeight: '600',
  },
  lastActive: {
    fontSize: 13,
    color: '#9bcfab',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9bcfab',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#eedd70',
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#643bc5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})