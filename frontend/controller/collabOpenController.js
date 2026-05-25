import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import API_ENDPOINT from "../config";

// Returns collab photo if uploaded, otherwise brand profile photo, otherwise null
const resolveCollabImage = (collab) => {
  if (collab?.photoUrl?.includes("uploads")) {
    return `${API_ENDPOINT}/${collab.photoUrl.replace(/\\/g, '/').replace('uploads/', '')}`;
  }
  const brand = collab?.brand;
  if (brand?.profileUrl) {
    if (brand.isSelectedImage) return brand.profileUrl; // avatar key
    return `${API_ENDPOINT}/${brand.profileUrl.replace(/\\/g, '/').replace('uploads/', '')}`;
  }
  return null;
};
const createCollabPost = async (collabPostData, showAlert,navigation) => {

  const data = new FormData();
  data.append("campaignTitle", collabPostData?.campaignTitle || "");
  data.append("campaignType", collabPostData?.campaignType);
  data.append("earningCapacity[min]", collabPostData?.earningCapacity?.min);
  data.append("earningCapacity[max]", collabPostData?.earningCapacity?.max);
  data.append("campaignTimelines", collabPostData?.campaignTimelines);
  data.append("minEligibilityCriteria", collabPostData?.minEligibilityCriteria);
  data.append("postInfo", collabPostData?.postInfo);
  data.append("productReviewInstructions", collabPostData?.productReviewInstructions);
  data.append("campaignSteps", collabPostData?.campaignSteps);
  data.append("brandName", collabPostData?.brandName);
  data.append("numberOfInfluencers", collabPostData?.numberOfInfluencers);
  data.append("brandDescription", collabPostData?.brandDescription);
  data.append("brandId", collabPostData?.brandId);
  data.append("compensationType", collabPostData?.compensationType);


  if (collabPostData.image && collabPostData.image.uri) {
    // For web, handle base64 string as a Blob
    if (Platform.OS === "web") {
      const blob = await (await fetch(collabPostData.image.uri)).blob();
      data.append("image", blob, collabPostData.image.name);
    } else {
      // For mobile platforms
      data.append("image", {
        uri: collabPostData.image.uri,
        name: collabPostData.image.name,
        type: collabPostData.image.type,
      });
    }
  }
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.post(`${API_ENDPOINT}/collab-open/collab-post`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 201) {
      navigation.navigate('BrandProfile');
      showAlert('Success', 'Collaboration post created successfully');
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.log(error);
    throw error
  }
};

