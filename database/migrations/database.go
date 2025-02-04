package migrations

import (
	"Sneszana/logging"
	"Sneszana/models"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
)

var DB *gorm.DB

func InitDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_USERNAME"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DATABASE"),
		os.Getenv("POSTGRES_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logging.Log.WithError(err).Fatal("Failed to connect to PostgreSQL database")
	}

	if err := DB.AutoMigrate(
		&models.Restaurant{},
		&models.Dish{},
		&models.User{},
		&models.Courier{},
		&models.RevokedToken{},
		&models.Order{},
		&models.OrderDish{},
		&models.Checker{},
		&models.Address{},
		&models.Review{},
	); err != nil {
		logging.Log.WithError(err).Fatal("Failed to migrate database")
		return
	}
	logging.Log.Info("database migrated successfully")
}
