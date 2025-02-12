import axios from 'axios';
import Jsona from 'jsona';
import { signOut } from 'next-auth/react';

const dataFormatter = new Jsona();

const ROLES = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/roles/projects`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: (data) => {
    try {
      const parsedData = JSON.parse(data);
      return {
        data: dataFormatter.deserialize(parsedData),
        meta: parsedData.meta,
      };
    } catch (error) {
      return data;
    }
  },
});

const onResponseSuccess = (response) => response;

const onResponseError = (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  if (error.response.status === 401) {
    signOut();
  }
  // Do something with response error
  return Promise.reject(error);
};

ROLES.interceptors.response.use(onResponseSuccess, onResponseError);

export default ROLES;
