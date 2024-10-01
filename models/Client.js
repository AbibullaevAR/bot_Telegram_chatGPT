const { Model } = require('objection');

class Client extends Model {
  static get tableName() {
    return 'Client';
  }

  static get relationMappings() {
    const Dialog = require('./Dialog');

    return {
      dialog: {
        relation: Model.HasOneRelation,  // Один клиент имеет один диалог
        modelClass: Dialog,
        join: {
          from: 'Client.id',
          to: 'Dialog.client_id',
        },
      },
    };
  }
}

module.exports = Client;