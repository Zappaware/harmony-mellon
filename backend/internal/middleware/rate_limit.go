package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// ipLimiter holds rate limiters per IP
type ipLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
}

func newIPLimiter(r rate.Limit, b int) *ipLimiter {
	return &ipLimiter{
		limiters: make(map[string]*rate.Limiter),
	}
}

func (i *ipLimiter) getLimiter(ip string, r rate.Limit, b int) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	if lim, ok := i.limiters[ip]; ok {
		return lim
	}
	lim := rate.NewLimiter(r, b)
	i.limiters[ip] = lim
	return lim
}

// cleanup removes old limiters periodically to prevent memory leak
func (i *ipLimiter) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			i.mu.Lock()
			// Simple cleanup: just recreate the map (in production, use TTL cache)
			if len(i.limiters) > 10000 {
				i.limiters = make(map[string]*rate.Limiter)
			}
			i.mu.Unlock()
		}
	}()
}

// RateLimitAuth creates a rate limiter for auth endpoints (login, register, forgot-password).
// Allows 5 requests per 15 minutes per IP to prevent brute force.
func RateLimitAuth() gin.HandlerFunc {
	// 5 tokens per 15 min = 5/900 per second
	lim := newIPLimiter(rate.Limit(5.0/900), 5)
	lim.cleanup(time.Hour)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := lim.getLimiter(ip, rate.Limit(5.0/900), 5)

		if !l.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RateLimitGeneral creates a rate limiter for general API (60 req/min per IP)
func RateLimitGeneral() gin.HandlerFunc {
	lim := newIPLimiter(rate.Limit(1), 60) // 1 per second, burst 60
	lim.cleanup(time.Hour)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := lim.getLimiter(ip, rate.Limit(1), 60)

		if !l.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Demasiadas solicitudes. Por favor espera un momento.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
