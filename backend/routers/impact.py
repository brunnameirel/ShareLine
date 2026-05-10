"""
Impact dashboard aggregates — rough reuse estimates for morale / storytelling.

Endpoints:
    GET /impact/summary — personal giving/receiving + community totals (auth required)
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
    completed_listings: int = Field(description="Items you listed that reached Completed status.")
    units: int = Field(description="Sum of listing quantities for those completed items.")
    estimated_value_usd: float
    estimated_co2_kg_saved: float


class ReceivingImpact(BaseModel):
    completed_requests: int
    units_received: int
    estimated_value_usd: float
    estimated_co2_kg_saved: float


class CommunityImpact(BaseModel):
    completed_listings_total: int
    units_on_completed_listings: int
    completed_handoffs_total: int = Field(
        description="Requests marked Completed (successful matches)."
    )
    units_via_completed_handoffs: int
    estimated_value_usd: float
    estimated_co2_kg_saved: float


class ImpactSummaryRead(BaseModel):
    giving: GivingImpact
    receiving: ReceivingImpact
    community: CommunityImpact
    methodology_note: str


METHODOLOGY_NOTE = (
    "Figures are illustrative: category averages approximate typical resale value "
    "and avoided emissions from reuse—not audited carbon accounting."
)


@router.get("/summary", response_model=ImpactSummaryRead)
def impact_summary(
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> ImpactSummaryRead:
    """Aggregate impact stats for the signed-in user and the whole platform."""

    # --- Personal: giving (completed listings by this donor) ---
    my_completed_items = session.exec(
        select(ItemTable).where(ItemTable.donor_id == current_user.id).where(ItemTable.status == "Completed")
    ).all()
    giving_units = sum(i.quantity for i in my_completed_items)
    g_usd, g_co2 = _sum_estimate_items(list(my_completed_items))

    # --- Personal: receiving ---
    my_completed_reqs = session.exec(
        select(RequestTable)
        .where(RequestTable.requester_id == current_user.id)
        .where(RequestTable.status == "Completed")
    ).all()
    recv_units = sum(r.requested_quantity for r in my_completed_reqs)
    r_usd, r_co2 = _sum_estimate_requests(session, list(my_completed_reqs))

    # --- Community ---
    all_completed_items = session.exec(select(ItemTable).where(ItemTable.status == "Completed")).all()
    community_listing_units = sum(i.quantity for i in all_completed_items)
    c_items_usd, c_items_co2 = _sum_estimate_items(list(all_completed_items))

    all_completed_reqs = session.exec(select(RequestTable).where(RequestTable.status == "Completed")).all()
    community_req_units = sum(r.requested_quantity for r in all_completed_reqs)
    # Avoid double-counting: monetary/co₂ from handoffs (requests); fallback if legacy data has items only.
    if all_completed_reqs:
        comm_usd, comm_co2 = _sum_estimate_requests(session, list(all_completed_reqs))
    else:
        comm_usd, comm_co2 = c_items_usd, c_items_co2

    return ImpactSummaryRead(
        giving=GivingImpact(
            completed_listings=len(my_completed_items),
            units=giving_units,
            estimated_value_usd=g_usd,
            estimated_co2_kg_saved=g_co2,
        ),
        receiving=ReceivingImpact(
            completed_requests=len(my_completed_reqs),
            units_received=recv_units,
            estimated_value_usd=r_usd,
            estimated_co2_kg_saved=r_co2,
        ),
        community=CommunityImpact(
            completed_listings_total=len(all_completed_items),
            units_on_completed_listings=community_listing_units,
            completed_handoffs_total=len(all_completed_reqs),
            units_via_completed_handoffs=community_req_units,
            estimated_value_usd=comm_usd,
            estimated_co2_kg_saved=comm_co2,
        ),
        methodology_note=METHODOLOGY_NOTE,
    )
