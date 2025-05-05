
import { GoogleSignin  } from "@react-native-google-signin/google-signin"



export const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices()
      // Sign out first to clear any existing sessions
      await GoogleSignin.signOut()
      const userInfo = await GoogleSignin.signIn()
      if (!userInfo || !userInfo.data || !userInfo.data.scopes) {
        console.log('GoogleSignIn error', 'There was some issue with getting id token', userInfo)
        return
      }

      console.log(userInfo)

  } catch (error) {
    // We might want to provide this error information to an error reporting service
    console.error('GoogleSignIn error', error)
  }
}
