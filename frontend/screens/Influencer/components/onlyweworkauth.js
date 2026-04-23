import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AddHandlesStyles } from "./AddHandle.scss";
import { useAlert } from "../../../util/AlertContext";

WebBrowser.maybeCompleteAuthSession();

const FormField = ({
  label,
  placeholder,
  value,
  setValue,
  isVerified,
  handleVerify,
}) => {
  return (
    <View style={styles.formField}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          editable={!isVerified}
        />
      </View>
      <View style={styles.verifyContainer}>
        <TouchableOpacity
          style={[styles.verifyButton, isVerified && styles.verifiedButton]}
          onPress={handleVerify}
          disabled={isVerified}
        >
          <Image
            style={styles.verifyIcon}
            contentFit="cover"
            source={
              isVerified
                ? require("../../../assets/verified_symbol.png")
                : require("../../../assets/verify_symbol.png")
            }
          />
          <Text style={styles.verifyText}>
            {isVerified ? "Verified" : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AddHandles = ({ route, navigation }) => {
  const [verifiedAccounts, setVerifiedAccounts] = useState([]);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const { price, follower, photo, isCompleted, redirect, email } = route.params || {};
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [youtubeData, setYoutubeData] = useState(null);
  const [youtubeAnalytics, setYoutubeAnalytics] = useState(null);
  const  {showAlert} = useAlert()
  let userData;
  AsyncStorage.clear();
  const [ytVerified, setYtVerified] = useState({
    email: "",
    channel: "",
    verified: false,
  });

  const [instagramInfo, setInstagramInfo] = useState({
    username: "",
    email: "",
  });

  const [request, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId:
      "329932494226-70dt8rglfndtp9lulruvn1c3u8n9igmm.apps.googleusercontent.com",
    iosClientId:
      "329932494226-1ovccufudqbu1ppo8f1sdnuu7ffl32fr.apps.googleusercontent.com",
    webClientId:
      "329932494226-rkpausht5lbbm9umvspatt9973pco2q6.apps.googleusercontent.com",
    scopes: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });
  const uri = AuthSession.makeRedirectUri({ useProxy: true });
  console.log("uri", uri);
console.log(request)
  const [fbRequest, fbResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: "1010737297365787",
    scopes: ["public_profile", "email"], // you can add additional scopes here , "pages_read_engagement", "pages_read_user_content"
  });

  const checkFacebookTokenAndFetchInstagram = async () => {
    const fbAccessToken = await AsyncStorage.getItem("fbAccessToken");
    // if (fbAccessToken) {
    //   //handleInstagramEffect(fbAccessToken);
    // } else {
    //   promptFacebookAsync();
    // }
  };

  useEffect(() => {
    if (googleResponse && googleResponse.type === "success" && googleResponse.authentication) {
      handleGoogleEffect(googleResponse.authentication.accessToken).catch(error => {
        console.error("Google Effect Error:", error);
      });
    }
    console.log("googleResponse", googleResponse);
  }, [googleResponse]);
  
  useEffect(() => {
    if (fbResponse && fbResponse.type === "success" && fbResponse.authentication) {
      handleFacebookEffect(fbResponse.authentication.accessToken).catch(error => {
        console.error("Facebook Effect Error:", error);
      });
    }
  }, [fbResponse]);
  
  useEffect(() => {
    if (route.params?.social) {
      const { ig, tw, fb, yt, tt, verifyAccount } = route.params.social;
      if (ig) setInstagram(ig);
      if (tw) setTwitter(tw);
      if (fb) setFacebook(fb);
      if (yt) setYoutube(yt);
      if (tt) setTiktok(tt);
      if (verifyAccount) setVerifiedAccounts(verifyAccount);
    }
  }, [route.params?.social]);

  const handleGoogleEffect = async (accessToken) => {
    try {
      setToken(accessToken);
      await getUserInfo(accessToken);
      await fetchYouTubeData(accessToken);
      await fetchYouTubeAnalytics(accessToken);
    } catch (error) {
      console.error("Error during Google effect:", error);
    }
  };

  const handleFacebookEffect = async (accessToken) => {
    try {
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
      );
      const userInfo = await userInfoResponse.json();
      setUserInfo(userInfo);
      console.log("facebook", userInfo);
      await AsyncStorage.setItem("fbAccessToken", accessToken);
      if(userInfo.email == email){
        if(facebook){
          setVerifiedAccounts((prev) => [...prev, "facebook"]);
        }else{
          showAlert("Error","Data mismatch. Please provide facebook username")
        }
      }else{
        showAlert("Error","Email does not match the email provided")
      }
    //await fetchFacebookPageData(accessToken);
    } catch (error) {
      console.log("Error in handleFacebookEffect:", error);
    }
  };

  const handleInstagramEffect = async (accessToken) => {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );
  
      if (!response.ok) {
        // Handle HTTP errors
        console.log("Instagram API Error:", response);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const userInfo = await response.json();
      setInstagramInfo({
        username: userInfo.username || "",
        email: userInfo.email || "",
      });
      setUserInfo(userInfo);
      console.log("Instagram user info:", userInfo);
      await AsyncStorage.setItem("igAccessToken", accessToken);
      setVerifiedAccounts((prev) => [...prev, "instagram"]);
    } catch (error) {
      // Handle other errors (e.g., network issues)
      console.error("Error in handleInstagramEffect:", error);
    }
  }

  const getUserInfo = async (token) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = await response.json();
      userData = {
        email: user?.email,
        verified: user?.verified_email,
      };
      setYtVerified(userData);
      setUserInfo(user);
    } catch (error) {
      // Add your own error handler here
    }
  };

  const fetchYouTubeData = async (token) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      await AsyncStorage.setItem("ytAccessToken", token);
      userData.channel = data?.items[0]?.snippet?.customUrl ;
      setYtVerified(userData);
      setYoutubeData(data);
      if(userData.email ==email){
        if(userData.verified){
          if(userData.channel==youtube.toLowerCase()){
            setVerifiedAccounts((prev) => [...prev, "youtube"]);
          }
          else{
            showAlert("Error","Youtube channel does not match the email provided")
          }
        }
        else{
          showAlert("Error","Email not verified")
        }
      }
      else{
        showAlert("Error","Email does not match the email provided")
      }
    } catch (error) {
      // Add your own error handler here
    }
  };

  const fetchYouTubeAnalytics = async (token) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://youtubeanalytics.googleapis.com/v2/reports?dimensions=day&endDate=2024-07-30&ids=channel==MINE&metrics=views,likes,dislikes,comments&startDate=2023-01-01",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const analyticsData = await response.json();
      setYoutubeAnalytics(analyticsData);
    } catch (error) {
      // Add your own error handler here
    }
  };

  const fetchFacebookPageData = async (accessToken) => {
    try {
      // Fetch pages managed by the user
      const pagesResponse = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();
      if (pagesData && pagesData.data && pagesData.data.length > 0) {
        // Fetch data for the first page
        const pageId = pagesData.data[0].id;
        const pageDataResponse = await fetch(
          `https://graph.facebook.com/${pageId}?fields=id,name,about,fan_count,picture&access_token=${accessToken}`
        );
        const pageData = await pageDataResponse.json();
        console.log(pageData);
        // Save page data in state or AsyncStorage
      }
    } catch (error) {
      console.error("Error fetching Facebook page data:", error);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 24, height: 24 }}></View>
          <Text style={styles.headerText}>Add Accounts</Text>
          <View style={styles.headerIcon}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(redirect, {
                  price,
                  follower,
                  photo,
                  isCompleted,
                })
              }
            >
              <Image
                style={styles.headerImage}
                contentFit="cover"
                source={require("../../../assets/cross_symbol.png")}
              />
            </TouchableOpacity>
          </View>
        </View>

        <FormField
          label="Instagram"
          placeholder="username"
          value={instagram}
          setValue={setInstagram}
          isVerified={verifiedAccounts.includes("instagram")}
          handleVerify={checkFacebookTokenAndFetchInstagram}
        />
        <FormField
          label="Twitter"
          placeholder="@username"
          value={twitter}
          setValue={setTwitter}
          isVerified={verifiedAccounts.includes("twitter")}
        />
        <FormField
          label="Facebook"
          placeholder="username"
          value={facebook}
          setValue={setFacebook}
          isVerified={verifiedAccounts.includes("facebook")}
          handleVerify={promptFacebookAsync}
        />
        <FormField
          label="YouTube"
          placeholder="@channelName"
          value={youtube}
          setValue={setYoutube}
          isVerified={verifiedAccounts.includes("youtube")}
          handleVerify={promptGoogleAsync}
        />
        <FormField
          label="TikTok"
          placeholder="@username"
          value={tiktok}
          setValue={setTiktok}
          isVerified={verifiedAccounts.includes("tiktok")}
        />
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() =>
            navigation.navigate(redirect, {
              social: {
                ig: instagram,
                tw: twitter,
                fb: facebook,
                yt: youtube,
                tt: tiktok,
                verifyAccount: verifiedAccounts,
              },
              price,
              follower,
              photo,
              isCompleted: { ...isCompleted, addSocialProfile: verifiedAccounts.length!=0 && true },
            })
          }
        >
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(AddHandlesStyles);

