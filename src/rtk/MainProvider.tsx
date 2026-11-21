"use client";

import { Provider } from "react-redux";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import { store } from "./store";

export default function MainProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
