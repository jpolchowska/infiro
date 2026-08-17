# infiro
Aplikacja do nauki matematyki

## Running backend and infrastructure

## create the .env file and copy .env.example into it (the main folder)
## create file db_password.txt in infrastructure/secrets/db_password.txt , put there "mysecretpassword"

## Use only during first time after downloading a repo or after modyfing one of Dockerfiles
docker compose build
## Use every time when app is beaing developed
docker compose watch

## Running Frontend

## !!! set up .env in frontend, use frontend/.env.example for reference !!!

## Do those commands in frontend directory
## Have android studio (RECCOMENDED)
npx expo start
## then press "a" on keyboard

## Have expo go (NOT RECCOMENDED)
npx expo start
## scan qr code