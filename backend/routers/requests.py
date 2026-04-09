# handles when someone wants an item + donor says yes/no + marking done

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from db import SessionDep
from models import ItemTable, NotificationTable, RequestTable, UserTable
from schemas import RequestCreate, RequestRead
from routers.auth import get_current_user, require_requester

router = APIRouter(prefix="/requests", tags=["requests"])


# little helper so we dont copy-paste NotificationTable(...) everywhere
def make_notification(sess: Session, who_gets_it: UUID, msg: str, link: Optional[str] = None):
    n = NotificationTable(user_id=who_gets_it, message=msg, link=link)
    sess.add(n)


# adds up qty for all APPROVED requests on this item (used before approving a new one)
def sum_up_approved_stuff(sess: Session, item_id: UUID) -> int:
    q = select(RequestTable).where(
        RequestTable.item_id == item_id,
        RequestTable.status == "Approved",
    )
    rows = sess.exec(q).all()
    total = 0
    for row in rows:
        total = total + row.requested_quantity  
    return total


# POST /requests/ 
@router.post("/", response_model=RequestRead, status_code=201)
def submit_request(
    data: RequestCreate,
    session: SessionDep,
    current_user: UserTable = Depends(require_requester),
) -> RequestTable:
    my_item = session.get(ItemTable, data.item_id)
    if my_item == None:
        raise HTTPException(status_code=404, detail="Item not found")

    # cant request if its not being offered for requests
    if my_item.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Item is not available for requests (status: " + str(my_item.status) + ")",
        )

    # 400 for trying to request your own listing
    if my_item.donor_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot request your own listing")

    if data.requested_quantity > my_item.quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available quantity")

    # check duplicate pending - one pending per person per item
    already = session.exec(
        select(RequestTable).where(
            RequestTable.item_id == data.item_id,
            RequestTable.requester_id == current_user.id,
            RequestTable.status == "Pending",
        )
    ).first()
    if already != None:
        raise HTTPException(status_code=400, detail="You already have a pending request for this item")

    new_req = RequestTable(
        requester_id=current_user.id,
        item_id=data.item_id,
        requested_quantity=data.requested_quantity,
        status="Pending",
    )
    session.add(new_req)

    make_notification(
        session,
        my_item.donor_id,
        'New request for "' + my_item.name + '" (' + str(data.requested_quantity) + " requested)",
        "/requests/" + str(new_req.id),
    )
    session.commit()
    session.refresh(new_req)
    return new_req


@router.patch("/{request_id}/approve", response_model=RequestRead)
def approve_request(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> RequestTable:
    req = session.get(RequestTable, request_id)
    if req == None:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be approved (current: " + req.status + ")",
        )

    the_item = session.get(ItemTable, req.item_id)
    if the_item == None:
        raise HTTPException(status_code=404, detail="Item not found")

    if the_item.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item donor can approve this request")

    # dont approve if we already promised too much qty to other approved people
    already_approved_amt = sum_up_approved_stuff(session, the_item.id)
    if already_approved_amt + req.requested_quantity > the_item.quantity:
        raise HTTPException(status_code=400, detail="Not enough remaining quantity to approve this request")

    req.status = "Approved"
    session.add(req)

    make_notification(
        session,
        req.requester_id,
        'Your request for "' + the_item.name + '" was approved',
        "/requests/" + str(req.id),
    )
    session.commit()
    session.refresh(req)
    return req


@router.patch("/{request_id}/reject", response_model=RequestRead)
def reject_request(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> RequestTable:
    req = session.get(RequestTable, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Only pending requests can be rejected (current: {req.status})",
        )

    the_item = session.get(ItemTable, req.item_id)
    if the_item == None:
        raise HTTPException(status_code=404, detail="Item not found")

    if the_item.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item donor can reject this request")

    req.status = "Rejected"
    session.add(req)

    make_notification(
        session,
        req.requester_id,
        'Your request for "' + the_item.name + '" was declined',
        "/requests/" + str(req.id),
    )
    session.commit()
    session.refresh(req)
    return req


@router.patch("/{request_id}/complete", response_model=RequestRead)
def complete_request(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> RequestTable:
    # pickup happened / deal is done - also updates how many items left
    req = session.get(RequestTable, request_id)
    if req == None:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved requests can be completed (current: " + req.status + ")",
        )

    the_item = session.get(ItemTable, req.item_id)
    if the_item == None:
        raise HTTPException(status_code=404, detail="Item not found")

    im_requester = current_user.id == req.requester_id
    im_donor = current_user.id == the_item.donor_id
    if im_requester == False and im_donor == False:
        raise HTTPException(status_code=403, detail="Only the requester or donor can complete this request")

    enough_left = the_item.quantity >= req.requested_quantity
    if enough_left == False:
        raise HTTPException(status_code=400, detail="Item no longer has enough quantity to complete this request")

    the_item.quantity = the_item.quantity - req.requested_quantity
    if the_item.quantity <= 0:
        the_item.quantity = 0
        the_item.status = "Unavailable"  # none left

    session.add(the_item)

    req.status = "Completed"
    session.add(req)

    # tell the other person
    if im_requester:
        other_guy = the_item.donor_id
    else:
        other_guy = req.requester_id

    make_notification(
        session,
        other_guy,
        'Request for "' + the_item.name + '" marked complete',
        "/requests/" + str(req.id),
    )
    session.commit()
    session.refresh(req)
    return req
