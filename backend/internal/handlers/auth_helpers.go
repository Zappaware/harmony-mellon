package handlers

import (
	"errors"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetCurrentUserFromDB fetches the current user from the database using the user_id from the JWT context.
// Use this for authorization checks so role changes take effect immediately without re-login.
// Returns (nil, error) if user_id is missing or user not found.
func GetCurrentUserFromDB(c *gin.Context, userRepo repository.UserRepository) (*models.User, error) {
	userIDVal, exists := c.Get("user_id")
	if !exists || userIDVal == nil {
		return nil, errors.New("user_id not in context")
	}
	userIDStr, ok := userIDVal.(string)
	if !ok || userIDStr == "" {
		return nil, errors.New("invalid user_id in context")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, err
	}
	user, err := userRepo.GetByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}
