'use strict';

/**
 * support.service.js — Support ticket management logic.
 */

const SupportTicket = require('./ticket.model');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');

/**
 * Open a new support ticket.
 */
async function createTicket(userId, userRole, data) {
  const ticket = await SupportTicket.create({
    user: userId,
    order: data.orderId || null,
    restaurant: data.restaurantId || null,
    subject: data.subject,
    category: data.category || 'order_issue',
    priority: data.priority || 'medium',
    messages: [
      {
        sender: userId,
        senderRole: userRole,
        text: data.message,
        attachments: data.attachments || [],
      },
    ],
  });

  return ticket;
}

/**
 * Add message / reply to existing ticket.
 */
async function replyToTicket(ticketId, userId, userRole, { text, attachments = [] }) {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError('Support ticket not found');

  const isOwner = ticket.user.toString() === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new BusinessError('Access denied to this ticket', ERROR_CODES.FORBIDDEN);
  }

  ticket.messages.push({
    sender: userId,
    senderRole: userRole,
    text,
    attachments,
  });

  if (isAdmin && ticket.status === 'open') {
    ticket.status = 'in_progress';
  }

  await ticket.save();
  return ticket;
}

/**
 * Get ticket details by ID.
 */
async function getTicketById(ticketId, requestingUser) {
  const ticket = await SupportTicket.findById(ticketId)
    .populate('user', 'name phone email')
    .populate('assignedTo', 'name email');

  if (!ticket) throw new NotFoundError('Support ticket not found');

  const isOwner = ticket.user._id.toString() === requestingUser.id;
  const isAdmin = requestingUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new BusinessError('Access denied', ERROR_CODES.FORBIDDEN);
  }

  return ticket;
}

/**
 * List tickets (filtered by user or all for admin).
 */
async function listTickets(requestingUser, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (requestingUser.role !== 'admin') {
    filter.user = requestingUser.id;
  }

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return { tickets, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * Update ticket status or assign agent.
 */
async function updateTicketStatus(ticketId, { status, assignedTo }) {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new NotFoundError('Support ticket not found');

  if (status) {
    ticket.status = status;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }
  }

  if (assignedTo) {
    ticket.assignedTo = assignedTo;
  }

  await ticket.save();
  return ticket;
}

module.exports = {
  createTicket,
  replyToTicket,
  getTicketById,
  listTickets,
  updateTicketStatus,
};
