"""
Impact dashboard aggregates: rough reuse estimates for morale / storytelling.

Endpoints:
    GET /impact/summary: personal giving and receiving totals (auth required)
"""

from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from db import SessionDep
from models import ItemTable, RequestTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/impact", tags=["impact"])

# Heuristic retail-equivalent value per unit (USD), by listing category.
_VALUE_USD_PER_UNIT: Dict[str, float] = {
    "Clothing": 18.0,
    "Textbooks": 42.0,
    "Electronics": 55.0,
    "Bedding": 28.0,
    "Other": 14.0,
}

# Approximate avoided manufacturing / disposal CO₂ per unit (kg CO₂e), illustrative only.
_CO2_KG_PER_UNIT: Dict[str, float] = {
    "Clothing": 6.5,
    "Textbooks": 11.0,
    "Electronics": 35.0,
    "Bedding": 9.0,
    "Other": 4.5,
}


def _cat_key(category: str) -> str:
    return category if category in _VALUE_USD_PER_UNIT else "Other"


def _estimate_units(category: str, units: float) -> Tuple[float, float]:
    key = _cat_key(category)
    return (
        _VALUE_USD_PER_UNIT[key] * units,
        _CO2_KG_PER_UNIT[key] * units,
    )


def _sum_estimate_items(items: List[ItemTable]) -> Tuple[float, float]:
    usd = 0.0
    co2 = 0.0
    for item in items:
        u, c = _estimate_units(item.category, float(item.quantity))
        usd += u
        co2 += c
    return round(usd, 2), round(co2, 2)


def _sum_estimate_requests(session: Session, reqs: List[RequestTable]) -> Tuple[float, float]:
    usd = 0.0
    co2 = 0.0
    for req in reqs:
        item = session.get(ItemTable, req.item_id)
        if not item:
            continue
        u, c = _estimate_units(item.category, float(req.requested_quantity))
        usd += u
        co2 += c
    return round(usd, 2), round(co2, 2)


class GivingImpact(BaseModel):
    items_listed: int = Field(description="Item rows you have posted as a donor.")
    units_listed: int = Field(description="Sum of quantities across those listings.")
    estimated_value_usd: float
    estimated_co2_kg_saved: float


class ReceivingImpact(BaseModel):
    active_requests: int = Field(
        description="Requests you placed that are pending, approved, or completed (not rejected)."
    )
    units_requested: int = Field(description="Sum of requested_quantity across those requests.")
    estimated_value_usd: float
    estimated_co2_kg_saved: float


class ImpactSummaryRead(BaseModel):
    giving: GivingImpact
    receiving: ReceivingImpact
    methodology_note: str


METHODOLOGY_NOTE = (
    "Giving reflects everything you have listed; receiving reflects your open requests "
    "(pending through matched). Dollar and CO₂ figures use category averages (illustrative only)."
)


@router.get("/summary", response_model=ImpactSummaryRead)
def impact_summary(
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> ImpactSummaryRead:
    """Aggregate impact stats for the signed-in user."""

    # --- Giving: all listings (Available / Reserved / Completed, real donor activity) ---
    my_items = session.exec(
        select(ItemTable).where(ItemTable.donor_id == current_user.id)
    ).all()
    giving_units = sum(i.quantity for i in my_items)
    g_usd, g_co2 = _sum_estimate_items(list(my_items))

    # --- Receiving: requests still in play (exclude Rejected only) ---
    my_active_reqs = session.exec(
        select(RequestTable)
        .where(RequestTable.requester_id == current_user.id)
        .where(RequestTable.status != "Rejected")
    ).all()
    recv_units = sum(r.requested_quantity for r in my_active_reqs)
    r_usd, r_co2 = _sum_estimate_requests(session, list(my_active_reqs))

    return ImpactSummaryRead(
        giving=GivingImpact(
            items_listed=len(my_items),
            units_listed=giving_units,
            estimated_value_usd=g_usd,
            estimated_co2_kg_saved=g_co2,
        ),
        receiving=ReceivingImpact(
            active_requests=len(my_active_reqs),
            units_requested=recv_units,
            estimated_value_usd=r_usd,
            estimated_co2_kg_saved=r_co2,
        ),
        methodology_note=METHODOLOGY_NOTE,
    )
