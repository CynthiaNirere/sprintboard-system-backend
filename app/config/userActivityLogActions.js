const LogActions = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  USER_CREATED: "User created",
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
  GITHUB_BRANCH_CREATED: "GitHub branch created",
  GITHUB_PR_CREATED: "GitHub PR created",
  GITHUB_PR_OPENED: "GitHub PR opened",
  GITHUB_PR_MERGED: "GitHub PR merged",
  GITHUB_TOKEN_UPDATED: "GitHub token updated",
  GITHUB_TOKEN_CLEARED: "GitHub token cleared",
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