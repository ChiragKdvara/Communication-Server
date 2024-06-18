from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import  Request, HTTPException

class MaxRequestSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_request_size: int):
        super().__init__(app)
        self.max_request_size = max_request_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get('content-length')
            if content_length and int(content_length) > self.max_request_size:
                raise HTTPException(status_code=413, detail="Request body too large")
            body = await request.body()
            if len(body) > self.max_request_size:
                raise HTTPException(status_code=413, detail="Request body too large")
        response = await call_next(request)
        return response