const TelegramBot = require('node-telegram-bot-api');
const Knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('./knexfile');
const Client = require('./models/Client');
const Dialog = require('./models/Dialog');
const { sendMessagesToGPT, getAnswer } = require('./api');

const API_KEY_BOT = process.env.API_KEY_BOT;

const knex = Knex(knexConfig);
Model.knex(knex);

const bot = new TelegramBot(API_KEY_BOT, {

  polling: {
    interval: 300,
    autoStart: true
  }
    
});

bot.on("polling_error", err => console.log(err.data.error.message));

bot.on('text', async msg => {
  try {
    if(msg.text == '/start') {

      await bot.sendMessage(msg.chat.id, `Здраствуйте `, {
        parse_mode: "HTML",
        reply_markup: {

          keyboard: [

            [{text: '⭐️ Контакт', request_contact: true}],

          ],
          resize_keyboard: true
      }
      });
  }else {
    await bot.sendChatAction(msg.chat.id, 'typing');
    const dialog = await getOrCreate(Dialog, { id_telegram_dialog: msg.chat.id }, { id_telegram_dialog: msg.chat.id });
    
    const response = await sendMessagesToGPT({
      id: dialog.id_chatGPT_dialog,
      messages: [{ text: msg.text }]
    });
    
    const isStartNewDialog = response.dialogId !== dialog.id_chatGPT_dialog;
    const existClientInformation = !!dialog.client_id;

    dialog.id_chatGPT_dialog = response.dialogId;
    await dialog.$query().patch();

    if (isStartNewDialog && existClientInformation){
      const client = await Client.query().findOne({ id: dialog.client_id });
      await sendMessagesToGPT({
        id: dialog.id_chatGPT_dialog,
        messages: [{ text: generateIdentificationMessageToChatGPT(client.full_name, client.phone) }]
      });
    }

    const resp = await getAnswer(dialog.id_chatGPT_dialog);
    await bot.sendMessage(msg.chat.id, resp[0].content[0].text.value);
  }
  } catch(erorr){
    console.log(erorr)
  }
});

bot.on('contact', async contact => {

  try {
    await bot.sendChatAction(contact.chat.id, 'typing');
    const client = await getOrCreate(Client, { phone: contact.contact.phone_number }, { phone: contact.contact.phone_number });
    const dialog = await getOrCreate(Dialog, { id_telegram_dialog: contact.chat.id }, { id_telegram_dialog: contact.chat.id });

    if (!dialog.client_id){
      dialog.client_id = client.id;
      await dialog.$query().patch();
    };

    const response = await sendMessagesToGPT({
      id: dialog.id_chatGPT_dialog,
      messages: [{text: generateIdentificationMessageToChatGPT(client.full_name, client.phone)}]
    });

    dialog.id_chatGPT_dialog = response.dialogId;
    await dialog.$query().patch();

    const resp = await getAnswer(dialog.id_chatGPT_dialog);

    await bot.sendMessage(contact.chat.id, resp[0].content[0].text.value, {
      reply_markup: {
        remove_keyboard: true 
      }
    });

  }
  catch(error) {

      console.log(error);

  }

})

function generateIdentificationMessageToChatGPT(fullName, phone){
  if (!fullName) return `мой номер телефона +${phone}`;

  return `Меня зовут ${fullName}, мой номер телефона +${phone}`;
}

async function getOrCreate(modelClass, findBy, createData) {
  // Пытаемся найти запись по критерию
  let instance = await modelClass.query().findOne(findBy);

  // Если запись не найдена, создаем новую
  if (!instance) {
    instance = await modelClass.query().insert(createData);
  }

  return instance;
}