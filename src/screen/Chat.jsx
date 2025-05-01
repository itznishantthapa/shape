import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppContext } from '../../context/AppContext'
import { getAccessToken } from '../utils/secureStorage'
import { Ionicons } from '@expo/vector-icons'
import { API_URL } from '../utils/config'
import { inhaleTokens } from '../utils/api'

const Chat = ({ navigation }) => {
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

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

  // When current user or all users change, filter the user list
  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
      // Filter out the current user from the list
      const filtered = allUsers.filter(user => user.id !== currentUser.id)
      setFilteredUsers(filtered)
    }
  }, [currentUser, allUsers])

  const fetchCurrentUser = async (retry=true) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(`${API_URL}/get-me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })


            /*
      If token is expired, try to refresh it and fetch users again
      Intrestingly, the backend returns a 401 status code for expired tokens
      */
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
      }
       else {
        console.error('Failed to fetch users:', data)
        setError('Failed to fetch users')
      }

    } catch{
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


  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0) : item.username.charAt(0)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.first_name +" "+ item.last_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true)
              setError(null)
              fetchCurrentUser().then(fetchUsers).finally(() => setLoading(false))
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users available</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
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
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
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
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
})