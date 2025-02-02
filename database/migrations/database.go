package migrations

import (
	"Sneszana/models"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
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
		log.Fatalf("failed to connect to PostgreSQL database: %v", err)
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
	); err != nil {
		log.Println("error migrating database")
		return
	}
	log.Println("database migrated successfully")
}
