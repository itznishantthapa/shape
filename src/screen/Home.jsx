import { StyleSheet, Text, View, StatusBar, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppContext } from '../../context/AppContext'

const Home = ({ navigation }) => {
  const { setStatusbarTheme, logout } = useAppContext()
  
  const handleLogout = async () => {
    try {
      // Use the logout function from context
      const success = await logout();
      
      if (success) {
        // Navigation will be handled automatically by App.jsx
        // due to the authenticated state change
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
        console.log('Successfully logged out');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'#fff'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.subtitle}>You've successfully verified your email!</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's Next?</Text>
          <Text style={styles.cardText}>
            Complete your profile and connect with others in your community.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logoutButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  }
})