const { Model } = require('objection');

class Dialog extends Model {
  static get tableName() {
    return 'Dialog';
  }

  static get relationMappings() {
    const Client = require('./Client');

    return {
      client: {
        relation: Model.BelongsToOneRelation,  // Один диалог принадлежит одному клиенту
        modelClass: Client,
        join: {
          from: 'Dialog.client_id',
          to: 'Client.id',
        },
      },
    };
  }
}

module.exports = Dialog;
