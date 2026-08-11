using bootcamp.helpdesk as db from '../db/schema';

service HelpdeskService {

  action closeTicket(ticketID : String, resolution : String) returns Boolean;
  action reassignTicket(ticketID : String, agentID : String) returns Boolean;

  function getTicketCount(status : String) returns Integer;

  entity Tickets as projection on db.Tickets;
  entity Agents  as projection on db.Agents;
  entity Comments as projection on db.Comments;
  entity Categories as projection on db.Categories;
}
