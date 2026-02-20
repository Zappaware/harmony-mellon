package handlers

import (
	"mellon-harmony-api/internal/service"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	fileService *service.FileService
}

func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{
		fileService: fileService,
	}
}

// UploadFile handles file uploads
func (h *FileHandler) UploadFile(c *gin.Context) {
	// Get the file from the form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided: " + err.Error()})
		return
	}

	// Optional: upload_purpose = "avatar" | "client_logo" | "attachment" (default)
	uploadPurpose := c.PostForm("upload_purpose")
	if uploadPurpose == "" {
		uploadPurpose = "attachment"
	}

	var filePath string
	switch uploadPurpose {
	case "avatar":
		userID := c.PostForm("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required for avatar upload"})
			return
		}
		filePath, err = h.fileService.SaveAvatarFile(file, userID)
	case "client_logo":
		clientID := c.PostForm("client_id")
		if clientID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "client_id required for client logo upload"})
			return
		}
		filePath, err = h.fileService.SaveClientLogoFile(file, clientID)
	default:
		// Validate file type for attachment uploads
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip", ".rar"}
		isAllowed := false
		for _, allowedExt := range allowedExts {
			if ext == allowedExt {
				isAllowed = true
				break
			}
		}
		if !isAllowed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed"})
			return
		}
		clientID := c.PostForm("client_id")
		projectID := c.PostForm("project_id")
		filePath, err = h.fileService.SaveFile(file, clientID, projectID)
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Determine file type
	fileType := "file"
	if strings.HasPrefix(file.Header.Get("Content-Type"), "image/") {
		fileType = "image"
	}

	// Return file info
	c.JSON(http.StatusOK, gin.H{
		"path": filePath,
		"name": file.Filename,
		"type": fileType,
		"size": file.Size,
	})
}

// ServeFile serves uploaded files
func (h *FileHandler) ServeFile(c *gin.Context) {
	filePath := c.Param("path")
	
	// Remove leading slash if present
	filePath = strings.TrimPrefix(filePath, "/")
	
	// Security: ensure the path doesn't contain directory traversal
	if strings.Contains(filePath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	// Get full file path
	// Remove "uploads/" prefix if present
	relativePath := strings.TrimPrefix(filePath, "uploads/")
	fullPath := h.fileService.GetFilePath(relativePath)
	
	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Serve the file
	c.File(fullPath)
}
