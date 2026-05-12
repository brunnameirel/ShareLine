"""
Reports router — ShareLine

Endpoints:
    POST /reports  — report the other user in a request thread
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from db import SessionDep
from models import ItemTable, RequestTable, UserReportTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

BAN_THRESHOLD = 3


class ReportCreate(BaseModel):
    request_id: UUID


class ReportRead(BaseModel):
    reported_user_id: UUID
    is_banned: bool


@router.post("", response_model=ReportRead, status_code=201)
def report_user(
    payload: ReportCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
):
    """Report the other party in a request. Bans them if they reach 3 reports."""
    req = session.get(RequestTable, payload.request_id)
    if not req:
        raise HTTPException(404, "Request not found")

    item = session.get(ItemTable, req.item_id)
    if not item:
        raise HTTPException(404, "Item not found")

    if current_user.id not in (req.requester_id, item.donor_id):
        raise HTTPException(403, "You are not a party to this request")

    other_user_id = item.donor_id if current_user.id == req.requester_id else req.requester_id

    existing = session.exec(
        select(UserReportTable)
        .where(UserReportTable.reporter_id == current_user.id)
        .where(UserReportTable.reported_id == other_user_id)
    ).first()
    if existing:
        raise HTTPException(400, "You have already reported this user")

    session.add(UserReportTable(
        reporter_id=current_user.id,
        reported_id=other_user_id,
        request_id=payload.request_id,
    ))

    other_user = session.get(UserTable, other_user_id)
    if not other_user:
        raise HTTPException(404, "Reported user not found")

    other_user.report_count += 1
    if other_user.report_count >= BAN_THRESHOLD:
        other_user.is_banned = True
    session.add(other_user)

    session.commit()
    session.refresh(other_user)

    return ReportRead(reported_user_id=other_user_id, is_banned=other_user.is_banned)
