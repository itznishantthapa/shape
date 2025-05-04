import NetInfo from '@react-native-community/netinfo';

 export const checkNetStatus = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected
};
