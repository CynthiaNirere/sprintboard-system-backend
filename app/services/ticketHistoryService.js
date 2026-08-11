const db = require("../models");
const TicketHistory = db.ticketHistory;
const User = db.user;
const Project = db.project;
const Sprint = db.sprint;
const Repo = db.githubRepository;
const Status = db.boardStatus;
const ticketValues = ["title", 
    "description",
    "type", 
    "priority",
    "storyPoints",
    "githubBranchName",
    "githubBranchCreatedAt",
    "githubPrURL",
    "assigneeId",
    "projectId",
    "sprintId",
    "statusId",
    "repoId",

    ];
const labelValues = new Map([
  ["assigneeId", "email"],
  ["projectId", "title"],
  ["sprintId", "name"],
  ["statusId", "name"],
  ["repoId", "name"],
]);
 
async function logTicketCreated(ticketId, userId){
    let user = await User.findByPk(userId, {
          attributes: ["email"]
        });
    let ticketHistory = {
        field: null,
        oldValue: ticketId,
        oldLabel: ticketId,
        newValue: ticketId,
        newLabel: ticketId,
        message: "Ticket created by: " + user.email,
        userId: userId,
        ticketId: ticketId
    }
    await TicketHistory.create(ticketHistory);
}
async function logTicketChanged(before, after, userId){
    let user;
    if(userId != null){
        user = await User.findByPk(userId, {
              attributes: ["email"]
            });
    }
    let changes = [];
    for(let attr of ticketValues){
        if(before[attr] != after[attr]){
            let ticketHistory; 
            if(!labelValues.has(attr)){

                ticketHistory = {
                    field: attr,
                    oldValue: before[attr],
                    oldLabel: before[attr],
                    newValue: after[attr],
                    newLabel: after[attr],
                    message: "Ticket " + attr + " changed by: " + user?.email ?? "server",
                    userId: userId ?? null,
                    ticketId: after.id
                }
            }else{
                ticketHistory = {
                    field: attr,
                    oldValue: before[attr],
                    oldLabel: before[attr],
                    newValue: after[attr],
                    newLabel: after[attr],
                    message: "Ticket " + attr + " changed by: " + user?.email ?? "server",
                    userId: userId ?? null,
                    ticketId: after.id
                }
                if(attr == "assigneeId"){
                    try{
                        oldAssignee = await User.findByPk(before[attr], {
                        attributes: ["email"]
                        });
                        newAssignee = await User.findByPk(after[attr], {
                        attributes: ["email"]
                        });
                        ticketHistory.oldLabel = oldAssignee.email;
                        ticketHistory.newLabel = newAssignee.email;
                    }catch(e){

                    }
                }else if(attr == "projectId"){
                    try{
                        oldproject = await Project.findByPk(before[attr], {
                        attributes: ["title"]
                        });
                        newproject = await Project.findByPk(after[attr], {
                        attributes: ["title"]
                        });
                        ticketHistory.oldLabel = oldproject.title;
                        ticketHistory.newLabel = newproject.title;
                    }catch(e){

                    }
                
                }else if(attr == "sprintId" || attr == "statusId" || attr == "repoId"){
                    try{
                        let old, ne;
                        if(attr == "sprintId"){
                            old = await Sprint.findByPk(before[attr], {
                            attributes: ["name"]
                            });
                            if(old == null) old = {name: "backlog"};
                            ne = await Sprint.findByPk(after[attr], {
                            attributes: ["name"]
                            });
                            if(ne == null) ne = {name: "backlog"};
                        }
                        else if(attr == "statusId"){

                            old = await Status.findByPk(before[attr], {
                            attributes: ["name"]
                            });
                            ne = await Status.findByPk(after[attr], {
                            attributes: ["name"]
                            });
                        }
                        else if(attr == "repoId"){
                            old = await Repo.findByPk(before[attr], {
                            attributes: ["name"]
                            });
                            ne = await Repo.findByPk(after[attr], {
                            attributes: ["name"]
                            });
                        }
                        ticketHistory.oldLabel = old.name;
                        ticketHistory.newLabel = ne.name;
                    }catch(e){

                    }
                
                }
                
            }
            changes.push(ticketHistory);
        }
    }
    await TicketHistory.bulkCreate(changes);
}

module.exports = { logTicketCreated , logTicketChanged };