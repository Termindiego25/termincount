package main

import (
	"context"
	"crypto/tls"
	"errors"
	"flag"
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

const (
	defaultStaticDir = "/srv/termincount"
	certFile         = "/etc/termincount/certs/fullchain.pem"
	keyFile          = "/etc/termincount/certs/privkey.pem"
)

func main() {
	healthcheck := flag.Bool("healthcheck", false, "check the local HTTP endpoint")
	flag.Parse()

	httpPort := env("PORT", "80")
	tlsPort := env("TLS_PORT", "443")

	if *healthcheck {
		if err := runHealthcheck(httpPort); err != nil {
			log.Fatal(err)
		}
		return
	}

	root := env("STATIC_DIR", defaultStaticDir)
	handler := withHealthz(staticHandler(root))

	if fileExists(certFile) && fileExists(keyFile) {
		go func() {
			redirect := withHealthz(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				target := "https://" + hostWithoutPort(r.Host) + r.URL.RequestURI()
				if tlsPort != "443" {
					target = "https://" + hostWithoutPort(r.Host) + ":" + tlsPort + r.URL.RequestURI()
				}
				http.Redirect(w, r, target, http.StatusPermanentRedirect)
			}))
			log.Printf("HTTP redirect server listening on :%s", httpPort)
			if err := http.ListenAndServe(":"+httpPort, redirect); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Fatal(err)
			}
		}()

		server := &http.Server{
			Addr:              ":" + tlsPort,
			Handler:           handler,
			ReadHeaderTimeout: 5 * time.Second,
			TLSConfig: &tls.Config{
				MinVersion: tls.VersionTLS12,
			},
		}
		log.Printf("HTTPS server listening on :%s", tlsPort)
		log.Fatal(server.ListenAndServeTLS(certFile, keyFile))
	}

	server := &http.Server{
		Addr:              ":" + httpPort,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("HTTP server listening on :%s", httpPort)
	log.Fatal(server.ListenAndServe())
}

func staticHandler(root string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		applySecurityHeaders(w, r.URL.Path)

		target := resolveTarget(root, r.URL.Path)
		if target == "" {
			http.NotFound(w, r)
			return
		}

		setContentType(w, target)
		http.ServeFile(w, r, target)
	})
}

func resolveTarget(root string, rawPath string) string {
	cleanURL := path.Clean("/" + rawPath)
	rel := strings.TrimPrefix(cleanURL, "/")
	if rel == "" {
		rel = "index.html"
	}

	target := filepath.Join(root, filepath.FromSlash(rel))
	if info, err := os.Stat(target); err == nil {
		if info.IsDir() {
			index := filepath.Join(target, "index.html")
			if fileExists(index) {
				return index
			}
			return ""
		}
		return target
	}

	fallback := filepath.Join(root, "200.html")
	if fileExists(fallback) {
		return fallback
	}
	return ""
}

func applySecurityHeaders(w http.ResponseWriter, requestPath string) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "SAMEORIGIN")
	w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
	w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

	if strings.HasPrefix(requestPath, "/_app/immutable/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
}

func setContentType(w http.ResponseWriter, filePath string) {
	if w.Header().Get("Content-Type") != "" {
		return
	}
	ext := filepath.Ext(filePath)
	if contentType := mime.TypeByExtension(ext); contentType != "" {
		w.Header().Set("Content-Type", contentType)
		return
	}

	switch ext {
	case ".css":
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case ".js", ".mjs":
		w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	case ".json", ".webmanifest":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
	}
}

func withHealthz(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/healthz" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func runHealthcheck(port string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://127.0.0.1:"+port+"/healthz", nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("unexpected health status: %s", resp.Status)
	}
	return nil
}

func hostWithoutPort(host string) string {
	if idx := strings.LastIndex(host, ":"); idx > -1 {
		return host[:idx]
	}
	return host
}

func env(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func fileExists(filePath string) bool {
	info, err := os.Stat(filePath)
	return err == nil && !info.IsDir()
}
