import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_ENDPOINT from "../config";
const getBrandProfile = async (brandId, showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.get(
        `${API_ENDPOINT}/brands/profile/${brandId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
    const data = await response.data;
    if (response.status == 200) {
      let brand = {
        ...data.brand,
        category: JSON.parse(data.brand.category).join(", "),
        profileUrl: data.brand.isSelectedImage
            ? data.brand.profileUrl
            : data.brand.profileUrl.includes("uploads")
                ? `${API_ENDPOINT}/${data.brand.profileUrl
                    .replace(/\\/g, "/")
                    .replace("uploads/", "")}`
                : null,
      };
      return brand;
    } else {
      showAlert("Brand Profile Error", data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert("Brand Profile Error", "Something went wrong. Please try again.");
  }
};

const BrandUpdate = async (brandId, payload, navigation, showAlert) => {
  const data = new FormData();
  data.append("name", payload?.name);
  data.append("email", payload?.email);
  data.append("password", payload?.password || "");
  data.append("brandName", payload?.brandName);
  data.append("category", JSON.stringify(payload?.category));
  data.append("location", payload?.location || "");
  data.append("website", payload?.website || "");
  data.append("description", payload?.description || "");

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
    const response = await axios.put(`${API_ENDPOINT}/brands/profile/${brandId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`
      },
    });
    if (response.status === 200) {
      navigation.navigate("BrandProfile");
    } else {
      const _data = response.data;
      showAlert("Brand Update Error", _data.message);
    }
  } catch (error) {
    console.error("Update Error:", error);
    showAlert("Brand Update Error", error?.response?.data?.message || "Something went wrong");
  }
};

const getAllBrandProfiles = async (showAlert) => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.get(`${API_ENDPOINT}/brands/getAllBrands`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    let data = await response.data.brands;

    data = data.map((brand) => {
      return {
        ...brand,
        profileUrl: brand.isSelectedImage
            ? brand.profileUrl
            : brand.profileUrl.includes("uploads")
                ? `${API_ENDPOINT}/${brand.profileUrl
                    .replace(/\\/g, "/")
                    .replace("uploads/", "")}`
                : null,
        category: (() => {
          try {
            const categoryArray = JSON.parse(brand.category || "[]");
            return Array.isArray(categoryArray) ? categoryArray.join(", ") : "";
          } catch (error) {
            console.error("Failed to parse category JSON:", error.message);
            return "";
          }
        })(),
      };
    });
    return data;
  } catch (error) {
    console.log(error);
    showAlert("Brand Profiles Error", "Something went wrong");
  }
};

export { getBrandProfile, getAllBrandProfiles, BrandUpdate };