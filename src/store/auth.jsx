import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "./tokenStore.js";
import { authService } from "../services/auth.service.js";
import { usersService } from "../services/users.service.js";


const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    setLoading(true);
    try {
      if (!tokenStore.getAccessToken()) {
        setMe(null);
        return;
      }
      const data = await usersService.me();
      setMe(data);
    } catch (e) {
      // token invalid -> clear
      tokenStore.clear();
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      me,
      loading,
      async login(payload) {
        // Change key from email to username if it's there
        const body = { ...payload };
        if (body.email) {
          body.username = body.email;
          delete body.email;
        }

        const data = await authService.login(body);
        // kỳ vọng data chứa accessToken
        if (data?.accessToken) tokenStore.setAccessToken(data.accessToken);
        await bootstrap();
        return data;
      },
      async register(payload) {
        const data = await authService.register(payload);
        if (data?.accessToken) tokenStore.setAccessToken(data.accessToken);
        await bootstrap();
        return data;
      },
      async logout() {
        try {
          await authService.logout();
        } finally {
          tokenStore.clear();
          setMe(null);
        }
      },
      refreshMe: bootstrap,
    }),
    [me, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
