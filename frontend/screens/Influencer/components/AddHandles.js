import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AddHandlesStyles } from "./AddHandle.scss";
import { useAlert } from "../../../util/AlertContext";
import {
  fetchRecentHighlightVideos,
  fetchYouTubeAnalytics,
  fetchYouTubeAnalyticsOverAll,
} from "../../../util/AuthFunction";
import { InfluencerSignUp } from "../../../controller/signupController";

WebBrowser.maybeCompleteAuthSession();

const API_ENDPOINT = "http://localhost:3000";

// Replace with your TikTok app Client Key from developers.tiktok.com
const TIKTOK_CLIENT_KEY = "YOUR_TIKTOK_CLIENT_KEY";

const tiktokDiscovery = {
  authorizationEndpoint: "https://www.tiktok.com/v2/auth/authorize/",
};

// Isolated in its own component so its hook state never conflicts with FacebookAuthManager
const GoogleAuthManager = forwardRef(({ onSuccess }, ref) => {
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "329932494226-70dt8rglfndtp9lulruvn1c3u8n9igmm.apps.googleusercontent.com",
    iosClientId: "329932494226-1ovccufudqbu1ppo8f1sdnuu7ffl32fr.apps.googleusercontent.com",
    webClientId: "329932494226-rkpausht5lbbm9umvspatt9973pco2q6.apps.googleusercontent.com",
    scopes: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });

  useImperativeHandle(ref, () => ({ prompt: () => promptAsync() }));

  useEffect(() => {
    if (response?.type === "success" && response.authentication) {
      onSuccess(
        response.authentication.accessToken,
        response.authentication.refreshToken || null
      );
    }
  }, [response]);

  return null;
});


