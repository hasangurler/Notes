"use strict";


/* =========================================================
   SERVICE WORKER
========================================================= */

const CACHE_NAME =
    "notlarim-cache-v2";


const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/bootstrap.min.css",
    "./css/bootstrap-icons.css",
    "./css/style.css",
    "./css/fonts/bootstrap-icons.woff",
    "./css/fonts/bootstrap-icons.woff2",
    "./js/bootstrap.bundle.min.js",
    "./js/app.js",
    "./favicon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"

];

/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )
            .then(
                cache =>
                    cache.addAll(
                        APP_SHELL
                    )
            )

        );


        /*
         * Yeni Service Worker'ın
         * beklemeden aktif olmasını sağla.
         */

        self.skipWaiting();

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    cacheName =>
                                        cacheName !==
                                        CACHE_NAME
                                )
                                .map(
                                    cacheName =>
                                        caches.delete(
                                            cacheName
                                        )
                                )

                        );

                    }
                )

        );


        /*
         * Açık olan sayfaları yeni
         * Service Worker'a bağla.
         */

        self.clients.claim();

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        /*
         * Yalnızca GET isteklerini
         * ele al.
         */

        if (
            event.request.method !==
            "GET"
        ) {

            return;
        }


        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                cachedResponse => {

                    /*
                     * Cache'de varsa doğrudan
                     * cache'den döndür.
                     */

                    if (cachedResponse) {

                        return cachedResponse;
                    }


                    /*
                     * Cache'de yoksa internetten
                     * almaya çalış.
                     */

                    return fetch(
                        event.request
                    );

                }
            )

        );

    }
);