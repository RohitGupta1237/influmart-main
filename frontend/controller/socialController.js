import axios from "axios";
import API_ENDPOINT from "../config";
const getSocialData = async (userId,showAlert) => {
  try {
    const url = `${API_ENDPOINT}/social/${userId}`
    const response = await axios.get(url);
    if (response.status == 200) {
      return response.data;
    }
  } catch (error) {
    console.log("error",error);
  }
};


export { getSocialData};