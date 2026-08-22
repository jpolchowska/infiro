"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function TestTokenPage() {
  const { getToken, token: contextToken, authenticated } = useAuth();
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestToken = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      console.log("Pobrany token przez getToken():", token);
      setCurrentToken(token ?? "Brak tokena (niezalogowany)");
    } catch (err) {
      console.error("Błąd pobierania tokena:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto bg-white rounded-lg border border-gray-200 mt-8">
      <h2 className="text-xl font-bold">Test getToken()</h2>
      
      <p className="text-sm text-gray-600">
        Status zalogowania: <strong>{authenticated ? "Zalogowany ✅" : "Niezalogowany ❌"}</strong>
      </p>

      <button
        onClick={handleTestToken}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
      >
        {loading ? "Pobieranie..." : "Wywołaj getToken()"}
      </button>

      {currentToken && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs break-all font-mono">
          <p className="font-semibold text-gray-700 mb-1">Wynik getToken():</p>
          {currentToken}
        </div>
      )}
    </div>
  );
}