"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { store } from "./store";
import { restoreAuth } from "./features/auth/authSlice";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({
  children,
}: ReduxProviderProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    store.dispatch(restoreAuth());
    setHydrated(true);
  }, []);

  return (
    <Provider store={store}>
      {!hydrated ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
        </div>
      ) : (
        children
      )}
    </Provider>
  );
}