const getAllCollabPosts = async (setCollabPosts, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  const influencerId = await AsyncStorage.getItem('influencerId');
  try {
    const params = influencerId ? { influencerId } : {};
    const response = await axios.get(
        `${API_ENDPOINT}/collab-open/get-collab-open`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
    );
    if (response.status === 200) {
      const collabPosts = response.data?.collabOpenings?.map((collab) => ({
        collabOpeningId: collab._id,
        brandName: collab.brand?.brandName,
        brandId: collab.brand?._id,
        category: collab.brand?.category,
        campaignType: JSON.parse(collab.campaignType).join(", "),
        earningCapacity: `${collab.earningCapacity?.min} to ${collab.earningCapacity?.max}`,
        campaignTimelines: collab.campaignTimelines,
        minEligibilityCriteria: collab.minEligibilityCriteria,
        postInfo: JSON.parse(collab.postInfo).join(", "),
        productReviewInstructions: collab.productReviewInstructions,
        campaignSteps: collab.campaignSteps,
        compensationType: collab.compensationType,
        numberOfInfluencers: collab.numberOfInfluencers,
        brandDescription: collab.brandDescription,
        createdAt: new Date(collab.createdAt).toLocaleDateString(),
        imageSource: resolveCollabImage(collab),
        isSelectedImage: !collab?.photoUrl?.includes("uploads") && collab?.brand?.isSelectedImage,
      }));
      setCollabPosts(collabPosts);
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert('Error', 'Something went wrong');
  }
};
// Send Collaboration Request
const sendCollabOpenRequest = async (influencerId, brandId, showAlert, navigation, collabOpeningId) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.post(
        `${API_ENDPOINT}/collab-open/send-collab-open-request`,
        { influencerId, brandId, collabOpeningId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
    if (response.status === 200) {
      showAlert('Success', 'Request sent successfully');
      navigation.navigate('CollabPost');
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert('Collab Open Request Error', error.response.data.message);
  }
};

// Fetch All Collaboration Requests for a User
const getAllCollabOpenRequests = async (userId, setRequests, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.get(
        `${API_ENDPOINT}/collab-open/collab-open-requests/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
    if (response.status === 200) {
      const data = response.data.user;
      const formatData = data.map((item) => ({
        imageSource: item?.sender?.isSelectedImage ? item?.sender?.profileUrl : item?.sender?.profileUrl
            ? {
              uri: `${API_ENDPOINT}/${item?.sender?.profileUrl?.replace(
                  /\\/g,
                  "/"
              ).replace("uploads/", "")}`,
            }
            : require("../assets/blank-profile.png"),
        postTitle: item?.sender?.influencerName,
        isSelectedImage: item?.sender?.isSelectedImage,
        postDate: new Date(item?.requestedAt)?.toLocaleDateString(),
        productName: (() => { try { return JSON.parse(item?.sender?.category)?.slice(0, 2)?.join(", "); } catch { return null; } })(),
        requestId: item?._id,
        campaignTitle: (() => {
          const title = item?.collabOpeningId?.campaignTitle;
          if (title) return title;
          const rawType = item?.collabOpeningId?.campaignType;
          if (!rawType) return null;
          try { return JSON.parse(rawType).join(", "); } catch { return rawType; }
        })(),
      }));
      setRequests(formatData);
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log("all request",error);
    showAlert('Error', 'Something went wrong');
  }
};

// Accept a Collaboration Request
const acceptCollabOpen = async (requestId, showAlert, navigation) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.post(
        `${API_ENDPOINT}/collab-open/accept-collab-open-request`,
        { requestId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
    if (response.status === 200) {
      showAlert('Success', 'Request accepted and message sent');
      navigation.navigate('BrandProfile');
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert('Error', 'Something went wrong');
  }
};

// Reject a Collaboration Request
const rejectCollabOpen = async (requestId, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.post(
        `${API_ENDPOINT}/collab-open/reject-collab-open-request`,
        { requestId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
    if (response.status === 200) {
      showAlert('Success', 'Request rejected successfully');
      navigation.navigate('BrandProfile');
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert('Error', 'Something went wrong');
  }
};

const getAppliedCollabPosts = async (setCollabPosts, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  const influencerId = await AsyncStorage.getItem('influencerId');
  if (!influencerId) return;
  try {
    const response = await axios.get(
        `${API_ENDPOINT}/collab-open/get-applied-posts`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { influencerId },
        }
    );
    if (response.status === 200) {
      const collabPosts = response.data?.collabOpenings?.map((collab) => ({
        collabOpeningId: collab._id,
        brandName: collab.brand?.brandName,
        brandId: collab.brand?._id,
        category: collab.brand?.category,
        campaignType: JSON.parse(collab.campaignType).join(", "),
        earningCapacity: `${collab.earningCapacity?.min} to ${collab.earningCapacity?.max}`,
        campaignTimelines: collab.campaignTimelines,
        minEligibilityCriteria: collab.minEligibilityCriteria,
        postInfo: JSON.parse(collab.postInfo).join(", "),
        productReviewInstructions: collab.productReviewInstructions,
        campaignSteps: collab.campaignSteps,
        compensationType: collab.compensationType,
        numberOfInfluencers: collab.numberOfInfluencers,
        brandDescription: collab.brandDescription,
        createdAt: new Date(collab.createdAt).toLocaleDateString(),
        imageSource: collab?.photoUrl?.includes("uploads")
            ? `${API_ENDPOINT}/${collab?.photoUrl?.replace(/\\/g, '/').replace('uploads/', '')}`
            : null,
      }));
      setCollabPosts(collabPosts);
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log('getAppliedCollabPosts error:', error);
    // Fail silently — applied tab just shows empty
  }
};

const getBrandCollabOpenCount = async (brandId) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.get(`${API_ENDPOINT}/collab-open/brand-collab-count/${brandId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.count ?? 0;
  } catch (error) {
    console.log('getBrandCollabOpenCount error:', error);
    return 0;
  }
};

const getBrandOwnCampaigns = async (brandId, setCampaigns, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.get(`${API_ENDPOINT}/collab-open/brand-campaigns/${brandId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      const campaigns = response.data?.collabOpenings?.map((collab) => ({
        collabOpeningId: collab._id,
        brandName: collab.brand?.brandName,
        brandId: collab.brand?._id,
        category: collab.brand?.category,
        campaignType: JSON.parse(collab.campaignType).join(", "),
        earningCapacity: `${collab.earningCapacity?.min} to ${collab.earningCapacity?.max}`,
        campaignTimelines: collab.campaignTimelines,
        minEligibilityCriteria: collab.minEligibilityCriteria,
        postInfo: JSON.parse(collab.postInfo).join(", "),
        productReviewInstructions: collab.productReviewInstructions,
        campaignSteps: collab.campaignSteps,
        compensationType: collab.compensationType,
        numberOfInfluencers: collab.numberOfInfluencers,
        brandDescription: collab.brandDescription,
        createdAt: new Date(collab.createdAt).toLocaleDateString(),
        imageSource: collab?.photoUrl?.includes("uploads")
            ? `${API_ENDPOINT}/${collab?.photoUrl?.replace(/\\/g, '/').replace('uploads/', '')}`
            : null,
        status: collab.status || 'active',
        collaboratedInfluencers: collab.collaboratedInfluencers || [],
      }));
      setCampaigns(campaigns || []);
    } else {
      showAlert('Error', response.data.message);
    }
  } catch (error) {
    console.log('getBrandOwnCampaigns error:', error);
    showAlert('Error', 'Something went wrong');
  }
};

const updateCampaignStatus = async (campaignId, status, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.patch(
        `${API_ENDPOINT}/collab-open/campaign-status/${campaignId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status === 200;
  } catch (error) {
    console.log('updateCampaignStatus error:', error);
    showAlert('Error', 'Failed to update campaign status');
    return false;
  }
};

const addCollaboratedInfluencer = async (campaignId, username, showAlert) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await axios.patch(
        `${API_ENDPOINT}/collab-open/campaign-influencers/${campaignId}`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.status === 200;
  } catch (error) {
    const msg = error?.response?.data?.message || 'Failed to add influencer';
    showAlert('Error', msg);
    return false;
  }
};

export {createCollabPost, getAllCollabPosts, getAppliedCollabPosts, sendCollabOpenRequest, getAllCollabOpenRequests, acceptCollabOpen, rejectCollabOpen, getBrandCollabOpenCount, getBrandOwnCampaigns, updateCampaignStatus, addCollaboratedInfluencer};