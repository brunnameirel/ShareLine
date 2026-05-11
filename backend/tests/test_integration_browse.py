"""Integration: browse list respects donor exclusion (API + DB)."""


def test_list_items_hides_own_listings_for_donor(
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    donor_client = auth_client(donor_user)
    donor_list = donor_client.get("/items").json()
    ids_donor = {row["id"] for row in donor_list}
    assert str(sample_item.id) not in ids_donor

    req_client = auth_client(requester_user)
    req_list = req_client.get("/items").json()
    ids_req = {row["id"] for row in req_list}
    assert str(sample_item.id) in ids_req
