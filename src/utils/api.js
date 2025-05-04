// API endpoints for authentication
import { setCache } from './cache';
import { API_URL } from './config';
import { storeAuthTokens, storeUserEmail, getAccessToken, getRefreshToken } from './secureStorage';
import { getCache } from './cache';

// Function to send OTP to email
export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_URL}/send-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to send OTP'
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

// Function to verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to verify OTP'
      };
    }

    // If successful, store the tokens and user email
    if (data.tokens) {
      await Promise.all([
        storeAuthTokens(data.tokens),
        storeUserEmail(email)
      ]);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Function to set password using the stored token
export const setPassword = async (email, password) => {
  try {
    // Get the stored access token
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Authentication token not found. Please verify your email again.'
      };
    }

    const response = await fetch(`${API_URL}/set-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to set password'
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error setting password:', error);
    return { success: false, error: error.message || 'Failed to set password' };
  }
};

// Function to login with email and password
export const loginWithPassword = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to login'
      };
    }

    // If successful, store the tokens and user email
    if (data.tokens) {
      await Promise.all([
        storeAuthTokens(data.tokens),
        storeUserEmail(email)
      ]);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message || 'Failed to login' };
  }
};

//If the token is expired, Get New Token
export const inhaleTokens = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    console.error('No refresh token found');
    return;
  }

  console.log('Refresh token found, attempting to get access token from backend, api.js');
  const response = await fetch(`${API_URL}/get-tokens/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  console.log('here1')
  const data = await response.json();
  console.log('here2')
  console.log('Refresh response:', data);

  if (data.success) {
    console.log('Here3')
    await storeAuthTokens(data.tokens);

    console.log('here4')
    console.log('New access token stored');
  }

}



export const updateUserProfile = async (newState, retry = true) => {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Authentication token not found. Please login again.'
      };
    }

    const formData = new FormData();

    // Append only if fields exist
    if (newState.first_name) formData.append('first_name', newState.first_name);
    if (newState.last_name) formData.append('last_name', newState.last_name);
    if (newState.email) formData.append('email', newState.email);
    if (newState.username) formData.append('username', newState.username);
    if (newState.bio) formData.append('bio', newState.bio);
    if (newState.level) formData.append('level', newState.level);

    if (newState.profile_pic && typeof newState.profile_pic === 'object') {
      console.log('The newState.profile_pic is---------------------------------------------------------------------->',newState.profile_pic);
      formData.append('profile_pic', {
        uri: newState.profile_pic.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
    }

    const response = await fetch(`${API_URL}/save-user-info/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set 'Content-Type', let fetch handle it for FormData
      },
      body: formData,
    });

    if (response.status === 401 && retry) {
      await inhaleTokens();
      return await updateUserProfile(newState, false);
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to update profile'
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
};

//Get the user profile
export const getUserProfile = async (userDispatch,retry=true) => {
  const accessToken = await getAccessToken();
  try {
    const response = await fetch( `${API_URL}/get-me/`, {
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json',
       'Authorization': `Bearer ${accessToken}`
      },
    });


  if (response.status === 401 && retry) {
    console.log('Token expired, refreshing...')
    await inhaleTokens(); 
    getUserProfile(userDispatch,false);
    return; 
  }


    const data = await response.json();
    if (response.ok) {
      setCache('user', data.user);
      userDispatch({ type: 'SET_USER', payload: data.user });
    } else {
      console.error('Error saving user info:', data);
    }
  }
  catch (error) {
    console.error('Error saving user info:', error);
  }
}

// http://192.168.137.92:8000/get-private-chat/
// target_user=1
export const getPrivateChats = async (target_user,roomName,retry=true) => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${API_URL}/get-private-chat/?target_user=${encodeURIComponent(target_user)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
    });


    if (response.status === 401 && retry) {
      console.log('Token expired, refreshing...')
      await inhaleTokens(); 
      getPrivateChats(target_user,roomName,false);
      return; 
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch messages');
    }
    setCache(`private_chats_${roomName}`, data.messages)
    return data;
  } catch (error) {
    console.error('Error fetching private chats:', error);
    return { success: false, error: error.message };
  }
}

export const getUnreadMessages = async (retry=true) => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${API_URL}/get-all-unread-messages/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
    });

    if (response.status === 401 && retry) {
      console.log('Token expired, refreshing...')
      await inhaleTokens(); 
      getUnreadMessages(false);
      return; 
    }
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch messages');
    }



    return data;
  } catch (error) {
  
    return { success: false, error: error.message };
  }
}