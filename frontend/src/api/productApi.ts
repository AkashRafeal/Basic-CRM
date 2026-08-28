import axios from 'axios';
import { Product, ProductStats, CreateProductDTO, UpdateProductDTO, AdjustStockDTO, ProductCategory, ProductStatus, BillingFrequency } from '../types/product';

const API_BASE_URL = 'http://localhost:8080/api/v1/products';

const getHeaders = () => {
  const token = localStorage.getItem('crm_token') || localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const productApi = {
  getProducts: async (params?: {
    search?: string;
    category?: ProductCategory;
    status?: ProductStatus;
    billingFrequency?: BillingFrequency;
    minPrice?: number;
    maxPrice?: number;
    lowStockOnly?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const res = await axios.get(API_BASE_URL, {
      headers: getHeaders(),
      params,
    });
    return res.data;
  },

  getActiveCatalog: async (): Promise<Product[]> => {
    const res = await axios.get(`${API_BASE_URL}/catalog`, {
      headers: getHeaders(),
    });
    return res.data?.data || [];
  },

  getProductStats: async (): Promise<ProductStats> => {
    const res = await axios.get(`${API_BASE_URL}/stats`, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  getProductBySku: async (sku: string): Promise<Product> => {
    const res = await axios.get(`${API_BASE_URL}/sku/${sku}`, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  createProduct: async (dto: CreateProductDTO): Promise<Product> => {
    const res = await axios.post(API_BASE_URL, dto, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  updateProduct: async (id: number, dto: UpdateProductDTO): Promise<Product> => {
    const res = await axios.put(`${API_BASE_URL}/${id}`, dto, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  adjustStock: async (id: number, dto: AdjustStockDTO): Promise<Product> => {
    const res = await axios.patch(`${API_BASE_URL}/${id}/stock`, dto, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  deleteProduct: async (id: number, permanent = false): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getHeaders(),
      params: { permanent },
    });
  },

  getCategories: async (): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
    });
    return res.data?.data || [];
  },

  createCategory: async (payload: { name: string; code?: string; description?: string }): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/categories`, payload, {
      headers: getHeaders(),
    });
    return res.data?.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/categories/${id}`, {
      headers: getHeaders(),
    });
  },

  exportCsvUrl: () => `${API_BASE_URL}/export`,
};
