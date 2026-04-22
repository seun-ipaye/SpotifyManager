import string
import random
from pydantic import BaseModel
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
frontend_url = os.getenv("FRONTEND_URL")

class TrackAdd(BaseModel):
    track_uri: str
class TrackDelete(BaseModel):
    track_uri: str
    
stuff = {

}

def generate_random_code(size, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choices(chars, k=size))

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

print("runnning on something but this is main2")

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
    front_url = f"{frontend_url}/playlists"
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

@app.get("/playlist/{playlist_id}/tracks")
def get_tracks(playlist_id: str):
    access_token = stuff["access_token"]

    response = requests.get(
        f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
        headers={"Authorization": f"Bearer {access_token}"}
    )

    return response.json()

@app.post("/playlists/{playlist_id}/add_track")
def add_track(playlist_id: str, track_data: TrackAdd):
    access_token = stuff["access_token"]
    if not access_token: raise HTTPException(status_code=401)
    add_response = requests.post(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
            json={
                "uris": [
                    track_data.track_uri,
                ],
                "position": 0
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = add_response.json()
    if add_response.status_code == 201:
        return data
    else:
         raise HTTPException(status_code=add_response.status_code, detail=data.get("error", {}).get("message", "Spotify API error"))
    
@app.post("/playlists/{playlist_id}/delete_track")
def delete_track(playlist_id: str, track_data: TrackDelete):
    access_token = stuff["access_token"]
    if not access_token: raise HTTPException(status_code=401)
    del_response = requests.delete(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
            json={
                "items": [
                    {
                        "uri": track_data.track_uri
                    }
                ],
        
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = del_response.json()
    if del_response.status_code == 200:
        return data
    else:
         raise HTTPException(status_code=del_response.status_code, detail=data.get("error", {}).get("message", "Spotify API error"))

#uvicorn app.main:app --reload --port 5001
#python3 -m venv venv source venv/bin/activate 
#uvicorn app.main:app --reload 