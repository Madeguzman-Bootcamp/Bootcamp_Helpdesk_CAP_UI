namespace bootcamp.helpdesk;

using { cuid, managed } from '@sap/cds/common';

type Email : String(100) @assert.regex: '^[^@]+@[^@]+\.[^@]+$';

type TicketStatus : String enum {
  open        = 'OPEN';
  inProgress  = 'IN_PROGRESS';
  resolved    = 'RESOLVED';
  closed      = 'CLOSED';
}

type Priority : String enum {
  low     = 'LOW';
  medium  = 'MEDIUM';
  high    = 'HIGH';
  urgent  = 'URGENT';
}

entity Categories : cuid {
  name : String(100);
}

entity Agents : cuid {
  name  : String(100);
  email : Email;
}

entity Tickets : cuid, managed {
  ticketNumber : String(30);
  subject      : String(200);
  description  : String;
  status       : TicketStatus;
  priority     : Priority;

  category : Association to Categories;
  agent    : Association to Agents;

  comments : Composition of many Comments on comments.ticket = $self;
}

entity Comments : cuid, managed {
  text   : String;
  ticket : Association to Tickets;
}
