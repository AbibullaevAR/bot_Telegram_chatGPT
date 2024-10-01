const Knex = require('knex');
const knexConfig = require('./knexfile');

const knex = Knex(knexConfig);

async function createSchema() {
  // Таблица Client
  if (!(await knex.schema.hasTable('Client'))) {
    await knex.schema.createTable('Client', (table) => {
      table.increments('id').primary();
      table.string('full_name');
      table.string('phone');
    });
    console.log('Таблица Client создана');
  }

  // Таблица Dialog, добавляем client_id для связи "один к одному"
  if (!(await knex.schema.hasTable('Dialog'))) {
    await knex.schema.createTable('Dialog', (table) => {
      table.increments('id').primary();
      table.string('id_telegram_dialog');
      table.string('id_chatGPT_dialog');
      table.integer('client_id').unsigned().unique().references('Client.id').onDelete('CASCADE');
      // Уникальность client_id гарантирует, что один клиент может иметь только один диалог
    });
    console.log('Таблица Dialog создана');
  }
}

createSchema()
  .then(() => {
    console.log('Схема базы данных создана');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Ошибка при создании схемы:', err);
    process.exit(1);
  });
