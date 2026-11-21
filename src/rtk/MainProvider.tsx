"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { initializeAuth } from "./slices/authSlice";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  token: string | null;
}

export default function MainProvider({
  children,
  token,
}: Props) {

  useEffect(() => {
    const initialize = async () => {
      await store.dispatch(
        initializeAuth({
          token,
        })
      );
    };

    initialize();
  }, [token]);

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}