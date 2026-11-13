const CACHE_NAME = "my-shop-shell-v1";
// Նկարների առանձին քեշ (ibb.co, cloudinary, unsplash և այլն)
const IMAGE_CACHE = "my-shop-images-v2";
const IMAGE_CACHE_MAX_ENTRIES = 150;
// Այս պարամետրերը միայն "քեշը շրջանցելու" համար են, քեշի բանալուց հանվում են
const BUST_PARAMS = ["_r", "_eager", "_safari_cb"];

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)
  );
}

function imageCacheKey(request, url) {
  const clean = new URL(url.toString());
  BUST_PARAMS.forEach((p) => clean.searchParams.delete(p));
  clean.hash = "";
  // CORS և no-CORS պատասխանները տարբեր են, դրանք չպետք է խառնվեն
  clean.searchParams.set("__sw_mode", request.mode === "cors" ? "cors" : "nocors");
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
  const request = event.request;
  const key = imageCacheKey(request, url);
  // SmartImage-ը ձախողման դեպքում ավելացնում է ?_r=... -> քեշը շրջանցում ենք և թարմացնում
  const forceRefresh = BUST_PARAMS.some((p) => url.searchParams.has(p));

  let cache;
  try {
    cache = await caches.open(IMAGE_CACHE);
    if (!forceRefresh) {
      const cached = await cache.match(key);
      if (cached) return cached;
    }
  } catch (e) {
    return fetch(request);
  }

  // Բեռնում ենք ճիշտ նույն հարցումով, ինչ browser-ը կաներ առանց service worker-ի
  const response = await fetch(request);
  // Քեշավորում ենք միայն հաջող (կամ opaque cross-origin) պատասխանները.
  // cache.put-ը կարդում է ամբողջ body-ն, ուստի կիսատ բեռնվածը չի պահվի
  if (response && (response.ok || response.type === "opaque")) {
    event.waitUntil(
      cache
        .put(key, response.clone())
        .then(() => trimImageCache(cache))
        .catch(() => undefined),
    );
  }
  return response;
}

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
