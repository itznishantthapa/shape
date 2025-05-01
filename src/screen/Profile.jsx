import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import ProfileEditModal from './ProfileEditModal';
import { useAppContext } from '../../context/AppContext';
import { getUserProfile } from '../utils/api';
import { API_URL } from '../utils/config';

const Profile = ({ navigation }) => {
  const { userState, userDispatch } = useAppContext();
  console.log('userState', userState.last_name , userState.first_name);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userState.first_name === '' && userState.last_name === '') {
        setEditModalVisible(true);
      }
    });

    return unsubscribe;
  }, [navigation, userState.first_name, userState.last_name]);

  useEffect(() => {

    getUserProfile(userDispatch);

    return () => {
      console.log('Profile component unmounted or dependencies changed');
    };
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={editModalVisible ? 'rgba(28, 24, 53, 0.9)' : '#eedd70'} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1c1835" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={24} color="#1c1835" />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: userState.profile_pic?.uri?.startsWith('file')
                ? userState.profile_pic.uri
                : `${API_URL}${userState.profile_pic}`,
            }}
            // source={{ uri:`${API_URL}${userState.profile_pic}` }} 
            // source={require('../assets/profile.webp')}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{userState.level}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.nameSection}>
          <View style={styles.nameIconContainer}>
            <Ionicons name="person" size={20} color="#9bcfab" />
          </View>
          <View style={styles.nameContent}>
            <Text style={styles.nameTitle}>Name</Text>
            <Text style={styles.nameValue}>{userState.first_name + " " + userState.last_name}</Text>
            <Text style={styles.usernameValue}>{userState.username}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Feather name="edit-2" size={18} color="#eedd70" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.messageSection}>
          <View style={styles.messageIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#eedd70" />
          </View>
          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>Bio</Text>
            <Text style={styles.messageValue}>{userState.bio}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1.2k</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>86</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={24} color="#643bc5" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark" size={24} color="#643bc5" />
        </TouchableOpacity>
      </View>


      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#eedd70',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#eedd70',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 15,
    right: '30%',
    backgroundColor: '#643bc5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#1c1835',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    elevation: 5,
    marginBottom: 20,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  nameIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1835',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9bcfab',
  },
  nameContent: {
    flex: 1,
    marginLeft: 15,
  },
  nameTitle: {
    color: '#9bcfab',
    fontSize: 14,
  },
  nameValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  usernameValue: {
    color: '#eedd70',
    fontSize: 14,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#643bc5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#643bc5',
    opacity: 0.3,
    marginVertical: 15,
  },
  messageSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1835',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eedd70',
  },
  messageContent: {
    flex: 1,
    marginLeft: 15,
  },
  messageTitle: {
    color: '#eedd70',
    fontSize: 14,
  },
  messageValue: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    backgroundColor: 'rgba(100, 59, 197, 0.2)',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9bcfab',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#643bc5',
    opacity: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eedd70',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 3,
  },
  primaryActionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#643bc5',
  },



});

export default Profile;