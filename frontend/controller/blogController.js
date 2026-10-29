import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";

export const getPublishedArticles = async () => {
  const response = await axios.get(`${API_ENDPOINT}/blog/articles`);
  return response.data?.articles || [];
};

export const getPublishedArticle = async (id) => {
  const response = await axios.get(`${API_ENDPOINT}/blog/articles/${id}`);
  return response.data?.article || null;
};

export const getMyArticles = async () => {
  const token = await AsyncStorage.getItem("token");
  const response = await axios.get(`${API_ENDPOINT}/blog/my-articles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.articles || [];
};

export const submitBlogArticle = async (article) => {
  const token = await AsyncStorage.getItem("token");
  const response = await axios.post(`${API_ENDPOINT}/blog/articles`, article, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPendingBlogArticles = async (adminSecret) => {
  const response = await axios.get(`${API_ENDPOINT}/blog/admin/pending`, {
    headers: { "x-admin-secret": adminSecret },
  });
  return response.data?.articles || [];
};

export const getAllBlogArticlesForAdmin = async (adminSecret) => {
  const response = await axios.get(`${API_ENDPOINT}/blog/admin/articles`, {
    headers: { "x-admin-secret": adminSecret },
  });
  return response.data?.articles || [];
};

export const deleteMyBlogArticle = async (id) => {
  const token = await AsyncStorage.getItem("token");
  const response = await axios.delete(`${API_ENDPOINT}/blog/my-articles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteBlogArticleAsAdmin = async (id, adminSecret) => {
  const response = await axios.delete(`${API_ENDPOINT}/blog/admin/${id}`, {
    headers: { "x-admin-secret": adminSecret },
  });
  return response.data;
};

export const reviewBlogArticle = async (id, action, rejectionNote, adminSecret) => {
  const response = await axios.patch(
    `${API_ENDPOINT}/blog/admin/${id}/${action}`,
    { rejectionNote },
    { headers: { "x-admin-secret": adminSecret } }
  );
  return response.data;
};
