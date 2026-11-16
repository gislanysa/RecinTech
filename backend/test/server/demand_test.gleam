import gleam/list
import gleam/option.{None, Some}
import server/company
import server/demand
import server/dummy
import server/startup
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

pub fn accept_application_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(applied) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(returned) =
    demand.accept_application(context.database, demand.id, from: startup.id)

  assert returned
    == demand.Application(
      demand: demand.id,
      startup: startup.id,
      status: demand.Accepted,
      created_at: applied.created_at,
      updated_at: returned.updated_at,
    )

  Nil
}

pub fn decline_application_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(applied) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(returned) =
    demand.decline_application(context.database, demand.id, from: startup.id)

  assert returned
    == demand.Application(
      demand: demand.id,
      startup: startup.id,
      status: demand.Declined,
      created_at: applied.created_at,
      updated_at: returned.updated_at,
    )

  Nil
}

pub fn accept_missing_application_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Error(demand.ApplicationNotFound(
    demand: returned_demand,
    startup: returned_startup,
  )) = demand.accept_application(context.database, demand.id, from: startup.id)

  assert returned_demand == demand.id
  assert returned_startup == startup.id

  Nil
}

pub fn decline_missing_application_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Error(demand.ApplicationNotFound(
    demand: returned_demand,
    startup: returned_startup,
  )) = demand.decline_application(context.database, demand.id, from: startup.id)

  assert returned_demand == demand.id
  assert returned_startup == startup.id

  Nil
}

pub fn accept_missing_startup_application_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)
  let missing_id = uuid.v7()

  let assert Error(demand.ApplicationNotFound(
    demand: returned_demand,
    startup: returned_startup,
  )) = demand.accept_application(context.database, demand.id, from: missing_id)

  assert returned_demand == demand.id
  assert returned_startup == missing_id

  Nil
}

pub fn accept_missing_demand_application_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let assert Error(demand.ApplicationNotFound(
    demand: returned_demand,
    startup: returned_startup,
  )) = demand.accept_application(context.database, missing_id, from: startup.id)

  assert returned_demand == missing_id
  assert returned_startup == startup.id

  Nil
}

/// Accepting an application that is already accepted is allowed.
pub fn accept_application_twice_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(_) =
    demand.accept_application(context.database, demand.id, from: startup.id)

  let assert Ok(returned) =
    demand.accept_application(context.database, demand.id, from: startup.id)

  assert returned.status == demand.Accepted

  Nil
}

/// Accepting a declined application reverses the previous decision.
pub fn accept_after_decline_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(_) =
    demand.decline_application(context.database, demand.id, from: startup.id)

  let assert Ok(returned) =
    demand.accept_application(context.database, demand.id, from: startup.id)

  assert returned.status == demand.Accepted

  Nil
}

/// Declining an accepted application reverses the previous decision.
pub fn decline_after_accept_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(_) =
    demand.accept_application(context.database, demand.id, from: startup.id)

  let assert Ok(returned) =
    demand.decline_application(context.database, demand.id, from: startup.id)

  assert returned.status == demand.Declined

  Nil
}

/// A declined application still blocks the Startup from applying again.
pub fn decline_application_blocks_reapply_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(_) =
    demand.decline_application(context.database, demand.id, from: startup.id)

  let assert Error(startup.ApplicationConflict(returned)) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  assert returned == demand.id

  Nil
}

pub fn get_applications_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup_a = dummy.new_startup(context.database)
  let startup_b = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup_a.id, apply_to: demand.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup_b.id, apply_to: demand.id)

  let assert Ok(_) =
    demand.accept_application(context.database, demand.id, from: startup_b.id)

  let assert Ok(returned) = demand.get_applications(context.database, demand.id)

  assert list.length(returned) == 2

  assert list.any(returned, fn(application) {
    application.startup == startup_a.id && application.status == demand.Pending
  })

  assert list.any(returned, fn(application) {
    application.startup == startup_b.id && application.status == demand.Accepted
  })

  Nil
}

pub fn get_empty_applications_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok([]) = demand.get_applications(context.database, demand.id)

  Nil
}

/// A Demand that does not exist has no applications, so this is not an error.
pub fn get_applications_from_missing_demand_test() -> Nil {
  use context <- server_test.with_context()
  let missing_id = uuid.v7()

  let assert Ok([]) = demand.get_applications(context.database, missing_id)

  Nil
}

/// Withdrawing deletes the application, so it is no longer returned.
pub fn get_applications_after_withdraw_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)
  let demand = dummy.new_demand(context.database, from: company.id)

  let assert Ok(_) =
    startup.apply_to_demand(context.database, startup.id, apply_to: demand.id)

  let assert Ok(_) =
    startup.withdraw_demand_application(
      context.database,
      startup.id,
      from: demand.id,
    )

  let assert Ok([]) = demand.get_applications(context.database, demand.id)

  Nil
}

pub fn browse_open_demands_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand_a = dummy.new_demand(context.database, from: company.id)
  let demand_b = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) =
    demand.browse_open_demands(context.database, limit: 100, offset: 0)

  assert returned == [demand_b, demand_a]

  Nil
}

/// Only demands with an `open` status are listed.
pub fn browse_open_demands_excludes_closed_and_canceled_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let open = dummy.new_demand(context.database, from: company.id)

  let closed = dummy.new_demand(context.database, from: company.id)
  let assert Ok(_) = demand.close(context.database, closed.id)

  let canceled = dummy.new_demand(context.database, from: company.id)
  let assert Ok(_) = demand.cancel(context.database, canceled.id)

  let assert Ok(returned) =
    demand.browse_open_demands(context.database, limit: 100, offset: 0)

  assert returned == [open]

  Nil
}

pub fn browse_open_demands_pagination_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let demand_a = dummy.new_demand(context.database, from: company.id)
  let demand_b = dummy.new_demand(context.database, from: company.id)
  let demand_c = dummy.new_demand(context.database, from: company.id)

  // only two demands fit in the first page
  let assert Ok(first_page) =
    demand.browse_open_demands(context.database, limit: 2, offset: 0)

  assert list.length(first_page) == 2

  // the last page holds the remaining demand
  let assert Ok(second_page) =
    demand.browse_open_demands(context.database, limit: 2, offset: 2)

  assert list.length(second_page) == 1

  // the two pages contain every demand exactly once
  let pages = list.append(first_page, second_page)
  assert list.length(pages) == 3

  assert list.any(pages, fn(record) { record.id == demand_a.id })
  assert list.any(pages, fn(record) { record.id == demand_b.id })
  assert list.any(pages, fn(record) { record.id == demand_c.id })

  // offsetting past every demand returns an empty list
  let assert Ok([]) =
    demand.browse_open_demands(context.database, limit: 2, offset: 10)

  Nil
}

pub fn browse_open_demands_empty_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok([]) =
    demand.browse_open_demands(context.database, limit: 100, offset: 0)

  Nil
}
