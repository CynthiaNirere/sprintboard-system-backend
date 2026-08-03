const {Op} = require('sequelize');
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Sprint = sequelize.define("sprint", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  }, {
    tableName: "sprints",
    timestamps: true,

    hooks: {
      beforeCreate: async (sprint, options) => {
        console.log(sprint);
        const sprintOverlap = await Sprint.findOne({
          where: {
            projectId: sprint.projectId,
            startDate: {[Op.lte]: sprint.endDate},
            endDate: {[Op.gte]: sprint.startDate}
          }
        })
        if(sprintOverlap) {
          throw new Error('A sprint for this project already exists during this time. ')
        }
      },
      beforeUpdate: async (sprint, options) => {
        const sprintOverlap = await Sprint.findOne({
          where: {
            id: {[Op.ne]: sprint.id},
            projectId: sprint.projectId,
            startDate: {[Op.lte]: sprint.endDate},
            endDate: {[Op.gte]: sprint.startDate}
          }
        })
        if(sprintOverlap) {
          throw new Error('A sprint for this project already exists during this time. ')
        }
      }
    }
});

  return Sprint;
};