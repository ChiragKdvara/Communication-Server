from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.hierarchy import router as hierarchy
from api.user_router import router as user_router
from api.template_router import router as template_router
from api.exp_messages import router as exp_messages
from api.view_messages import router as view_messages
from api.validate_router import router as validate_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers for different APIs
app.include_router(hierarchy,prefix='/api/v1/hierarchy')
app.include_router(user_router,prefix='/api/v1/users')
app.include_router(template_router,prefix='/api/v1/templates')
app.include_router(exp_messages,prefix='/api/v1/expMessages')
app.include_router(view_messages,prefix='/api/v1/viewMessages')
app.include_router(validate_router,prefix='/api/v1/validate')
