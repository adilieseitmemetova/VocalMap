import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

type SpotifyToken = {
  access_token: string;
  expires_in: number;
};

type SpotifyImage = {
  url: string;
  width: number;
  height: number;
};

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  external_urls: { spotify?: string };
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: SpotifyImage[];
  };
};

function jsonResponse(res: import("http").ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function devApiPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;
  let tokenCache: { token: string; expiresAt: number } | null = null;

  async function getSpotifyToken() {
    if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
      return tokenCache.token;
    }

    if (!clientId || !clientSecret) {
      throw new Error("SPOTIFY_MISSING_CREDENTIALS");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ grant_type: "client_credentials" })
    });

    if (!response.ok) {
      throw new Error(`SPOTIFY_TOKEN_FAILED_${response.status}`);
    }

    const data = (await response.json()) as SpotifyToken;
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };
    return tokenCache.token;
  }

  return {
    name: "vocal-markup-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/spotify/search", async (req, res) => {
        try {
          const requestUrl = new URL(req.url ?? "", "http://localhost");
          const query = requestUrl.searchParams.get("q")?.trim();

          if (!query) {
            jsonResponse(res, 400, { error: "Введите название песни или артиста." });
            return;
          }

          const token = await getSpotifyToken();
          const params = new URLSearchParams({
            q: query,
            type: "track",
            limit: "10",
            market: "US"
          });

          const spotifyResponse = await fetch(`https://api.spotify.com/v1/search?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!spotifyResponse.ok) {
            jsonResponse(res, spotifyResponse.status, {
              error: "Spotify search failed.",
              status: spotifyResponse.status
            });
            return;
          }

          const data = await spotifyResponse.json();
          const tracks = ((data.tracks?.items ?? []) as SpotifyTrack[]).map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map((artist) => artist.name).join(", "),
            albumName: track.album.name,
            albumArtUrl: track.album.images[0]?.url ?? "",
            durationMs: track.duration_ms,
            spotifyUrl: track.external_urls.spotify ?? ""
          }));

          jsonResponse(res, 200, { tracks });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";

          if (message === "SPOTIFY_MISSING_CREDENTIALS") {
            jsonResponse(res, 501, {
              error:
                "Spotify не подключен. Создайте .env на основе .env.example и добавьте SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET."
            });
            return;
          }

          jsonResponse(res, 500, { error: message });
        }
      });

      server.middlewares.use("/api/lyrics/search", async (req, res) => {
        try {
          const requestUrl = new URL(req.url ?? "", "http://localhost");
          const upstreamUrl = `https://lrclib.net/api/search${requestUrl.search}`;
          const upstreamResponse = await fetch(upstreamUrl, {
            headers: {
              "User-Agent": "VocalMarkupTool/0.1 local prototype"
            }
          });

          const text = await upstreamResponse.text();
          res.statusCode = upstreamResponse.status;
          res.setHeader("Content-Type", upstreamResponse.headers.get("content-type") ?? "application/json");
          res.end(text);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          jsonResponse(res, 500, { error: message });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApiPlugin(mode)]
}));
