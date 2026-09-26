'use strict';

const supportService = require('./support.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function createTicket(req, res) {
  const ticket = await supportService.createTicket(req.user.id, req.user.role, req.body);
  return success(res, { ticket }, 'Support ticket created successfully', StatusCodes.CREATED);
}

async function replyTicket(req, res) {
  const { id } = req.params;
  const ticket = await supportService.replyToTicket(id, req.user.id, req.user.role, req.body);
  return success(res, { ticket }, 'Reply posted');
}

async function getTicket(req, res) {
  const ticket = await supportService.getTicketById(req.params.id, req.user);
  return success(res, { ticket });
}

async function listTickets(req, res) {
  const result = await supportService.listTickets(req.user, req.query);
  return success(res, result);
}

async function updateStatus(req, res) {
  const ticket = await supportService.updateTicketStatus(req.params.id, req.body);
  return success(res, { ticket }, 'Ticket status updated');
}

module.exports = {
  createTicket,
  replyTicket,
  getTicket,
  listTickets,
  updateStatus,
};
