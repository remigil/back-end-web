# Bogor Ngawas Services

Bogor Ngawas adalah sebuah website yang menyediakan layanan untuk mengawasi perjalanan kedatangan dan keberangkatan Kota Bogor.

## Installation

Cara menginstall service ini dengan cara clone project ini dari GitHub.

### Pre-requisites

Sebelum memulai instalasi, pastikan Anda memiliki beberapa hal berikut:

1. Node.js versi >= 16.13.1
2. Npm versi >= 6.14.18

Setelah itu, clone project ini ke direktori yang Anda inginkan, lalu jalankan perintah berikut untuk mengunduh semua dependensi:

```bash
npm install

# APP CONFIGURATION
APP_VERSION=
APP_PORT=
APP_NODE_ENV=
APP_ENABLE_DEBUG_LOG=
APP_ENABLE_ERROR_LOG=
APP_ENABLE_DB_LOG=
APP_ENABLE_ENCRYPT_DATA_OUTPUT=
APP_ENABLE_COMPRESSION=
APP_ENABLE_RATE_LIMIT=
APP_ENABLE_CORS=

# AUTHENTICATION
GOOGLE_MAPS_API_KEY=
# BASIC AUTH
AUTH_UNAME=
AUTH_PASSWORD=
# AES
ENCRYPT_IV=
ENCRYPT_PASSPHARSE=
# JWT
JWT_EXPIRE=
JWT_ISSUER=
JWT_AUDIENCE=
JWT_ALGORITHM=
JWT_SUBJECT=

# DB
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
DB_DIALECT=

# DB ETILANG MARIADB
DB_HOST_ETILANG=
DB_PORT_ETILANG=
DB_USER_ETILANG=
DB_PASS_ETILANG=
DB_NAME_ETILANG=
DB_DIALECT_ETILANG=

# ANTI DDOS
# in minutes
RATE_LIMIT_RESET=
# per ip/window limit visit api within rate limit reset time
RATE_LIMIT_VISIT_PER_RLR=

# CORS
CORS_ORIGIN=*

# Mongo
# MONGO_HOST=
# MONGO_PORT=
# MONGO_DB=
# MONGO_USERNAME=
# MONGO_PASSWORD=
# ENV_SSL=
# ANEV_BASE_URL=
