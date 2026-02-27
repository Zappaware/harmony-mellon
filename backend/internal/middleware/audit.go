package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// AuditLog logs sensitive actions: method, path, user_id, role, IP, timestamp
func AuditLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		clientIP := c.ClientIP()

		c.Next()

		// Only log for sensitive methods
		if method != "GET" && method != "OPTIONS" {
			userID, _ := c.Get("user_id")
			userRole, _ := c.Get("user_role")
			userIDStr := ""
			roleStr := ""
			if userID != nil {
				userIDStr = userID.(string)
			}
			if userRole != nil {
				roleStr = userRole.(string)
			}
			latency := time.Since(start)
			log.Printf("[AUDIT] %s %s | user=%s role=%s ip=%s latency=%v",
				method, path, userIDStr, roleStr, clientIP, latency)
		}
	}
}
