import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// ============================================================
// HttpClient
// Responsabilidade:
// - Centralizar configuração HTTP
// - Evitar axios espalhado no projeto
// - Facilitar interceptors
// - Facilitar troca futura de provider
// - Facilitar testes/mocks
// ============================================================

export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL ?? process.env.AUTH_SERVICE_URL ?? "http://localhost:8080",

      timeout: 5000,

      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  // ============================================================
  // Interceptors
  // ============================================================

  /**
   * Centraliza logs, auth headers e tratamento global.
   */
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        /**
         * Exemplo:
         * Adicionar token automaticamente
         */

        // const token = localStorage.getItem("accessToken");

        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

        return config;
      },

      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,

      (error) => {
        /**
         * Centraliza erros HTTP
         */

        if (error.response?.status === 401) {
          console.error("Não autorizado");
        }

        return Promise.reject(error);
      },
    );
  }

  // ============================================================
  // Métodos HTTP
  // ============================================================

  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

// ============================================================
// Singleton compartilhado
// ============================================================

export const http = new HttpClient();
