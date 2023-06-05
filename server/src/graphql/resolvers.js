import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'
import shortid from 'shortid'

let subscriptionDataForUndo = {
    subscription: '',
    data: null
};

export default {
    JSON: GraphQLJSONObject,

    Query: {
        mainTasks: (root, args, {db}) => db.chain.get('tasks').value(),
        subTasks: (root, args, {db}) => db.chain.get('sub_tasks').filter({taskID: args.taskID}).value(),
        allLayers: (root, args, {db}) => db.chain.get('layers').value()
    },

    MainTask: {
        subTasks: (root, args, {db}) => {
            return db.get('data').get('sub_tasks').filter((subTask) => subTask.taskID === root.id).value();
        }
    },
    Mutation: {
        addSubTask: (root, {input}, {pubsub, db, backup}) => {
            const subTask = {
                id: shortid.generate(),
                text: input.text,
                taskID: input.taskID,
                completed: false
            };
            subscriptionDataForUndo.subscription = 'SUB_TASK_DELETED';
            backup.set('data', db.get('data').value()).write();
            db.get('data').get('sub_tasks').push(subTask).last().write();
            subscriptionDataForUndo.data = {subTaskDeleted: subTask};
            pubsub.publish('SUB_TASK_ADDED', {subTaskAdded: subTask});
            return subTask;
        },
        addMainTask: (root, {input}, {pubsub, db, backup}) => {
            const mainTask = {
                id: shortid.generate(),
                name: input.name,
            };
            subscriptionDataForUndo.subscription = 'MAIN_TASK_DELETED';
            backup.set('data', db.get('data').value()).write();
            db.get('data').get('tasks').push(mainTask).last().write();
            subscriptionDataForUndo.data = {mainTaskDeleted: mainTask};
            pubsub.publish('MAIN_TASK_ADDED', {mainTaskAdded: mainTask});
            return mainTask;
        },
        deleteMainTask: (root, {id}, {pubsub, db, backup}) => {
            subscriptionDataForUndo.subscription = 'MAIN_TASK_ADDED';
            backup.set('data', db.get('data').value()).write();
            const task = db.get('data').get('tasks').find({id: id}).value();
            db.get('data').get('tasks').remove(task).write();
            db.get('data').get('sub_tasks').remove({taskID: task.id}).write();
            subscriptionDataForUndo.data = {mainTaskAdded: task};
            pubsub.publish('MAIN_TASK_DELETED', {mainTaskDeleted: task});
            return task;
        },
        deleteSubTask: (root, {id}, {pubsub, db, backup}) => {
            subscriptionDataForUndo.subscription = 'SUB_TASK_ADDED';
            backup.set('data', db.get('data').value()).write();
            const subTask = db.get('data').get('sub_tasks').find({id: id}).value();
            db.get('data').get('sub_tasks').remove(subTask).write();
            subscriptionDataForUndo.data = {subTaskAdded: subTask};
            pubsub.publish('SUB_TASK_DELETED', {subTaskDeleted: subTask});
            return subTask;
        },
        updateMainTask: (root, {input}, {db, backup}) => {
            subscriptionDataForUndo.subscription = '';
            backup.set('data', db.get('data').value()).write();
            const task = db.get('data').get('tasks').find({id: input.id}).assign({name: input.name}).value();
            db.write();
            return task;
        },
        updateSubTask: (root, {input}, {db, backup}) => {
            subscriptionDataForUndo.subscription = '';
            backup.set('data', db.get('data').value()).write();
            const subTask = db.get('data').get('sub_tasks').find({id: input.id}).assign({text: input.text, completed: input.completed}).value();
            db.write();
            return subTask;
        },
        updateSubTaskText: (root, {input}, {db, backup}) => {
            subscriptionDataForUndo.subscription = '';
            backup.set('data', db.get('data').value()).write();
            const subTask = db.get('data').get('sub_tasks').find({id: input.id}).assign({text: input.text}).value();
            db.write();
            return subTask;
        },
        undoLastChange: (root, input, {pubsub, db, backup}) => {
            backup.read();
            if(subscriptionDataForUndo.subscription !== ''){
                pubsub.publish(subscriptionDataForUndo.subscription, subscriptionDataForUndo.data);
            }
            db.set('data', backup.get('data').value()).write();
            return true;
        }
    },

    Subscription: {
        subTaskAdded: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator('SUB_TASK_ADDED'),
        },
        mainTaskAdded: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator('MAIN_TASK_ADDED'),
        },
        subTaskDeleted: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator('SUB_TASK_DELETED'),
        },
        mainTaskDeleted: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator('MAIN_TASK_DELETED'),
        }
    },
}
