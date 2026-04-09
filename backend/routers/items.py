

from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import select
from uuid import UUID

from db import SessionDep
# prevents collision with Request from fastapi
from models import ItemTable, UserTable, RequestTable
from schemas import ItemCreate
from .auth import get_current_user, require_donor, require_requester

router = APIRouter(tags=["items"])

templates = Jinja2Templates(directory="templates")


@router.post("/", response_model=ItemTable)
def create_item(item_in: ItemCreate, session: SessionDep):
    """
    Create a new item batch for a donor.
    If an identical batch already exists, increase its quantity instead.
    """

    # 1) Check user or admin exists
    donor = session.get(UserTable, item_in.donor_id)
    if donor is None or not donor.is_donor:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID or user is not a donor",
        )

    # 2) Check if a similar item already exists (same donor, name, category, location, description, condition)
    query = select(ItemTable).where(
        ItemTable.donor_id == item_in.donor_id,
        ItemTable.name == item_in.name,
        ItemTable.category == item_in.category,
        ItemTable.location == item_in.location,
        ItemTable.description == item_in.description,
        ItemTable.condition == item_in.condition,
    )
    existing = session.exec(query).first()

    # 3) If found, just bump quantity
    if existing:
        existing.quantity += item_in.quantity

        # If it was "Completed" and now has stock, make it "Available"
        if existing.quantity > 0 and existing.status == "Completed":
            existing.status = "Available"

        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    # 4) Otherwise create a brand new item
    item = ItemTable(
        donor_id=item_in.donor_id,
        name=item_in.name,
        category=item_in.category,
        quantity=item_in.quantity,
        description=item_in.description,
        location=item_in.location,
        status="Available",
        condition=item_in.condition,
        photo_urls=item_in.photo_urls,
    )

    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.get("/", response_model=List[ItemTable])
def list_items(
    session: SessionDep,
    category: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    min_quantity: Optional[int] = None,
):
    """
    List items, optionally filtered by category, location, status, and min_quantity.
    """
    query = select(ItemTable)

    if category is not None:
        query = query.where(ItemTable.category == category)

    if location is not None:
        query = query.where(ItemTable.location == location)

    if status is not None:
        query = query.where(ItemTable.status == status)

    if min_quantity is not None:
        query = query.where(ItemTable.quantity >= min_quantity)

    results = session.exec(query).all()
    return results


@router.delete("/{item_id}")
def delete_item(
    item_id: UUID,
    session: SessionDep,
    user: UserTable = Depends(require_donor),
):

    item = session.get(ItemTable, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Donors can only delete their own items
    if item.donor_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete items you donated.",
        )

    if item.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Completed items cannot be deleted.",
        )

    # If you also want to clean up old non-pending requests, you *can* do:
    old_requests = session.exec(select(RequestTable).where(RequestTable.item_id == item_id)).all()
    for r in old_requests:
        session.delete(r)

    session.delete(item)
    session.commit()
    return {"detail": "Item deleted successfully"}

@router.get("/my", response_class=HTMLResponse)
def my_items_page(
    request: Request, 
    session: SessionDep, 
    user: UserTable = Depends(require_donor)
):
    
    items = session.exec(
        select(ItemTable).where(ItemTable.donor_id == user.id)
    ).all()

    return templates.TemplateResponse(
        "items_my.html",
        {"request": request, "current_user": user, "items": items},
    )

@router.post("/new")
async def create_item_from_form(
    request: Request, 
    session: SessionDep, 
    user: UserTable = Depends(require_donor)
):

    form = await request.form() # type: ignore

    name = form.get("name")
    category = form.get("category")
    quantity_raw = form.get("quantity")
    description = form.get("description")
    location = form.get("location")
    condition = form.get("condition")
    photo_urls = form.get("photo_urls")  # Optional, comma-separated URLs

    if not all([name, category, quantity_raw, description, location, condition]):
        raise HTTPException(status_code=400, detail="All fields required")

    try:
        quantity = int(str(quantity_raw).strip())
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Quantity must be a whole number")

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    item_in = ItemCreate(
        donor_id=user.id,
        name=name,
        category=category,
        quantity=quantity,
        description=description,
        location=location,
        condition=condition,
        photo_urls=photo_urls,
    )

    create_item(item_in=item_in, session=session)

    return RedirectResponse(url="/items/my", status_code=303)

@router.get("/new", response_class=HTMLResponse)
def new_item_page(
    request: Request, 
    user: UserTable = Depends(require_donor)
):

    return templates.TemplateResponse(
        "items_new.html",
        {
            "request": request,
            "current_user": user,
        },
    )
    
@router.get("/{item_id}", response_model=ItemTable)
def get_item(item_id: UUID, session: SessionDep):
    """
    Get a single item by ID.
    """
    item = session.get(ItemTable, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item