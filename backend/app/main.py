from pydantic import BaseModel
import string
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")



# playlist_id = "3m7rfTFYrcH2oPbGbytBCr"

def get_access_token():
    token_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
    )

    if token_response.status_code != 200:
        raise HTTPException(status_code=token_response.status_code, detail=token_response.json())

    return token_response.json()["access_token"]



app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
@app.get("/")
def root():
    return {"message": "Spotify Manager API running"}

@app.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: str):
    
    access_token = get_access_token()
    playlist_response = requests.get(f"https://api.spotify.com/v1/playlists/{playlist_id}", headers={"Authorization": f"Bearer {access_token}"})
    
    if playlist_response.status_code != 200:
        raise HTTPException(status_code=playlist_response.status_code, detail=playlist_response.json())

   
    return playlist_response.json()

@app.get("/login")
def login():
    
    access_token = get_access_token()
    playlist_response = requests.get(f"https://api.spotify.com/v1/playlists/{playlist_id}", headers={"Authorization": f"Bearer {access_token}"})
    
    if playlist_response.status_code != 200:
        raise HTTPException(status_code=playlist_response.status_code, detail=playlist_response.json())

   
    return playlist_response.json()