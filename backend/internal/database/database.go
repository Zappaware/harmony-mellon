package database

import (
	"mellon-harmony-api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Issue{},
		&models.Comment{},
		&models.Project{},
		&models.ProjectMember{},
		&models.Notification{},
	)
}
