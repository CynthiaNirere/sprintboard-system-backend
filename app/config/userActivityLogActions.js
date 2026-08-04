
const LogActions = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  GLOBAL_ROLE_CHANGED: "Global role changed",
  PROJECT_ROLE_CHANGED: "Project role changed",
  PROJECT_CREATED: "Project created",
  PROJECT_DELETED: "Project deleted",
  MEMBER_ADDED: "Member added",
  MEMBER_REMOVED: "Member removed",
  TICKET_CREATED: "Ticket created",
  TICKET_UPDATED: "Ticket updated",
  TICKET_DELETED: "Ticket deleted",
  SPRINT_CREATED: "Sprint created",
  SPRINT_UPDATED: "Sprint updated",
  SPRINT_DELETED: "Sprint deleted",
  GITHUB_REPO_LINKED: "GitHub repo linked",
  BOARD_STATUS_UPDATED: "Board status updated",
  TEST_STATUS_CHANGED: "Test status changed",
  ATTACHMENT_UPLOADED: "Attachment uploaded",
  ATTACHMENT_DELETED: "Attachment deleted",
  RETRO_CREATED: "Retro created",
  RETRO_ITEM_ADDED: "Retro item added",
}

const LogActionValues = Object.values(LogActions); 

module.exports = {
  LogActions,
  LogActionValues
};