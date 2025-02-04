package config

import (
	"Sneszana/logging"
	"github.com/joho/godotenv"
)

func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		logging.Log.WithError(err).Fatal("Ошибка загрузки .env файла")
	} else {
		logging.Log.Info(".env файл успешно загружен")
	}
}
