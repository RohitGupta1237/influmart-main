import axios from "axios";
//import { API_ENDPOINT } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
 const API_ENDPOINT = "http://localhost:3000";
const GetInfluencerProfile = async (influencerId, setProfile, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/influencers/profile/${influencerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.data?.influencer
    if (response.status === 200) {
      let newData = {...data,
        ytData: (() => { try { return data.ytData?.[0] ? JSON.parse(data.ytData[0]) : null; } catch(e) { return null; } })(),
        profileUrl: data.isSelectedImage ? data.profileUrl : data.profileUrl?.includes("uploads")
          ? `${API_ENDPOINT}/${data.profileUrl.replace(/\\/g, '/').replace('uploads/', '')}`
          : data.profileUrl || null,
        category: (() => {
            try {
              const categoryArray = JSON.parse(data.category || "[]");
              return Array.isArray(categoryArray) ? categoryArray.join(", ") : "";
            } catch (error) {
              console.error("Failed to parse category JSON:", error.message);
              return "";
            }
          })(),
        price: (() => {
          try {
            if (!data?.price) return null;
            const parsed = JSON.parse(data.price);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) { return null; }
        })(),
        }
      console.log(newData)
      setProfile(newData);
      return newData
    } else {
      showAlert("Profile Error", response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert("Profile Error", "Something went wrong");
  }
};

const InfluencerUpdate = async (influencerId, payload, navigation, showAlert) => {
  const data = new FormData();
  data.append("userName", payload?.name);
  data.append("email", payload?.email);
  data.append("influencerName", payload?.brandName);
  data.append("category", JSON.stringify(payload?.category));
  data.append("price", JSON.stringify([{
    yt: payload?.priceYoutube || "0",
    ig: payload?.priceInstagram || "0",
    tt: payload?.priceTiktok || "0",
    tr: "0",
  }]));

  if (payload.image && payload.image.uri) {
    if (payload?.image?.isSelected) {
      data.append("profileUrl", payload?.image?.file);
      data.append("isSelectedImage", true);
    } else {
      if (Platform.OS === "web") {
        const blob = await (await fetch(payload.image.uri)).blob();
        data.append("image", blob, payload.image.name);
      } else {
        data.append("image", {
          uri: payload.image.uri,
          name: payload.image.name,
          type: payload.image.type,
        });
      }
    }
  }
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.put(`${API_ENDPOINT}/influencers/profile/${influencerId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`
      },
    });
    if (response.status === 200) {
      navigation.navigate("UserProfile");
    } else {
      const _data = response.data;
      showAlert("Influencer Update Error", _data.message);
    }
  } catch (error) {
    console.error("Update Error:", error);
    showAlert("Influencer Update Error", "Something went wrong");
  }
};

const GetAllInfluencerProfile = async (setProfile) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/influencers/profiles`);
    const data = await response.data?.influencers;

    if (response.status === 200) {
      const newData = data.map((influencer) => ({
        ...influencer,
        profileUrl: influencer.isSelectedImage? influencer?.profileUrl : influencer.profileUrl && influencer.profileUrl.includes("uploads")
          ? `${API_ENDPOINT}/${influencer.profileUrl.replace(/\\/g, '/').replace('uploads/', '')}`
          : null,
        category: (() => {
          try {
            const categoryArray = JSON.parse(influencer.category || "[]");
            return Array.isArray(categoryArray) ? categoryArray.join(", ") : "";
          } catch (error) {
            console.error("Failed to parse category JSON:", error.message);
            return "";
          }
        })(),
      }));
      setProfile(newData);
    }
  } catch (error) {
    console.error("Profile fetching error:", error.message);
  }
};

const DeleteInfluencerProfile = async (influencerId, navigation, showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.delete(
      `${API_ENDPOINT}/influencers/profile/${influencerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 200) {
      showAlert("Profile Deleted", "Successfully deleted your profile");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("influencerId");
      navigation.navigate("LoginPage");
    }
  } catch (error) {
    console.log(error);
    showAlert("Profile Error", "Something went wrong");
  }
};

const FilterInfluencerProfile = async (filters, setInfluencerData) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/influencers/search-influencers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filters)
    });
    const data = await response.json();
    if (response.status === 200){
      const newData = data.map((influencer) => ({
        ...influencer,
        profileUrl: influencer?.isSelectedImage ? influencer?.profileUrl : influencer?.profileUrl?.includes("uploads")
          ? `${API_ENDPOINT}/${influencer.profileUrl.replace(/\\/g, '/').replace('uploads/', '')}`
          : null,
        category: (() => {
          try {
            const categoryArray = JSON.parse(influencer.category || "[]");
            return Array.isArray(categoryArray) ? categoryArray.join(", ") : "";
          } catch (error) {
            console.error("Failed to parse category JSON:", error.message);
            return "";
          }
        })(),
      }));
      setInfluencerData(newData);
    }
  } catch (error) {
    console.error('Error fetching influencers:', error);
  }
}

const UpdateInfluencerDescription = async (influencerId, description, showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.patch(
      `${API_ENDPOINT}/influencers/${influencerId}/description`,
      { description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status === 200;
  } catch (error) {
    showAlert("Error", "Failed to update description");
    return false;
  }
};

const UpdateInfluencerHashtags = async (influencerId, hashtags, showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.patch(
      `${API_ENDPOINT}/influencers/${influencerId}/hashtags`,
      { hashtags },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status === 200;
  } catch (error) {
    showAlert("Error", "Failed to update hashtags");
    return false;
  }
};

const UpdateInfluencerPrice = async (influencerId, price, showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.patch(
      `${API_ENDPOINT}/influencers/${influencerId}/price`,
      { price },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status === 200;
  } catch (error) {
    showAlert("Error", "Failed to update price");
    return false;
  }
};

export {
  GetInfluencerProfile,
  GetAllInfluencerProfile,
  DeleteInfluencerProfile,
  FilterInfluencerProfile,
  InfluencerUpdate,
  UpdateInfluencerDescription,
  UpdateInfluencerHashtags,
  UpdateInfluencerPrice,
};
