package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
		Password    string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Println("invalid request body")
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" || input.Email == "" || input.PhoneNumber == "" || input.Password == "" {
		log.Println("invalid request body")
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Println("failed to hash password")
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}
	user := models.User{
		Name:        input.Name,
		Email:       input.Email,
		PhoneNumber: input.PhoneNumber,
		Password:    string(hashedPassword),
	}

	if err := migrations.DB.Create(&user).Error; err != nil {
		log.Println("failed to create user")
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
	utils.JSONFormat(w, r, map[string]string{"message": "User registered successfully"})
}