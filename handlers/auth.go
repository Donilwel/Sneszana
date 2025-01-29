package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"strings"
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
	if migrations.DB.Where("email = ?", input.Email).First(&models.User{}).Error == nil {
		log.Println("user with email already exists")
		http.Error(w, "user with email already exists", http.StatusBadRequest)
		return
	}
	if migrations.DB.Where("name = ?", input.Name).First(&models.User{}).Error == nil {
		log.Println("user with nickname " + input.Name + " already exists")
		http.Error(w, "user with nickname "+input.Name+" already exists", http.StatusBadRequest)
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
	utils.JSONFormat(w, r, user)
	utils.JSONFormat(w, r, map[string]string{"message": "User registered successfully"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Println("invalid request body")
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Email == "" || input.Password == "" {
		log.Println("invalid. email or password is empty")
		http.Error(w, "invalid. email or password is empty", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := migrations.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		log.Println("invalid email or password")
		http.Error(w, "invalid email or password", http.StatusNotFound)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		log.Println("invalid email or password")
		http.Error(w, "invalid email or password", http.StatusNotFound)
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email)
	if err != nil {
		log.Println("failed to generate JWT")
		http.Error(w, "failed to generate JWT", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, map[string]string{"token": token})
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	if token == "" {
		log.Println("no have token")
		http.Error(w, "no have token", http.StatusUnauthorized)
		return
	}
	parts := strings.Split(token, " ")
	revoked := models.RevokedToken{Token: parts[1]}
	if err := migrations.DB.Save(&revoked).Error; err != nil {
		log.Println("failed to revoke token")
		http.Error(w, "failed to revoke token", http.StatusInternalServerError)
		return
	}
	log.Println("Logout successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logout successfully"))
}
