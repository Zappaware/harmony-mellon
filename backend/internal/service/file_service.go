package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

const (
	// MaxFileSize is 10MB in bytes
	MaxFileSize = 10 * 1024 * 1024
	// UploadDir is the directory where files are stored
	UploadDir = "uploads"
	// UnclassifiedFolder is used when client or project is not provided
	UnclassifiedFolder = "general"
)

type FileService struct {
	uploadDir string
}

func NewFileService(uploadDir string) *FileService {
	// Create upload directory if it doesn't exist
	if uploadDir == "" {
		uploadDir = UploadDir
	}

	// Ensure directory exists
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}

	return &FileService{
		uploadDir: uploadDir,
	}
}

// safeFolderName returns a safe segment for path (UUID or "general" only)
func safeFolderName(id string) string {
	id = strings.TrimSpace(id)
	if id == "" {
		return UnclassifiedFolder
	}
	// Allow only UUID-like: hex and hyphens, no path traversal
	for _, r := range id {
		if (r >= 'a' && r <= 'f') || (r >= '0' && r <= '9') || r == '-' {
			continue
		}
		if r >= 'A' && r <= 'F' {
			continue
		}
		return UnclassifiedFolder
	}
	if strings.Contains(id, "..") {
		return UnclassifiedFolder
	}
	return id
}

// SaveFile saves an uploaded file under uploads/{client_id}/{project_id}/images|files/
// clientID and projectID can be empty or UUIDs; empty/invalid values use "general".
// Returns path with forward slashes for URLs (e.g. "uploads/client_id/project_id/images/unique.jpg").
func (s *FileService) SaveFile(fileHeader *multipart.FileHeader, clientID, projectID string) (string, error) {
	// Validate file size
	if fileHeader.Size > MaxFileSize {
		return "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", MaxFileSize)
	}

	clientID = safeFolderName(clientID)
	projectID = safeFolderName(projectID)

	// images vs files by content type
	subdir := "files"
	if strings.HasPrefix(fileHeader.Header.Get("Content-Type"), "image/") {
		subdir = "images"
	}

	dir := filepath.Join(s.uploadDir, clientID, projectID, subdir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	ext := filepath.Ext(fileHeader.Filename)
	uniqueName := generateUniqueFilename(ext)
	filePath := filepath.Join(dir, uniqueName)

	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	// Return path with forward slashes for URL consistency (e.g. uploads/client_id/project_id/images/unique.jpg)
	return filepath.ToSlash(filepath.Join(s.uploadDir, clientID, projectID, subdir, uniqueName)), nil
}

// SaveAvatarFile saves an uploaded image as a user avatar under uploads/avatars/{userID}/
// userID must be a valid UUID. Returns path with forward slashes (e.g. uploads/avatars/user_id/unique.jpg).
func (s *FileService) SaveAvatarFile(fileHeader *multipart.FileHeader, userID string) (string, error) {
	if fileHeader.Size > MaxFileSize {
		return "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", MaxFileSize)
	}
	if !strings.HasPrefix(fileHeader.Header.Get("Content-Type"), "image/") {
		return "", fmt.Errorf("avatar must be an image file")
	}
	userID = safeFolderName(userID)
	if userID == UnclassifiedFolder {
		return "", fmt.Errorf("valid user_id required for avatar upload")
	}
	dir := filepath.Join(s.uploadDir, "avatars", userID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()
	ext := filepath.Ext(fileHeader.Filename)
	uniqueName := generateUniqueFilename(ext)
	filePath := filepath.Join(dir, uniqueName)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}
	return filepath.ToSlash(filepath.Join(s.uploadDir, "avatars", userID, uniqueName)), nil
}

// SaveClientLogoFile saves an uploaded image as a client logo under uploads/logos/{clientID}/
// clientID must be a valid UUID. Returns path with forward slashes (e.g. uploads/logos/client_id/unique.jpg).
func (s *FileService) SaveClientLogoFile(fileHeader *multipart.FileHeader, clientID string) (string, error) {
	if fileHeader.Size > MaxFileSize {
		return "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", MaxFileSize)
	}
	if !strings.HasPrefix(fileHeader.Header.Get("Content-Type"), "image/") {
		return "", fmt.Errorf("logo must be an image file")
	}
	clientID = safeFolderName(clientID)
	if clientID == UnclassifiedFolder {
		return "", fmt.Errorf("valid client_id required for logo upload")
	}
	dir := filepath.Join(s.uploadDir, "logos", clientID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()
	ext := filepath.Ext(fileHeader.Filename)
	uniqueName := generateUniqueFilename(ext)
	filePath := filepath.Join(dir, uniqueName)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}
	return filepath.ToSlash(filepath.Join(s.uploadDir, "logos", clientID, uniqueName)), nil
}

// DeleteFile deletes a file from the upload directory
func (s *FileService) DeleteFile(filePath string) error {
	// Ensure the file is within the upload directory for security
	if !strings.HasPrefix(filePath, s.uploadDir) {
		return fmt.Errorf("invalid file path: %s", filePath)
	}

	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// GetFilePath returns the full path to a file
func (s *FileService) GetFilePath(relativePath string) string {
	return filepath.Join(s.uploadDir, relativePath)
}

// generateUniqueFilename generates a unique filename with the given extension
func generateUniqueFilename(ext string) string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes) + ext
}
