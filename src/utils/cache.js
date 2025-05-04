import AsyncStorage from '@react-native-async-storage/async-storage';



export async function setCache(key, data) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        console.log(`Cache saved successfully for ${key}`);
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

export async function getCache(key){
    try {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        console.error('Error getting user data:', err);
      }
}

export async function clearCache(key){
    try {
        await AsyncStorage.removeItem(key);
        console.log(`Cache cleared successfully for ${key}`);
      } catch (err) {
        console.error('Error removing user data:', err);
      }
}


export const getAllStoredKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error('Error fetching keys:', error);
  }
};