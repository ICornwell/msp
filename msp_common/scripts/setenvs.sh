#!/bin/bash

cp -f .env ./msp_servicehub/.env
cp -f .env ./msp_datahub/.env

cp -f .env-bff ./msp_fes/src/uiApi/.env
cp -f .env-ui ./msp_fes/.env

cp -f .env ./msp_actorwork/.env


