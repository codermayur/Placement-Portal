import api, { extractApiData, extractApiError } from "../api";

export const getOpportunities = async () => {
  const response = await api.get("/opportunities");
  return extractApiData(response) || [];
};

export const getOpportunityById = async (id) => {
  try {
    const response = await api.get(`/opportunities/${id}`);
    return extractApiData(response);
  } catch (error) {
    throw new Error(extractApiError(error, "Opportunity not found"));
  }
};

export const createOpportunity = async (payload) => {
  try {
    const response = await api.post("/opportunities", payload);
    return extractApiData(response);
  } catch (error) {
    throw new Error(extractApiError(error, "Failed to create opportunity"));
  }
};

export const updateOpportunity = async (id, payload) => {
  try {
    const response = await api.put(`/opportunities/${id}`, payload);
    return extractApiData(response);
  } catch (error) {
    const message = extractApiError(error, "Failed to update opportunity");
    if (error?.response?.status === 409) throw new Error("Cannot edit archived opportunities");
    if (error?.response?.status === 403) throw new Error("You don't have permission to edit this opportunity");
    throw new Error(message);
  }
};

export const deleteOpportunity = async (id) => {
  try {
    const response = await api.delete(`/opportunities/${id}`);
    return extractApiData(response);
  } catch (error) {
    const message = extractApiError(error, "Failed to delete opportunity");
    if (error?.response?.status === 403) throw new Error("You don't have permission to delete this opportunity");
    if (error?.response?.status === 404) throw new Error("Opportunity not found");
    throw new Error(message);
  }
};
