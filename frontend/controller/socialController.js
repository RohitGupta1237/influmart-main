//import { API_ENDPOINT } from "@env";
import axios from "axios";
const API_ENDPOINT = "http://localhost:3000";
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
