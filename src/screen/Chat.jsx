import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppContext } from '../../context/AppContext'
import { getAccessToken } from '../utils/secureStorage'
import { Ionicons, Feather } from '@expo/vector-icons'
import { API_URL } from '../utils/config'
import { inhaleTokens } from '../utils/api'
import { StatusBar } from 'expo-status-bar'

const Chat = ({ navigation }) => {
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // First fetch current user, then fetch all users
    const initializeData = async () => {
      try {
        await fetchCurrentUser()
        await fetchUsers()
      } catch (error) {
        console.error('Error initializing data:', error)
        setError('Failed to load chat data')
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])
  console.log('filteredUsers-->',filteredUsers)

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

  const fetchCurrentUser = async (retry=true) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(`${API_URL}/get-me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 && retry) {
        console.log('Token expired, refreshing...')
        await inhaleTokens(); 
        fetchCurrentUser(false);
        fetchUsers(false);
        return; 
      }

      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        console.log('Current user fetched:', data.user.email)
      } else {
        console.error('Failed to fetch current user:', data)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  }

  const fetchUsers = async (retry = true) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(`${API_URL}/get-all-users/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setAllUsers(data.users)
        console.log('All users fetched:', data.users.length)
      } else {
        console.error('Failed to fetch users:', data)
        setError('Failed to fetch users')
      }
    } catch {
      console.error('Error fetching users:')
      setError('Failed to fetch users')
      throw error
    }
  }

  const handleUserPress = (user) => {
    if (!currentUser) return
    
    // Generate room name based on user IDs
    const roomName = `chat_${Math.min(currentUser.id, user.id)}_${Math.max(currentUser.id, user.id)}`
    
    navigation.navigate('Inbox', {
      user,
      roomName,
      currentUser
    })
  }

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

  const renderUserItem = ({ item, index }) => {
    // Generate a consistent but random color based on user id
    const colorIndex = item.id % 4;
    const colors = ['#643bc5', '#9bcfab', '#eedd70', '#ff7eb6'];
    const avatarColor = colors[colorIndex];
    
    // Random last message for demo purposes
    const messages = [
      "Hey, how's it going?",
      "Did you finish the assignment?",
      "Let's meet up later!",
      "Check out this cool project",
      "Are you coming to the event?",
      "Thanks for your help!",
      "Can we talk about the project?",
      "Did you see the latest lecture?"
    ];
    
    const randomMessage = messages[item.id % messages.length];
    const status = getRandomStatus();
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
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
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {item.first_name && item.last_name 
                ? `${item.first_name} ${item.last_name}` 
                : item.username}
            </Text>
            <Text style={styles.timeStamp}>2:34 PM</Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {randomMessage}
            </Text>
            
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{Math.floor(Math.random() * 5) + 1}</Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{status}</Text>
            {item.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#643bc5" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
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
              fetchCurrentUser().then(fetchUsers).finally(() => setLoading(false))
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#eedd70' />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.newChatButton}>
            <Feather name="edit" size={22} color="#eedd70" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9bcfab" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(155, 207, 171, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={18} color="#9bcfab" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../assets/profile.webp')} 
            style={styles.emptyImage}
            defaultSource={require('../assets/profile.webp')}
          />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Start chatting with your classmates to see conversations here
          </Text>
          <TouchableOpacity style={styles.startChatButton}>
            <Text style={styles.startChatText}>Start a New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Chats</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 59, 197, 0.2)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#eedd70',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 59, 197, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 24, 53, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9bcfab',
  },
  seeAllText: {
    fontSize: 14,
    color: '#eedd70',
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
    borderRadius: 12,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(100, 59, 197, 0.1)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.2)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timeStamp: {
    fontSize: 12,
    color: '#9bcfab',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(155, 207, 171, 0.8)',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: '#eedd70',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#1c1835',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(238, 221, 112, 0.7)',
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(100, 59, 197, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    color: '#9bcfab',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: 'rgba(155, 207, 171, 0.3)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eedd70',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9bcfab',
    textAlign: 'center',
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: '#643bc5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})