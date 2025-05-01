import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { updateUserProfile } from '../utils/api';

const { height } = Dimensions.get('window');

const ProfileEditModal = ({ visible, onClose }) => {

  const {userState,userDispatch} = useAppContext();



  // Animation value for sliding up
  const [slideAnim] = useState(new Animated.Value(height));
  
  // Level selector state
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const levelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

  // Animate modal when visibility changes
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    updateUserProfile(userState)
    onClose();
  };

  const handleImageChange = () => {
    // Image picker functionality would be implemented here
    console.log('Change profile image');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContainer,
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
              >
                <View style={styles.handle} />
                
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Edit Profile</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <Feather name="x" size={22} color="#9bcfab" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Profile Image Section */}
                  <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                      <Image 
                         source={require('../assets/profile.webp')}
                        style={styles.profileImage}
                      />
                      <TouchableOpacity 
                        style={styles.imageEditButton}
                        onPress={handleImageChange}
                      >
                        <Feather name="camera" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.formContainer}>
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            value={userState.first_name}
                            onChangeText={(text) => userDispatch({ type: 'UPDATE_USER', payload: { first_name: text } })}
                            placeholder="First name"
                            placeholderTextColor="rgba(155, 207, 171, 0.6)"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            value={userState.last_name}
                            onChangeText={(text) => userDispatch({ type: 'UPDATE_USER', payload: { last_name: text } })}
                            placeholder="Last name"
                            placeholderTextColor="rgba(155, 207, 171, 0.6)"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Level</Text>
                      <TouchableOpacity 
                        style={styles.levelSelector}
                        onPress={() => setShowLevelSelector(!showLevelSelector)}
                      >
                        <View style={styles.inputWrapper}>
                          <Text style={styles.levelText}>{userState.level}</Text>
                          <Feather name="chevron-down" size={18} color="#9bcfab" style={styles.dropdownIcon} />
                        </View>
                      </TouchableOpacity>

                      {showLevelSelector && (
                        <View style={styles.levelOptionsContainer}>
                          {levelOptions.map((level, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.levelOption,
                                userState.level === level && styles.selectedLevelOption
                              ]}
                              onPress={() => {
                                userDispatch({ type: 'UPDATE_USER', payload: { level: level } })
                                setShowLevelSelector(false);
                              }}
                            >
                              <Text 
                                style={[
                                  styles.levelOptionText,
                                  userState.level === level && styles.selectedLevelOptionText
                                ]}
                              >
                                {level}
                              </Text>
                              {userState.level === level && (
                                <Ionicons name="checkmark" size={16} color="#eedd70" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Bio</Text>
                      <View style={[styles.inputWrapper, styles.bioInputWrapper]}>
                        <TextInput
                          style={[styles.input, styles.bioInput]}
                          value={userState.bio}
                          onChangeText={(text) => userDispatch({ type: 'UPDATE_USER', payload: { bio: text } })}
                          placeholder="Tell us about yourself..."
                          placeholderTextColor="rgba(155, 207, 171, 0.6)"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 24, 53, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1c1835',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%', // Takes up 50% of the screen
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Extra padding for iOS devices with home indicator
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
    borderBottomWidth: 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#643bc5',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 59, 197, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eedd70',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 59, 197, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#643bc5',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#643bc5',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1c1835',
  },
  formContainer: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9bcfab',
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 24, 53, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
    overflow: 'hidden',
  },
  bioInputWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#fff',
  },
  bioInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  levelSelector: {
    width: '100%',
  },
  levelText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownIcon: {
    paddingRight: 12,
  },
  levelOptionsContainer: {
    backgroundColor: 'rgba(28, 24, 53, 0.95)',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
    overflow: 'hidden',
    elevation: 5,
    maxHeight: 150,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 59, 197, 0.2)',
  },
  selectedLevelOption: {
    backgroundColor: 'rgba(100, 59, 197, 0.2)',
  },
  levelOptionText: {
    fontSize: 15,
    color: '#9bcfab',
  },
  selectedLevelOptionText: {
    color: '#eedd70',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#643bc5',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    shadowColor: '#643bc5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileEditModal;