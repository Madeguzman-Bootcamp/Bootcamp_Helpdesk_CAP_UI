const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { Tickets, Agents, Comments } = this.entities;

  // ------------------------------------------------------------
  // 1. BEFORE CREATE on Tickets
  // ------------------------------------------------------------
  this.before('CREATE', Tickets, req => {
    const { category_ID, subject } = req.data;

    if (!category_ID) {
      return req.error(400, {
        code: 'MISSING_CATEGORY',
        message: 'Category is required when creating a ticket.'
      });
    }

    if (!subject) {
      return req.error(400, {
        code: 'MISSING_SUBJECT',
        message: 'Subject is required when creating a ticket.'
      });
    }
  });

  // ------------------------------------------------------------
  // 2. BEFORE UPDATE on Tickets
  // ------------------------------------------------------------
  this.before('UPDATE', Tickets, async req => {
    const incomingStatus = req.data.status;

    if (incomingStatus === 'CLOSED') {
      const ticketID = req.data.ID || req.params[0];

      const existing = await SELECT.one.from(Tickets).where({ ID: ticketID });

      if (!existing) {
        return req.error(404, {
          code: 'TICKET_NOT_FOUND',
          message: 'Cannot update — ticket does not exist.'
        });
      }

      if (existing.status === 'CLOSED') {
        return req.error(400, {
          code: 'ALREADY_CLOSED',
          message: 'Ticket is already closed.'
        });
      }
    }
  });

  // ------------------------------------------------------------
  // 3. ACTION: closeTicket
  // ------------------------------------------------------------
  this.on('closeTicket', async req => {
    const { ticketID, resolution } = req.data;

    if (!resolution) {
      return req.error(400, {
        code: 'MISSING_RESOLUTION',
        message: 'Resolution text is required to close a ticket.'
      });
    }

    const ticket = await SELECT.one.from(Tickets).where({ ID: ticketID });

    if (!ticket) {
      return req.error(404, {
        code: 'TICKET_NOT_FOUND',
        message: 'Cannot close — ticket does not exist.'
      });
    }

    if (ticket.status === 'CLOSED') {
      return req.error(400, {
        code: 'ALREADY_CLOSED',
        message: 'Ticket is already closed.'
      });
    }

    // Update ticket status
    await UPDATE(Tickets)
      .set({ status: 'CLOSED' })
      .where({ ID: ticketID });

    // Insert resolution as a comment
    await INSERT.into(Comments).entries({
      text: resolution,
      ticket_ID: ticketID
    });

    return true;
  });

  // ------------------------------------------------------------
  // 4. ACTION: reassignTicket
  // ------------------------------------------------------------
  this.on('reassignTicket', async req => {
    const { ticketID, agentID } = req.data;

    if (!agentID) {
      return req.error(400, {
        code: 'MISSING_AGENT',
        message: 'Agent ID is required to reassign a ticket.'
      });
    }

    const agent = await SELECT.one.from(Agents).where({ ID: agentID });

    if (!agent) {
      return req.error(404, {
        code: 'AGENT_NOT_FOUND',
        message: 'Cannot reassign — agent does not exist.'
      });
    }

    await UPDATE(Tickets)
      .set({ agent_ID: agentID })
      .where({ ID: ticketID });

    return true;
  });

  // ------------------------------------------------------------
  // 5. FUNCTION: getTicketCount
  // ------------------------------------------------------------
  this.on('getTicketCount', async req => {
    const { status } = req.data;

    let query = SELECT.from(Tickets).columns('count(*) as count');

    if (status) {
      query.where({ status });
    }

    const result = await query;

    return result[0].count;
  });

});
