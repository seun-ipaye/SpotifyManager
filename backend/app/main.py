import string
import random
from fastapi import FastAPI, HTTPException, Cookie 
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
frontend_url = os.getenv("FRONTEND_URL")



def generate_random_code(size, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choices(chars, k=size))


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
@app.get("/")
def root():
    return {"message": "Spotify Manager API running"}

@app.get("/login")
def login():
    state = generate_random_code(16)
    scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email'
    
    query_params = {
        "response_type": "code",
        "client_id": client_id,
        "scope": scope,
        "redirect_uri": redirect_uri,
        "state": state,
    }

    
    auth_url = "https://accounts.spotify.com/authorize?" + urlencode(query_params)

    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=300, samesite="none", secure=True)
    
    return response

print("runnning")

@app.get("/callback")
def callback(code: str, state: str, oauth_state: str = Cookie(None)):
    if (state == oauth_state):
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
        data = token_response.json()
        front_url = f"{frontend_url}/playlists"
        frontend_redirect = RedirectResponse(url=front_url)
        
        frontend_redirect.set_cookie(key="access_token", value=data["access_token"], httponly=True, max_age=3600, samesite="none", secure=True) 
        frontend_redirect.set_cookie(key="refresh_token", value=data["refresh_token"], httponly=True, max_age=360000, samesite="none", secure=True)
        frontend_redirect.delete_cookie("oauth_state")
        
    else:
        raise HTTPException(status_code=401, detail="state doesnt match")
    
    return frontend_redirect
    
@app.get("/playlists")
def get_playlists(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not logged in")
            
    response = requests.get(
        "https://api.spotify.com/v1/me/playlists",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    return response.json()

@app.get("/user")
def get_user(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access token")
        
    response = requests.get(
        "https://api.spotify.com/v1/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    data = response.json()
    print("userp", data)
    return data

@app.get("/playlist/{playlist_id}/tracks")
def get_tracks(playlist_id: str, access_token: str = Cookie(None)):
    
    response = requests.get(
        f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    return response.json()
#uvicorn app.main:app --reload --port 5001
#python3 -m venv venv source venv/bin/activate 
#uvicorn app.main:app --reload  
