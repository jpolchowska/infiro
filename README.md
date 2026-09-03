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

## !!! set up .env in mobile, use mobile/.env.example for reference !!!

## Do those commands in mobile directory
## Have android studio (RECCOMENDED)
npx expo start
## then press "a" on keyboard

## Have expo go (NOT RECCOMENDED)
npx expo start
## scan qr code

## Creating Accounts

#### Student (Uczeń)
#### Go to keykloak admin (log in), then precede to "matematyka-app" realm and go to "Users" and create account using form

#### Teacher (Nauczyciel)
#### Go to keykloak admin (log in), then precede to "matematyka-app" realm and go to "Users" and create account using form, then go to groups select "join Group" select "nauczyciele" and then Join

#### admin (Administrator)
#### Go to keykloak admin (log in), then precede to "matematyka-app" realm and go to "Users" and create accounts using form
#### then create role "admin" in Realm roles, and then map that role to the user ( Users, Role maping, asign role, filter by realm roles) and you should have here admin role