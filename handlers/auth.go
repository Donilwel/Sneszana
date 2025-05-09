package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"strings"
	"time"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	var input struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
		Password    string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, err, startTime, "Invalid request body")
		writeJSONError(w, http.StatusBadRequest, "Некорректное тело запроса")
		return
	}

	if input.Name == "" || input.Email == "" || input.PhoneNumber == "" || input.Password == "" {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Missing required fields")
		writeJSONError(w, http.StatusBadRequest, "Заполните все поля")
		return
	}

	if migrations.DB.Where("email = ?", input.Email).First(&models.User{}).Error == nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Email already exists")
		writeJSONError(w, http.StatusBadRequest, "Пользователь с таким email уже существует")
		return
	}

	if migrations.DB.Where("name = ?", input.Name).First(&models.User{}).Error == nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Nickname already exists")
		writeJSONError(w, http.StatusBadRequest, fmt.Sprintf("Имя пользователя %s уже занято", input.Name))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		logging.LogRequest(logrus.ErrorLevel, uuid.Nil, r, http.StatusInternalServerError, err, startTime, "Failed to hash password")
		writeJSONError(w, http.StatusInternalServerError, "Не удалось зашифровать пароль")
		return
	}

	user := models.User{
		Name:        input.Name,
		Email:       input.Email,
		PhoneNumber: input.PhoneNumber,
		Password:    string(hashedPassword),
	}

	if err := migrations.DB.Create(&user).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, user.ID, r, http.StatusInternalServerError, err, startTime, "Failed to create user")
		writeJSONError(w, http.StatusInternalServerError, "Не удалось создать пользователя")
		return
	}

	w.WriteHeader(http.StatusCreated)
	utils.JSONFormat(w, r, map[string]string{"message": "Пользователь успешно зарегистрирован"})
	logging.LogRequest(logrus.InfoLevel, user.ID, r, http.StatusCreated, nil, startTime, "User registered successfully")
}

func JSONFormat(w http.ResponseWriter, r *http.Request, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func writeJSONError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": message})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, err, startTime, "Invalid request body")
		utils.WriteJSONError(w, http.StatusBadRequest, "Некорректное тело запроса")
		return
	}

	if input.Email == "" || input.Password == "" {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Missing email or password")
		utils.WriteJSONError(w, http.StatusBadRequest, "Email и пароль обязательны")
		return
	}

	var user models.User
	if err := migrations.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusUnauthorized, err, startTime, "Email not found")
		utils.WriteJSONError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		logging.LogRequest(logrus.WarnLevel, user.ID, r, http.StatusUnauthorized, err, startTime, "Invalid password")
		utils.WriteJSONError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		logging.LogRequest(logrus.ErrorLevel, user.ID, r, http.StatusInternalServerError, err, startTime, "Failed to generate JWT")
		utils.WriteJSONError(w, http.StatusInternalServerError, "Ошибка генерации токена")
		return
	}

	utils.JSONFormat(w, r, map[string]string{"token": token})
	logging.LogRequest(logrus.InfoLevel, user.ID, r, http.StatusOK, nil, startTime, "User logged in successfully")
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	token := r.Header.Get("Authorization")
	if token == "" {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Missing authorization token")
		http.Error(w, "Missing authorization token", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(token, " ")
	if len(parts) != 2 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid token format")
		http.Error(w, "Invalid token format", http.StatusUnauthorized)
		return
	}

	revoked := models.RevokedToken{Token: parts[1]}
	if err := migrations.DB.Save(&revoked).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to revoke token")
		http.Error(w, "Failed to revoke token", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logout successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "User logged out successfully")
}
