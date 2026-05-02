import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntdApp } from "antd";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppContextProvider } from "./components/context/app.context";
import "../i18n";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);
