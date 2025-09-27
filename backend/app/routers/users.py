from app.dependencies import get_current_user
from app.schemas.definitions import User
from fastapi import APIRouter
from fastapi.params import Depends

router = APIRouter()


@router.get("/users/me")
def get_current_user_info(user: User = Depends(get_current_user)):
    pass


@router.put("/users/me")
def update_current_user_info(user: User = Depends(get_current_user)):
    pass
