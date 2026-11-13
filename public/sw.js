const CACHE_NAME = "my-shop-shell-v1";
// Նկարների առանձին քեշ (ibb.co, cloudinary, unsplash և այլն)
const IMAGE_CACHE = "my-shop-images-v1";
const IMAGE_CACHE_MAX_ENTRIES = 400;
// Այս պարամետրերը միայն "քեշը շրջանցելու" համար են, քեշի բանալուց հանվում են
const BUST_PARAMS = ["_r", "_eager", "_safari_cb"];

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)
  );
}

function imageCacheKey(url) {
  const clean = new URL(url.toString());
  BUST_PARAMS.forEach((p) => clean.searchParams.delete(p));
  clean.hash = "";
  return clean.toString();
}

async function trimImageCache(cache) {
  const keys = await cache.keys();
  const extra = keys.length - IMAGE_CACHE_MAX_ENTRIES;
  for (let i = 0; i < extra; i++) {
    await cache.delete(keys[i]); // ամենահին մուտքերը սկզբում են
  }
}

async function handleImage(event, url) {
  const cache = await caches.open(IMAGE_CACHE);
  const key = imageCacheKey(url);
  // Եթե նկարը չի բեռնվել/կիսատ է եղել, SmartImage-ը ավելացնում է ?_r=... -> քեշը շրջանցում ենք և թարմացնում
  const forceRefresh = BUST_PARAMS.some((p) => url.searchParams.has(p));

  if (!forceRefresh) {
    const cached = await cache.match(key);
    if (cached) return cached; // ակնթարթային, առանց ցանցի
  }

  try {
    // CORS-ով ենք բեռնում, որ պատասխանը "թափանցիկ" (opaque) չլինի և կարողանանք ստուգել status-ը
    const response = await fetch(key, {
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: forceRefresh ? "reload" : "default",
    });
    if (response.ok) {
      // cache.put-ը կարդում է ամբողջ body-ն. եթե բեռնումը կիսատ մնա, այն կմերժվի և կիսատ նկար չի պահվի
      event.waitUntil(
        cache
          .put(key, response.clone())
          .then(() => trimImageCache(cache))
          .catch(() => undefined),
      );
    }
    return response;
  } catch (error) {
    // CORS չաջակցող աղբյուր կամ ցանցի սխալ -> հին քեշված տարբերակը, հակառակ դեպքում սովորական բեռնում
    const stale = await cache.match(key);
    if (stale) return stale;
    return fetch(event.request);
  }
}
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/maskable-icon-192x192.png",
  "/maskable-icon-512x512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((cacheKey) => cacheKey !== CACHE_NAME && cacheKey !== IMAGE_CACHE)
          .map((cacheKey) => caches.delete(cacheKey)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => (await caches.match("/")) || Response.error()),
    );
    return;
  }

  if (isImageRequest(event.request, requestUrl) && /^https?:$/.test(requestUrl.protocol)) {
    event.respondWith(handleImage(event, requestUrl));
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (!APP_SHELL.includes(requestUrl.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request)),
  );
});
