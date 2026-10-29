import gleam/option.{None, Some}
import server/company
import server/company/demand
import server/dummy
import server_test
import youid/uuid

pub fn register_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let title = "dummy"
  let description = "description"
  let status = demand.Open

  let assert Ok(demand) =
    demand.register(
      context.database,
      company_id: company.id,
      title:,
      description:,
      status:,
    )

  assert demand.company_id == company.id
  assert demand.title == title
  assert demand.description == description
  assert demand.status == status

  Nil
}

pub fn register_demand_missing_company_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let assert Error(demand.CompanyNotFound(returned)) =
    demand.register(
      context.database,
      company_id: missing_id,
      title: "dummy",
      description: "dummy",
      status: demand.Open,
    )

  assert returned == missing_id

  Nil
}

pub fn get_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) = demand.get(context.database, demand.id)
  assert returned.id == demand.id

  Nil
}

pub fn get_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(demand.NotFound(returned)) = demand.get(context.database, id)

  assert returned == id

  Nil
}

pub fn ensure_exists_test() -> Nil {
  use context <- server_test.with_context()

  let missing_demand_id = uuid.v7()

  let assert Error(demand.NotFound(returned)) = {
    use <- demand.ensure_exists(context.database, missing_demand_id)

    Ok(Nil)
    // ^^^ Depite the callback function ending with an Ok(_), this function
    // should always return an Error(_) since the Demand does not exist.
  }

  // The error should include the given ID in his payload
  assert returned == missing_demand_id

  Nil
}

pub fn assign_segment_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let segment = dummy.new_segment(context.database)

  let assert Ok(returned) =
    demand.assign_segment(context.database, record.id, assign: segment.id)

  assert returned == segment

  Nil
}

pub fn segment_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let segment = dummy.new_segment(context.database)

  // Assigning once
  let assert Ok(_) =
    demand.assign_segment(context.database, record.id, assign: segment.id)

  // Assigning twice, this one must return an Error.
  let assert Error(demand.AssignmentConflict(returned)) =
    demand.assign_segment(context.database, record.id, assign: segment.id)

  assert returned == segment.id

  Nil
}

pub fn assign_segment_to_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let segment = dummy.new_segment(context.database)

  let assert Error(demand.NotFound(returned)) =
    demand.assign_segment(context.database, id, assign: segment.id)

  assert returned == id

  Nil
}

/// You must not be able to assign Segments that are not registered.
pub fn assign_missing_segment_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let id = uuid.v7()
  let assert Error(demand.AssignedMissingEntity(returned)) =
    demand.assign_segment(context.database, record.id, assign: id)

  assert returned == id

  Nil
}

pub fn get_demand_segments_test() -> Nil {
  use context <- server_test.with_context()

  // First one
  let segment_a = dummy.new_segment(context.database)
  let segment_b = dummy.new_segment(context.database)

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  // Assigning first segment
  let assert Ok(_) =
    demand.assign_segment(context.database, record.id, assign: segment_a.id)

  // Assigning a second segment
  let assert Ok(_) =
    demand.assign_segment(context.database, record.id, assign: segment_b.id)

  let assert Ok(returned) =
    demand.get_segments(context.database, from: record.id)

  assert returned == [segment_a, segment_b]

  Nil
}

pub fn unassign_segment_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let segment = dummy.new_segment(context.database)

  let assert Ok(assigned) =
    demand.assign_segment(context.database, record.id, assign: segment.id)

  assert assigned.id == segment.id

  let assert Ok(deleted) =
    demand.unassign_segment(context.database, record.id, unassign: assigned.id)

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = demand.get_segments(context.database, from: record.id)

  Nil
}

pub fn unassign_missing_segment_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let missing_id = uuid.v7()

  let assert Error(demand.AssignmentNotFound(returned)) =
    demand.unassign_segment(context.database, record.id, unassign: missing_id)

  assert returned == missing_id

  Nil
}

pub fn unassign_segment_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let segment = dummy.new_segment(context.database)

  let assert Error(demand.AssignmentNotFound(returned)) =
    demand.unassign_segment(context.database, missing_id, unassign: segment.id)

  assert returned == segment.id

  Nil
}

pub fn assign_expertise_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(returned) =
    demand.assign_expertise(context.database, record.id, assign: expertise.id)

  assert returned == expertise

  Nil
}

