import string
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import os
import requests
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
redirect_uri = os.getenv("REDIRECT_URI")

stuff = {
    
}


def generate_random_code(size, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choices(chars, k=size))

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
    state = generate_random_code(16)
    scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email'
    
    stuff["state"] = state
    query_params = {
        "response_type": "code",
        "client_id": client_id,
        "scope": scope,
        "redirect_uri": redirect_uri,
        "state": state,
    }
    
    auth_url = "https://accounts.spotify.com/authorize?" + urlencode(query_params)
    return RedirectResponse(url=auth_url)

print("runnning on 8000 :]")

@app.get("/callback")
def callback(code: str, state: str):
    if (state == stuff["state"]):
        print("yes(exchanges code for access+refresh token)")
        token_response = requests.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
            auth=(client_id, client_secret)
        )
        # print(token_response.json())
        stuff["access_token"] = token_response.json()["access_token"]
        stuff["refresh_token"] = token_response.json()["refresh_token"]
        
    else:
        raise HTTPException(status_code=401, detail="state doesnt match")
    front_url = "http://localhost:5173/playlists"
    return RedirectResponse(url=front_url)
    
@app.get("/playlists")
def get_playlists():
    access_token = stuff["access_token"]
    
    response = requests.get(
        "https://api.spotify.com/v1/me/playlists",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    return response.json()

@app.get("/user")
def get_user():
    access_token = stuff["access_token"]
    
    response = requests.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    data = response.json()
    print("userp", data)
    return data
#uvicorn app.main:app --reload --port 5001
#source venv/bin/activate 
#uvicorn app.main:app --reload 