const FormField = ({
  label,
  placeholder,
  value,
  setValue,
  isVerified,
  isUnverified,
  handleVerify,
}) => {
  const [disableButton, setDisableButton] = useState(true);
  useEffect(() => {
    if (value) {
      setDisableButton(false);
    } else {
      setDisableButton(true);
    }
  }, [value]);
  return (
    <View style={styles.formField}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          editable={!isVerified && !isUnverified}
        />
      </View>
      <View style={styles.verifyContainer}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (disableButton || isVerified || isUnverified) && styles.verifiedButton,
            isUnverified && styles.unverifiedButton,
          ]}
          onPress={handleVerify}
          disabled={disableButton || isVerified || isUnverified}
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
          <Text style={[styles.verifyText, isUnverified && styles.unverifiedText]}>
            {isVerified ? "Verified" : isUnverified ? "Unverified" : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AddHandles = ({ route, navigation }) => {
  const [verifiedAccounts, setVerifiedAccounts] = useState([]);
  const [unverifiedAccounts, setUnverifiedAccounts] = useState([]);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const { price, follower, photo, isCompleted, redirect, email,
    savedName, savedEmail, savedUsername, savedGender, savedMobileNumber,
    savedSelected, savedLocation, savedCountryCode, savedAgreedToTerms, savedEmailVerified } =
    route.params || {};
  const savedFormParams = { savedName, savedEmail, savedUsername, savedGender, savedMobileNumber, savedSelected, savedLocation, savedCountryCode, savedAgreedToTerms, savedEmailVerified };
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [youtubeData, setYoutubeData] = useState(null);
  const [youtubeAnalytics, setYoutubeAnalytics] = useState(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const { showAlert } = useAlert();
  const [monthlyData, setMonthlyData] = useState([]);
  let userYtData;
  const [instagramInfo, setInstagramInfo] = useState({
    username: "",
    email: "",
  });

  // Google auth manager ref (YouTube OAuth during signup)
  const googleAuthRef = useRef(null);
  const [authKey, setAuthKey] = useState(0);
  const resetAuthManagers = () => setAuthKey(k => k + 1);

  // Twitter OAuth — fully handled by backend (PKCE + token exchange)
  // Backend initiates OAuth, exchanges code, returns username via deep link influmart://auth?twitterUsername=X

  // TikTok OAuth — token exchange done on backend (client_secret required)
  const [tiktokRequest, tiktokResponse, promptTiktokAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: TIKTOK_CLIENT_KEY,
        redirectUri: AuthSession.makeRedirectUri({ scheme: "influmart" }),
        scopes: ["user.info.basic", "user.info.profile"],
        usePKCE: true,
        responseType: AuthSession.ResponseType.Code,
        extraParams: { client_key: TIKTOK_CLIENT_KEY },
      },
      tiktokDiscovery
    );



  useEffect(() => {
    if (tiktokResponse && tiktokResponse.type === "success") {
      handleTiktokEffect(tiktokResponse).catch((error) => {
        console.error("TikTok Effect Error:", error);
      });
    } else if (tiktokResponse && tiktokResponse.type === "error") {
      showAlert("Error", "TikTok sign-in was cancelled or failed");
    }
  }, [tiktokResponse]);

  useEffect(() => {
    if (route.params?.social) {
      const { ig, tw, fb, yt, tt, verifyAccount } = route.params.social;
      if (ig) setInstagram(ig);
      if (tw) setTwitter(tw);
      if (fb) setFacebook(fb);
      if (yt) setYoutube(yt);
      if (tt) setTiktok(tt);
      if (verifyAccount) setVerifiedAccounts(verifyAccount);
      if (route.params.social.unverifiedAccounts) setUnverifiedAccounts(route.params.social.unverifiedAccounts);
    }
  }, [route.params?.social]);

  const handleGoogleEffect = async (accessToken) => {
    try {
      setToken(accessToken);
      await AsyncStorage.setItem("ytAccessToken", accessToken);
      await getUserInfo(accessToken);
      await fetchYouTubeData(accessToken);
    } catch (error) {
      console.error("Error during Google effect:", error);
    } finally {
      resetAuthManagers();
    }
  };

  // Facebook verification — OAuth proves ownership, then RapidAPI fetches analytics
  const handleFacebookVerify = async () => {
    try {
      const fbHandle = facebook.startsWith("@") ? facebook.slice(1) : facebook;
      if (!fbHandle) return;

      const influencerId = await AsyncStorage.getItem("influencerId");
      const state = Math.random().toString(36).substring(2, 18);
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "influmart", path: "auth" });

      const result = await WebBrowser.openAuthSessionAsync(
        `${API_ENDPOINT}/auth/facebook?state=${state}&influencerId=${influencerId || "none"}&redirectUri=${encodeURIComponent(redirectUri)}&fbHandle=${encodeURIComponent(fbHandle)}`,
        redirectUri
      );

      if (result.type !== "success") {
        showAlert("Info", "Facebook sign-in was cancelled");
        return;
      }

      const urlParams = new URLSearchParams(result.url.split("?")[1] || "");
      const fbSuccess = urlParams.get("fbSuccess");
      const fbUsername = urlParams.get("fbUsername");
      const fbLinked = urlParams.get("fbLinked"); // "true" if entered handle matched one of their pages
      const error = urlParams.get("error");

      if (error || !fbSuccess) {
        // OAuth failed — fall back to RapidAPI (marks as Unverified)
        const res = await fetch(`${API_ENDPOINT}/auth/facebook/analytics?username=${encodeURIComponent(fbHandle)}`);
        if (res.ok) {
          const analytics = await res.json();
          if (analytics && Object.keys(analytics).length > 0) {
            await AsyncStorage.setItem("fbAnalytics", JSON.stringify(analytics));
            setUnverifiedAccounts((prev) => [...prev, "facebook"]);
            return;
          }
        }
        showAlert("Error", "Facebook verification failed. Please try again.");
        return;
      }

      if (fbLinked === "true") {
        // Entered handle matched one of their Facebook Pages — verified
        // Fetch and cache analytics for submission with signup form
        try {
          const analyticsRes = await fetch(`${API_ENDPOINT}/auth/facebook/analytics?username=${encodeURIComponent(fbHandle)}`);
          if (analyticsRes.ok) {
            const analytics = await analyticsRes.json();
            if (analytics && Object.keys(analytics).length > 0) {
              await AsyncStorage.setItem("fbAnalytics", JSON.stringify(analytics));
            }
          }
        } catch (e) {
          console.warn("[Facebook] Could not cache analytics:", e.message);
        }
        setVerifiedAccounts((prev) => [...prev, "facebook"]);
      } else {
        // No matching page found — can't confirm they own the entered handle
        showAlert("Error", "No Facebook Page matching your entered username was found on your account. Make sure you entered your Facebook Page username, not your personal profile.");
      }
    } catch (error) {
      console.error("Facebook verification error:", error);
      showAlert("Error", "Facebook verification failed. Please try again.");
    }
  };

  // Instagram verification — OAuth proves ownership, then RapidAPI fetches analytics
  const handleInstagramVerify = async () => {
    try {
      const igHandle = instagram.startsWith("@") ? instagram.slice(1) : instagram;
      if (!igHandle) return;

      const influencerId = await AsyncStorage.getItem("influencerId");
      const state = Math.random().toString(36).substring(2, 18);
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "influmart", path: "auth" });

      const result = await WebBrowser.openAuthSessionAsync(
        `${API_ENDPOINT}/auth/instagram?state=${state}&influencerId=${influencerId || "none"}&igHandle=${encodeURIComponent(igHandle)}&redirectUri=${encodeURIComponent(redirectUri)}`,
        redirectUri
      );

      if (result.type !== "success") {
        showAlert("Info", "Instagram sign-in was cancelled");
        return;
      }

      const urlParams = new URLSearchParams(result.url.split("?")[1] || "");
      const igSuccess = urlParams.get("igSuccess");
      const returnedUsername = urlParams.get("igUsername");
      const igLinked = urlParams.get("igLinked"); // "true" if IG is linked to a Facebook Page
      const error = urlParams.get("error");

      if (error || !igSuccess) {
        // OAuth failed — fetch RapidAPI data and mark as Unverified
        const res = await fetch(`${API_ENDPOINT}/auth/instagram/rapidapi-analytics?username=${encodeURIComponent(igHandle)}`);
        if (res.ok) {
          const analytics = await res.json();
          if (analytics && Object.keys(analytics).length > 0) {
            await AsyncStorage.setItem("igAnalytics", JSON.stringify(analytics));
            setUnverifiedAccounts((prev) => [...prev, "instagram"]);
            return;
          }
        }
        showAlert("Error", "Instagram verification failed. Please try again.");
        return;
      }

      if (igLinked === "true") {
        // Professional account linked to FB Page — validate username match
        if (returnedUsername && igHandle.toLowerCase() !== returnedUsername.toLowerCase()) {
          showAlert("Error", `Handle does not match. Your linked Instagram account is @${returnedUsername}`);
          return;
        }
        // Ownership confirmed — fetch Graph API data and RapidAPI data in parallel
        try {
          const [graphRes, rapidRes] = await Promise.allSettled([
            fetch(`${API_ENDPOINT}/auth/instagram/analytics?username=${encodeURIComponent(igHandle)}`),
            fetch(`${API_ENDPOINT}/auth/instagram/rapidapi-analytics?username=${encodeURIComponent(igHandle)}`),
          ]);

          if (graphRes.status === "fulfilled" && graphRes.value.ok) {
            const graphData = await graphRes.value.json();
            if (graphData && Object.keys(graphData).length > 0) {
              await AsyncStorage.setItem("igGraphAnalytics", JSON.stringify(graphData));
            }
          }

          if (rapidRes.status === "fulfilled" && rapidRes.value.ok) {
            const rapidData = await rapidRes.value.json();
            if (rapidData && Object.keys(rapidData).length > 0) {
              await AsyncStorage.setItem("igAnalytics", JSON.stringify(rapidData));
            }
          }
        } catch (e) {
          console.warn("[Instagram] Could not cache analytics:", e.message);
        }
        setVerifiedAccounts((prev) => [...prev, "instagram"]);
      } else {
        // Personal account — can't verify username ownership, still fetch RapidAPI data
        showAlert("Authorization Failed", "Your Instagram account is not linked to a Facebook Page. Switch to a Creator or Business account and link it to a Facebook Page to get verified.");
        try {
          const res = await fetch(`${API_ENDPOINT}/auth/instagram/rapidapi-analytics?username=${encodeURIComponent(igHandle)}`);
          if (res.ok) {
            const analytics = await res.json();
            if (analytics && Object.keys(analytics).length > 0) {
              await AsyncStorage.setItem("igAnalytics", JSON.stringify(analytics));
            }
          }
        } catch (e) {
          console.warn("[Instagram] Could not fetch RapidAPI analytics for personal account:", e.message);
        }
        setUnverifiedAccounts((prev) => [...prev, "instagram"]);
      }
    } catch (error) {
      console.error("Instagram verification error:", error);
      showAlert("Error", "Instagram verification failed. Please try again.");
    }
  };

  // YouTube OAuth — two paths:
  //   Signup (no influencerId in storage): use GoogleAuthManager (access token, client-side analytics)
  //   Profile edit (influencerId exists): use backend OAuth route to get refresh token for cron jobs
  const handleYouTubeVerify = async () => {
    try {
      const influencerId = await AsyncStorage.getItem("influencerId");

      // During signup the influencer doesn't exist in DB yet — fall back to client-side Google OAuth
      if (!influencerId) {
        googleAuthRef.current?.prompt();
        return;
      }

      const state = Math.random().toString(36).substring(2, 18);
      const result = await WebBrowser.openAuthSessionAsync(
        `http://127.0.0.1:3000/auth/youtube?state=${state}&influencerId=${influencerId}`,
        "influmart://"
      );

      if (result.type !== "success") {
        showAlert("Info", "YouTube sign-in was cancelled");
        return;
      }

      const urlParams = new URLSearchParams(result.url.split("?")[1] || "");
      const ytSuccess = urlParams.get("ytSuccess");
      const ytChannel = urlParams.get("ytChannel");
      const ytEmail = urlParams.get("ytEmail");
      const error = urlParams.get("error");

      if (error || !ytSuccess) {
        const msgs = {
          youtube_no_channel: "No YouTube channel found on this Google account.",
          youtube_state_mismatch: "Security check failed. Please try again.",
        };
        showAlert("Error", msgs[error] || "YouTube verification failed. Please try again.");
        return;
      }

      // Verify email matches signup email
      if (ytEmail && email && ytEmail.toLowerCase() !== email.toLowerCase()) {
        showAlert("Error", "Email does not match the email used to sign up");
        return;
      }

      // Verify channel handle matches entered value
      const enteredChannel = youtube.toLowerCase().replace(/^@/, "");
      const actualChannel = (ytChannel || "").toLowerCase().replace(/^@/, "");
      if (enteredChannel === actualChannel) {
        setVerifiedAccounts((prev) => [...prev, "youtube"]);
      } else {
        showAlert("Error", `Channel does not match. Your YouTube channel is ${ytChannel}`);
      }
    } catch (error) {
      console.error("YouTube verification error:", error);
      showAlert("Error", "YouTube verification failed. Please try again.");
    }
  };

  // Twitter OAuth — backend handles PKCE + token exchange, returns username via deep link
  const handleTwitterVerify = async () => {
    try {
      const state = Math.random().toString(36).substring(2, 18);
      const result = await WebBrowser.openAuthSessionAsync(
        `http://127.0.0.1:3000/auth/twitter?state=${state}`,
        "influmart://"
      );

      if (result.type !== "success") {
        showAlert("Info", "Twitter sign-in was cancelled");
        return;
      }

      const urlParams = new URLSearchParams(result.url.split("?")[1] || "");
      const twitterUsername = urlParams.get("twitterUsername");
      const error = urlParams.get("error");

      if (error || !twitterUsername) {
        showAlert("Error", "Twitter verification failed. Please try again.");
        return;
      }

      const enteredHandle = twitter.startsWith("@") ? twitter.slice(1) : twitter;
      if (enteredHandle.toLowerCase() === twitterUsername.toLowerCase()) {
        setVerifiedAccounts((prev) => [...prev, "twitter"]);
      } else {
        showAlert("Error", `Handle does not match. Your Twitter username is @${twitterUsername}`);
      }
    } catch (error) {
      console.error("Twitter verification error:", error);
      showAlert("Error", "Twitter verification failed. Please try again.");
    }
  };

  // TikTok OAuth — backend handles token exchange since client_secret is required
  const handleTiktokEffect = async (response) => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "influmart" });
      const verifyResponse = await fetch(`${API_ENDPOINT}/auth/tiktok/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: response.params.code,
          redirectUri,
          codeVerifier: tiktokRequest.codeVerifier,
        }),
      });

      const result = await verifyResponse.json();

      if (!verifyResponse.ok || !result.username) {
        showAlert("Error", result.message || "TikTok verification failed. Please try again.");
        return;
      }

      const enteredHandle = tiktok.startsWith("@") ? tiktok.slice(1) : tiktok;
      const actualHandle = result.username;

      if (enteredHandle.toLowerCase() === actualHandle.toLowerCase()) {
        setVerifiedAccounts((prev) => [...prev, "tiktok"]);
      } else {
        showAlert(
          "Error",
          `TikTok handle does not match. Your TikTok username is @${actualHandle}`
        );
      }
    } catch (error) {
      console.error("TikTok verification error:", error);
      showAlert("Error", "TikTok verification failed. Please try again.");
    }
  };

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
      setUserInfo(user);
      userYtData = { email: user.email, verified: user.verified_email };
    } catch (error) {
      console.log("Error fetching user info:", error);
    }
  };

  const fetchYouTubeData = async (token) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      userYtData = {
        ...userYtData,
        channel: data.items[0]?.snippet?.customUrl,
      };
      await AsyncStorage.setItem("ytChannelId", data.items[0]?.id);

      // Fetch analytics separately — don't let failures here block verification
      try {
        const analytics = await fetchYouTubeAnalytics();
        const highlights = await fetchRecentHighlightVideos();
        const overAll = await fetchYouTubeAnalyticsOverAll();
        await AsyncStorage.setItem(
          "ytDelete",
          JSON.stringify({
            analytics,
            highlights,
            ytChannelId: data.items[0]?.id,
            overAll,
          })
        );
      } catch (analyticsError) {
        console.warn("Analytics fetch failed (non-blocking):", analyticsError);
      }

      // Verify the channel handle matches — email match not required since
      // users may sign up with a different email than their YouTube Google account
      const enteredChannel = youtube.toLowerCase().replace(/^@/, "");
      const actualChannel = (userYtData.channel || "").toLowerCase().replace(/^@/, "");
      if (enteredChannel === actualChannel) {
        setVerifiedAccounts((prev) => [...prev, "youtube"]);
        // Save channel ID to backend so cron job can refresh stats
        try {
          const influencerId = await AsyncStorage.getItem("influencerId");
          const authToken = await AsyncStorage.getItem("token");
          const channelId = await AsyncStorage.getItem("ytChannelId");
          if (influencerId && channelId) {
            await fetch(`${API_ENDPOINT}/influencers/${influencerId}/yt-refresh-token`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ ytChannelId: channelId }),
            });
          }
        } catch (e) {
          console.warn("Could not save YT channel ID to backend:", e);
        }
      } else {
        showAlert(
          "Error",
          `Channel does not match. Your YouTube channel is ${userYtData.channel}`
        );
      }
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      showAlert("Error", "Could not fetch YouTube data. Please try again.");
    }
  };

  return (
    <ScrollView>
      {/* GoogleAuthManager renders nothing — owns Google/YouTube OAuth hook in isolation */}
      <GoogleAuthManager
        key={`google-${authKey}`}
        ref={googleAuthRef}
        onSuccess={(token) => handleGoogleEffect(token).catch(console.error)}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 24, height: 24 }}></View>
          <Text style={styles.headerText}>Add Accounts</Text>
          <View style={styles.headerIcon}>
            <TouchableOpacity
              onPress={() => {
                const hasData = !!(instagram || twitter || facebook || youtube || tiktok);
                if (hasData) {
                  setShowDiscardModal(true);
                } else {
                  navigation.navigate(redirect, {
                    price, follower, photo,
                    isCompleted: { ...isCompleted, addSocialProfile: false },
                    ...savedFormParams,
                  });
                }
              }}
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
          isUnverified={unverifiedAccounts.includes("instagram")}
          handleVerify={handleInstagramVerify}
        />
        <FormField
          label="Twitter"
          placeholder="@username"
          value={twitter}
          setValue={setTwitter}
          isVerified={verifiedAccounts.includes("twitter")}
          handleVerify={handleTwitterVerify}
        />
        <FormField
          label="Facebook"
          placeholder="username"
          value={facebook}
          setValue={setFacebook}
          isVerified={verifiedAccounts.includes("facebook")}
          isUnverified={unverifiedAccounts.includes("facebook")}
          handleVerify={handleFacebookVerify}
        />
        <FormField
          label="YouTube"
          placeholder="@channelName"
          value={youtube}
          setValue={setYoutube}
          isVerified={verifiedAccounts.includes("youtube")}
          handleVerify={handleYouTubeVerify}
        />
        <FormField
          label="TikTok"
          placeholder="@username"
          value={tiktok}
          setValue={setTiktok}
          isVerified={verifiedAccounts.includes("tiktok")}
          handleVerify={() => promptTiktokAsync()}
        />

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            navigation.navigate(redirect, {
              social: {
                ig: instagram,
                tw: twitter,
                fb: facebook,
                yt: youtube,
                tt: tiktok,
                verifyAccount: verifiedAccounts,
                unverifiedAccounts,
              },
              price,
              follower,
              photo,
              isCompleted: {
                ...isCompleted,
                addSocialProfile: verifiedAccounts.length != 0 && true,
              },
              ...savedFormParams,
            });
          }}
        >
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showDiscardModal} animationType="fade">
        <View style={discardModalStyles.overlay}>
          <View style={discardModalStyles.box}>
            <Text style={discardModalStyles.title}>Discard Changes?</Text>
            <Text style={discardModalStyles.message}>
              Your entered data will be lost. Press Confirm to save them first.
            </Text>
            <View style={discardModalStyles.buttons}>
              <TouchableOpacity
                style={[discardModalStyles.btn, discardModalStyles.stayBtn]}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={discardModalStyles.stayText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[discardModalStyles.btn, discardModalStyles.discardBtn]}
                onPress={() => {
                  setShowDiscardModal(false);
                  navigation.navigate(redirect, {
                    price, follower, photo,
                    isCompleted: { ...isCompleted, addSocialProfile: false },
                    ...savedFormParams,
                  });
                }}
              >
                <Text style={discardModalStyles.discardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = AddHandlesStyles;

const discardModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    width: "80%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginBottom: 22,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stayBtn: {
    backgroundColor: "#f0f0f0",
  },
  stayText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
  discardBtn: {
    backgroundColor: "#e53935",
  },
  discardText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default AddHandles;