pub fn expertise_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(_) =
    demand.assign_expertise(context.database, record.id, assign: expertise.id)

  // You can not assign the same expertise twice
  let assert Error(demand.AssignmentConflict(returned)) =
    demand.assign_expertise(context.database, record.id, assign: expertise.id)

  assert returned == expertise.id

  Nil
}

pub fn assign_expertise_to_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let expertise = dummy.new_expertise(context.database)

  let assert Error(demand.NotFound(returned)) =
    demand.assign_expertise(context.database, id, assign: expertise.id)

  assert returned == id

  Nil
}

pub fn assign_missing_expertise_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let id = uuid.v7()
  let assert Error(demand.AssignedMissingEntity(returned)) =
    demand.assign_expertise(context.database, record.id, assign: id)

  assert returned == id

  Nil
}

pub fn get_demand_expertises_test() -> Nil {
  use context <- server_test.with_context()

  let expertise_a = dummy.new_expertise(context.database)
  let expertise_b = dummy.new_expertise(context.database)

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    demand.assign_expertise(context.database, record.id, assign: expertise_a.id)

  let assert Ok(_) =
    demand.assign_expertise(context.database, record.id, assign: expertise_b.id)

  let assert Ok(returned) = demand.get_expertises(context.database, record.id)

  assert returned == [expertise_a, expertise_b]

  Nil
}

pub fn unassign_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(assigned) =
    demand.assign_expertise(context.database, record.id, assign: expertise.id)

  assert assigned.id == expertise.id

  let assert Ok(deleted) =
    demand.unassign_expertise(
      context.database,
      record.id,
      unassign: assigned.id,
    )

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = demand.get_expertises(context.database, record.id)

  Nil
}

pub fn unassign_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let missing_id = uuid.v7()

  let assert Error(demand.AssignmentNotFound(returned)) =
    demand.unassign_expertise(context.database, record.id, unassign: missing_id)

  assert returned == missing_id

  Nil
}

pub fn assign_technology_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let technology = dummy.new_technology(context.database)

  let assert Ok(returned) =
    demand.assign_technology(context.database, record.id, assign: technology.id)

  assert returned == technology

  Nil
}

pub fn technology_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let technology = dummy.new_technology(context.database)

  let assert Ok(_) =
    demand.assign_technology(context.database, record.id, assign: technology.id)

  // You can not assign the same technology twice
  let assert Error(demand.AssignmentConflict(returned)) =
    demand.assign_technology(context.database, record.id, assign: technology.id)

  assert returned == technology.id

  Nil
}

pub fn assign_technology_to_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let technology = dummy.new_technology(context.database)

  let assert Error(demand.NotFound(returned)) =
    demand.assign_technology(context.database, id, assign: technology.id)

  assert returned == id

  Nil
}

pub fn assign_missing_technology_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let id = uuid.v7()
  let assert Error(demand.AssignedMissingEntity(returned)) =
    demand.assign_technology(context.database, record.id, assign: id)

  assert returned == id

  Nil
}

pub fn get_demand_technologies_test() -> Nil {
  use context <- server_test.with_context()

  let technology_a = dummy.new_technology(context.database)
  let technology_b = dummy.new_technology(context.database)

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    demand.assign_technology(
      context.database,
      record.id,
      assign: technology_a.id,
    )

  let assert Ok(_) =
    demand.assign_technology(
      context.database,
      record.id,
      assign: technology_b.id,
    )

  let assert Ok(returned) = demand.get_technologies(context.database, record.id)

  assert returned == [technology_a, technology_b]

  Nil
}

pub fn unassign_technology_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let technology = dummy.new_technology(context.database)

  let assert Ok(assigned) =
    demand.assign_technology(context.database, record.id, assign: technology.id)

  assert assigned.id == technology.id

  let assert Ok(deleted) =
    demand.unassign_technology(
      context.database,
      record.id,
      unassign: assigned.id,
    )

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = demand.get_technologies(context.database, record.id)

  Nil
}

pub fn unassign_missing_technology_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let missing_id = uuid.v7()

  let assert Error(demand.AssignmentNotFound(returned)) =
    demand.unassign_technology(
      context.database,
      record.id,
      unassign: missing_id,
    )

  assert returned == missing_id

  Nil
}

