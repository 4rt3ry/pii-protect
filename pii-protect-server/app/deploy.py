import uvicorn
from pathlib import Path

def main():
    uvicorn.run("server:app", 
                host="localhost",
                port=8443,
                reload=True, 
                ssl_keyfile=Path(__file__).parent / "secrets/certs/sample-ec-key.pem",
                ssl_certfile=Path(__file__).parent / "secrets/certs/sample-cert.pem",
                log_level="debug")
                

if __name__ == "__main__":
    main()
