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
  PermissionsAndroid,
  Platform,
  Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { updateUserProfile } from '../utils/api';
import { API_URL } from '../utils/config';
import { launchImageLibrary } from 'react-native-image-picker';

const { height } = Dimensions.get('window');

const ProfileEditModal = ({ visible, onClose }) => {
  const { userState, userDispatch } = useAppContext();

  // Local state for form data
  const [formData, setFormData] = useState({
    first_name: userState.first_name,
    last_name: userState.last_name,
    level: userState.level,
    bio: userState.bio,
    profile_pic: userState.profile_pic
  });

  // Update local state when userState changes (e.g. when modal reopens)
  useEffect(() => {
    setFormData({
      first_name: userState.first_name,
      last_name: userState.last_name,
      level: userState.level,
      bio: userState.bio,
      profile_pic: userState.profile_pic
    });
  }, [userState]);

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

  const handleSave = async () => {
    try {
      // First update the database
      const result = await updateUserProfile(formData);
      if (result.success) {
        // If successful, update the context
        userDispatch({ type: 'UPDATE_USER', payload: formData });
    onClose();
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES ||
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Gallery Permission',
          message: 'App needs access to your gallery to pick images',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot access gallery without permission');
      return;
    }

    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const asset = response.assets?.[0];
        console.log('Selected Image URI:', asset.type);
        setFormData(prev => ({ ...prev, profile_pic: asset }));
      }
    });
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
                  <Text style={styles.headerTitle}>Setup Profile</Text>
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
                        source={{
                          uri: formData.profile_pic?.uri?.startsWith('file')
                            ? formData.profile_pic.uri
                            : `${API_URL}${formData.profile_pic}`,
                        }}
                        style={styles.profileImage}
                      />
                      <TouchableOpacity
                        style={styles.imageEditButton}
                        onPress={pickImage}
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
                            value={formData.first_name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
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
                            value={formData.last_name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                            placeholder="Last name"
                            placeholderTextColor="rgba(155, 207, 171, 0.6)"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Level</Text>
                      <View style={styles.levelSelector}>
                      <TouchableOpacity
                          style={styles.inputWrapper}
                        onPress={() => setShowLevelSelector(!showLevelSelector)}
                      >
                          <Text style={styles.levelText}>{formData.level || 'Select Level'}</Text>
                          <Feather 
                            name={showLevelSelector ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color="#9bcfab" 
                            style={styles.dropdownIcon} 
                          />
                      </TouchableOpacity>

                      {showLevelSelector && (
                          <ScrollView 
                            style={styles.levelOptionsContainer}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                          >
                          {levelOptions.map((level, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.levelOption,
                                  formData.level === level && styles.selectedLevelOption,
                                  index === levelOptions.length - 1 && { borderBottomWidth: 0 }
                              ]}
                              onPress={() => {
                                  setFormData(prev => ({ ...prev, level }));
                                setShowLevelSelector(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.levelOptionText,
                                    formData.level === level && styles.selectedLevelOptionText
                                ]}
                              >
                                {level}
                              </Text>
                                {formData.level === level && (
                                <Ionicons name="checkmark" size={16} color="#eedd70" />
                              )}
                            </TouchableOpacity>
                          ))}
                          </ScrollView>
                        )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Bio</Text>
                      <View style={[styles.inputWrapper, styles.bioInputWrapper]}>
                        <TextInput
                          style={[styles.input, styles.bioInput]}
                          value={formData.bio}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
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
    zIndex: 1,
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
    position: 'relative',
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
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(28, 24, 53, 0.95)',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
    overflow: 'hidden',
    elevation: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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