pub fn assign_service_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let service = dummy.new_service(context.database)

  let assert Ok(returned) =
    demand.assign_service(context.database, record.id, assign: service.id)

  assert returned == service

  Nil
}

pub fn service_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let service = dummy.new_service(context.database)

  let assert Ok(_) =
    demand.assign_service(context.database, record.id, assign: service.id)

  // You can not assign the same service twice
  let assert Error(demand.AssignmentConflict(returned)) =
    demand.assign_service(context.database, record.id, assign: service.id)

  assert returned == service.id

  Nil
}

pub fn assign_service_to_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let service = dummy.new_service(context.database)

  let assert Error(demand.NotFound(returned)) =
    demand.assign_service(context.database, id, assign: service.id)

  assert returned == id

  Nil
}

pub fn assign_missing_service_to_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let id = uuid.v7()
  let assert Error(demand.AssignedMissingEntity(returned)) =
    demand.assign_service(context.database, record.id, assign: id)

  assert returned == id

  Nil
}

pub fn get_demand_services_test() -> Nil {
  use context <- server_test.with_context()

  let service_a = dummy.new_service(context.database)
  let service_b = dummy.new_service(context.database)

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    demand.assign_service(context.database, record.id, assign: service_a.id)

  let assert Ok(_) =
    demand.assign_service(context.database, record.id, assign: service_b.id)

  let assert Ok(returned) = demand.get_services(context.database, record.id)

  assert returned == [service_a, service_b]

  Nil
}

pub fn unassign_service_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let service = dummy.new_service(context.database)

  let assert Ok(assigned) =
    demand.assign_service(context.database, record.id, assign: service.id)

  assert assigned.id == service.id

  let assert Ok(deleted) =
    demand.unassign_service(context.database, record.id, unassign: assigned.id)

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = demand.get_services(context.database, record.id)

  Nil
}

pub fn unassign_missing_service_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let record = dummy.new_demand(context.database, from: company.id)
  let missing_id = uuid.v7()

  let assert Error(demand.AssignmentNotFound(returned)) =
    demand.unassign_service(context.database, record.id, unassign: missing_id)

  assert returned == missing_id

  Nil
}

pub fn open_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) = demand.open(context.database, demand.id)

  assert returned.id == demand.id
  assert returned.status == demand.Open

  Nil
}

pub fn open_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let demand_id = uuid.v7()
  let assert Error(demand.NotFound(returned)) =
    demand.open(context.database, demand_id)

  assert returned == demand_id

  Nil
}

pub fn close_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) = demand.close(context.database, demand.id)

  assert returned.id == demand.id
  assert returned.status == demand.Closed

  Nil
}

pub fn close_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let demand_id = uuid.v7()
  let assert Error(demand.NotFound(returned)) =
    demand.close(context.database, demand_id)

  assert returned == demand_id

  Nil
}

pub fn cancel_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) = demand.cancel(context.database, demand.id)

  assert returned.id == demand.id
  assert returned.status == demand.Canceled

  Nil
}

pub fn canceled_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let demand_id = uuid.v7()
  let assert Error(demand.NotFound(returned)) =
    demand.cancel(context.database, demand_id)

  assert returned == demand_id

  Nil
}

pub fn update_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let new_title = "This is a new title"
  let assert Ok(returned) =
    demand.update(
      context.database,
      demand.id,
      new_title: Some(new_title),
      new_description: None,
    )

  assert returned.id == demand.id
  assert returned.title == new_title

  Nil
}

pub fn update_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let assert Error(demand.NotFound(returned)) =
    demand.update(
      context.database,
      missing_id,
      new_title: None,
      new_description: None,
    )

  assert returned == missing_id

  Nil
}

pub fn delete_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, company.id)

  let assert Ok(returned) = demand.delete(context.database, demand.id)
  assert returned.id == demand.id

  // no longer available
  let assert Error(demand.NotFound(_)) = demand.get(context.database, demand.id)
  let assert Ok([]) = company.get_demands(context.database, company.id, 1, 0)

  Nil
}

pub fn delete_missing_demand_test() -> Nil {
  use context <- server_test.with_context()

  let demand_id = uuid.v7()
  let assert Error(demand.NotFound(returned)) =
    demand.delete(context.database, demand_id)

  assert returned == demand_id

  Nil
}
