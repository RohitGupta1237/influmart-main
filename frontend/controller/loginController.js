import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";
//It handle the Influencer login functionality
export const handleInfluencerLogin = async (username,password) => {
  if (username.trim() != "" && password.trim() != "") {
    try {
      const response = await fetch(`${API_ENDPOINT}/influencers/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json()
      // Only persist auth data when login actually succeeded — otherwise data.token
      // is undefined and AsyncStorage.setItem throws an ugly error popup.
      if (response.status == 200 && data?.token) {
        await AsyncStorage.setItem('token', data.token);
        if (data?.influencer?._id) await AsyncStorage.setItem('influencerId', data.influencer._id);
        await AsyncStorage.removeItem('brandId');
        return {success:true,message:data.message}
      }
      return {success:false,message:data?.message || "Invalid username or password"}
    }
    catch (error) {
      console.log(error)
      return {success:false,message:error.message}
    }
  }
  else
    return {success:false,message:"Please provide username and password"}
}

//It handle the brand login functionality
export const handleBrandLogin = async (email, password) => {
  if (email.trim() != "" && password.trim() != "") {
    try {
      const response = await axios.post(
          `${API_ENDPOINT}/brands/login`,
          { email, password }
      );
      const data = await response.data;
      // Only persist auth data when login actually succeeded.
      if (response.status == 200 && data?.token) {
        await AsyncStorage.setItem('token', data.token);
        if (data?.brandId) await AsyncStorage.setItem('brandId', data.brandId);
        await AsyncStorage.removeItem('influencerId');
        return { success: true, message: data.message, id: data?.brand?._id };
      }
      return { success: false, message: data?.message || "Invalid email or password" };
    } catch (error) {
      // axios throws on non-2xx (e.g. 401) — surface the server's message cleanly.
      const msg = error?.response?.data?.message || "Invalid email or password";
      return { success: false, message: msg };
    }






  } else
    return { success: false, message: "Please provide email and password" };
};